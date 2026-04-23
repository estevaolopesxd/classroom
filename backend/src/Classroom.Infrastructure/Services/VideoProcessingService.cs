using System.Diagnostics;
using Classroom.Domain.Enums;
using Classroom.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Classroom.Infrastructure.Services;

public class VideoProcessingService(
    IServiceScopeFactory scopeFactory,
    ILogger<VideoProcessingService> logger,
    IConfiguration configuration) : BackgroundService
{
    private readonly Queue<Guid> _queue = new();
    private readonly SemaphoreSlim _signal = new(0);

    public void EnqueueVideo(Guid videoId)
    {
        _queue.Enqueue(videoId);
        _signal.Release();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await _signal.WaitAsync(stoppingToken);
            if (!_queue.TryDequeue(out var videoId)) continue;

            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var storage = scope.ServiceProvider.GetRequiredService<MinIOStorageService>();

            await ProcessVideoAsync(db, storage, videoId, stoppingToken);
        }
    }

    private async Task ProcessVideoAsync(AppDbContext db, MinIOStorageService storage, Guid videoId, CancellationToken ct)
    {
        var video = await db.Videos.FindAsync([videoId], ct);
        if (video is null) return;

        logger.LogInformation("Processing video {VideoId}", videoId);
        var tempDir = Path.Combine(Path.GetTempPath(), videoId.ToString());
        Directory.CreateDirectory(tempDir);

        try
        {
            var bucket = configuration["MinIO:BucketVideos"]!;
            var originalLocalPath = Path.Combine(tempDir, "original");

            // Download original file from MinIO
            var downloadUrl = storage.GeneratePresignedGetUrl(bucket, video.OriginalKey!, 600);
            using var httpClient = new HttpClient();
            var fileBytes = await httpClient.GetByteArrayAsync(downloadUrl, ct);
            await File.WriteAllBytesAsync(originalLocalPath, fileBytes, ct);

            // Transcode to HLS with FFmpeg
            var hlsDir = Path.Combine(tempDir, "hls");
            Directory.CreateDirectory(hlsDir);
            var playlistPath = Path.Combine(hlsDir, "playlist.m3u8");

            var ffmpegArgs = $"-i \"{originalLocalPath}\" " +
                "-c:v libx264 -crf 23 -preset fast " +
                "-c:a aac -b:a 128k " +
                $"-hls_time 6 -hls_playlist_type vod " +
                $"-hls_segment_filename \"{hlsDir}/segment%03d.ts\" " +
                $"\"{playlistPath}\"";

            await RunFFmpeg(ffmpegArgs, ct);

            // Extract duration
            var duration = await GetVideoDuration(originalLocalPath, ct);

            // Extract thumbnail at 5 seconds
            var thumbnailPath = Path.Combine(tempDir, "thumbnail.jpg");
            await RunFFmpeg($"-i \"{originalLocalPath}\" -ss 00:00:05 -vframes 1 \"{thumbnailPath}\"", ct);

            // Upload HLS files to MinIO
            var hlsBaseKey = $"videos/{videoId}/hls";
            foreach (var file in Directory.GetFiles(hlsDir))
            {
                var fileName = Path.GetFileName(file);
                var contentType = fileName.EndsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t";
                using var fileStream = File.OpenRead(file);
                await storage.PutObjectAsync(bucket, $"{hlsBaseKey}/{fileName}", fileStream, contentType);
            }

            // Upload thumbnail
            string? thumbnailKey = null;
            if (File.Exists(thumbnailPath))
            {
                thumbnailKey = $"thumbnails/{videoId}/thumb.jpg";
                var thumbBucket = configuration["MinIO:BucketThumbnails"]!;
                using var thumbStream = File.OpenRead(thumbnailPath);
                await storage.PutObjectAsync(thumbBucket, thumbnailKey, thumbStream, "image/jpeg");
            }

            // Update video record
            video.HlsKey = $"{hlsBaseKey}/playlist.m3u8";
            video.ThumbnailKey = thumbnailKey;
            video.DurationSeconds = duration;
            video.Status = VideoStatus.Ready;
            await db.SaveChangesAsync(ct);

            logger.LogInformation("Video {VideoId} processed successfully", videoId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process video {VideoId}", videoId);
            video.Status = VideoStatus.Failed;
            await db.SaveChangesAsync(ct);
        }
        finally
        {
            Directory.Delete(tempDir, true);
        }
    }

    private static async Task RunFFmpeg(string args, CancellationToken ct)
    {
        var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "ffmpeg",
                Arguments = args,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };
        process.Start();
        await process.WaitForExitAsync(ct);
        if (process.ExitCode != 0)
        {
            var error = await process.StandardError.ReadToEndAsync(ct);
            throw new Exception($"FFmpeg failed: {error}");
        }
    }

    private static async Task<int?> GetVideoDuration(string filePath, CancellationToken ct)
    {
        var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "ffprobe",
                Arguments = $"-v quiet -print_format json -show_format \"{filePath}\"",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };
        process.Start();
        var output = await process.StandardOutput.ReadToEndAsync(ct);
        await process.WaitForExitAsync(ct);

        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(output);
            if (doc.RootElement.TryGetProperty("format", out var format) &&
                format.TryGetProperty("duration", out var duration) &&
                double.TryParse(duration.GetString(), out var seconds))
            {
                return (int)seconds;
            }
        }
        catch { }

        return null;
    }
}

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
    private record VideoJob(Guid VideoId, double? TrimStart = null, double? TrimEnd = null);

    private readonly Queue<VideoJob> _queue = new();
    private readonly SemaphoreSlim _signal = new(0);

    /// <summary>Enfileira processamento normal (upload completo → HLS).</summary>
    public void EnqueueVideo(Guid videoId)
    {
        _queue.Enqueue(new VideoJob(videoId));
        _signal.Release();
    }

    /// <summary>Enfileira um job de trim: corta o vídeo no intervalo e gera novo HLS.</summary>
    public void EnqueueTrim(Guid videoId, double trimStart, double trimEnd)
    {
        _queue.Enqueue(new VideoJob(videoId, trimStart, trimEnd));
        _signal.Release();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await _signal.WaitAsync(stoppingToken);
            if (!_queue.TryDequeue(out var job)) continue;

            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var storage = scope.ServiceProvider.GetRequiredService<MinIOStorageService>();

            await ProcessVideoAsync(db, storage, job, stoppingToken);
        }
    }

    private async Task ProcessVideoAsync(AppDbContext db, MinIOStorageService storage, VideoJob job, CancellationToken ct)
    {
        var videoId = job.VideoId;
        var video = await db.Videos.FindAsync([videoId], ct);
        if (video is null) return;

        var isTrim = job.TrimStart.HasValue && job.TrimEnd.HasValue;
        logger.LogInformation("Processing video {VideoId}{Trim}", videoId,
            isTrim ? $" [trim {job.TrimStart:F1}s → {job.TrimEnd:F1}s]" : "");

        var tempDir = Path.Combine(Path.GetTempPath(), videoId.ToString());
        Directory.CreateDirectory(tempDir);

        try
        {
            var bucket = configuration["MinIO:BucketVideos"]!;
            var originalLocalPath = Path.Combine(tempDir, "original");

            // Baixa o arquivo original do MinIO via cliente S3 interno (Docker-safe)
            var fileBytes = await storage.DownloadObjectAsync(bucket, video.OriginalKey!);
            await File.WriteAllBytesAsync(originalLocalPath, fileBytes, ct);

            // Monta os argumentos de trim (se houver)
            var trimArgs = isTrim
                ? $"-ss {job.TrimStart!.Value.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)} " +
                  $"-to {job.TrimEnd!.Value.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)} "
                : "";

            // Transcodifica para HLS com FFmpeg
            var hlsDir = Path.Combine(tempDir, "hls");
            Directory.CreateDirectory(hlsDir);
            var playlistPath = Path.Combine(hlsDir, "playlist.m3u8");

            var ffmpegArgs = $"-i \"{originalLocalPath}\" {trimArgs}" +
                "-c:v libx264 -crf 23 -preset fast " +
                "-c:a aac -b:a 128k " +
                $"-hls_time 6 -hls_playlist_type vod " +
                $"-hls_segment_filename \"{hlsDir}/segment%03d.ts\" " +
                $"\"{playlistPath}\"";

            await RunFFmpeg(ffmpegArgs, ct);

            // Extrai duração do arquivo processado (considera trim)
            var duration = await GetVideoDuration(playlistPath, ct)
                ?? await GetVideoDuration(originalLocalPath, ct);

            // Thumbnail: tira no segundo 5 (ou meio do trim)
            var thumbSeek = isTrim
                ? ((job.TrimStart!.Value + job.TrimEnd!.Value) / 2).ToString("F2", System.Globalization.CultureInfo.InvariantCulture)
                : "00:00:05";
            var thumbnailPath = Path.Combine(tempDir, "thumbnail.jpg");
            await RunFFmpeg($"-i \"{originalLocalPath}\" -ss {thumbSeek} -vframes 1 \"{thumbnailPath}\"", ct);

            // Sobe arquivos HLS para o MinIO
            var hlsBaseKey = $"videos/{videoId}/hls";
            foreach (var file in Directory.GetFiles(hlsDir))
            {
                var fileName = Path.GetFileName(file);
                var contentType = fileName.EndsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t";
                using var fileStream = File.OpenRead(file);
                await storage.PutObjectAsync(bucket, $"{hlsBaseKey}/{fileName}", fileStream, contentType);
            }

            // Sobe thumbnail
            string? thumbnailKey = null;
            if (File.Exists(thumbnailPath))
            {
                thumbnailKey = $"thumbnails/{videoId}/thumb.jpg";
                var thumbBucket = configuration["MinIO:BucketThumbnails"]!;
                using var thumbStream = File.OpenRead(thumbnailPath);
                await storage.PutObjectAsync(thumbBucket, thumbnailKey, thumbStream, "image/jpeg");
            }

            // Atualiza o registro do vídeo
            video.HlsKey = $"{hlsBaseKey}/playlist.m3u8";
            video.ThumbnailKey = thumbnailKey;
            video.DurationSeconds = duration;
            video.Status = VideoStatus.Ready;
            await db.SaveChangesAsync(ct);

            logger.LogInformation("Video {VideoId} processado com sucesso", videoId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Falha ao processar video {VideoId}", videoId);
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
                double.TryParse(duration.GetString(),
                    System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture,
                    out var seconds))
            {
                return (int)seconds;
            }
        }
        catch { }

        return null;
    }
}

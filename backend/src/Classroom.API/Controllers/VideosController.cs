using System.Security.Claims;
using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Infrastructure.Data;
using Classroom.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/videos")]
[Authorize]
public class VideosController(AppDbContext db, MinIOStorageService storage, VideoProcessingService videoProcessor, IConfiguration configuration) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private const int ChunkSize = 10 * 1024 * 1024; // 10MB

    [HttpPost("upload/initiate")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<InitiateUploadResponse>> InitiateUpload([FromBody] InitiateUploadRequest request)
    {
        var video = new Video
        {
            Title = request.Title ?? request.FileName,
            MimeType = request.ContentType,
            SizeBytes = request.FileSize,
            UploadedById = CurrentUserId
        };
        db.Videos.Add(video);
        await db.SaveChangesAsync();

        var bucket = configuration["MinIO:BucketVideos"]!;
        var objectKey = $"videos/{video.Id}/original{Path.GetExtension(request.FileName)}";
        video.OriginalKey = objectKey;
        await db.SaveChangesAsync();

        var uploadId = await storage.InitiateMultipartUpload(bucket, objectKey, request.ContentType);

        var totalParts = (int)Math.Ceiling((double)request.FileSize / ChunkSize);
        var parts = Enumerable.Range(1, totalParts)
            .Select(n => new UploadPart(n, storage.GeneratePresignedPartUrl(bucket, objectKey, uploadId, n)))
            .ToList();

        return Ok(new InitiateUploadResponse(video.Id, uploadId, parts, ChunkSize));
    }

    [HttpPost("upload/complete")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<VideoDto>> CompleteUpload([FromBody] CompleteUploadRequest request)
    {
        var video = await db.Videos.FindAsync(request.VideoId);
        if (video is null) return NotFound();

        var bucket = configuration["MinIO:BucketVideos"]!;
        var parts = request.Parts
            .OrderBy(p => p.PartNumber)
            .Select(p => (p.PartNumber, p.ETag))
            .ToList();

        await storage.CompleteMultipartUpload(bucket, video.OriginalKey!, request.UploadId, parts);

        // Enqueue for transcoding
        videoProcessor.EnqueueVideo(video.Id);

        return Ok(MapDto(video));
    }

    /// <summary>
    /// Proxy: receive one chunk from the browser and upload it directly to MinIO.
    /// This avoids the browser needing to reach MinIO directly (SSL/CORS issues).
    /// </summary>
    [HttpPut("upload/part")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(12 * 1024 * 1024)] // 12MB (10MB chunk + overhead)
    public async Task<ActionResult<object>> UploadPartProxy(
        [FromQuery] Guid videoId,
        [FromQuery] string uploadId,
        [FromQuery] int partNumber)
    {
        var video = await db.Videos.FindAsync(videoId);
        if (video is null) return NotFound();

        var bucket = configuration["MinIO:BucketVideos"]!;

        using var memStream = new MemoryStream();
        await Request.Body.CopyToAsync(memStream);
        memStream.Position = 0;

        var eTag = await storage.UploadPartAsync(bucket, video.OriginalKey!, uploadId, partNumber, memStream);
        return Ok(new { eTag });
    }

    [HttpPost("upload/abort")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AbortUpload([FromBody] AbortUploadRequest request)
    {
        var video = await db.Videos.FindAsync(request.VideoId);
        if (video is null) return NotFound();

        var bucket = configuration["MinIO:BucketVideos"]!;
        await storage.AbortMultipartUpload(bucket, video.OriginalKey!, request.UploadId);
        db.Videos.Remove(video);
        await db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Cria um novo vídeo cortando o intervalo [startSeconds, endSeconds] do vídeo original.
    /// Retorna o novo VideoDto (status = Processing) — monitore via GET /status.
    /// </summary>
    [HttpPost("{id:guid}/trim")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<VideoDto>> TrimVideo(Guid id, [FromBody] TrimVideoRequest request)
    {
        var original = await db.Videos.FindAsync(id);
        if (original is null) return NotFound();
        if (original.Status != Domain.Enums.VideoStatus.Ready)
            return BadRequest(new { message = "O vídeo precisa estar pronto antes de editar." });
        if (request.StartSeconds < 0 || request.EndSeconds <= request.StartSeconds)
            return BadRequest(new { message = "Intervalo de corte inválido." });

        // Cria registro para o vídeo cortado (reutiliza o OriginalKey do pai)
        var trimmedTitle = request.Title ?? original.Title + " (cortado)";
        var trimmed = new Domain.Entities.Video
        {
            Title = trimmedTitle,
            MimeType = original.MimeType ?? "video/mp4",
            SizeBytes = 0,
            OriginalKey = original.OriginalKey,   // mesmo arquivo fonte
            UploadedById = CurrentUserId,
            Status = Domain.Enums.VideoStatus.Processing,
        };

        db.Videos.Add(trimmed);
        await db.SaveChangesAsync();

        videoProcessor.EnqueueTrim(trimmed.Id, request.StartSeconds, request.EndSeconds);
        return Ok(MapDto(trimmed));
    }

    [HttpGet("{id:guid}/play-url")]
    public async Task<ActionResult<object>> GetPlayUrl(Guid id)
    {
        var video = await db.Videos.FindAsync(id);
        if (video is null) return NotFound();
        if (video.Status != Domain.Enums.VideoStatus.Ready)
            return BadRequest(new { message = "Vídeo ainda não está pronto" });

        var bucket = configuration["MinIO:BucketVideos"]!;
        // URL direta (bucket público) — presigned URLs não funcionam com HLS.js
        // pois os segmentos .ts são carregados sem assinaturas
        var url = storage.GetPublicHlsUrl(bucket, video.HlsKey!);
        return Ok(new { url, hlsKey = video.HlsKey });
    }

    [HttpGet("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<VideoDto>> GetStatus(Guid id)
    {
        var video = await db.Videos.FindAsync(id);
        if (video is null) return NotFound();
        return Ok(MapDto(video));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var video = await db.Videos.FindAsync(id);
        if (video is null) return NotFound();

        var bucket = configuration["MinIO:BucketVideos"]!;
        if (!string.IsNullOrEmpty(video.OriginalKey))
            await storage.DeleteObject(bucket, video.OriginalKey);
        if (!string.IsNullOrEmpty(video.HlsKey))
        {
            // Delete HLS playlist and segments
            var prefix = video.HlsKey.Replace("/playlist.m3u8", "");
            await storage.DeleteObject(bucket, video.HlsKey);
        }

        db.Videos.Remove(video);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static VideoDto MapDto(Video v) => new(
        v.Id, v.Title, v.HlsKey, v.ThumbnailKey,
        v.Status.ToString(), v.DurationSeconds, v.SizeBytes, v.CreatedAt
    );
}

public record AbortUploadRequest(Guid VideoId, string UploadId);

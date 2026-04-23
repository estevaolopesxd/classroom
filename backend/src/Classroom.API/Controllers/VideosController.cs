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

    [HttpGet("{id:guid}/play-url")]
    public async Task<ActionResult<object>> GetPlayUrl(Guid id)
    {
        var video = await db.Videos.FindAsync(id);
        if (video is null) return NotFound();
        if (video.Status != Domain.Enums.VideoStatus.Ready)
            return BadRequest(new { message = "Vídeo ainda não está pronto" });

        var bucket = configuration["MinIO:BucketVideos"]!;
        var url = storage.GeneratePresignedGetUrl(bucket, video.HlsKey!, 3600);
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

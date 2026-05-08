namespace Classroom.Application.DTOs;

public record InitiateUploadRequest(
    string FileName,
    long FileSize,
    string ContentType,
    string? Title = null
);

public record InitiateUploadResponse(
    Guid VideoId,
    string UploadId,
    List<UploadPart> Parts,
    int ChunkSize
);

public record UploadPart(int PartNumber, string Url);

public record CompleteUploadRequest(
    Guid VideoId,
    string UploadId,
    List<CompletedPart> Parts
);

public record CompletedPart(int PartNumber, string ETag);

public record VideoDto(
    Guid Id,
    string? Title,
    string? HlsUrl,
    string? ThumbnailUrl,
    string Status,
    int? DurationSeconds,
    long? SizeBytes,
    DateTime CreatedAt
);

public record TrimVideoRequest(double StartSeconds, double EndSeconds, string? Title = null);

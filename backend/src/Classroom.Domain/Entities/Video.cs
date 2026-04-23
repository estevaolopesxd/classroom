using Classroom.Domain.Common;
using Classroom.Domain.Enums;

namespace Classroom.Domain.Entities;

public class Video : BaseEntity
{
    public string? Title { get; set; }
    public string? OriginalKey { get; set; }
    public string? HlsKey { get; set; }
    public string? ThumbnailKey { get; set; }
    public VideoStatus Status { get; set; } = VideoStatus.Pending;
    public int? DurationSeconds { get; set; }
    public long? SizeBytes { get; set; }
    public string? MimeType { get; set; }
    public Guid UploadedById { get; set; }

    public User UploadedBy { get; set; } = null!;
}

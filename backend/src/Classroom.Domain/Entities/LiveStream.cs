using Classroom.Domain.Common;
using Classroom.Domain.Enums;

namespace Classroom.Domain.Entities;

public class LiveStream : BaseEntity
{
    public Guid? LessonId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string StreamKey { get; set; } = string.Empty;
    public string? HlsUrl { get; set; }
    public StreamStatus Status { get; set; } = StreamStatus.Scheduled;
    public DateTime? ScheduledAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public Guid? RecordingVideoId { get; set; }
    public Guid CreatedById { get; set; }

    public Lesson? Lesson { get; set; }
    public Video? RecordingVideo { get; set; }
    public User CreatedBy { get; set; } = null!;
}

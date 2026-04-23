using Classroom.Domain.Common;
using Classroom.Domain.Enums;

namespace Classroom.Domain.Entities;

public class Lesson : BaseEntity
{
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public LessonType Type { get; set; } = LessonType.Video;
    public int Order { get; set; }
    public int? DurationSeconds { get; set; }
    public bool IsFreePreview { get; set; }
    public Guid? VideoId { get; set; }
    public string? TextContent { get; set; }

    public Module Module { get; set; } = null!;
    public Video? Video { get; set; }
    public ICollection<LessonProgress> Progresses { get; set; } = new List<LessonProgress>();
}

namespace Classroom.Domain.Entities;

public class LessonComment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LessonId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }   // null = top-level, non-null = reply
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Lesson Lesson { get; set; } = null!;
    public User User { get; set; } = null!;
    public LessonComment? Parent { get; set; }
    public ICollection<LessonComment> Replies { get; set; } = new List<LessonComment>();
}

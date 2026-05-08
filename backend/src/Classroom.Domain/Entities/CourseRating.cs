namespace Classroom.Domain.Entities;

public class CourseRating
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    public Guid UserId { get; set; }
    public int Rating { get; set; }        // 1-5
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Course Course { get; set; } = null!;
    public User User { get; set; } = null!;
}

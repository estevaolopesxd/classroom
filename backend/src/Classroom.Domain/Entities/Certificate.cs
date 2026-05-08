namespace Classroom.Domain.Entities;

public class Certificate
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Código público e único para verificação (UUID formatado como string curta).</summary>
    public string Code { get; set; } = string.Empty;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

    // Snapshots no momento da emissão
    public string StudentName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int CourseDurationMinutes { get; set; }
}

using Classroom.Domain.Enums;

namespace Classroom.Domain.Entities;

public class CourseEnrollment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid CourseId { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public EnrollmentSource Source { get; set; } = EnrollmentSource.Purchase;

    public User User { get; set; } = null!;
    public Course Course { get; set; } = null!;
}

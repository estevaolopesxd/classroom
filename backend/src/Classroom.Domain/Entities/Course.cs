using Classroom.Domain.Common;
using Classroom.Domain.Enums;

namespace Classroom.Domain.Entities;

public class Course : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public string? ThumbnailUrl { get; set; }
    public Guid? TrailerVideoId { get; set; }
    public CourseStatus Status { get; set; } = CourseStatus.Draft;
    public bool IsForSale { get; set; }
    public decimal? Price { get; set; }
    public string Currency { get; set; } = "BRL";
    public string? StripePriceId { get; set; }
    public string? StripeProductId { get; set; }
    public string? Level { get; set; }
    public int? DurationMinutes { get; set; }
    public Guid CreatedById { get; set; }

    public User CreatedBy { get; set; } = null!;
    public Video? TrailerVideo { get; set; }
    public ICollection<Module> Modules { get; set; } = new List<Module>();
    public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
    public ICollection<Purchase> Purchases { get; set; } = new List<Purchase>();
}

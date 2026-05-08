using Classroom.Domain.Enums;

namespace Classroom.Domain.Entities;

public class CourseEnrollment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid CourseId { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public EnrollmentSource Source { get; set; } = EnrollmentSource.Purchase;

    // ── Subscription fields (null for OneTime / Free / Admin) ──────────────
    public string? StripeSubscriptionId { get; set; }
    public string? StripeCustomerId { get; set; }
    public SubscriptionStatus SubscriptionStatus { get; set; } = SubscriptionStatus.None;
    /// <summary>End of the current paid billing period. Access is valid until this date.</summary>
    public DateTime? CurrentPeriodEnd { get; set; }

    public User User { get; set; } = null!;
    public Course Course { get; set; } = null!;

    /// <summary>
    /// Returns true when the enrollment grants active access.
    /// OneTime / Free / Admin always have access.
    /// Subscriptions are valid while Active, PastDue, or the period hasn't ended yet.
    /// </summary>
    public bool HasAccess =>
        SubscriptionStatus == SubscriptionStatus.None ||
        SubscriptionStatus == SubscriptionStatus.Active ||
        SubscriptionStatus == SubscriptionStatus.PastDue ||
        (SubscriptionStatus == SubscriptionStatus.Cancelled && CurrentPeriodEnd.HasValue && CurrentPeriodEnd.Value > DateTime.UtcNow);
}

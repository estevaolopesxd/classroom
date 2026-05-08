namespace Classroom.Domain.Enums;

/// <summary>
/// Defines how the student is billed for a course.
/// OneTime = single payment, lifetime access.
/// Monthly / Quarterly / Semiannual / Annual = recurring Stripe subscription.
/// </summary>
public enum PricingType
{
    OneTime,
    Monthly,
    Quarterly,    // every 3 months
    Semiannual,   // every 6 months
    Annual        // every 12 months
}

namespace Classroom.Domain.Enums;

public enum SubscriptionStatus
{
    /// <summary>Subscription is active and paid.</summary>
    Active,
    /// <summary>Payment failed but still within grace period.</summary>
    PastDue,
    /// <summary>Subscription was cancelled; access may remain until CurrentPeriodEnd.</summary>
    Cancelled,
    /// <summary>No subscription (lifetime / free / admin grants).</summary>
    None
}

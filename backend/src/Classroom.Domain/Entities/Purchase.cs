using Classroom.Domain.Common;
using Classroom.Domain.Enums;

namespace Classroom.Domain.Entities;

public class Purchase : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid CourseId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "BRL";
    public string? StripeSessionId { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public PurchaseStatus Status { get; set; } = PurchaseStatus.Pending;
    public DateTime? PurchasedAt { get; set; }

    public Guid? CouponId { get; set; }
    public string? CouponCode { get; set; }
    public decimal? DiscountPercent { get; set; }

    public User User { get; set; } = null!;
    public Course Course { get; set; } = null!;
    public Coupon? Coupon { get; set; }
}

namespace Classroom.Application.DTOs;

public record CreateCheckoutRequest(Guid CourseId, string? CouponCode = null);

public record CheckoutResponse(string? CheckoutUrl, string? SessionId, bool IsFree = false);

public record PurchaseDto(
    Guid Id,
    Guid CourseId,
    string CourseTitle,
    decimal Amount,
    string Currency,
    string Status,
    DateTime? PurchasedAt,
    DateTime CreatedAt
);

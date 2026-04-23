namespace Classroom.Application.DTOs;

public record CreateCheckoutRequest(Guid CourseId);

public record CheckoutResponse(string CheckoutUrl, string SessionId);

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

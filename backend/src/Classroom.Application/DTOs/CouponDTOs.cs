using System.ComponentModel.DataAnnotations;

namespace Classroom.Application.DTOs;

public record CouponDto(
    Guid Id,
    string Code,
    decimal DiscountPercent,
    Guid? CourseId,
    string? CourseTitle,
    decimal? CoursePrice,
    string? CourseCurrency,
    bool IsActive,
    DateTime? ExpiresAt,
    int? MaxUses,
    int UsedCount,
    DateTime CreatedAt
);

public record CreateCouponRequest(
    /// <summary>Null = gerar automaticamente.</summary>
    string? Code,

    [Range(1, 100)] decimal DiscountPercent,

    /// <summary>Null = vale para qualquer curso.</summary>
    Guid? CourseId,

    bool IsActive = true,
    DateTime? ExpiresAt = null,
    int? MaxUses = null
);

public record UpdateCouponRequest(
    [MaxLength(50)] string? Code,
    [Range(1, 100)] decimal? DiscountPercent,
    Guid? CourseId,
    bool? IsActive,
    DateTime? ExpiresAt,
    int? MaxUses
);

public record ValidateCouponRequest(
    [Required] string Code,
    [Required] Guid CourseId
);

public record ValidateCouponResponse(
    bool Valid,
    string? Message,
    string? CouponId,
    string? Code,
    decimal DiscountPercent,
    decimal OriginalPrice,
    decimal FinalPrice,
    decimal SavedAmount
);

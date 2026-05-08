using Classroom.Domain.Common;

namespace Classroom.Domain.Entities;

public class Coupon : BaseEntity
{
    public string Code { get; set; } = string.Empty;

    /// <summary>Percentual de desconto: 0–100.</summary>
    public decimal DiscountPercent { get; set; }

    /// <summary>Null = vale para todos os cursos pagos.</summary>
    public Guid? CourseId { get; set; }
    public Course? Course { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>Null = sem expiração.</summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>Null = usos ilimitados.</summary>
    public int? MaxUses { get; set; }

    public int UsedCount { get; set; }

    public Guid CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
}

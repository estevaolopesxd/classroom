using System.Security.Claims;
using System.Text;
using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/coupons")]
[Authorize]
public class CouponsController(AppDbContext db) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── Admin: listar todos ────────────────────────────────────────────────

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<CouponDto>>> GetAll()
    {
        var coupons = await db.Coupons
            .Include(c => c.Course)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => MapDto(c))
            .ToListAsync();

        return Ok(coupons);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CouponDto>> GetById(Guid id)
    {
        var coupon = await db.Coupons.Include(c => c.Course).FirstOrDefaultAsync(c => c.Id == id);
        return coupon is null ? NotFound() : Ok(MapDto(coupon));
    }

    // ── Admin: criar ───────────────────────────────────────────────────────

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CouponDto>> Create([FromBody] CreateCouponRequest request)
    {
        var code = string.IsNullOrWhiteSpace(request.Code)
            ? GenerateCode()
            : request.Code.Trim().ToUpper();

        // Uniqueness check
        if (await db.Coupons.AnyAsync(c => c.Code == code))
            return Conflict(new { message = $"Código '{code}' já existe." });

        // Validate course if specified
        if (request.CourseId.HasValue)
        {
            var courseExists = await db.Courses.AnyAsync(c => c.Id == request.CourseId);
            if (!courseExists) return BadRequest(new { message = "Curso não encontrado." });
        }

        var coupon = new Coupon
        {
            Code = code,
            DiscountPercent = request.DiscountPercent,
            CourseId = request.CourseId,
            IsActive = request.IsActive,
            ExpiresAt = request.ExpiresAt,
            MaxUses = request.MaxUses,
            CreatedById = CurrentUserId
        };

        db.Coupons.Add(coupon);
        await db.SaveChangesAsync();

        // Reload with course navigation
        await db.Entry(coupon).Reference(c => c.Course).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = coupon.Id }, MapDto(coupon));
    }

    // ── Admin: gerar código aleatório ──────────────────────────────────────

    [HttpPost("generate-code")]
    [Authorize(Roles = "Admin")]
    public IActionResult GenerateUniqueCode()
    {
        return Ok(new { code = GenerateCode() });
    }

    // ── Admin: atualizar ───────────────────────────────────────────────────

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CouponDto>> Update(Guid id, [FromBody] UpdateCouponRequest request)
    {
        var coupon = await db.Coupons.Include(c => c.Course).FirstOrDefaultAsync(c => c.Id == id);
        if (coupon is null) return NotFound();

        if (request.Code is not null)
        {
            var newCode = request.Code.Trim().ToUpper();
            if (await db.Coupons.AnyAsync(c => c.Code == newCode && c.Id != id))
                return Conflict(new { message = $"Código '{newCode}' já existe." });
            coupon.Code = newCode;
        }

        if (request.DiscountPercent.HasValue) coupon.DiscountPercent = request.DiscountPercent.Value;
        if (request.IsActive.HasValue) coupon.IsActive = request.IsActive.Value;
        if (request.ExpiresAt.HasValue) coupon.ExpiresAt = request.ExpiresAt;
        if (request.MaxUses.HasValue) coupon.MaxUses = request.MaxUses;

        // Allow unsetting CourseId (null = válido para todos)
        coupon.CourseId = request.CourseId;
        if (coupon.CourseId.HasValue)
            await db.Entry(coupon).Reference(c => c.Course).LoadAsync();
        else
            coupon.Course = null;

        await db.SaveChangesAsync();

        if (coupon.CourseId.HasValue && coupon.Course is null)
            await db.Entry(coupon).Reference(c => c.Course).LoadAsync();

        return Ok(MapDto(coupon));
    }

    // ── Admin: toggle ativo/inativo ────────────────────────────────────────

    [HttpPost("{id:guid}/toggle")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CouponDto>> Toggle(Guid id)
    {
        var coupon = await db.Coupons.Include(c => c.Course).FirstOrDefaultAsync(c => c.Id == id);
        if (coupon is null) return NotFound();

        coupon.IsActive = !coupon.IsActive;
        await db.SaveChangesAsync();
        return Ok(MapDto(coupon));
    }

    // ── Admin: deletar ─────────────────────────────────────────────────────

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var coupon = await db.Coupons.FindAsync(id);
        if (coupon is null) return NotFound();

        // Prevent deleting coupons that have been used
        if (coupon.UsedCount > 0)
            return BadRequest(new { message = "Não é possível deletar um cupom que já foi utilizado. Desative-o." });

        db.Coupons.Remove(coupon);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Público (autenticado): validar cupom ───────────────────────────────

    [HttpPost("validate")]
    public async Task<ActionResult<ValidateCouponResponse>> Validate([FromBody] ValidateCouponRequest request)
    {
        var code = request.Code.Trim().ToUpper();

        var coupon = await db.Coupons
            .Include(c => c.Course)
            .FirstOrDefaultAsync(c => c.Code == code);

        if (coupon is null)
            return Ok(Fail("Cupom não encontrado."));

        if (!coupon.IsActive)
            return Ok(Fail("Este cupom está inativo."));

        if (coupon.ExpiresAt.HasValue && coupon.ExpiresAt.Value < DateTime.UtcNow)
            return Ok(Fail("Este cupom expirou."));

        if (coupon.MaxUses.HasValue && coupon.UsedCount >= coupon.MaxUses.Value)
            return Ok(Fail("Este cupom atingiu o limite de usos."));

        // Coupon is tied to a specific course
        if (coupon.CourseId.HasValue && coupon.CourseId.Value != request.CourseId)
            return Ok(Fail("Este cupom não é válido para este curso."));

        var course = await db.Courses.FindAsync(request.CourseId);
        if (course is null || !course.Price.HasValue || course.Price.Value <= 0)
            return Ok(Fail("Curso não encontrado ou não é pago."));

        var original = course.Price.Value;
        var saved = Math.Round(original * coupon.DiscountPercent / 100, 2);
        var final = Math.Max(0, original - saved);

        return Ok(new ValidateCouponResponse(
            true, null,
            coupon.Id.ToString(), coupon.Code,
            coupon.DiscountPercent, original, final, saved
        ));
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private static ValidateCouponResponse Fail(string message) =>
        new(false, message, null, null, 0, 0, 0, 0);

    /// <summary>
    /// Gera um código legível de 8 caracteres (sem vogais nem dígitos ambíguos).
    /// Ex: KPTM-7W3X
    /// </summary>
    private static string GenerateCode()
    {
        const string chars = "BCDFGHJKLMNPQRSTVWXZ23456789";
        var rng = new Random();
        var sb = new StringBuilder(9);
        for (var i = 0; i < 8; i++)
        {
            if (i == 4) sb.Append('-');
            sb.Append(chars[rng.Next(chars.Length)]);
        }
        return sb.ToString();
    }

    private static CouponDto MapDto(Coupon c) => new(
        c.Id, c.Code, c.DiscountPercent,
        c.CourseId, c.Course?.Title,
        c.Course?.Price, c.Course?.Currency,
        c.IsActive, c.ExpiresAt,
        c.MaxUses, c.UsedCount, c.CreatedAt
    );
}

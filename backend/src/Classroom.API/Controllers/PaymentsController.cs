using System.Security.Claims;
using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Domain.Enums;
using Classroom.Infrastructure.Data;
using Classroom.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe.Checkout;

namespace Classroom.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController(AppDbContext db, StripeService stripe, IConfiguration configuration) : ControllerBase
{
    [HttpPost("checkout")]
    [Authorize]
    public async Task<ActionResult<CheckoutResponse>> CreateCheckout([FromBody] CreateCheckoutRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var userEmail = User.FindFirstValue(ClaimTypes.Email)!;

        var course = await db.Courses.FindAsync(request.CourseId);
        if (course is null) return NotFound();
        if (!course.IsForSale || !course.Price.HasValue || course.Price.Value <= 0)
            return BadRequest(new { message = "Este curso não está disponível para venda" });

        var isEnrolled = await db.CourseEnrollments
            .AnyAsync(e => e.UserId == userId && e.CourseId == request.CourseId);
        if (isEnrolled)
            return Conflict(new { message = "Você já está inscrito neste curso" });

        // ── Resolver cupom ──────────────────────────────────────────────────
        Coupon? coupon = null;
        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            var code = request.CouponCode.Trim().ToUpper();
            coupon = await db.Coupons.FirstOrDefaultAsync(c =>
                c.Code == code && c.IsActive &&
                (c.ExpiresAt == null || c.ExpiresAt > DateTime.UtcNow) &&
                (c.MaxUses == null || c.UsedCount < c.MaxUses) &&
                (c.CourseId == null || c.CourseId == request.CourseId));

            if (coupon is null)
                return BadRequest(new { message = "Cupom inválido, inativo ou expirado." });
        }

        var originalPrice = course.Price.Value;
        var discount = coupon is not null
            ? Math.Round(originalPrice * coupon.DiscountPercent / 100, 2)
            : 0m;
        var finalPrice = Math.Max(0, originalPrice - discount);

        // ── Cupom 100%: inscrição gratuita direta ───────────────────────────
        if (finalPrice == 0)
        {
            db.CourseEnrollments.Add(new CourseEnrollment
            {
                UserId = userId,
                CourseId = course.Id,
                Source = EnrollmentSource.Free
            });

            var freePurchase = new Purchase
            {
                UserId = userId,
                CourseId = course.Id,
                Amount = 0,
                Currency = course.Currency,
                Status = PurchaseStatus.Completed,
                PurchasedAt = DateTime.UtcNow,
                CouponId = coupon!.Id,
                CouponCode = coupon.Code,
                DiscountPercent = coupon.DiscountPercent
            };
            db.Purchases.Add(freePurchase);

            coupon.UsedCount++;
            await db.SaveChangesAsync();

            return Ok(new CheckoutResponse(null, null, true));
        }

        // ── Checkout via Stripe ─────────────────────────────────────────────
        if (!stripe.IsConfigured)
            return BadRequest(new { message = "Pagamentos não configurados. Configure as chaves Stripe no servidor." });

        if (string.IsNullOrEmpty(course.StripePriceId))
            return BadRequest(new { message = "Este curso não possui preço configurado no Stripe." });

        var frontendUrl = configuration["AllowedOrigins__0"] ?? "http://localhost:3002";

        // Se há desconto, criamos um coupon no Stripe e passamos para a sessão
        string? stripeCouponId = null;
        if (coupon is not null)
            stripeCouponId = await stripe.CreateOrGetCouponAsync(coupon.Id.ToString(), coupon.DiscountPercent);

        var session = await stripe.CreateCheckoutSessionAsync(
            course.StripePriceId, userEmail,
            userId.ToString(), course.Id.ToString(),
            $"{frontendUrl}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            $"{frontendUrl}/checkout/cancel",
            stripeCouponId
        );

        var purchase = new Purchase
        {
            UserId = userId,
            CourseId = course.Id,
            Amount = finalPrice,
            Currency = course.Currency,
            StripeSessionId = session.Id,
            Status = PurchaseStatus.Pending,
            CouponId = coupon?.Id,
            CouponCode = coupon?.Code,
            DiscountPercent = coupon?.DiscountPercent
        };
        db.Purchases.Add(purchase);

        // Reserva o uso do cupom — confirma ao receber webhook
        if (coupon is not null)
            coupon.UsedCount++;

        await db.SaveChangesAsync();

        return Ok(new CheckoutResponse(session.Url, session.Id));
    }

    [HttpGet("history")]
    [Authorize]
    public async Task<ActionResult<List<PurchaseDto>>> GetHistory()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var purchases = await db.Purchases
            .Where(p => p.UserId == userId)
            .Include(p => p.Course)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PurchaseDto(
                p.Id, p.CourseId, p.Course.Title,
                p.Amount, p.Currency, p.Status.ToString(),
                p.PurchasedAt, p.CreatedAt))
            .ToListAsync();

        return Ok(purchases);
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();

        if (string.IsNullOrEmpty(signature))
            return BadRequest();

        Stripe.Event stripeEvent;
        try
        {
            stripeEvent = stripe.ConstructWebhookEvent(json, signature);
        }
        catch (Exception)
        {
            return BadRequest(new { message = "Webhook inválido" });
        }

        if (stripeEvent.Type == "checkout.session.completed")
        {
            var session = stripeEvent.Data.Object as Session;
            if (session is null) return Ok();

            if (!session.Metadata.TryGetValue("userId", out var userIdStr) ||
                !session.Metadata.TryGetValue("courseId", out var courseIdStr))
                return Ok();

            var userId = Guid.Parse(userIdStr);
            var courseId = Guid.Parse(courseIdStr);

            var purchase = await db.Purchases
                .FirstOrDefaultAsync(p => p.StripeSessionId == session.Id);

            if (purchase is not null)
            {
                purchase.Status = PurchaseStatus.Completed;
                purchase.StripePaymentIntentId = session.PaymentIntentId;
                purchase.PurchasedAt = DateTime.UtcNow;
            }

            var alreadyEnrolled = await db.CourseEnrollments
                .AnyAsync(e => e.UserId == userId && e.CourseId == courseId);

            if (!alreadyEnrolled)
            {
                db.CourseEnrollments.Add(new CourseEnrollment
                {
                    UserId = userId,
                    CourseId = courseId,
                    Source = EnrollmentSource.Purchase
                });
            }

            await db.SaveChangesAsync();
        }
        else if (stripeEvent.Type == "charge.refunded")
        {
            // Handle refund - could revoke enrollment
            var charge = stripeEvent.Data.Object as Stripe.Charge;
            if (charge?.PaymentIntentId is not null)
            {
                var purchase = await db.Purchases
                    .FirstOrDefaultAsync(p => p.StripePaymentIntentId == charge.PaymentIntentId);
                if (purchase is not null)
                    purchase.Status = PurchaseStatus.Refunded;
                await db.SaveChangesAsync();
            }
        }

        return Ok();
    }
}

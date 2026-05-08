using System.Security.Claims;
using Classroom.Application.DTOs;
using Classroom.Domain.Entities;
using Classroom.Domain.Enums;
using Classroom.Infrastructure.Data;
using Classroom.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
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
            .AnyAsync(e => e.UserId == userId && e.CourseId == request.CourseId && (
                e.SubscriptionStatus == SubscriptionStatus.None ||
                e.SubscriptionStatus == SubscriptionStatus.Active ||
                e.SubscriptionStatus == SubscriptionStatus.PastDue ||
                (e.SubscriptionStatus == SubscriptionStatus.Cancelled && e.CurrentPeriodEnd > DateTime.UtcNow)
            ));
        if (isEnrolled)
            return Conflict(new { message = "Você já está inscrito neste curso" });

        // ── Resolver cupom ──────────────────────────────────────────────────
        Domain.Entities.Coupon? coupon = null;
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
                Source = EnrollmentSource.Free,
                SubscriptionStatus = SubscriptionStatus.None
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

        string? stripeCouponId = null;
        if (coupon is not null)
            stripeCouponId = await stripe.CreateOrGetCouponAsync(coupon.Id.ToString(), coupon.DiscountPercent);

        var session = await stripe.CreateCheckoutSessionAsync(
            course.StripePriceId, userEmail,
            userId.ToString(), course.Id.ToString(),
            $"{frontendUrl}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            $"{frontendUrl}/checkout/cancel",
            course.PricingType,
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

        if (coupon is not null) coupon.UsedCount++;
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

        if (string.IsNullOrEmpty(signature)) return BadRequest();

        Stripe.Event stripeEvent;
        try
        {
            stripeEvent = stripe.ConstructWebhookEvent(json, signature);
        }
        catch
        {
            return BadRequest(new { message = "Webhook inválido" });
        }

        switch (stripeEvent.Type)
        {
            // ── One-time payment completed ───────────────────────────────────
            case "checkout.session.completed":
            {
                var session = stripeEvent.Data.Object as Session;
                if (session is null) break;

                if (!session.Metadata.TryGetValue("userId", out var userIdStr) ||
                    !session.Metadata.TryGetValue("courseId", out var courseIdStr))
                    break;

                var userId = Guid.Parse(userIdStr);
                var courseId = Guid.Parse(courseIdStr);

                // Update purchase record
                var purchase = await db.Purchases
                    .FirstOrDefaultAsync(p => p.StripeSessionId == session.Id);
                if (purchase is not null)
                {
                    purchase.Status = PurchaseStatus.Completed;
                    purchase.StripePaymentIntentId = session.PaymentIntentId;
                    purchase.PurchasedAt = DateTime.UtcNow;
                }

                // For subscriptions, enrollment is created/updated on subscription.updated below.
                // For one-time payments, create enrollment here.
                if (session.Mode == "payment")
                {
                    var alreadyEnrolled = await db.CourseEnrollments
                        .AnyAsync(e => e.UserId == userId && e.CourseId == courseId);
                    if (!alreadyEnrolled)
                    {
                        db.CourseEnrollments.Add(new CourseEnrollment
                        {
                            UserId = userId,
                            CourseId = courseId,
                            Source = EnrollmentSource.Purchase,
                            SubscriptionStatus = SubscriptionStatus.None
                        });
                    }
                }

                // For subscriptions, save the subscription ID + customer on enrollment
                if (session.Mode == "subscription" && !string.IsNullOrEmpty(session.SubscriptionId))
                {
                    var enrollment = await db.CourseEnrollments
                        .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

                    if (enrollment is null)
                    {
                        enrollment = new CourseEnrollment
                        {
                            UserId = userId,
                            CourseId = courseId,
                            Source = EnrollmentSource.Purchase,
                            SubscriptionStatus = SubscriptionStatus.Active,
                            StripeSubscriptionId = session.SubscriptionId,
                            StripeCustomerId = session.CustomerId
                        };
                        db.CourseEnrollments.Add(enrollment);
                    }
                    else
                    {
                        enrollment.StripeSubscriptionId = session.SubscriptionId;
                        enrollment.StripeCustomerId = session.CustomerId;
                        enrollment.SubscriptionStatus = SubscriptionStatus.Active;
                    }
                }

                await db.SaveChangesAsync();
                break;
            }

            // ── Subscription updated (renewal, trial end, status change) ────
            // In Stripe.net v51, period end is on SubscriptionItem
            case "customer.subscription.updated":
            {
                var sub = stripeEvent.Data.Object as Subscription;
                if (sub is null) break;

                var enrollment = await db.CourseEnrollments
                    .FirstOrDefaultAsync(e => e.StripeSubscriptionId == sub.Id);
                if (enrollment is null) break;

                enrollment.SubscriptionStatus = MapSubscriptionStatus(sub.Status);
                enrollment.CurrentPeriodEnd = sub.Items?.Data?.FirstOrDefault()?.CurrentPeriodEnd;
                await db.SaveChangesAsync();
                break;
            }

            // ── Subscription deleted / cancelled ────────────────────────────
            case "customer.subscription.deleted":
            {
                var sub = stripeEvent.Data.Object as Subscription;
                if (sub is null) break;

                var enrollment = await db.CourseEnrollments
                    .FirstOrDefaultAsync(e => e.StripeSubscriptionId == sub.Id);
                if (enrollment is null) break;

                enrollment.SubscriptionStatus = SubscriptionStatus.Cancelled;
                enrollment.CurrentPeriodEnd = sub.Items?.Data?.FirstOrDefault()?.CurrentPeriodEnd;
                await db.SaveChangesAsync();
                break;
            }

            // ── Invoice paid — extend period ─────────────────────────────────
            // In Stripe.net v51, Invoice.Parent.SubscriptionDetails.SubscriptionId
            case "invoice.payment_succeeded":
            {
                var invoice = stripeEvent.Data.Object as Invoice;
                var subId = invoice?.Parent?.SubscriptionDetails?.SubscriptionId;
                if (subId is null) break;

                var enrollment = await db.CourseEnrollments
                    .FirstOrDefaultAsync(e => e.StripeSubscriptionId == subId);
                if (enrollment is null) break;

                enrollment.SubscriptionStatus = SubscriptionStatus.Active;
                await db.SaveChangesAsync();
                break;
            }

            // ── Invoice payment failed ────────────────────────────────────────
            case "invoice.payment_failed":
            {
                var invoice = stripeEvent.Data.Object as Invoice;
                var subId = invoice?.Parent?.SubscriptionDetails?.SubscriptionId;
                if (subId is null) break;

                var enrollment = await db.CourseEnrollments
                    .FirstOrDefaultAsync(e => e.StripeSubscriptionId == subId);
                if (enrollment is null) break;

                enrollment.SubscriptionStatus = SubscriptionStatus.PastDue;
                await db.SaveChangesAsync();
                break;
            }

            // ── Refund ────────────────────────────────────────────────────────
            case "charge.refunded":
            {
                var charge = stripeEvent.Data.Object as Charge;
                if (charge?.PaymentIntentId is not null)
                {
                    var purchase = await db.Purchases
                        .FirstOrDefaultAsync(p => p.StripePaymentIntentId == charge.PaymentIntentId);
                    if (purchase is not null)
                        purchase.Status = PurchaseStatus.Refunded;
                    await db.SaveChangesAsync();
                }
                break;
            }
        }

        return Ok();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static SubscriptionStatus MapSubscriptionStatus(string stripeStatus) => stripeStatus switch
    {
        "active"   => SubscriptionStatus.Active,
        "past_due" => SubscriptionStatus.PastDue,
        "canceled" => SubscriptionStatus.Cancelled,
        "unpaid"   => SubscriptionStatus.PastDue,
        _          => SubscriptionStatus.Active
    };
}

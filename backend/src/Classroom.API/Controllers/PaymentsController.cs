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

        if (!stripe.IsConfigured)
            return BadRequest(new { message = "Pagamentos não configurados. Configure as chaves Stripe no servidor." });

        var course = await db.Courses.FindAsync(request.CourseId);
        if (course is null) return NotFound();
        if (!course.IsForSale || string.IsNullOrEmpty(course.StripePriceId))
            return BadRequest(new { message = "Este curso não está disponível para venda" });

        var isEnrolled = await db.CourseEnrollments
            .AnyAsync(e => e.UserId == userId && e.CourseId == request.CourseId);
        if (isEnrolled)
            return Conflict(new { message = "Você já está inscrito neste curso" });

        var frontendUrl = configuration["Cors:Origins"] ?? "http://localhost:3000";
        var session = await stripe.CreateCheckoutSessionAsync(
            course.StripePriceId, userEmail,
            userId.ToString(), course.Id.ToString(),
            $"{frontendUrl}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            $"{frontendUrl}/checkout/cancel"
        );

        var purchase = new Purchase
        {
            UserId = userId,
            CourseId = course.Id,
            Amount = course.Price!.Value,
            Currency = course.Currency,
            StripeSessionId = session.Id,
            Status = PurchaseStatus.Pending
        };
        db.Purchases.Add(purchase);
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

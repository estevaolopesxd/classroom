using Classroom.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace Classroom.Infrastructure.Services;

public class StripeService(IConfiguration configuration)
{
    private readonly string? _secretKey = configuration["Stripe:SecretKey"];
    private readonly string? _webhookSecret = configuration["Stripe:WebhookSecret"];

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_secretKey) &&
        !_secretKey.StartsWith("sk_test_disabled") &&
        _secretKey.StartsWith("sk_");

    private StripeClient CreateClient()
    {
        if (!IsConfigured)
            throw new InvalidOperationException("Stripe não configurado. Adicione STRIPE_SECRET_KEY no .env");
        return new StripeClient(_secretKey);
    }

    public async Task<Product> CreateProductAsync(string name, string description)
    {
        var service = new ProductService(CreateClient());
        return await service.CreateAsync(new ProductCreateOptions
        {
            Name = name,
            Description = description
        });
    }

    /// <summary>
    /// Creates a Stripe Price for a given product.
    /// For OneTime pricing, creates a one-off price.
    /// For subscription pricing, creates a recurring price with the correct interval.
    /// </summary>
    public async Task<Price> CreatePriceAsync(string productId, decimal amount, string currency, PricingType pricingType)
    {
        var service = new PriceService(CreateClient());

        var options = new PriceCreateOptions
        {
            Product = productId,
            UnitAmount = (long)(amount * 100),
            Currency = currency.ToLower()
        };

        if (pricingType != PricingType.OneTime)
        {
            options.Recurring = pricingType switch
            {
                PricingType.Monthly    => new PriceRecurringOptions { Interval = "month", IntervalCount = 1 },
                PricingType.Quarterly  => new PriceRecurringOptions { Interval = "month", IntervalCount = 3 },
                PricingType.Semiannual => new PriceRecurringOptions { Interval = "month", IntervalCount = 6 },
                PricingType.Annual     => new PriceRecurringOptions { Interval = "year",  IntervalCount = 1 },
                _ => null
            };
        }

        return await service.CreateAsync(options);
    }

    /// <summary>
    /// Creates a Stripe Checkout Session.
    /// Automatically chooses "payment" or "subscription" mode based on pricing type.
    /// Coupon discounts are supported for both modes.
    /// </summary>
    public async Task<Session> CreateCheckoutSessionAsync(
        string priceId,
        string customerEmail,
        string userId,
        string courseId,
        string successUrl,
        string cancelUrl,
        PricingType pricingType = PricingType.OneTime,
        string? stripeCouponId = null)
    {
        var client = CreateClient();
        var isSubscription = pricingType != PricingType.OneTime;

        var options = new SessionCreateOptions
        {
            Mode = isSubscription ? "subscription" : "payment",
            CustomerEmail = customerEmail,
            LineItems =
            [
                new SessionLineItemOptions
                {
                    Price = priceId,
                    Quantity = 1
                }
            ],
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl,
            Metadata = new Dictionary<string, string>
            {
                ["userId"]   = userId,
                ["courseId"] = courseId
            }
        };

        // Discounts work at session level for both payment and subscription modes
        if (!string.IsNullOrEmpty(stripeCouponId))
        {
            options.Discounts =
            [
                new SessionDiscountOptions { Coupon = stripeCouponId }
            ];
        }

        var service = new SessionService(client);
        return await service.CreateAsync(options);
    }

    /// <summary>
    /// Creates a percentage-off coupon on Stripe (idempotent — uses coupon GUID as Stripe coupon ID).
    /// </summary>
    public async Task<string> CreateOrGetCouponAsync(string couponId, decimal discountPercent)
    {
        var client = CreateClient();
        var service = new CouponService(client);

        try
        {
            var existing = await service.GetAsync(couponId);
            return existing.Id;
        }
        catch (StripeException ex) when (ex.StripeError?.Code == "resource_missing")
        {
            // Not found — create it
        }

        var coupon = await service.CreateAsync(new CouponCreateOptions
        {
            Id = couponId,
            PercentOff = discountPercent,
            Duration = "once"
        });
        return coupon.Id;
    }

    /// <summary>Cancels an active Stripe subscription immediately.</summary>
    public async Task CancelSubscriptionAsync(string subscriptionId)
    {
        var service = new SubscriptionService(CreateClient());
        await service.CancelAsync(subscriptionId, new SubscriptionCancelOptions());
    }

    public Event ConstructWebhookEvent(string json, string signature)
    {
        if (string.IsNullOrWhiteSpace(_webhookSecret) || _webhookSecret.StartsWith("whsec_disabled"))
            throw new InvalidOperationException("Stripe webhook não configurado");
        return EventUtility.ConstructEvent(json, signature, _webhookSecret);
    }
}

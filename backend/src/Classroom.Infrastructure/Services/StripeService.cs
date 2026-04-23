using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace Classroom.Infrastructure.Services;

public class StripeService(IConfiguration configuration)
{
    private readonly string _secretKey = configuration["Stripe:SecretKey"]!;
    private readonly string _webhookSecret = configuration["Stripe:WebhookSecret"]!;

    private StripeClient CreateClient() => new(_secretKey);

    public async Task<Product> CreateProductAsync(string name, string description)
    {
        var service = new ProductService(CreateClient());
        return await service.CreateAsync(new ProductCreateOptions
        {
            Name = name,
            Description = description
        });
    }

    public async Task<Price> CreatePriceAsync(string productId, decimal amount, string currency)
    {
        var service = new PriceService(CreateClient());
        return await service.CreateAsync(new PriceCreateOptions
        {
            Product = productId,
            UnitAmount = (long)(amount * 100),
            Currency = currency.ToLower()
        });
    }

    public async Task<Session> CreateCheckoutSessionAsync(
        string priceId, string customerEmail, string userId, string courseId,
        string successUrl, string cancelUrl)
    {
        var service = new SessionService(CreateClient());
        return await service.CreateAsync(new SessionCreateOptions
        {
            Mode = "payment",
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
                ["userId"] = userId,
                ["courseId"] = courseId
            }
        });
    }

    public Event ConstructWebhookEvent(string json, string signature)
    {
        return EventUtility.ConstructEvent(json, signature, _webhookSecret);
    }
}

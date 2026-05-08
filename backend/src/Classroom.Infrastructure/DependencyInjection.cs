using Classroom.Infrastructure.Data;
using Classroom.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Classroom.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("Default"),
                npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)
            )
        );

        services.AddSingleton<JwtTokenService>();
        services.AddSingleton<MinIOStorageService>();
        services.AddSingleton<StripeService>();
        services.AddSingleton<VideoProcessingService>();
        services.AddHostedService(sp => sp.GetRequiredService<VideoProcessingService>());
        services.AddSingleton<CertificatePdfService>();

        return services;
    }
}

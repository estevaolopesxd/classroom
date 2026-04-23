using System.Text;
using Classroom.API.Hubs;
using Classroom.API.Middleware;
using Classroom.Domain.Entities;
using Classroom.Domain.Enums;
using Classroom.Infrastructure;
using Classroom.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? "default-dev-secret-change-in-production-must-be-at-least-32chars!!";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "classroom-api",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "classroom-app",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // Allow token from query string for SignalR
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var path = context.HttpContext.Request.Path;
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Infrastructure (EF Core, MinIO, Stripe, VideoProcessing)
builder.Services.AddInfrastructure(builder.Configuration);

// SignalR + optional Redis backplane
var redisConnection = builder.Configuration["Redis:ConnectionString"];
var signalR = builder.Services.AddSignalR();
if (!string.IsNullOrWhiteSpace(redisConnection))
{
    try { signalR.AddStackExchangeRedis(redisConnection); }
    catch { /* Redis optional */ }
}

// CORS – named policy, explicit — must be first in the pipeline
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("auth", context =>
        System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1)
            }));
});

// ── App ────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// CORS first — named policy — headers survive even on error responses
app.UseCors("AllowAll");

app.UseMiddleware<ExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();
app.UseWebSockets();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();
app.MapHub<LiveStreamHub>("/hubs/livestream");

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// ── Database migration + seed ─────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        await db.Database.MigrateAsync();
        logger.LogInformation("✓ Database migrated");

        // Seed default admin if no users exist
        if (!await db.Users.AnyAsync())
        {
            var adminEmail = builder.Configuration["Admin:DefaultEmail"] ?? "admin@classroom.com";
            var adminPassword = builder.Configuration["Admin:DefaultPassword"] ?? "Admin@123456";

            db.Users.Add(new User
            {
                Email = adminEmail.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                FirstName = "Admin",
                LastName = "Principal",
                Role = UserRole.Admin,
                IsActive = true
            });

            db.ThemeConfigs.Add(new ThemeConfig
            {
                Name = "default",
                IsActive = true
            });

            await db.SaveChangesAsync();
            logger.LogInformation("✓ Admin seed: {Email} / {Password}", adminEmail, adminPassword);
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migration failed");
        throw;
    }
}

app.Run();

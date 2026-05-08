using System.Text;
using System.Threading.RateLimiting;
using Classroom.API.Hubs;
using Classroom.API.Middleware;
using Classroom.Domain.Entities;
using Classroom.Domain.Enums;
using Classroom.Infrastructure;
using Classroom.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── Forward headers from reverse proxies (nginx, Traefik, etc.) ───────────────
// Required for correct IP detection, HTTPS detection, and HSTS
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// ── Request size limit ────────────────────────────────────────────────────────
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 12 * 1024 * 1024; // 12MB (video chunk proxy)
});

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── JWT Authentication ─────────────────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret must be configured");

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

        // Allow token from query string for SignalR hubs and WebSocket endpoints
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var path = context.HttpContext.Request.Path;
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken) &&
                    (path.StartsWithSegments("/hubs") || path.StartsWithSegments("/api/streams")))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ── Infrastructure (EF Core, MinIO, Stripe, VideoProcessing) ─────────────────
builder.Services.AddInfrastructure(builder.Configuration);

// ── SignalR + optional Redis backplane ────────────────────────────────────────
var redisConnection = builder.Configuration["Redis:ConnectionString"];
var signalR = builder.Services.AddSignalR();
if (!string.IsNullOrWhiteSpace(redisConnection))
{
    try { signalR.AddStackExchangeRedis(redisConnection); }
    catch { /* Redis is optional */ }
}

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production, restrict to configured origins. In development, allow all.
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AppPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment() || allowedOrigins is null || allowedOrigins.Length == 0)
        {
            // Development: allow everything
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            // Production: restrict to declared origins
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

// ── Rate limiting ─────────────────────────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Strict: for login / auth endpoints (prevent brute-force)
    options.AddPolicy("auth_strict", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1)
            }));

    // General API: wider window, higher limit
    options.AddPolicy("api_general", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 300,
                Window = TimeSpan.FromMinutes(1)
            }));

    // Upload: protect large upload initiation from abuse
    options.AddPolicy("upload", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "anon",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1)
            }));
});

// ── App ────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// Must be first: handle X-Forwarded-For / X-Forwarded-Proto from reverse proxies
app.UseForwardedHeaders();

// CORS first — headers must survive even on error responses
app.UseCors("AppPolicy");

// Security headers on all responses
app.UseMiddleware<SecurityHeadersMiddleware>();

// Global error handler — hides internals in production
app.UseMiddleware<ExceptionMiddleware>();

// Swagger only in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseWebSockets();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();
app.MapHub<LiveStreamHub>("/hubs/livestream");

// Health check (no auth, no rate limit)
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .AllowAnonymous();

// ── Database migration + seed ─────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        await db.Database.MigrateAsync();
        logger.LogInformation("✓ Database migrated");

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
            logger.LogInformation("✓ Admin seed: {Email}", adminEmail);
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migration failed");
        throw;
    }
}

app.Run();

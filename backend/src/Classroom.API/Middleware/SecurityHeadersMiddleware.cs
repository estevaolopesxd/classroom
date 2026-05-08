namespace Classroom.API.Middleware;

/// <summary>
/// Adds security HTTP headers to every response.
/// Prevents clickjacking, MIME sniffing, XSS and information leakage.
/// </summary>
public class SecurityHeadersMiddleware(RequestDelegate next, IWebHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        // Prevent MIME type sniffing
        headers["X-Content-Type-Options"] = "nosniff";

        // Deny embedding in iframes (clickjacking protection)
        headers["X-Frame-Options"] = "DENY";

        // Restrict referrer info
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // Only allow camera/mic/screen from same origin (needed for recording feature)
        headers["Permissions-Policy"] = "camera=(self), microphone=(self), display-capture=(self), geolocation=()";

        // Remove server info leakage
        headers.Remove("Server");
        headers.Remove("X-Powered-By");
        headers.Remove("X-AspNet-Version");
        headers.Remove("X-AspNetMvc-Version");

        // HSTS: force HTTPS for 1 year (only when already on HTTPS)
        if (context.Request.IsHttps || context.Request.Headers.ContainsKey("X-Forwarded-Proto"))
        {
            var proto = context.Request.Headers["X-Forwarded-Proto"].ToString();
            if (context.Request.IsHttps || proto == "https")
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        }

        // Content-Security-Policy — tightened for prod, relaxed for dev
        if (!env.IsDevelopment())
        {
            headers["Content-Security-Policy"] =
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline'; " +   // Next.js requires unsafe-inline
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: blob: http: https:; " +
                "media-src 'self' blob: http: https:; " +  // HLS video sources
                "connect-src 'self' ws: wss: http: https:; " + // API + WebSocket
                "font-src 'self' data:; " +
                "frame-ancestors 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self'";
        }

        await next(context);
    }
}

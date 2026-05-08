using System.Text.Json;

namespace Classroom.API.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IWebHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception at {Method} {Path}: {Message}",
                context.Request.Method, context.Request.Path, ex.Message);

            if (!context.Response.HasStarted)
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";

                // Never expose internal details in production
                var body = env.IsDevelopment()
                    ? new { message = "Erro interno do servidor", detail = ex.Message }
                    : new { message = "Erro interno do servidor", detail = (string?)null };

                await context.Response.WriteAsync(JsonSerializer.Serialize(body));
            }
        }
    }
}

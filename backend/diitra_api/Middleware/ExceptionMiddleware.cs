using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace diitra_api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning(ex, "Conflict detected: Data has been modified by another user.");
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.Conflict;

            var response = new 
            { 
                statusCode = context.Response.StatusCode, 
                message = "Conflicto de edición: El registro ha sido modificado por otro usuario. Por favor, recarga los datos e intenta de nuevo." 
            };

            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred during request: {Path} [{Method}]. Error: {Message}", 
                context.Request.Path, context.Request.Method, ex.Message);
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            object response = _env.IsDevelopment()
                ? new { statusCode = context.Response.StatusCode, message = ex.Message, innerException = ex.InnerException?.Message, innerStackTrace = ex.InnerException?.StackTrace, stackTrace = ex.StackTrace?.ToString() }
                : new { statusCode = context.Response.StatusCode, message = "Internal Server Error" };

            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };
            var json = JsonSerializer.Serialize(response, options);

            await context.Response.WriteAsync(json);
        }
    }
}

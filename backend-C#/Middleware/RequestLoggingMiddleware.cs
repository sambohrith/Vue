using Serilog;
using Serilog.Events;
using System.Diagnostics;

namespace IMS.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public RequestLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestId = context.Items["RequestId"]?.ToString() ?? Guid.NewGuid().ToString();

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();

            var statusCode = context.Response.StatusCode;
            var method = context.Request.Method;
            var path = context.Request.Path;
            var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userAgent = context.Request.Headers.UserAgent.ToString();
            var userId = context.User?.Identity?.IsAuthenticated == true
                ? context.User.FindFirst("user_id")?.Value
                : null;

            var logLevel = statusCode >= 400 ? LogEventLevel.Warning : LogEventLevel.Information;

            Log.Write(logLevel, 
                "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs}ms - {RequestId}",
                method, path, statusCode, stopwatch.ElapsedMilliseconds, requestId);
        }
    }
}

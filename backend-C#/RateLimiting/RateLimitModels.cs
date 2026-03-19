// Rate Limiting Models for AspNetCoreRateLimit
using Microsoft.Extensions.Options;

namespace IMS;

public class IpRateLimitOptions
{
    public List<RateLimitRule> GeneralRules { get; set; } = new();
}

public class RateLimitRule
{
    public string Endpoint { get; set; } = "*";
    public int Limit { get; set; }
    public string Period { get; set; } = "1m";
}

public interface IRateLimitCounterStore
{
    Task<bool> ExistsAsync(string id);
    Task<RateLimitCounter?> GetAsync(string id);
    Task RemoveAsync(string id);
    Task SetAsync(string id, RateLimitCounter counter, TimeSpan? expirationTime = null);
}

public interface IIpPolicyStore
{
    Task<IpRateLimitPolicies?> GetAsync(string id);
    Task SetAsync(string id, IpRateLimitPolicies policies);
}

public class IpRateLimitPolicies
{
    public List<RateLimitRule> Rules { get; set; } = new();
}

public class RateLimitCounter
{
    public DateTime Timestamp { get; set; }
    public long TotalRequests { get; set; }
}

public interface IRateLimitConfiguration
{
    List<string> EndpointWhitelist { get; set; }
}

public class RateLimitConfiguration : IRateLimitConfiguration
{
    public List<string> EndpointWhitelist { get; set; } = new();
}

// In-Memory Implementations
public class MemoryCacheRateLimitCounterStore : IRateLimitCounterStore
{
    private readonly Dictionary<string, RateLimitCounter> _cache = new();

    public Task<bool> ExistsAsync(string id)
    {
        lock (_cache)
        {
            if (_cache.TryGetValue(id, out var counter))
            {
                // Check expiration
                if (DateTime.UtcNow - counter.Timestamp > TimeSpan.FromMinutes(1))
                {
                    _cache.Remove(id);
                    return Task.FromResult(false);
                }
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }
    }

    public Task<RateLimitCounter?> GetAsync(string id)
    {
        lock (_cache)
        {
            _cache.TryGetValue(id, out var counter);
            return Task.FromResult(counter);
        }
    }

    public Task RemoveAsync(string id)
    {
        lock (_cache)
        {
            _cache.Remove(id);
            return Task.CompletedTask;
        }
    }

    public Task SetAsync(string id, RateLimitCounter counter, TimeSpan? expirationTime = null)
    {
        lock (_cache)
        {
            _cache[id] = counter;
            return Task.CompletedTask;
        }
    }
}

public class MemoryCacheIpPolicyStore : IIpPolicyStore
{
    private readonly Dictionary<string, IpRateLimitPolicies> _cache = new();

    public Task<IpRateLimitPolicies?> GetAsync(string id)
    {
        lock (_cache)
        {
            _cache.TryGetValue(id, out var policies);
            return Task.FromResult(policies);
        }
    }

    public Task SetAsync(string id, IpRateLimitPolicies policies)
    {
        lock (_cache)
        {
            _cache[id] = policies;
            return Task.CompletedTask;
        }
    }
}

// Extension for IApplicationBuilder
public static class RateLimitingExtensions
{
    public static IApplicationBuilder UseIpRateLimiting(this IApplicationBuilder app)
    {
        return app.UseMiddleware<IpRateLimitMiddleware>();
    }
}

// Middleware
public class IpRateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IRateLimitCounterStore _counterStore;
    private readonly IIpPolicyStore _policyStore;
    private readonly IpRateLimitOptions _options;

    public IpRateLimitMiddleware(
        RequestDelegate next,
        IRateLimitCounterStore counterStore,
        IIpPolicyStore policyStore,
        IOptions<IpRateLimitOptions> options)
    {
        _next = next;
        _counterStore = counterStore;
        _policyStore = policyStore;
        _options = options.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var endpoint = context.Request.Path;

        // Check rate limit
        foreach (var rule in _options.GeneralRules)
        {
            if (rule.Endpoint == "*" || endpoint.StartsWithSegments(rule.Endpoint))
            {
                var counterId = $"{clientIp}:{endpoint}";
                var exists = await _counterStore.ExistsAsync(counterId);
                
                RateLimitCounter counter;
                if (!exists)
                {
                    counter = new RateLimitCounter
                    {
                        Timestamp = DateTime.UtcNow,
                        TotalRequests = 1
                    };
                    await _counterStore.SetAsync(counterId, counter, TimeSpan.FromMinutes(1));
                }
                else
                {
                    counter = (await _counterStore.GetAsync(counterId))!;
                    counter.TotalRequests++;
                    await _counterStore.SetAsync(counterId, counter);
                }

                if (counter.TotalRequests > rule.Limit)
                {
                    context.Response.StatusCode = 429;
                    await context.Response.WriteAsync("Rate limit exceeded");
                    return;
                }
            }
        }

        await _next(context);
    }
}

using IMS.Models;

namespace IMS.DTOs.Responses;

public class ListUsersResponse
{
    public List<User> Users { get; set; } = new();
    public long Total { get; set; }
    public int Page { get; set; }
    public int Limit { get; set; }
    public int TotalPages { get; set; }
}

public class DashboardStatsResponse
{
    public long TotalUsers { get; set; }
    public long OnlineUsers { get; set; }
    public long AdminUsers { get; set; }
    public long ActiveUsers { get; set; }
    public long TotalPosts { get; set; }
    public long TotalRooms { get; set; }
    public long TotalMessages { get; set; }
    public SystemInfo System { get; set; } = new();
}

public class SystemInfo
{
    public string NodeVersion { get; set; } = "10.0";
    public string Platform { get; set; } = Environment.OSVersion.Platform.ToString();
    public long Uptime { get; set; }
    public Dictionary<string, string> MemoryUsage { get; set; } = new();
    public string ServerTime { get; set; } = DateTime.UtcNow.ToString("O");
}

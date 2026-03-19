using IMS.DTOs;
using IMS.DTOs.Responses;
using IMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMS.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : BaseController
{
    private readonly IUserService _userService;

    public DashboardController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse>> GetDashboardStats()
    {
        var stats = await _userService.GetUserStatsAsync();
        
        var systemInfo = new SystemInfo
        {
            NodeVersion = "10.0",
            Platform = Environment.OSVersion.Platform.ToString(),
            Uptime = Environment.TickCount64 / 1000,
            MemoryUsage = new Dictionary<string, string>(),
            ServerTime = DateTime.UtcNow.ToString("O")
        };

        var response = new DashboardStatsResponse
        {
            TotalUsers = stats.Total,
            OnlineUsers = stats.Active,
            AdminUsers = stats.Admins,
            ActiveUsers = stats.Active,
            TotalPosts = 0,
            TotalRooms = 0,
            TotalMessages = 0,
            System = systemInfo
        };

        return Success(response, "获取成功");
    }
}

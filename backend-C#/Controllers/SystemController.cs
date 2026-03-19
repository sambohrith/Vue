using IMS.DTOs;
using IMS.DTOs.Requests;
using IMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMS.Controllers;

[ApiController]
[Route("api/system")]
[Authorize(Roles = "admin")]
public class SystemController : BaseController
{
    private readonly ISystemService _systemService;

    public SystemController(ISystemService systemService)
    {
        _systemService = systemService;
    }

    [HttpGet("settings")]
    public async Task<ActionResult<ApiResponse>> GetSettings()
    {
        var settings = await _systemService.GetSettingsAsync();
        return Success(settings, "获取成功");
    }

    [HttpPut("settings")]
    public async Task<ActionResult<ApiResponse>> UpdateSettings([FromBody] UpdateSettingsRequest request)
    {
        var settings = await _systemService.UpdateSettingsAsync(request);
        return Success(settings, "更新成功");
    }

    [HttpPost("backup")]
    public async Task<ActionResult<ApiResponse>> BackupDatabase()
    {
        var result = await _systemService.BackupDatabaseAsync();
        return Success(result, "备份成功");
    }
}

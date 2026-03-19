using IMS.DTOs;
using IMS.DTOs.Requests;
using IMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMS.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : BaseController
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var result = await _authService.RegisterAsync(request, clientIp);
            return Created(new { user = result.User, token = result.Token }, "注册成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var result = await _authService.LoginAsync(request, clientIp);
            return Success(new { user = result.User, token = result.Token }, "登录成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> Logout()
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        await _authService.LogoutAsync(CurrentUserId.Value, clientIp);
        return Success("登出成功");
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> GetMe()
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        var user = await _authService.GetCurrentUserAsync(CurrentUserId.Value);
        if (user == null)
        {
            return Error("用户不存在", 404);
        }

        return Success(new { user }, "获取成功");
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> GetProfile()
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        var profile = await _authService.GetUserProfileAsync(CurrentUserId.Value);
        if (profile == null)
        {
            return Error("用户不存在", 404);
        }

        return Success(new { user = profile }, "获取成功");
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        try
        {
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            await _authService.ChangePasswordAsync(CurrentUserId.Value, request, clientIp);
            return Success("密码修改成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var result = await _authService.RefreshTokenAsync(request);
            if (result == null)
            {
                return Error("刷新令牌失败", 401);
            }
            return Success(new { user = result.User, token = result.Token }, "令牌刷新成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 401);
        }
    }
}

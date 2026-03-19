using IMS.DTOs;
using IMS.DTOs.Requests;
using IMS.DTOs.Responses;
using IMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMS.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : BaseController
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse>> ListUsers([FromQuery] ListUsersRequest request)
    {
        var result = await _userService.ListUsersAsync(request);
        return Success(new 
        { 
            users = result.Users,
            pagination = new 
            { 
                page = result.Page, 
                limit = result.Limit, 
                total = result.Total, 
                totalPages = result.TotalPages 
            }
        }, "获取成功");
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse>> GetUser(long id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null)
        {
            return Error("用户不存在", 404);
        }

        return Success(new { user }, "获取成功");
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse>> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            var user = await _userService.CreateUserAsync(request);
            return Created(new { user }, "用户创建成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse>> UpdateUser(long id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            var user = await _userService.UpdateUserAsync(id, request);
            return Success(new { user }, "用户更新成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse>> DeleteUser(long id)
    {
        if (id == CurrentUserId)
        {
            return Error("不能删除自己的账号", 400);
        }

        try
        {
            await _userService.DeleteUserAsync(id);
            return Success("用户已删除");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpPatch("{id}/toggle")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse>> ToggleUserActive(long id)
    {
        if (id == CurrentUserId)
        {
            return Error("不能禁用自己的账号", 400);
        }

        try
        {
            var user = await _userService.ToggleUserActiveAsync(id);
            var message = user.IsActive ? "用户已启用" : "用户已禁用";
            return Success(new { user }, message);
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpGet("stats")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ApiResponse>> GetUserStats()
    {
        var stats = await _userService.GetUserStatsAsync();
        return Success(stats, "获取成功");
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse>> GetMyInfo()
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        var user = await _userService.GetUserByIdAsync(CurrentUserId.Value);
        if (user == null)
        {
            return Error("用户不存在", 404);
        }

        return Success(new ProfileInfo
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Avatar = user.Avatar,
            Phone = user.Phone,
            Gender = user.Gender,
            Bio = user.Bio,
            Skills = user.Skills,
            Department = user.Department,
            Position = user.Position,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        }, "获取成功");
    }

    [HttpPut("me")]
    public async Task<ActionResult<ApiResponse>> UpdateMyInfo([FromBody] UpdateProfileRequest request)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        try
        {
            var user = await _userService.UpdateProfileAsync(CurrentUserId.Value, request);
            return Success(new ProfileInfo
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                Avatar = user.Avatar,
                Phone = user.Phone,
                Gender = user.Gender,
                Bio = user.Bio,
                Skills = user.Skills,
                Department = user.Department,
                Position = user.Position,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt
            }, "信息更新成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpGet("contacts")]
    public async Task<ActionResult<ApiResponse>> GetAllContacts()
    {
        var users = await _userService.GetAllContactsAsync();
        var result = users.Select(u => new UserInfo
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            FullName = u.FullName,
            Avatar = u.Avatar,
            Department = u.Department,
            Position = u.Position,
            Role = u.Role,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt,
            UpdatedAt = u.UpdatedAt,
            LastLoginAt = u.LastLoginAt
        }).ToList();

        return Success(result, "获取成功");
    }
}

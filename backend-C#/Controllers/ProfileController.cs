using IMS.DTOs;
using IMS.DTOs.Requests;
using IMS.DTOs.Responses;
using IMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMS.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : BaseController
{
    private readonly IUserService _userService;

    public ProfileController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse>> GetProfile()
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

    [HttpPut]
    public async Task<ActionResult<ApiResponse>> UpdateProfile([FromBody] UpdateProfileRequest request)
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
}

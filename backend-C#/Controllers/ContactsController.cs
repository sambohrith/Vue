using IMS.DTOs;
using IMS.DTOs.Responses;
using IMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMS.Controllers;

[ApiController]
[Route("api/contacts")]
[Authorize]
public class ContactsController : BaseController
{
    private readonly IUserService _userService;

    public ContactsController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
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

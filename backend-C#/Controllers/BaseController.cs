using IMS.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace IMS.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseController : ControllerBase
{
    protected long? CurrentUserId
    {
        get
        {
            var userIdClaim = User.FindFirst("user_id")?.Value;
            if (long.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            return null;
        }
    }

    protected string? CurrentUserRole => User.FindFirst(ClaimTypes.Role)?.Value;

    protected string RequestId => HttpContext.Items["RequestId"]?.ToString() ?? Guid.NewGuid().ToString();

    protected ActionResult<ApiResponse> Success(object? data, string message = "操作成功")
    {
        return Ok(new ApiResponse
        {
            Success = true,
            Message = message,
            Data = data,
            RequestId = RequestId
        });
    }

    protected ActionResult<ApiResponse> Success(string message = "操作成功")
    {
        return Ok(new ApiResponse
        {
            Success = true,
            Message = message,
            RequestId = RequestId
        });
    }

    protected ActionResult<ApiResponse> Created(object? data, string message = "创建成功")
    {
        return StatusCode(201, new ApiResponse
        {
            Success = true,
            Message = message,
            Data = data,
            RequestId = RequestId
        });
    }

    protected ActionResult<ApiResponse> Error(string message, int statusCode = 400)
    {
        return StatusCode(statusCode, new ApiResponse
        {
            Success = false,
            Message = message,
            RequestId = RequestId
        });
    }

    protected ActionResult<ApiResponse> ValidationError(Dictionary<string, string> errors)
    {
        return BadRequest(new ApiResponse
        {
            Success = false,
            Message = "数据验证失败",
            Data = errors,
            RequestId = RequestId
        });
    }
}

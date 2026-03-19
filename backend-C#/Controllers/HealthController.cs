using IMS.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace IMS.Controllers;

[ApiController]
[Route("api")]
public class HealthController : ControllerBase
{
    [HttpGet("health")]
    public ActionResult<ApiResponse> HealthCheck()
    {
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "服务器运行正常",
            Data = new { timestamp = DateTime.UtcNow.ToString("O") }
        });
    }
}

using IMS.DTOs;
using IMS.DTOs.Requests;
using IMS.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMS.Controllers;

[ApiController]
[Route("api/social")]
[Authorize]
public class SocialController : BaseController
{
    private readonly ISocialService _socialService;

    public SocialController(ISocialService socialService)
    {
        _socialService = socialService;
    }

    // Posts
    [HttpGet("posts")]
    public async Task<ActionResult<ApiResponse>> GetPosts([FromQuery] ListPostsRequest request)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        var result = await _socialService.GetPostsAsync(CurrentUserId.Value, request);
        return Success(new 
        { 
            posts = result.Posts, 
            total = result.Total, 
            page = result.Page, 
            limit = result.Limit 
        }, "获取成功");
    }

    [HttpPost("posts")]
    public async Task<ActionResult<ApiResponse>> CreatePost([FromBody] CreatePostRequest request)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        try
        {
            var post = await _socialService.CreatePostAsync(CurrentUserId.Value, request);
            return Success(post, "创建成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpGet("posts/{id}")]
    public async Task<ActionResult<ApiResponse>> GetPost(long id)
    {
        // Return empty response for now - can be extended
        return Success(null, "获取成功");
    }

    [HttpPut("posts/{id}")]
    public async Task<ActionResult<ApiResponse>> UpdatePost(long id)
    {
        // Placeholder
        return Success(new { }, "更新成功");
    }

    [HttpDelete("posts/{id}")]
    public async Task<ActionResult<ApiResponse>> DeletePost(long id)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        try
        {
            await _socialService.DeletePostAsync(CurrentUserId.Value, CurrentUserRole ?? "", id);
            return Success("删除成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpPost("posts/{id}/like")]
    public async Task<ActionResult<ApiResponse>> ToggleLike(long id)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        try
        {
            var result = await _socialService.ToggleLikeAsync(CurrentUserId.Value, id);
            return Success(result, "操作成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpPost("posts/{id}/comment")]
    public async Task<ActionResult<ApiResponse>> AddComment(long id, [FromBody] AddCommentRequest request)
    {
        if (!CurrentUserId.HasValue)
        {
            return Error("未登录", 401);
        }

        try
        {
            var comment = await _socialService.AddCommentAsync(CurrentUserId.Value, id, request);
            return Success(comment, "评论成功");
        }
        catch (InvalidOperationException ex)
        {
            return Error(ex.Message, 400);
        }
    }

    [HttpGet("posts/{id}/comments")]
    public async Task<ActionResult<ApiResponse>> GetComments(long id, [FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        var result = await _socialService.GetCommentsAsync(id, page, limit);
        return Success(new 
        { 
            comments = result.Comments, 
            total = result.Total, 
            page = result.Page, 
            limit = result.Limit 
        }, "获取成功");
    }
}

using IMS.Data;
using IMS.DTOs.Requests;
using IMS.DTOs.Responses;
using IMS.Models;
using Microsoft.EntityFrameworkCore;

namespace IMS.Services;

public class SocialService : ISocialService
{
    private readonly ApplicationDbContext _context;

    public SocialService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PostsListResponse> GetPostsAsync(long currentUserId, ListPostsRequest request)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var limit = request.Limit < 1 || request.Limit > 100 ? 10 : request.Limit;
        var offset = (page - 1) * limit;

        var total = await _context.Posts.CountAsync(p => p.IsActive);

        var posts = await _context.Posts
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        var response = new List<PostResponse>();
        foreach (var post in posts)
        {
            var author = await _context.Users
                .Select(u => new { u.Id, u.FullName, u.Username, u.Avatar })
                .FirstOrDefaultAsync(u => u.Id == post.UserId);

            var likeCount = await _context.PostLikes.CountAsync(l => l.PostId == post.Id);
            var commentCount = await _context.PostComments.CountAsync(c => c.PostId == post.Id);
            var isLiked = await _context.PostLikes
                .AnyAsync(l => l.PostId == post.Id && l.UserId == currentUserId);

            var authorName = author?.FullName ?? author?.Username ?? "";

            response.Add(new PostResponse
            {
                Id = post.Id,
                Content = post.Content,
                UserId = post.UserId,
                UserName = authorName,
                UserAvatar = author?.Avatar,
                IsPublic = post.IsActive,
                CreatedAt = post.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                UpdatedAt = post.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                Likes = (int)likeCount,
                Comments = (int)commentCount,
                Images = new List<string>(), // Parse from JSON if needed
                IsLiked = isLiked
            });
        }

        return new PostsListResponse
        {
            Posts = response,
            Total = total,
            Page = page,
            Limit = limit
        };
    }

    public async Task<PostResponse> CreatePostAsync(long currentUserId, CreatePostRequest request)
    {
        var post = new Post
        {
            UserId = currentUserId,
            Content = request.Content,
            Images = request.Images != null ? string.Join(",", request.Images) : null,
            IsActive = request.IsPublic ?? true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        var author = await _context.Users
            .Select(u => new { u.Id, u.FullName, u.Username, u.Avatar })
            .FirstOrDefaultAsync(u => u.Id == currentUserId);

        var authorName = author?.FullName ?? author?.Username ?? "";

        return new PostResponse
        {
            Id = post.Id,
            Content = post.Content,
            UserId = post.UserId,
            UserName = authorName,
            UserAvatar = author?.Avatar,
            IsPublic = post.IsActive,
            CreatedAt = post.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
            UpdatedAt = post.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
            Likes = 0,
            Comments = 0,
            Images = request.Images ?? new List<string>(),
            IsLiked = false
        };
    }

    public async Task<bool> DeletePostAsync(long currentUserId, string userRole, long postId)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post == null)
        {
            throw new InvalidOperationException("帖子不存在");
        }

        // Check permission (only author or admin can delete)
        if (post.UserId != currentUserId && userRole != "admin")
        {
            throw new InvalidOperationException("无权限删除此帖子");
        }

        // Soft delete
        post.DeletedAt = DateTime.UtcNow;
        post.IsActive = false;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<LikeToggleResponse> ToggleLikeAsync(long currentUserId, long postId)
    {
        // Check post exists
        var post = await _context.Posts.FindAsync(postId);
        if (post == null)
        {
            throw new InvalidOperationException("帖子不存在");
        }

        // Check if already liked
        var existingLike = await _context.PostLikes
            .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == currentUserId);

        bool isLiked;
        if (existingLike != null)
        {
            // Unlike
            _context.PostLikes.Remove(existingLike);
            isLiked = false;
        }
        else
        {
            // Like
            _context.PostLikes.Add(new PostLike
            {
                PostId = postId,
                UserId = currentUserId,
                CreatedAt = DateTime.UtcNow
            });
            isLiked = true;
        }

        await _context.SaveChangesAsync();

        var likeCount = await _context.PostLikes.CountAsync(l => l.PostId == postId);

        return new LikeToggleResponse
        {
            IsLiked = isLiked,
            Likes = likeCount
        };
    }

    public async Task<CommentsListResponse> GetCommentsAsync(long postId, int page, int limit)
    {
        page = page < 1 ? 1 : page;
        limit = limit < 1 || limit > 100 ? 20 : limit;
        var offset = (page - 1) * limit;

        var total = await _context.PostComments.CountAsync(c => c.PostId == postId);

        var comments = await _context.PostComments
            .Where(c => c.PostId == postId)
            .OrderByDescending(c => c.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        var response = new List<CommentResponse>();
        foreach (var comment in comments)
        {
            var author = await _context.Users
                .Select(u => new { u.Id, u.FullName, u.Username, u.Avatar })
                .FirstOrDefaultAsync(u => u.Id == comment.UserId);

            var authorName = author?.FullName ?? author?.Username ?? "";

            response.Add(new CommentResponse
            {
                Id = comment.Id,
                Content = comment.Content,
                UserId = comment.UserId,
                UserName = authorName,
                UserAvatar = author?.Avatar,
                PostId = comment.PostId,
                CreatedAt = comment.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }

        return new CommentsListResponse
        {
            Comments = response,
            Total = total,
            Page = page,
            Limit = limit
        };
    }

    public async Task<CommentResponse> AddCommentAsync(long currentUserId, long postId, AddCommentRequest request)
    {
        // Check post exists
        var post = await _context.Posts.FindAsync(postId);
        if (post == null)
        {
            throw new InvalidOperationException("帖子不存在");
        }

        var comment = new PostComment
        {
            PostId = postId,
            UserId = currentUserId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.PostComments.Add(comment);
        await _context.SaveChangesAsync();

        var author = await _context.Users
            .Select(u => new { u.Id, u.FullName, u.Username, u.Avatar })
            .FirstOrDefaultAsync(u => u.Id == currentUserId);

        var authorName = author?.FullName ?? author?.Username ?? "";

        return new CommentResponse
        {
            Id = comment.Id,
            Content = comment.Content,
            UserId = comment.UserId,
            UserName = authorName,
            UserAvatar = author?.Avatar,
            PostId = comment.PostId,
            CreatedAt = comment.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
        };
    }
}

using IMS.DTOs.Requests;
using IMS.DTOs.Responses;

namespace IMS.Services;

public interface ISocialService
{
    Task<PostsListResponse> GetPostsAsync(long currentUserId, ListPostsRequest request);
    Task<PostResponse> CreatePostAsync(long currentUserId, CreatePostRequest request);
    Task<bool> DeletePostAsync(long currentUserId, string userRole, long postId);
    Task<LikeToggleResponse> ToggleLikeAsync(long currentUserId, long postId);
    Task<CommentsListResponse> GetCommentsAsync(long postId, int page, int limit);
    Task<CommentResponse> AddCommentAsync(long currentUserId, long postId, AddCommentRequest request);
}

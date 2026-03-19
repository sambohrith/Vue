using IMS.DTOs.Requests;
using IMS.DTOs.Responses;
using IMS.Models;

namespace IMS.Services;

public interface IUserService
{
    Task<ListUsersResponse> ListUsersAsync(ListUsersRequest request);
    Task<User?> GetUserByIdAsync(long id);
    Task<User> CreateUserAsync(CreateUserRequest request);
    Task<User> UpdateUserAsync(long id, UpdateUserRequest request);
    Task<bool> DeleteUserAsync(long id);
    Task<User> ToggleUserActiveAsync(long id);
    Task<UserStats> GetUserStatsAsync();
    Task<List<User>> GetAllContactsAsync();
    Task<User> UpdateProfileAsync(long userId, UpdateProfileRequest request);
}

using IMS.DTOs.Requests;
using IMS.DTOs.Responses;

namespace IMS.Services;

public interface ISystemService
{
    Task<SettingsResponse> GetSettingsAsync();
    Task<SettingsResponse> UpdateSettingsAsync(UpdateSettingsRequest request);
    Task<BackupResponse> BackupDatabaseAsync();
}

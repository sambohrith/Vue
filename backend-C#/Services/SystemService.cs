using IMS.Data;
using IMS.DTOs.Requests;
using IMS.DTOs.Responses;
using IMS.Models;
using Microsoft.EntityFrameworkCore;

namespace IMS.Services;

public class SystemService : ISystemService
{
    private readonly ApplicationDbContext _context;

    public SystemService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SettingsResponse> GetSettingsAsync()
    {
        var settings = new SettingsResponse
        {
            SiteName = await GetSettingValueAsync(SettingKeys.SiteName, "信息管理系统"),
            SiteLogo = await GetSettingValueAsync(SettingKeys.SiteLogo, ""),
            SiteDescription = await GetSettingValueAsync(SettingKeys.SiteDescription, "企业级信息管理解决方案"),
            PasswordMinLength = int.Parse(await GetSettingValueAsync(SettingKeys.PasswordMinLength, "8")),
            LoginAttempts = int.Parse(await GetSettingValueAsync(SettingKeys.LoginAttempts, "5")),
            Enable2FA = (await GetSettingValueAsync(SettingKeys.Enable2FA, "false")) == "true",
            EnableIPRestriction = (await GetSettingValueAsync(SettingKeys.EnableIPRestriction, "false")) == "true",
            EnableEmailNotifications = (await GetSettingValueAsync(SettingKeys.EnableEmailNotifications, "true")) == "true",
            EnableSystemNotifications = (await GetSettingValueAsync(SettingKeys.EnableSystemNotifications, "true")) == "true",
            NotificationEmail = await GetSettingValueAsync(SettingKeys.NotificationEmail, "admin@ims.com"),
            BackupFrequency = await GetSettingValueAsync(SettingKeys.BackupFrequency, "weekly"),
            BackupRetention = int.Parse(await GetSettingValueAsync(SettingKeys.BackupRetention, "30"))
        };

        return settings;
    }

    public async Task<SettingsResponse> UpdateSettingsAsync(UpdateSettingsRequest request)
    {
        if (request.SiteName != null)
            await SetSettingValueAsync(SettingKeys.SiteName, request.SiteName);
        if (request.SiteLogo != null)
            await SetSettingValueAsync(SettingKeys.SiteLogo, request.SiteLogo);
        if (request.SiteDescription != null)
            await SetSettingValueAsync(SettingKeys.SiteDescription, request.SiteDescription);
        if (request.PasswordMinLength.HasValue)
            await SetSettingValueAsync(SettingKeys.PasswordMinLength, request.PasswordMinLength.Value.ToString());
        if (request.LoginAttempts.HasValue)
            await SetSettingValueAsync(SettingKeys.LoginAttempts, request.LoginAttempts.Value.ToString());
        if (request.Enable2FA.HasValue)
            await SetSettingValueAsync(SettingKeys.Enable2FA, request.Enable2FA.Value.ToString().ToLower());
        if (request.EnableIPRestriction.HasValue)
            await SetSettingValueAsync(SettingKeys.EnableIPRestriction, request.EnableIPRestriction.Value.ToString().ToLower());
        if (request.EnableEmailNotifications.HasValue)
            await SetSettingValueAsync(SettingKeys.EnableEmailNotifications, request.EnableEmailNotifications.Value.ToString().ToLower());
        if (request.EnableSystemNotifications.HasValue)
            await SetSettingValueAsync(SettingKeys.EnableSystemNotifications, request.EnableSystemNotifications.Value.ToString().ToLower());
        if (request.NotificationEmail != null)
            await SetSettingValueAsync(SettingKeys.NotificationEmail, request.NotificationEmail);
        if (request.BackupFrequency != null)
            await SetSettingValueAsync(SettingKeys.BackupFrequency, request.BackupFrequency);
        if (request.BackupRetention.HasValue)
            await SetSettingValueAsync(SettingKeys.BackupRetention, request.BackupRetention.Value.ToString());

        return await GetSettingsAsync();
    }

    public async Task<BackupResponse> BackupDatabaseAsync()
    {
        // Simulate backup
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        var backupPath = $"/backups/backup_{timestamp}.sql";

        return await Task.FromResult(new BackupResponse
        {
            Success = true,
            Message = "数据库备份成功",
            BackupPath = backupPath,
            Timestamp = DateTime.UtcNow.ToString("O")
        });
    }

    private async Task<string> GetSettingValueAsync(string key, string defaultValue)
    {
        var setting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == key);

        return setting?.Value ?? defaultValue;
    }

    private async Task SetSettingValueAsync(string key, string value)
    {
        var setting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == key);

        if (setting == null)
        {
            setting = new SystemSettings
            {
                Key = key,
                Value = value,
                UpdatedAt = DateTime.UtcNow
            };
            _context.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = value;
            setting.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}

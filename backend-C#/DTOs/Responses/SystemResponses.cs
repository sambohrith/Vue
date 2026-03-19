namespace IMS.DTOs.Responses;

public class SettingsResponse
{
    public string SiteName { get; set; } = "信息管理系统";
    public string SiteLogo { get; set; } = string.Empty;
    public string SiteDescription { get; set; } = "企业级信息管理解决方案";
    public int PasswordMinLength { get; set; } = 8;
    public int LoginAttempts { get; set; } = 5;
    public bool Enable2FA { get; set; } = false;
    public bool EnableIPRestriction { get; set; } = false;
    public bool EnableEmailNotifications { get; set; } = true;
    public bool EnableSystemNotifications { get; set; } = true;
    public string NotificationEmail { get; set; } = "admin@ims.com";
    public string BackupFrequency { get; set; } = "weekly";
    public int BackupRetention { get; set; } = 30;
}

public class BackupResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string BackupPath { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IMS.Models;

[Table("system_settings")]
public class SystemSettings
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("key")]
    [StringLength(100)]
    public string Key { get; set; } = string.Empty;

    [Column("value")]
    public string? Value { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// Default setting keys
public static class SettingKeys
{
    public const string SiteName = "site_name";
    public const string SiteLogo = "site_logo";
    public const string SiteDescription = "site_description";
    public const string PasswordMinLength = "password_min_length";
    public const string LoginAttempts = "login_attempts";
    public const string Enable2FA = "enable_2fa";
    public const string EnableIPRestriction = "enable_ip_restriction";
    public const string EnableEmailNotifications = "enable_email_notifications";
    public const string EnableSystemNotifications = "enable_system_notifications";
    public const string NotificationEmail = "notification_email";
    public const string BackupFrequency = "backup_frequency";
    public const string BackupRetention = "backup_retention";
}

using System.ComponentModel.DataAnnotations;

namespace IMS.DTOs.Requests;

public class UpdateSettingsRequest
{
    [StringLength(100)]
    public string? SiteName { get; set; }

    public string? SiteLogo { get; set; }

    public string? SiteDescription { get; set; }

    public int? PasswordMinLength { get; set; }

    public int? LoginAttempts { get; set; }

    public bool? Enable2FA { get; set; }

    public bool? EnableIPRestriction { get; set; }

    public bool? EnableEmailNotifications { get; set; }

    public bool? EnableSystemNotifications { get; set; }

    [EmailAddress]
    public string? NotificationEmail { get; set; }

    public string? BackupFrequency { get; set; }

    public int? BackupRetention { get; set; }
}

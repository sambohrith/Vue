using IMS.Models;
using Microsoft.EntityFrameworkCore;

namespace IMS.Data;

public static class DbInitializer
{
    public static async Task SeedAdminUser(ApplicationDbContext context, IConfigurationSection adminConfig)
    {
        var username = adminConfig["DefaultUsername"] ?? "admin";
        var password = adminConfig["DefaultPassword"] ?? "admin123";
        var email = adminConfig["DefaultEmail"] ?? "admin@ims.com";

        // Check if admin already exists
        var existingAdmin = await context.Users
            .FirstOrDefaultAsync(u => u.Username == username);

        if (existingAdmin != null)
        {
            Console.WriteLine("Admin user already exists");
            return;
        }

        // Create admin user
        var admin = new User
        {
            Username = username,
            Email = email,
            FullName = "系统管理员",
            Role = "admin",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        admin.SetPassword(password);

        context.Users.Add(admin);
        await context.SaveChangesAsync();

        Console.WriteLine($"Default admin user created: {username}");
    }

    public static async Task SeedDefaultSettings(ApplicationDbContext context)
    {
        var defaultSettings = new Dictionary<string, string>
        {
            { SettingKeys.SiteName, "信息管理系统" },
            { SettingKeys.SiteLogo, "" },
            { SettingKeys.SiteDescription, "企业级信息管理解决方案" },
            { SettingKeys.PasswordMinLength, "8" },
            { SettingKeys.LoginAttempts, "5" },
            { SettingKeys.Enable2FA, "false" },
            { SettingKeys.EnableIPRestriction, "false" },
            { SettingKeys.EnableEmailNotifications, "true" },
            { SettingKeys.EnableSystemNotifications, "true" },
            { SettingKeys.NotificationEmail, "admin@ims.com" },
            { SettingKeys.BackupFrequency, "weekly" },
            { SettingKeys.BackupRetention, "30" }
        };

        foreach (var setting in defaultSettings)
        {
            var exists = await context.SystemSettings
                .AnyAsync(s => s.Key == setting.Key);

            if (!exists)
            {
                context.SystemSettings.Add(new SystemSettings
                {
                    Key = setting.Key,
                    Value = setting.Value,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        await context.SaveChangesAsync();
    }
}

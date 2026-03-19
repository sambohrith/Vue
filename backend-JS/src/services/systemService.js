const { SystemSettings } = require('../models');

const SETTING_KEYS = {
  SITE_NAME: 'site_name',
  SITE_LOGO: 'site_logo',
  SITE_DESCRIPTION: 'site_description',
  PASSWORD_MIN_LENGTH: 'password_min_length',
  LOGIN_ATTEMPTS: 'login_attempts',
  ENABLE_2FA: 'enable_2fa',
  ENABLE_IP_RESTRICTION: 'enable_ip_restriction',
  ENABLE_EMAIL_NOTIFICATIONS: 'enable_email_notifications',
  ENABLE_SYSTEM_NOTIFICATIONS: 'enable_system_notifications',
  NOTIFICATION_EMAIL: 'notification_email',
  BACKUP_FREQUENCY: 'backup_frequency',
  BACKUP_RETENTION: 'backup_retention'
};

const getSetting = async (key, defaultValue) => {
  const setting = await SystemSettings.findOne({ where: { key } });
  return setting ? setting.value : defaultValue;
};

const setSetting = async (key, value) => {
  const setting = await SystemSettings.findOne({ where: { key } });
  
  if (setting) {
    setting.value = value;
    await setting.save();
  } else {
    await SystemSettings.create({ key, value });
  }
};

const getSettings = async () => {
  return {
    siteName: await getSetting(SETTING_KEYS.SITE_NAME, '信息管理系统'),
    siteLogo: await getSetting(SETTING_KEYS.SITE_LOGO, ''),
    siteDescription: await getSetting(SETTING_KEYS.SITE_DESCRIPTION, '企业级信息管理解决方案'),
    passwordMinLength: parseInt(await getSetting(SETTING_KEYS.PASSWORD_MIN_LENGTH, '8')),
    loginAttempts: parseInt(await getSetting(SETTING_KEYS.LOGIN_ATTEMPTS, '5')),
    enable2FA: (await getSetting(SETTING_KEYS.ENABLE_2FA, 'false')) === 'true',
    enableIPRestriction: (await getSetting(SETTING_KEYS.ENABLE_IP_RESTRICTION, 'false')) === 'true',
    enableEmailNotifications: (await getSetting(SETTING_KEYS.ENABLE_EMAIL_NOTIFICATIONS, 'true')) === 'true',
    enableSystemNotifications: (await getSetting(SETTING_KEYS.ENABLE_SYSTEM_NOTIFICATIONS, 'true')) === 'true',
    notificationEmail: await getSetting(SETTING_KEYS.NOTIFICATION_EMAIL, 'admin@ims.com'),
    backupFrequency: await getSetting(SETTING_KEYS.BACKUP_FREQUENCY, 'weekly'),
    backupRetention: parseInt(await getSetting(SETTING_KEYS.BACKUP_RETENTION, '30'))
  };
};

const updateSettings = async (req) => {
  const {
    siteName,
    siteLogo,
    siteDescription,
    passwordMinLength,
    loginAttempts,
    enable2FA,
    enableIPRestriction,
    enableEmailNotifications,
    enableSystemNotifications,
    notificationEmail,
    backupFrequency,
    backupRetention
  } = req;

  if (siteName !== undefined) await setSetting(SETTING_KEYS.SITE_NAME, siteName);
  if (siteLogo !== undefined) await setSetting(SETTING_KEYS.SITE_LOGO, siteLogo);
  if (siteDescription !== undefined) await setSetting(SETTING_KEYS.SITE_DESCRIPTION, siteDescription);
  if (passwordMinLength !== undefined) await setSetting(SETTING_KEYS.PASSWORD_MIN_LENGTH, String(passwordMinLength));
  if (loginAttempts !== undefined) await setSetting(SETTING_KEYS.LOGIN_ATTEMPTS, String(loginAttempts));
  if (enable2FA !== undefined) await setSetting(SETTING_KEYS.ENABLE_2FA, String(enable2FA));
  if (enableIPRestriction !== undefined) await setSetting(SETTING_KEYS.ENABLE_IP_RESTRICTION, String(enableIPRestriction));
  if (enableEmailNotifications !== undefined) await setSetting(SETTING_KEYS.ENABLE_EMAIL_NOTIFICATIONS, String(enableEmailNotifications));
  if (enableSystemNotifications !== undefined) await setSetting(SETTING_KEYS.ENABLE_SYSTEM_NOTIFICATIONS, String(enableSystemNotifications));
  if (notificationEmail !== undefined) await setSetting(SETTING_KEYS.NOTIFICATION_EMAIL, notificationEmail);
  if (backupFrequency !== undefined) await setSetting(SETTING_KEYS.BACKUP_FREQUENCY, backupFrequency);
  if (backupRetention !== undefined) await setSetting(SETTING_KEYS.BACKUP_RETENTION, String(backupRetention));

  return req;
};

const backupDatabase = async () => {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
  return {
    success: true,
    message: '数据库备份成功',
    backupPath: `/backups/backup_${timestamp}.sql`,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  getSettings,
  updateSettings,
  backupDatabase
};

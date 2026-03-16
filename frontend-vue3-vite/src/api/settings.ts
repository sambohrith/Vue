import http from './http'

export interface SystemSettings {
  systemName: string
  systemLogo?: string
  systemDescription?: string
  allowRegistration: boolean
  allowChat: boolean
  allowProfileEdit: boolean
  passwordMinLength: number
  sessionTimeout: number
  maxLoginAttempts: number
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPassword?: string
  smtpFrom?: string
}

export interface BackupResponse {
  success: boolean
  message: string
  backupPath?: string
}

export interface Settings {
  siteName: string
  siteLogo?: string
  siteDescription?: string
  passwordMinLength: number
  loginAttempts: number
  enable2FA: boolean
  enableIPRestriction: boolean
  enableEmailNotifications: boolean
  enableSystemNotifications: boolean
  notificationEmail?: string
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  backupRetention: number
}

export const settingsApi = {
  getSettings() {
    return http.get<Settings>('/system/settings')
  },

  updateSettings(data: Partial<Settings>) {
    return http.put<Settings>('/system/settings', data)
  },

  backupDatabase() {
    return http.post<BackupResponse>('/system/backup')
  },

  createBackup() {
    return http.post<BackupResponse>('/system/backup')
  },

  downloadBackup() {
    return http.get<string>('/system/backup/download')
  }
}

export default settingsApi

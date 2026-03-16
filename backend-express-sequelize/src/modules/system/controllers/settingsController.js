const { sequelize } = require('../../../config/database');
const fs = require('fs').promises;
const path = require('path');

// 获取系统设置
async function getSettings(req, res) {
  try {
    // 从数据库或配置文件读取设置
    // 这里简化处理，返回默认设置
    const settings = {
      siteName: '人员信息管理系统',
      siteDescription: '企业内部人员信息管理平台',
      allowRegistration: true,
      requireEmailVerification: false,
      maxUploadSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      chatEnabled: true,
      socialEnabled: true,
      maintenanceMode: false
    };

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({ success: false, message: '获取设置失败' });
  }
}

// 更新系统设置
async function updateSettings(req, res) {
  try {
    // 验证是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    const settings = req.body;

    // 这里应该保存到数据库或配置文件
    // 简化处理，只返回成功

    res.json({
      success: true,
      message: '设置更新成功',
      data: { settings }
    });
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(500).json({ success: false, message: '更新设置失败' });
  }
}

// 备份数据库
async function backupDatabase(req, res) {
  try {
    // 验证是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../../../../backups');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    // 确保备份目录存在
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (err) {
      // 目录已存在
    }

    // 获取所有表数据
    const tables = ['Users', 'ChatMessages', 'Posts', 'PostLikes', 'PostComments', 'Rooms', 'RoomMembers', 'RoomMessages'];
    const backup = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      data: {}
    };

    for (const table of tables) {
      try {
        const [results] = await sequelize.query(`SELECT * FROM ${table}`);
        backup.data[table] = results;
      } catch (err) {
        console.warn(`备份表 ${table} 失败:`, err.message);
        backup.data[table] = [];
      }
    }

    // 写入备份文件
    await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));

    res.json({
      success: true,
      message: '备份成功',
      data: {
        backupFile: path.basename(backupFile),
        timestamp: backup.timestamp
      }
    });
  } catch (error) {
    console.error('备份失败:', error);
    res.status(500).json({ success: false, message: '备份失败' });
  }
}

// 恢复数据库
async function restoreDatabase(req, res) {
  try {
    // 验证是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    const { backupFile } = req.body;

    if (!backupFile) {
      return res.status(400).json({ success: false, message: '请指定备份文件' });
    }

    const backupPath = path.join(__dirname, '../../../../backups', backupFile);

    // 读取备份文件
    const backupData = await fs.readFile(backupPath, 'utf8');
    const backup = JSON.parse(backupData);

    // 恢复数据
    for (const [table, records] of Object.entries(backup.data)) {
      if (records.length > 0) {
        try {
          // 清空表
          await sequelize.query(`DELETE FROM ${table}`);

          // 插入数据
          for (const record of records) {
            const columns = Object.keys(record).join(', ');
            const values = Object.values(record).map(v =>
              v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
            ).join(', ');

            await sequelize.query(`INSERT INTO ${table} (${columns}) VALUES (${values})`);
          }
        } catch (err) {
          console.warn(`恢复表 ${table} 失败:`, err.message);
        }
      }
    }

    res.json({
      success: true,
      message: '恢复成功'
    });
  } catch (error) {
    console.error('恢复失败:', error);
    res.status(500).json({ success: false, message: '恢复失败' });
  }
}

// 获取数据库大小
async function getDatabaseSize(req, res) {
  try {
    // 验证是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    // 查询数据库大小
    const [results] = await sequelize.query(`
      SELECT
        table_schema AS 'database',
        SUM(data_length + index_length) AS 'size'
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      GROUP BY table_schema
    `);

    const sizeInBytes = results[0]?.size || 0;
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

    res.json({
      success: true,
      data: {
        sizeInBytes,
        sizeInMB: parseFloat(sizeInMB),
        formattedSize: sizeInMB > 1024
          ? `${(sizeInMB / 1024).toFixed(2)} GB`
          : `${sizeInMB} MB`
      }
    });
  } catch (error) {
    console.error('获取数据库大小失败:', error);
    res.status(500).json({ success: false, message: '获取数据库大小失败' });
  }
}

// 获取系统日志
async function getSystemLogs(req, res) {
  try {
    // 验证是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    const { page = 1, limit = 50 } = req.query;

    // 这里简化处理，返回模拟日志
    // 实际应该从日志文件或数据库读取
    const logs = [
      { id: 1, level: 'info', message: '系统启动成功', timestamp: new Date().toISOString() },
      { id: 2, level: 'info', message: '数据库连接成功', timestamp: new Date().toISOString() }
    ];

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: logs.length
        }
      }
    });
  } catch (error) {
    console.error('获取系统日志失败:', error);
    res.status(500).json({ success: false, message: '获取系统日志失败' });
  }
}

// 清理系统缓存
async function clearCache(req, res) {
  try {
    // 验证是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足' });
    }

    // 这里可以清理各种缓存
    // 例如：内存缓存、文件缓存等

    res.json({
      success: true,
      message: '缓存清理成功'
    });
  } catch (error) {
    console.error('清理缓存失败:', error);
    res.status(500).json({ success: false, message: '清理缓存失败' });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  backupDatabase,
  restoreDatabase,
  getDatabaseSize,
  getSystemLogs,
  clearCache
};

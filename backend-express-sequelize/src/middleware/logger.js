const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
const errorLogPath = path.join(logDir, 'error.log');
const accessLogPath = path.join(logDir, 'access.log');
const combinedLogPath = path.join(logDir, 'combined.log');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logLevels = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
  return `[${timestamp}] [${level}] ${message} ${metaStr}`;
};

const writeLog = (filePath, message) => {
  try {
    fs.appendFileSync(filePath, message + '\n', 'utf8');
  } catch (error) {
    console.error('写入日志文件失败:', error);
  }
};

const logger = {
  error: (message, meta = {}) => {
    const formattedMessage = formatMessage(logLevels.ERROR, message, meta);
    console.error(formattedMessage);
    writeLog(errorLogPath, formattedMessage);
    writeLog(combinedLogPath, formattedMessage);
  },

  warn: (message, meta = {}) => {
    const formattedMessage = formatMessage(logLevels.WARN, message, meta);
    console.warn(formattedMessage);
    writeLog(combinedLogPath, formattedMessage);
  },

  info: (message, meta = {}) => {
    const formattedMessage = formatMessage(logLevels.INFO, message, meta);
    console.log(formattedMessage);
    writeLog(combinedLogPath, formattedMessage);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = formatMessage(logLevels.DEBUG, message, meta);
      console.log(formattedMessage);
      writeLog(combinedLogPath, formattedMessage);
    }
  },

  http: (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
      
      const logData = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      };

      if (res.statusCode >= 400) {
        logger.error(message, logData);
      } else {
        logger.info(message, logData);
      }
      
      writeLog(accessLogPath, formatMessage('ACCESS', message, logData));
    });

    next();
  },

  logError: (error, req = null) => {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };

    if (req) {
      errorData.request = {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        params: req.params,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent')
      };
    }

    logger.error('应用错误', errorData);
  },

  logAuth: (action, userId, success = true, meta = {}) => {
    const message = `认证操作: ${action} - 用户ID: ${userId} - ${success ? '成功' : '失败'}`;
    const logData = {
      action,
      userId,
      success,
      ...meta
    };

    if (success) {
      logger.info(message, logData);
    } else {
      logger.warn(message, logData);
    }
  },

  logDatabase: (operation, model, duration, success = true, meta = {}) => {
    const message = `数据库操作: ${operation} - 模型: ${model} - 耗时: ${duration}ms - ${success ? '成功' : '失败'}`;
    const logData = {
      operation,
      model,
      duration,
      success,
      ...meta
    };

    if (success) {
      logger.debug(message, logData);
    } else {
      logger.error(message, logData);
    }
  }
};

module.exports = logger;

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

const config = require('../config');

const logsDir = path.dirname(config.log.filename);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(logColors);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    level: config.log.level,
    format: consoleFormat
  }),
  new DailyRotateFile({
    filename: config.log.filename,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: config.log.maxAge > 0,
    maxSize: `${config.log.maxSize}m`,
    maxFiles: config.log.maxBackups,
    format: fileFormat
  })
];

const logger = winston.createLogger({
  levels: logLevels,
  transports,
  exitOnError: false
});

const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - ${req.ip}`;
    
    if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.http(message);
    }
  });
  
  next();
};

const authLogger = (action, userId, success, details = {}) => {
  const message = `Auth: ${action} - User: ${userId} - Success: ${success}`;
  if (success) {
    logger.info(message, details);
  } else {
    logger.warn(message, details);
  }
};

module.exports = {
  logger,
  httpLogger,
  authLogger,
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  debug: logger.debug.bind(logger),
  http: logger.http.bind(logger)
};

/**
 * 安全中间件
 * 包含：请求限流、安全头、输入清理、SQL注入防护
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// 创建限流器
const createRateLimiter = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 100, // 每个IP最多100个请求
        message: {
            success: false,
            message: '请求过于频繁，请稍后再试'
        },
        standardHeaders: true,
        legacyHeaders: false,
        // 跳过健康检查端点
        skip: (req) => req.path === '/health'
    };

    return rateLimit({ ...defaultOptions, ...options });
};

// API 限流器 - 普通接口
const apiLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
});

// 严格限流器 - 登录注册等敏感接口
const strictLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 1000, // 放宽到1000次尝试（开发环境使用）
    message: {
        success: false,
        message: '尝试次数过多，请15分钟后再试'
    }
});

// 聊天消息限流器
const chatLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1分钟
    max: 30, // 每分钟最多30条消息
    message: {
        success: false,
        message: '发送消息过于频繁，请稍后再试'
    }
});

// Helmet 安全头配置
const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"], // 允许内联事件处理器 (onclick等)
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false, // 允许加载外部资源
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
};

// 请求大小限制
const requestSizeLimit = {
    json: '10mb',
    urlencoded: '10mb'
};

// 安全中间件组合
const securityMiddleware = {
    // 基础安全头
    helmet: helmet(helmetConfig),

    // 请求大小限制
    requestSizeLimit,

    // MongoDB 注入防护
    mongoSanitize: mongoSanitize({
        replaceWith: '_',
        onSanitize: ({ req, key }) => {
            console.warn(`检测到潜在的 MongoDB 注入攻击: ${key}`, {
                ip: req.ip,
                path: req.path,
                method: req.method
            });
        }
    }),
    
    // XSS 防护
    xss: xss(),
    
    // HTTP 参数污染防护
    hpp: hpp({
        whitelist: [
            'page',
            'limit',
            'sort',
            'fields'
        ]
    }),
    
    // 限流器
    apiLimiter,
    strictLimiter,
    chatLimiter,
    
    // 自定义限流器创建函数
    createRateLimiter
};

module.exports = securityMiddleware;

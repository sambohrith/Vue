package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// TokenBucket 令牌桶限流器
type TokenBucket struct {
	rate       int           // 每秒产生令牌数
	capacity   int           // 桶容量
	tokens     int           // 当前令牌数
	lastUpdate time.Time     // 上次更新时间
	mu         sync.Mutex
}

func NewTokenBucket(rate, capacity int) *TokenBucket {
	return &TokenBucket{
		rate:       rate,
		capacity:   capacity,
		tokens:     capacity,
		lastUpdate: time.Now(),
	}
}

func (tb *TokenBucket) Allow() bool {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(tb.lastUpdate).Seconds()
	tb.lastUpdate = now

	// 添加新令牌
	tb.tokens += int(elapsed * float64(tb.rate))
	if tb.tokens > tb.capacity {
		tb.tokens = tb.capacity
	}

	if tb.tokens > 0 {
		tb.tokens--
		return true
	}
	return false
}

// RateLimiter 限流中间件
type RateLimiter struct {
	buckets map[string]*TokenBucket
	mu      sync.RWMutex
	rate    int
	burst   int
}

func NewRateLimiter(requestsPerMinute, burst int) *RateLimiter {
	return &RateLimiter{
		buckets: make(map[string]*TokenBucket),
		rate:    requestsPerMinute / 60, // 转换为每秒
		burst:   burst,
	}
}

func (rl *RateLimiter) getBucket(key string) *TokenBucket {
	rl.mu.RLock()
	bucket, exists := rl.buckets[key]
	rl.mu.RUnlock()

	if !exists {
		rl.mu.Lock()
		bucket = NewTokenBucket(rl.rate, rl.burst)
		rl.buckets[key] = bucket
		rl.mu.Unlock()
	}

	return bucket
}

func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 跳过健康检查端点
		if c.Request.URL.Path == "/api/health" || c.Request.URL.Path == "/api/health/detailed" {
			c.Next()
			return
		}

		// 使用IP作为限流键
		key := c.ClientIP()
		
		// 如果已登录，使用用户ID
		if userID, exists := c.Get("userID"); exists {
			if id, ok := userID.(uint); ok {
				key = "user:" + string(rune(id))
			}
		}

		bucket := rl.getBucket(key)
		if !bucket.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": "请求过于频繁，请稍后再试",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

module backend-go

go 1.21

require (
	github.com/gin-contrib/cors v1.7.2
	github.com/gin-gonic/gin v1.9.1
	github.com/go-playground/validator/v10 v10.19.0
	github.com/golang-jwt/jwt/v5 v5.2.0
	github.com/google/uuid v1.6.0
	github.com/spf13/viper v1.18.2
	go.uber.org/zap v1.27.0
	golang.org/x/crypto v0.21.0
	gopkg.in/natefinch/lumberjack.v2 v2.2.1
	gorm.io/driver/mysql v1.5.6
	gorm.io/driver/postgres v1.5.7
	gorm.io/driver/sqlite v1.5.6
	gorm.io/gorm v1.25.8
)

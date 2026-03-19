using IMS;
using IMS.Data;
using IMS.Middleware;
using IMS.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MySqlConnector;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;
using Serilog;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/app.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 30)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger with JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "IMS API", Version = "v1" });
    
    // Add JWT Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure JWT
var jwtConfig = builder.Configuration.GetSection("JWT");
var jwtSecret = jwtConfig["Secret"] ?? "your-default-secret-key-here-must-be-at-least-32-characters-long";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };
});

// Configure Database
var dbConfig = builder.Configuration.GetSection("Database");
var dbProvider = Environment.GetEnvironmentVariable("DB_PROVIDER") 
    ?? dbConfig["Provider"] 
    ?? "sqlite";

// 辅助方法：获取配置值（优先环境变量，支持占位符替换）
string GetConfigValue(string envVar, string configKey, string defaultValue)
{
    var envValue = Environment.GetEnvironmentVariable(envVar);
    if (!string.IsNullOrEmpty(envValue)) return envValue;
    
    var configValue = dbConfig[configKey];
    if (string.IsNullOrEmpty(configValue) || configValue.StartsWith("${")) return defaultValue;
    
    return configValue;
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    switch (dbProvider.ToLower())
    {
        case "mysql":
            var mysqlHost = GetConfigValue("DB_HOST", "MySQL:Host", "localhost");
            var mysqlPort = GetConfigValue("DB_PORT", "MySQL:Port", "3306");
            var mysqlDb = GetConfigValue("DB_NAME", "MySQL:Database", "ims");
            var mysqlUser = GetConfigValue("DB_USER", "MySQL:User", "root");
            var mysqlPass = GetConfigValue("DB_PASSWORD", "MySQL:Password", "");
            var mysqlSsl = GetConfigValue("DB_SSLMODE", "MySQL:SslMode", "None");
            
            var mysqlConn = $"Server={mysqlHost};Port={mysqlPort};Database={mysqlDb};Uid={mysqlUser};Pwd={mysqlPass};SslMode={mysqlSsl};";
            options.UseMySql(mysqlConn, new MySqlServerVersion(new Version(8, 0, 30)));
            Log.Information("Using MySQL database: {Host}:{Port}/{Database}", mysqlHost, mysqlPort, mysqlDb);
            break;
            
        case "postgresql":
        case "postgres":
            var pgHost = GetConfigValue("DB_HOST", "PostgreSQL:Host", "localhost");
            var pgPort = GetConfigValue("DB_PORT", "PostgreSQL:Port", "5432");
            var pgDb = GetConfigValue("DB_NAME", "PostgreSQL:Database", "ims");
            var pgUser = GetConfigValue("DB_USER", "PostgreSQL:User", "postgres");
            var pgPass = GetConfigValue("DB_PASSWORD", "PostgreSQL:Password", "");
            
            var pgConn = $"Host={pgHost};Port={pgPort};Database={pgDb};Username={pgUser};Password={pgPass}";
            options.UseNpgsql(pgConn);
            Log.Information("Using PostgreSQL database: {Host}:{Port}/{Database}", pgHost, pgPort, pgDb);
            break;
            
        case "sqlserver":
            var mssqlHost = GetConfigValue("DB_HOST", "SQLServer:Host", "localhost");
            var mssqlDb = GetConfigValue("DB_NAME", "SQLServer:Database", "ims");
            var mssqlUser = GetConfigValue("DB_USER", "SQLServer:User", "sa");
            var mssqlPass = GetConfigValue("DB_PASSWORD", "SQLServer:Password", "");
            var trustCert = dbConfig.GetValue<bool>("SQLServer:TrustServerCertificate", true);
            
            var mssqlConn = $"Server={mssqlHost};Database={mssqlDb};User Id={mssqlUser};Password={mssqlPass};TrustServerCertificate={trustCert};";
            options.UseSqlServer(mssqlConn);
            Log.Information("Using SQL Server database: {Host}/{Database}", mssqlHost, mssqlDb);
            break;
            
        case "sqlite":
        default:
            var sqlitePath = Environment.GetEnvironmentVariable("DB_PATH") 
                ?? dbConfig["SQLite:Path"] 
                ?? "ims.db";
            options.UseSqlite($"Data Source={sqlitePath}");
            Log.Information("Using SQLite database: {Path}", sqlitePath);
            break;
    }
});

// Configure CORS
var allowedOrigins = builder.Configuration.GetSection("Server:AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:5173", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowedOrigins", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Register Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<ISocialService, SocialService>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<ISystemService, SystemService>();
builder.Services.AddScoped<IJwtService, JwtService>();

// Configure Rate Limiting
if (builder.Configuration.GetValue<bool>("RateLimit:Enabled"))
{
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(options =>
    {
        options.GeneralRules = new List<RateLimitRule>
        {
            new RateLimitRule
            {
                Endpoint = "*",
                Limit = builder.Configuration.GetValue<int>("RateLimit:RequestsPerMinute"),
                Period = "1m"
            }
        };
    });
    builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
    builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
}

var app = builder.Build();

// Apply database migrations
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        db.Database.Migrate();
        Log.Information("Database migrated successfully");
        
        // Seed default admin
        var adminConfig = builder.Configuration.GetSection("Admin");
        await DbInitializer.SeedAdminUser(db, adminConfig);
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred while migrating the database");
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use custom middleware
app.UseMiddleware<RequestIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

app.UseCors("AllowedOrigins");

if (builder.Configuration.GetValue<bool>("RateLimit:Enabled"))
{
    app.UseIpRateLimiting();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

var port = builder.Configuration.GetValue<int>("Server:Port");
if (port > 0)
{
    app.Urls.Add($"http://0.0.0.0:{port}");
}

Log.Information("Starting IMS API server...");

app.Run();

Log.Information("IMS API server stopped");

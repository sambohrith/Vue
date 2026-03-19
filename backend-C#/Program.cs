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
var driver = dbConfig["Driver"] ?? "sqlite";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    switch (driver.ToLower())
    {
        case "mysql":
            var mysqlConn = dbConfig.GetConnectionString("MySQL");
            options.UseMySql(mysqlConn, ServerVersion.AutoDetect(mysqlConn));
            break;
        case "postgresql":
        case "postgres":
            options.UseNpgsql(dbConfig.GetConnectionString("PostgreSQL"));
            break;
        case "sqlserver":
            options.UseSqlServer(dbConfig.GetConnectionString("SQLServer"));
            break;
        case "sqlite":
        default:
            var sqlitePath = builder.Configuration.GetValue<string>("SQLite:Path") ?? "ims.db";
            options.UseSqlite($"Data Source={sqlitePath}");
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

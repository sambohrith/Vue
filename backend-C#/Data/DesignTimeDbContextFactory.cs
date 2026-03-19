using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace IMS.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .AddEnvironmentVariables()
            .Build();

        var dbConfig = configuration.GetSection("Database");
        var dbProvider = Environment.GetEnvironmentVariable("DB_PROVIDER") 
            ?? dbConfig["Provider"] 
            ?? "sqlite";
        
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

        switch (dbProvider.ToLower())
        {
            case "mysql":
                var mysqlHost = dbConfig["MySQL:Host"] ?? "localhost";
                var mysqlPort = dbConfig["MySQL:Port"] ?? "3306";
                var mysqlDb = dbConfig["MySQL:Database"] ?? "ims";
                var mysqlUser = dbConfig["MySQL:User"] ?? "root";
                var mysqlPass = dbConfig["MySQL:Password"] ?? "";
                var mysqlSsl = dbConfig["MySQL:SslMode"] ?? "None";
                
                var mysqlConn = $"Server={mysqlHost};Port={mysqlPort};Database={mysqlDb};Uid={mysqlUser};Pwd={mysqlPass};SslMode={mysqlSsl};";
                optionsBuilder.UseMySql(mysqlConn, new MySqlServerVersion(new Version(8, 0, 30)));
                break;
                
            case "postgresql":
            case "postgres":
                var pgHost = dbConfig["PostgreSQL:Host"] ?? "localhost";
                var pgPort = dbConfig["PostgreSQL:Port"] ?? "5432";
                var pgDb = dbConfig["PostgreSQL:Database"] ?? "ims";
                var pgUser = dbConfig["PostgreSQL:User"] ?? "postgres";
                var pgPass = dbConfig["PostgreSQL:Password"] ?? "";
                
                var pgConn = $"Host={pgHost};Port={pgPort};Database={pgDb};Username={pgUser};Password={pgPass}";
                optionsBuilder.UseNpgsql(pgConn);
                break;
                
            case "sqlserver":
                var mssqlHost = dbConfig["SQLServer:Host"] ?? "localhost";
                var mssqlDb = dbConfig["SQLServer:Database"] ?? "ims";
                var mssqlUser = dbConfig["SQLServer:User"] ?? "sa";
                var mssqlPass = dbConfig["SQLServer:Password"] ?? "";
                var trustCert = bool.TryParse(dbConfig["SQLServer:TrustServerCertificate"], out var tc) ? tc : true;
                
                var mssqlConn = $"Server={mssqlHost};Database={mssqlDb};User Id={mssqlUser};Password={mssqlPass};TrustServerCertificate={trustCert};";
                optionsBuilder.UseSqlServer(mssqlConn);
                break;
                
            case "sqlite":
            default:
                var sqlitePath = dbConfig["SQLite:Path"] ?? "ims.db";
                optionsBuilder.UseSqlite($"Data Source={sqlitePath}");
                break;
        }

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}

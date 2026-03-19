using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace IMS.Services;

public class JwtService : IJwtService
{
    private readonly string _secret;
    private readonly int _expirationHours;

    public JwtService(IConfiguration configuration)
    {
        _secret = configuration["JWT:Secret"] 
            ?? "your-super-secret-jwt-key-here-must-be-at-least-32-characters-long-for-security";
        
        var expirationStr = configuration["JWT:Expiration"] ?? "24h";
        _expirationHours = ParseExpirationHours(expirationStr);
    }

    private int ParseExpirationHours(string expiration)
    {
        if (expiration.EndsWith("h"))
        {
            if (int.TryParse(expiration.TrimEnd('h'), out var hours))
                return hours;
        }
        else if (expiration.EndsWith("d"))
        {
            if (int.TryParse(expiration.TrimEnd('d'), out var days))
                return days * 24;
        }
        return 24; // default 24 hours
    }

    public string GenerateToken(long userId)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_secret);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim("user_id", userId.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            }),
            Expires = DateTime.UtcNow.AddHours(_expirationHours),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key), 
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public (bool isValid, long? userId) ValidateToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_secret);

        try
        {
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var userIdClaim = jwtToken.Claims.FirstOrDefault(x => x.Type == "user_id");
            
            if (userIdClaim != null && long.TryParse(userIdClaim.Value, out var userId))
            {
                return (true, userId);
            }

            return (false, null);
        }
        catch
        {
            return (false, null);
        }
    }
}

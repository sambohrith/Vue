namespace IMS.Services;

public interface IJwtService
{
    string GenerateToken(long userId);
    (bool isValid, long? userId) ValidateToken(string token);
}

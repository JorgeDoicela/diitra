using diitra_application.Security.DTOs;

namespace diitra_application.Security;

public interface ITokenService
{
    string GenerateToken(AuthResponse user);
    string GenerateRefreshToken(string username);
}

using diitra_application.Security.DTOs;

namespace diitra_application.Security;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    string GenerateToken(AuthResponse user);
}

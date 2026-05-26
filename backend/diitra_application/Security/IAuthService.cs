using diitra_application.Security.DTOs;

namespace diitra_application.Security;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    string GenerateToken(AuthResponse user);
    string GenerateRefreshToken(string username);
    Task<diitra_domain.Identity.Entities.User?> GetOrProvisionUserByCedulaAsync(string cedula);
    Task<diitra_domain.Identity.Entities.User> ProvisionUserAsync(string username, string name, string password, string table, string sigafiId);
    Task<AuthResponse?> RefreshAuthResponseAsync(string username);
}

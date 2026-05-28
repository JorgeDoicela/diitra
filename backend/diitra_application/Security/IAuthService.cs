using diitra_application.Security.DTOs;

namespace diitra_application.Security;

public interface IAuthService
{
    Task<(AuthResponse? Auth, LoginBlockedResponse? Blocked)> LoginAsync(LoginRequest request);
    string GenerateToken(AuthResponse user);
    string GenerateRefreshToken(string username);
    Task<diitra_domain.Identity.Entities.User?> GetOrProvisionUserByCedulaAsync(string cedula);
    Task<diitra_domain.Identity.Entities.User> ProvisionUserAsync(string username, string name, string password, string table, string sigafiId);
    Task<AuthResponse?> RefreshAuthResponseAsync(string username);
    Task<AuthResponse?> GetAuthResponseForUserByIdAsync(int idUsuario);
    Task<MagicLoginResponseDto?> ValidateAndConsumeMagicLinkAsync(string tokenHash, string? ipAddress, string? userAgent);
    Task<AuthResponse?> ValidateAndConsumeHandoffPinAsync(string pin, string? ipAddress);
    Task<string> CreateMagicLinkAsync(int idUsuario, DateTime expirationDate);
    Task<bool> ResendMagicLinkAsync(string email);
}

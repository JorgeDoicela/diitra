using diitra_application.Security.DTOs;

namespace diitra_application.Security;

public interface IMagicLinkService
{
    Task<string> CreateMagicLinkAsync(int idUsuario, DateTime expirationDate);
    Task<MagicLoginResponseDto?> ValidateAndConsumeMagicLinkAsync(string tokenHash, string? ipAddress, string? userAgent);
    Task<AuthResponse?> ValidateAndConsumeHandoffPinAsync(string pin, string? ipAddress);
    Task<bool> ResendMagicLinkAsync(string email);
}

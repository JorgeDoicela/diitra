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
    Task<AuthResponse?> LoginWithMicrosoftAsync(MicrosoftLoginRequest request);
    /// <summary>
    /// Genera un token de recuperación (30 min) y envía el enlace al correo institucional del usuario.
    /// Siempre retorna true para evitar enumeración de usuarios.
    /// </summary>
    Task<PasswordRecoveryRequestResult> RequestPasswordRecoveryAsync(string identificador, string? cedula, string? ipAddress);
    /// <summary>
    /// Valida el token de recuperación y retorna la contraseña original de SIGAFI si es legible.
    /// Consume el token (un solo uso).
    /// </summary>
    Task<PasswordRecoveryValidationResult> ValidatePasswordRecoveryTokenAsync(string plainToken, string? ipAddress);

    /// <summary>
    /// Cambia la contraseña de un usuario si no es institucional (ej. evaluadores externos).
    /// </summary>
    Task<bool> ChangePasswordAsync(int idUsuario, string currentPassword, string newPassword);

    /// <summary>
    /// Reestablece de emergencia la contraseña de un usuario si se detecta un cambio de credenciales sospechoso, invalidando sesiones anteriores.
    /// </summary>
    Task<bool> RevertSuspiciousPasswordChangeAsync(string plainToken, string newPassword, string? ipAddress);

    /// <summary>
    /// Restablece la contraseña de un usuario mediante token de recuperación de contraseña ordinario (solo para evaluadores externos).
    /// </summary>
    Task<bool> ResetPasswordWithRecoveryTokenAsync(string plainToken, string newPassword, string? ipAddress);
}

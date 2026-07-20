using diitra_application.Security.DTOs;

namespace diitra_application.Security;

public interface IPasswordRecoveryService
{
    Task<PasswordRecoveryRequestResult> RequestPasswordRecoveryAsync(string identificador, string? cedula, string? ipAddress);
    Task<PasswordRecoveryValidationResult> ValidatePasswordRecoveryTokenAsync(string plainToken, string? ipAddress);
    Task<bool> ChangePasswordAsync(int idUsuario, string currentPassword, string newPassword);
    Task<bool> RevertSuspiciousPasswordChangeAsync(string plainToken, string newPassword, string? ipAddress);
    Task<bool> ResetPasswordWithRecoveryTokenAsync(string plainToken, string newPassword, string? ipAddress);
}

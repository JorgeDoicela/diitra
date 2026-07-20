using diitra_application.Security;

namespace diitra_infrastructure.Security;

public class PasswordService : IPasswordService
{
    public PasswordVerificationResult VerifyPassword(string password, string hashedPasswordOrPlaintext)
    {
        try
        {
            if (BCrypt.Net.BCrypt.Verify(password, hashedPasswordOrPlaintext))
            {
                return new PasswordVerificationResult { Success = true, NeedsRehash = false };
            }
        }
        catch
        {
            // Fallback para claves en texto plano durante transición
            if (hashedPasswordOrPlaintext == password)
            {
                return new PasswordVerificationResult { Success = true, NeedsRehash = true };
            }
        }
        return new PasswordVerificationResult { Success = false, NeedsRehash = false };
    }

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, 11);
    }

    public bool IsBCryptHash(string password)
    {
        if (string.IsNullOrEmpty(password)) return false;
        return password.Length == 60 && (password.StartsWith("$2a$") || password.StartsWith("$2b$") || password.StartsWith("$2y$"));
    }
}

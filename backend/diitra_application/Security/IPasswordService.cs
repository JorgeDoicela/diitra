namespace diitra_application.Security;

public interface IPasswordService
{
    PasswordVerificationResult VerifyPassword(string password, string hashedPasswordOrPlaintext);
    string HashPassword(string password);
    bool IsBCryptHash(string password);
}

public class PasswordVerificationResult
{
    public bool Success { get; set; }
    public bool NeedsRehash { get; set; }
}

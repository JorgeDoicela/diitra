using diitra_application.Security.DTOs;

namespace diitra_application.Security;

public interface IMicrosoftAuthService
{
    Task<AuthResponse?> LoginWithMicrosoftAsync(MicrosoftLoginRequest request);
}

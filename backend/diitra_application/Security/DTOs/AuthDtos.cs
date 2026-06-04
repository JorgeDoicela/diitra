namespace diitra_application.Security.DTOs;

public class LoginRequest
{
    public string Username { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public class AuthResponse
{
    public string IdReferencia { get; set; } = null!;
    public string NombreCompleto { get; set; } = null!;
    public string Role { get; set; } = null!;
    public List<string> Roles { get; set; } = new();
    public List<string> RoleCodes { get; set; } = new();
    public string TipoUsuario { get; set; } = null!; // profesor, alumno, externo, admin
    public List<string> Permissions { get; set; } = new();
    public string Token { get; set; } = null!;
    public string? RefreshToken { get; set; }
    public string? Email { get; set; }
    public string Sistemas { get; set; } = string.Empty;
    public bool Administrador { get; set; }
    public int IdUsuario { get; set; }
    public string UserUuid { get; set; } = null!;
    public string Usuario { get; set; } = null!;
}

/// <summary>Respuesta cuando el usuario está bloqueado por exceso de intentos fallidos.</summary>
public class LoginBlockedResponse
{
    public string Message { get; set; } = null!;
    /// <summary>UTC moment when the lockout expires (ISO 8601).</summary>
    public DateTime BloqueadoHasta { get; set; }
    /// <summary>Seconds remaining until the account unlocks.</summary>
    public int SegundosRestantes { get; set; }
}

public class MagicLoginRequest
{
    public string Token { get; set; } = null!;
}

public class HandoffLoginRequest
{
    public string Pin { get; set; } = null!;
}

public class MagicLoginResponseDto
{
    public AuthResponse Auth { get; set; } = null!;
    public string? Pin { get; set; }
}

public class MagicResendRequest
{
    public string Email { get; set; } = null!;
}

public class MagicConfirmRequest
{
    public string Token { get; set; } = null!;
}

public class MicrosoftLoginRequest
{
    public string IdToken { get; set; } = null!;
}

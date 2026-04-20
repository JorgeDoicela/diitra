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
    public string TipoUsuario { get; set; } = null!; // profesor, alumno, externo, admin
    public List<string> Permissions { get; set; } = new();
}

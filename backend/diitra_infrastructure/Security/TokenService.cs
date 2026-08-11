using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using diitra_application.Security;
using diitra_application.Security.DTOs;

namespace diitra_infrastructure.Security;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(AuthResponse user)
    {
        var jwtSettings = _configuration.GetSection("JWTSettings");
        var secret = jwtSettings["Secret"] ?? "YOUR_JWT_SHARED_SECRET_KEY_CHANGE_IN_PRODUCTION";
        var key = Encoding.UTF8.GetBytes(secret);

        var systemsClaim = user.Sistemas ?? string.Empty;

        var claims = new List<Claim>
        {
            new Claim("sub", user.IdReferencia ?? ""),
            new Claim(ClaimTypes.NameIdentifier, user.IdReferencia ?? ""),
            new Claim("nombre", user.NombreCompleto ?? ""),
            new Claim(ClaimTypes.Name, user.NombreCompleto ?? ""),
            new Claim("email", user.Email ?? ""),
            new Claim("tipo_usuario", user.Administrador ? "ADMIN" : "USUARIO"),
            new Claim("sistemas", systemsClaim ?? ""),
            new Claim("id_usuario", user.IdUsuario.ToString()),
            new Claim("user_uuid", user.UserUuid ?? ""),
            new Claim("es_admin", user.Administrador.ToString().ToLower())
        };

        foreach (var roleCode in user.RoleCodes)
        {
            claims.Add(new Claim(ClaimTypes.Role, roleCode));
            claims.Add(new Claim("roles", roleCode));
        }
        foreach (var permission in user.Permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(8), // Vigencia de 8 horas para el acceso
            Issuer = jwtSettings["Issuer"] ?? "auth_global_istpet",
            Audience = jwtSettings["Audience"] ?? "all",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public string GenerateRefreshToken(string username)
    {
        var jwtSettings = _configuration.GetSection("JWTSettings");
        var secret = jwtSettings["Secret"] ?? "YOUR_JWT_SHARED_SECRET_KEY_CHANGE_IN_PRODUCTION";
        var key = Encoding.UTF8.GetBytes(secret);

        var claims = new List<Claim>
        {
            new Claim("sub", username),
            new Claim("token_type", "refresh")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7), // Válido por 7 días
            Issuer = jwtSettings["Issuer"] ?? "auth_global_istpet",
            Audience = jwtSettings["Audience"] ?? "all",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}

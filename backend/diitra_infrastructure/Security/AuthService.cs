using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using diitra_domain.Identity.Entities;
using diitra_infrastructure.data.models;
using diitra_application.Security;
using diitra_application.Security.DTOs;

namespace diitra_infrastructure.Security;

public class AuthService : IAuthService
{
    private readonly DiitraContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(DiitraContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var username = request.Username.Trim();
        var password = request.Password.Trim();

        Console.WriteLine($"[AUTH] Intento de login para usuario: {username}");

        // 1. Intentar buscar como Profesor (Legacy)
        var profesor = await _context.Profesores
            .FirstOrDefaultAsync(p => p.IdProfesor.Trim() == username && p.Activo == 1);

        if (profesor != null)
        {
            Console.WriteLine($"[AUTH] Profesor encontrado: {profesor.PrimerNombre} {profesor.PrimerApellido}");
            if (profesor.Clave != null && profesor.Clave.Trim() == password)
            {
                Console.WriteLine("[AUTH] Login exitoso para Profesor");
                return await GetAuthResponseAsync(profesor.IdProfesor, $"{profesor.PrimerNombre} {profesor.PrimerApellido}", "profesor");
            }
            else 
            {
                Console.WriteLine("[AUTH] Error: Contraseña incorrecta para Profesor");
            }
        }
        else 
        {
            Console.WriteLine("[AUTH] Usuario no encontrado en la tabla de profesores");
        }

        // 2. Intentar buscar como Alumno (Legacy)
        var alumno = await _context.Alumnos
            .FirstOrDefaultAsync(a => a.UserAlumno == request.Username);

        if (alumno != null)
        {
             if (alumno.Password == request.Password)
            {
                return await GetAuthResponseAsync(alumno.IdAlumno, $"{alumno.PrimerNombre} {alumno.ApellidoPaterno}", "alumno");
            }
        }

        return null;
    }

    private async Task<AuthResponse> GetAuthResponseAsync(string idReferencia, string nombreCompleto, string tipoUsuario)
    {
        var userRoles = await _context.UserRoles
            .Include(ur => ur.Role)
            .ThenInclude(r => r.Permissions)
            .Where(ur => ur.IdReferencia == idReferencia && ur.TipoReferencia == tipoUsuario && ur.Activo)
            .ToListAsync();

        if (!userRoles.Any() && tipoUsuario == "profesor")
        {
            var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.Nombre == "Docente Investigador");
            if (defaultRole != null)
            {
                var newUserRole = new UserRole
                {
                    IdReferencia = idReferencia,
                    TipoReferencia = "profesor",
                    IdRol = defaultRole.IdRol,
                    Activo = true,
                    FechaAsignacion = DateTime.UtcNow
                };
                _context.UserRoles.Add(newUserRole);
                await _context.SaveChangesAsync();

                userRoles = await _context.UserRoles
                    .Include(ur => ur.Role)
                    .ThenInclude(r => r.Permissions)
                    .Where(ur => ur.IdReferencia == idReferencia && ur.TipoReferencia == tipoUsuario && ur.Activo)
                    .ToListAsync();
            }
        }

        var primaryRole = userRoles.FirstOrDefault()?.Role?.Nombre ?? (tipoUsuario == "alumno" ? "Estudiante" : "Sin Rol");
        
        var permissions = userRoles
            .SelectMany(ur => ur.Role.Permissions)
            .Select(p => p.CodigoName)
            .Distinct()
            .ToList();

        return new AuthResponse
        {
            IdReferencia = idReferencia,
            NombreCompleto = nombreCompleto,
            Role = primaryRole,
            TipoUsuario = tipoUsuario,
            Permissions = permissions
        };
    }

    public string GenerateToken(AuthResponse user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = Encoding.ASCII.GetBytes(jwtSettings["Secret"]!);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.IdReferencia),
            new Claim(ClaimTypes.Name, user.NombreCompleto),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("tipo_usuario", user.TipoUsuario)
        };

        foreach (var permission in user.Permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(double.Parse(jwtSettings["ExpiryInHours"] ?? "12")),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}

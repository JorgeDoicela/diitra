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
    private const string MASTER_ADMIN_ID = "0302144159";

    public AuthService(DiitraContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var username = request.Username.Trim();
        var password = request.Password.Trim();

        // 1. Buscar usuario en DIITRA
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Usuario == username && (u.Activo ?? true));

        if (user != null)
        {
            if (VerifyPassword(user, password))
            {
                return await GetAuthResponseAsync(user);
            }
            return null;
        }

        // 2. JIT Provisioning: Intentar buscar en SIGAFI (Docentes)
        var profesor = await _context.Profesores
            .FirstOrDefaultAsync(p => p.IdProfesor.Trim() == username && (p.Activo == 1 || p.Activo == null));

        if (profesor != null)
        {
            // Validar clave legada de SIGAFI (Asumimos texto plano o BCrypt si ya fue migrada)
            if (profesor.Clave == password || (profesor.Clave != null && BCrypt.Net.BCrypt.Verify(password, profesor.Clave)))
            {
                user = await ProvisionUserAsync(username, $"{profesor.PrimerNombre} {profesor.PrimerApellido}", password, "profesor", username);
                return await GetAuthResponseAsync(user);
            }
        }

        // 3. JIT Provisioning: Intentar buscar en SIGAFI (Alumnos)
        var alumno = await _context.Alumnos
            .FirstOrDefaultAsync(a => a.UserAlumno == username && a.Password == password);

        if (alumno != null)
        {
            user = await ProvisionUserAsync(username, $"{alumno.PrimerNombre} {alumno.ApellidoPaterno}", password, "alumno", alumno.IdAlumno);
            return await GetAuthResponseAsync(user);
        }

        return null;
    }

    private bool VerifyPassword(User user, string password)
    {
        try
        {
            if (BCrypt.Net.BCrypt.Verify(password, user.Contrasenia)) return true;
        }
        catch
        {
            // Fallback para claves en texto plano durante transición
            if (user.Contrasenia == password)
            {
                // Actualizar a Hash automáticamente
                user.Contrasenia = BCrypt.Net.BCrypt.HashPassword(password);
                _context.SaveChanges();
                return true;
            }
        }
        return false;
    }

    private async Task<User> ProvisionUserAsync(string username, string name, string password, string table, string sigafiId)
    {
        var user = new User
        {
            Usuario = username,
            Nombre = name.Trim(),
            Contrasenia = BCrypt.Net.BCrypt.HashPassword(password),
            Activo = true,
            Administrador = (username == MASTER_ADMIN_ID),
            TablaSigafi = table,
            IdSigafi = sigafiId
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Metadata inicial
        _context.InvUsuariosMetadata.Add(new InvUsuarioMetadata
        {
            IdUsuario = user.IdUsuario,
            Uuid = Guid.NewGuid(),
            Version = 1
        });
        await _context.SaveChangesAsync();

        return user;
    }

    private async Task<AuthResponse> GetAuthResponseAsync(User user)
    {
        // 1. Sincronizar Roles por defecto (Mecánica Profesional de Roles Automáticos)
        await SynchronizeUserRolesAsync(user);

        // 2. Cargar Roles y Permisos Modulares
        var userRoles = await _context.UserRoles
            .Include(ur => ur.Role)
                .ThenInclude(r => r.RoleModuleOperations).ThenInclude(rmo => rmo.ModuleOperation).ThenInclude(mo => mo.Module)
            .Include(ur => ur.Role)
                .ThenInclude(r => r.RoleModuleOperations).ThenInclude(rmo => rmo.ModuleOperation).ThenInclude(mo => mo.Operation)
            .Where(ur => ur.IdUsuario == user.IdUsuario && (ur.EsActivo ?? true))
            .ToListAsync();

        var permissions = userRoles
            .SelectMany(ur => ur.Role.RoleModuleOperations)
            .Where(rmo => (rmo.EsActivo ?? true) && rmo.ModuleOperation != null && (rmo.ModuleOperation.EsActivo ?? true))
            .Select(rmo => $"{rmo.ModuleOperation.Module.Nombre}:{rmo.ModuleOperation.Operation.NombreOperacion}".ToUpper())
            .Distinct()
            .ToList();

        var metadata = await _context.InvUsuariosMetadata.FirstOrDefaultAsync(m => m.IdUsuario == user.IdUsuario);
        if (metadata != null)
        {
            metadata.FechaUltimoAcceso = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        var response = new AuthResponse
        {
            IdReferencia = user.Usuario.Trim(),
            IdUsuario = user.IdUsuario,
            UserUuid = metadata?.Uuid.ToString() ?? "",
            Usuario = user.Usuario,
            NombreCompleto = user.Nombre,
            Role = userRoles.FirstOrDefault()?.Role?.Nombre ?? "Usuario",
            Roles = userRoles.Select(ur => ur.Role.Nombre).ToList(),
            RoleCodes = userRoles.Select(ur => ur.Role.CodigoRol).ToList(),
            TipoUsuario = user.TablaSigafi,
            Permissions = permissions,
            Administrador = (user.Usuario == MASTER_ADMIN_ID) || (user.Administrador ?? false)
        };

        response.Token = GenerateToken(response);
        return response;
    }

    private async Task SynchronizeUserRolesAsync(User user)
    {
        var currentRoles = await _context.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ur.IdUsuario == user.IdUsuario && (ur.EsActivo ?? true))
            .ToListAsync();

        string? requiredRoleCode = null;

        // Reglas de negocio para roles automáticos
        if (user.Usuario == MASTER_ADMIN_ID) requiredRoleCode = "ADMIN_SIST";
        else if (user.TablaSigafi == "profesor") requiredRoleCode = "DOCENTE_IN";
        else if (user.TablaSigafi == "alumno") requiredRoleCode = "ESTUDIANTE";

        if (requiredRoleCode != null && !currentRoles.Any(r => r.Role.CodigoRol == requiredRoleCode))
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == requiredRoleCode);
            if (role != null)
            {
                _context.UserRoles.Add(new UserRole
                {
                    IdUsuario = user.IdUsuario,
                    IdRol = role.IdRol,
                    EsActivo = true,
                    FechaCreacion = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }
        }
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
            new Claim("user_uuid", user.UserUuid),
            new Claim("tipo_usuario", user.TipoUsuario),
            new Claim("es_admin", user.Administrador.ToString().ToLower())
        };

        foreach (var roleCode in user.RoleCodes) claims.Add(new Claim(ClaimTypes.Role, roleCode));
        foreach (var permission in user.Permissions) claims.Add(new Claim("permission", permission));

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

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

        // 1. Intentar buscar en la tabla centralizada (Usuarios)
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Usuario.Trim() == username && u.Activo);

        if (user != null)
        {
            // Validamos contra la clave centralizada (o legacy si se sincronizó)
            if (user.Clave == password)
            {
                return await GetAuthResponseAsync(user.Usuario, user.Nombre, user.TipoUsuario);
            }
        }

        // 2. PROVISIÓN BAJO DEMANDA: Buscar como Profesor (Legacy) si no está centralizado o falló la clave central
        var profesor = await _context.Profesores
            .FirstOrDefaultAsync(p => p.IdProfesor.Trim() == username && p.Activo == 1);

        if (profesor != null && profesor.Clave?.Trim() == password)
        {
            // SI EXISTE EN LEGACY: Asegurar que esté en la tabla centralizada
            if (user == null)
            {
                user = new User
                {
                    Usuario = username,
                    Nombre = $"{profesor.PrimerNombre} {profesor.PrimerApellido}",
                    Clave = password, // Sincronizamos la clave inicial
                    Activo = true,
                    TipoUsuario = "profesor",
                    IdSigafi = profesor.IdProfesor
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }
            return await GetAuthResponseAsync(profesor.IdProfesor, user.Nombre, "profesor");
        }

        // 3. PROVISIÓN BAJO DEMANDA: Buscar como Alumno (Legacy)
        var alumno = await _context.Alumnos
            .FirstOrDefaultAsync(a => a.UserAlumno == username && a.Password == password);

        if (alumno != null)
        {
            if (user == null)
            {
                user = new User
                {
                    Usuario = username,
                    Nombre = $"{alumno.PrimerNombre} {alumno.ApellidoPaterno}",
                    Clave = password,
                    Activo = true,
                    TipoUsuario = "alumno",
                    IdSigafi = alumno.IdAlumno
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }
            return await GetAuthResponseAsync(alumno.IdAlumno, user.Nombre, "alumno");
        }

        return null;
    }

    private async Task<AuthResponse> GetAuthResponseAsync(string username, string nombreCompleto, string tipoUsuario)
    {
        var cleanId = username.Trim();
        var masterAdminId = _configuration["Security:MasterAdminId"] ?? string.Empty;

        // Cargar Roles y sus configuraciones modulares
        var userRoles = await _context.UserRoles
            .Include(ur => ur.Role)
                .ThenInclude(r => r.RoleModuleOperations)
                    .ThenInclude(rmo => rmo.ModuleOperation)
                        .ThenInclude(mo => mo.Module)
            .Include(ur => ur.Role)
                .ThenInclude(r => r.RoleModuleOperations)
                    .ThenInclude(rmo => rmo.ModuleOperation)
                        .ThenInclude(mo => mo.Operation)
            .Where(ur => ur.Usuario.Trim() == cleanId && ur.EsActivo)
            .ToListAsync();

        // LOGICA DE BOOTSTRAP: Asignar rol inicial si es nuevo en DIITRA
        if (!userRoles.Any() && tipoUsuario == "profesor")
        {
            var defaultRoleCodigo = cleanId == masterAdminId ? "ADMIN_SISTEMA" : "DOCENTE_INV";
            var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == defaultRoleCodigo);
            
            if (defaultRole != null)
            {
                var newUserRole = new UserRole
                {
                    Usuario = cleanId,
                    IdRol = defaultRole.IdRol,
                    EsActivo = true,
                    FechaCreacion = DateTime.UtcNow
                };
                _context.UserRoles.Add(newUserRole);
                await _context.SaveChangesAsync();

                // Recargar
                userRoles = await _context.UserRoles
                    .Include(ur => ur.Role)
                        .ThenInclude(r => r.RoleModuleOperations)
                            .ThenInclude(rmo => rmo.ModuleOperation)
                                .ThenInclude(mo => mo.Module)
                    .Include(ur => ur.Role)
                        .ThenInclude(r => r.RoleModuleOperations)
                            .ThenInclude(rmo => rmo.ModuleOperation)
                                .ThenInclude(mo => mo.Operation)
                    .Where(ur => ur.Usuario.Trim() == cleanId && ur.EsActivo)
                    .ToListAsync();
            }
        }

        // Determinar Rol Primario para el JWT legado
        var primaryRole = userRoles
            .OrderByDescending(ur => ur.Role.CodigoRol == "ADMIN_SISTEMA")
            .ThenBy(ur => ur.IdRol)
            .FirstOrDefault()?.Role?.Nombre 
            ?? (tipoUsuario == "alumno" ? "Estudiante" : "Sin Rol");
        
        // Carga de Permisos Modulares (Formato MODULE:OPERATION)
        var permissions = userRoles
            .SelectMany(ur => ur.Role.RoleModuleOperations)
            .Where(rmo => rmo.EsActivo && rmo.ModuleOperation != null && rmo.ModuleOperation.EsActivo)
            .Select(rmo => $"{rmo.ModuleOperation.Module.Nombre}:{rmo.ModuleOperation.Operation.NombreOperacion}".ToUpper())
            .Distinct()
            .ToList();

        return new AuthResponse
        {
            IdReferencia = cleanId,
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

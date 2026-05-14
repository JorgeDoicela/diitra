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
    private readonly IAuditService _auditService;
    private const string MASTER_ADMIN_ID = "0302144159";

    public AuthService(DiitraContext context, IConfiguration configuration, IAuditService auditService)
    {
        _context = context;
        _configuration = configuration;
        _auditService = auditService;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var username = request.Username.Trim();
        var password = request.Password.Trim();

        // 1. Buscar usuario en DIITRA
        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == username && u.Activo);

        if (user != null)
        {
            if (VerifyPassword(user, password))
            {
                var response = await GetAuthResponseAsync(user);
                await _auditService.LogActionAsync(user.IdUsuario, "LOGIN", "Inicio de sesión exitoso (Usuario DIITRA)", "SEGURIDAD");
                return response;
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
                string fullNombre = $"{profesor.PrimerNombre} {profesor.SegundoNombre} {profesor.PrimerApellido} {profesor.SegundoApellido}".Replace("  ", " ").Trim();
                user = await ProvisionUserAsync(username, fullNombre, password, "profesor", username);
                var response = await GetAuthResponseAsync(user);
                await _auditService.LogActionAsync(user.IdUsuario, "LOGIN", "Inicio de sesión exitoso (JIT Profesor)", "SEGURIDAD");
                return response;
            }
        }

        // 3. JIT Provisioning: Intentar buscar en SIGAFI (Alumnos)
        var alumno = await _context.Alumnos
            .FirstOrDefaultAsync(a => a.UserAlumno == username && a.Password == password);

        if (alumno != null)
        {
            string fullNombre = $"{alumno.PrimerNombre} {alumno.SegundoNombre} {alumno.ApellidoPaterno} {alumno.ApellidoMaterno}".Replace("  ", " ").Trim();
            user = await ProvisionUserAsync(username, fullNombre, password, "alumno", alumno.IdAlumno);
            var response = await GetAuthResponseAsync(user);
            await _auditService.LogActionAsync(user.IdUsuario, "LOGIN", "Inicio de sesión exitoso (JIT Alumno)", "SEGURIDAD");
            return response;
        }

        return null;
    }

    public async Task<User?> GetOrProvisionUserByCedulaAsync(string cedula)
    {
        // 1. Buscar en DIITRA
        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == cedula);
        if (user != null) return user;

        // 2. Buscar en Profesores
        var p = await _context.Profesores.FirstOrDefaultAsync(prof => prof.IdProfesor == cedula);
        if (p != null)
        {
            string fullNombre = $"{p.PrimerNombre} {p.SegundoNombre} {p.PrimerApellido} {p.SegundoApellido}".Replace("  ", " ").Trim();
            return await ProvisionUserAsync(cedula, fullNombre, "cambiame", "profesor", cedula);
        }

        // 3. Buscar en Alumnos
        var a = await _context.Alumnos.FirstOrDefaultAsync(alum => alum.IdAlumno == cedula);
        if (a != null)
        {
            string fullNombre = $"{a.PrimerNombre} {a.SegundoNombre} {a.ApellidoPaterno} {a.ApellidoMaterno}".Replace("  ", " ").Trim();
            return await ProvisionUserAsync(cedula, fullNombre, "cambiame", "alumno", cedula);
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
                user.Contrasenia = BCrypt.Net.BCrypt.HashPassword(password, 11);
                _context.SaveChanges();
                return true;
            }
        }
        return false;
    }

    public async Task<User> ProvisionUserAsync(string username, string name, string password, string table, string sigafiId)
    {
        var user = new User
        {
            IdSigafi = sigafiId,
            Nombre = name.Trim(),
            Contrasenia = BCrypt.Net.BCrypt.HashPassword(password, 11),
            Activo = true,
            Administrador = (username == MASTER_ADMIN_ID),
            TablaSigafi = table
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
        // 0. Asegurar Estructura RBAC (Sistemas, Módulos, Operaciones)
        await SeedRbacStructureAsync();

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
            IdReferencia = user.IdSigafi.Trim(),
            IdUsuario = user.IdUsuario,
            UserUuid = metadata?.Uuid.ToString() ?? "",
            Usuario = user.IdSigafi,
            NombreCompleto = user.Nombre ?? "",
            Role = userRoles.FirstOrDefault()?.Role?.Nombre ?? "Usuario",
            Roles = userRoles.Select(ur => ur.Role.Nombre).ToList(),
            RoleCodes = userRoles.Select(ur => ur.Role.CodigoRol).ToList(),
            TipoUsuario = user.TablaSigafi,
            Permissions = permissions,
            Administrador = (user.IdSigafi == MASTER_ADMIN_ID) || user.Administrador
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
        if (user.IdSigafi == MASTER_ADMIN_ID) requiredRoleCode = "DIITRA_ADMIN";
        else if (user.TablaSigafi == "profesor") requiredRoleCode = "DIITRA_DOCENTE";
        else if (user.TablaSigafi == "alumno") requiredRoleCode = "DIITRA_ESTUDIANTE";
        else if (user.TablaSigafi == "otros") requiredRoleCode = "DIITRA_REVISOR_EXTERNO";

        if (requiredRoleCode != null && !currentRoles.Any(r => r.Role.CodigoRol == requiredRoleCode))
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.CodigoRol == requiredRoleCode);
            
            // Si el ROL no existe en la base de datos (tabla rbac_rol), lo CREAMOS automáticamente
            if (role == null)
            {
                role = new Role
                {
                    CodigoRol = requiredRoleCode,
                    Nombre = requiredRoleCode == "DIITRA_ADMIN" ? "Administrador DIITRA" :
                             requiredRoleCode == "DIITRA_DOCENTE" ? "Docente Investigador DIITRA" :
                             requiredRoleCode == "DIITRA_ESTUDIANTE" ? "Estudiante DIITRA" : 
                             requiredRoleCode == "DIITRA_REVISOR_EXTERNO" ? "Revisor Externo DIITRA" : requiredRoleCode,
                    EsActivo = true
                };
                _context.Roles.Add(role);
                await _context.SaveChangesAsync();
                
                // Asignar permisos por defecto al nuevo rol (AISLAMIENTO DE SISTEMA)
                await AssignDefaultPermissionsToRoleAsync(role);
            }

            // Ahora que el rol existe, lo asignamos al usuario
            _context.UserRoles.Add(new UserRole
            {
                IdUsuario = user.IdUsuario,
                IdRol = role.IdRol,
                EsActivo = true,
                FechaCreacion = DateOnly.FromDateTime(DateTime.UtcNow)
            });
            await _context.SaveChangesAsync();
        }
    }

    public string GenerateToken(AuthResponse user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = Encoding.UTF8.GetBytes(jwtSettings["Secret"]!);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.IdReferencia),
            new Claim("id_usuario", user.IdUsuario.ToString()),
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

    private async Task SeedRbacStructureAsync()
    {
        // 1. Asegurar Sistema
        var system = await _context.Systems.FirstOrDefaultAsync(s => s.Codigo == "DIITRA");
        if (system == null)
        {
            system = new SystemEntity { Codigo = "DIITRA", Detalle = "Sistema de Gestión de Investigación e Innovación" };
            _context.Systems.Add(system);
            await _context.SaveChangesAsync();
        }

        // 2. Extraer todos los Módulos y Operaciones definidos en el Enum de Permisos
        var permissions = typeof(diitra_domain.Identity.Enums.Permissions)
            .GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.FlattenHierarchy)
            .Where(f => f.IsLiteral && !f.IsInitOnly)
            .Select(f => f.GetValue(null)?.ToString() ?? "")
            .Where(p => p.Contains(":"))
            .Select(p => {
                var parts = p.Split(':');
                return new { Modulo = parts[0], Operacion = parts[1] };
            })
            .Distinct()
            .ToList();

        foreach (var p in permissions)
        {
            // Asegurar Módulo
            var module = await _context.Modules.FirstOrDefaultAsync(m => m.Nombre == p.Modulo && m.IdSistema == system.IdSistema);
            if (module == null)
            {
                module = new IdentityModule { Nombre = p.Modulo, IdSistema = system.IdSistema, EsActivo = true };
                _context.Modules.Add(module);
                await _context.SaveChangesAsync();
            }

            // Asegurar Operación
            var operation = await _context.Operations.FirstOrDefaultAsync(o => o.NombreOperacion == p.Operacion);
            if (operation == null)
            {
                operation = new IdentityOperation { NombreOperacion = p.Operacion };
                _context.Operations.Add(operation);
                await _context.SaveChangesAsync();
            }

            // Asegurar Relación Módulo-Operación
            var exists = await _context.ModuleOperations.AnyAsync(mo => mo.IdModulos == module.IdModulos && mo.IdOperaciones == operation.IdOperaciones);
            if (!exists)
            {
                _context.ModuleOperations.Add(new ModuleOperation 
                { 
                    IdModulos = module.IdModulos, 
                    IdOperaciones = operation.IdOperaciones, 
                    EsActivo = true,
                    FechaCreacion = DateOnly.FromDateTime(DateTime.UtcNow)
                });
                await _context.SaveChangesAsync();
            }
        }
    }

    private async Task AssignDefaultPermissionsToRoleAsync(Role role)
    {
        // Obtener el IdSistema de DIITRA primero (no se puede usar await dentro de Where lambda)
        var diitraSistemaId = await _context.Systems
            .Where(s => s.Codigo == "DIITRA")
            .Select(s => s.IdSistema)
            .FirstOrDefaultAsync();

        // Obtener todas las operaciones de DIITRA
        var diitraOps = await _context.ModuleOperations
            .Include(mo => mo.Module)
            .Include(mo => mo.Operation)
            .Where(mo => mo.Module.IdSistema == diitraSistemaId)
            .ToListAsync();

        foreach (var op in diitraOps)
        {
            bool shouldAssign = false;
            var perm = $"{op.Module.Nombre}:{op.Operation.NombreOperacion}".ToUpper();

            if (role.CodigoRol == "DIITRA_ADMIN") shouldAssign = true; // Admin tiene TODO de DIITRA
            else if (role.CodigoRol == "DIITRA_DOCENTE")
            {
                // Docentes: Gestión de proyectos y bitácora, pero no administración de sistema
                if (perm.StartsWith("PROYECTOS") || perm.StartsWith("BITACORA") || perm.StartsWith("SOLICITUDES")) shouldAssign = true;
                if (perm == "CONFIGURACION:VER") shouldAssign = true;
            }
            else if (role.CodigoRol == "DIITRA_ESTUDIANTE")
            {
                // Estudiantes: Solo ver y postular
                if (perm == "PROYECTOS:VER" || perm == "PROYECTOS:POSTULAR") shouldAssign = true;
            }
            else if (role.CodigoRol == "DIITRA_REVISOR_EXTERNO")
            {
                // Revisores Externos: Solo ver proyectos asignados y realizar revisiones
                if (perm == "PROYECTOS:VER" || perm.StartsWith("REVISIONES")) shouldAssign = true;
            }

            if (shouldAssign)
            {
                _context.RoleModuleOperations.Add(new RoleModuleOperation
                {
                    IdRol = role.IdRol,
                    IdModulosOperaciones = op.IdModulosOperaciones,
                    EsActivo = true,
                    FechaAsignacion = DateOnly.FromDateTime(DateTime.UtcNow),
                    UsuarioAsigno = "SISTEMA_DIITRA_JIT"
                });
            }
        }
        await _context.SaveChangesAsync();
    }
}

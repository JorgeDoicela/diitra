using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
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
    private readonly diitra_application.Common.Notifications.INotificationService _notificationService;
    private readonly string _masterAdminId;
    private static bool _rbacSeeded = false;
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (int Attempts, DateTime LockedUntil)> _ipLockouts = new();

    public AuthService(DiitraContext context, IConfiguration configuration, IAuditService auditService, diitra_application.Common.Notifications.INotificationService notificationService)
    {
        _context = context;
        _configuration = configuration;
        _auditService = auditService;
        _notificationService = notificationService;
        _masterAdminId = configuration["Security:MasterAdminId"] ?? "0302144159";
    }

    public async Task<(AuthResponse? Auth, LoginBlockedResponse? Blocked)> LoginAsync(LoginRequest request)
    {
        var username = request.Username.Trim();
        var password = request.Password.Trim();

        // ── 1. Buscar usuario en DIITRA (por cédula/IdSigafi o por Email) ─────────
        var user = await _context.Users.FirstOrDefaultAsync(u => (u.IdSigafi == username || u.EmailInstitucional == username) && u.Activo);

        if (user != null)
        {
            // ── Verificar bloqueo activo ─────────────────────────────────────────
            if (user.BloqueadoHasta.HasValue && user.BloqueadoHasta.Value > DateTime.Now)
            {
                var remaining = (int)(user.BloqueadoHasta.Value - DateTime.Now).TotalSeconds;
                return (null, new LoginBlockedResponse
                {
                    Message = $"Cuenta bloqueada temporalmente por exceso de intentos fallidos. Intenta de nuevo en {remaining} segundos.",
                    BloqueadoHasta = user.BloqueadoHasta.Value,
                    SegundosRestantes = remaining
                });
            }

            if (VerifyPassword(user, password))
            {
                // ── Éxito: resetear contadores ───────────────────────────────────
                user.IntentosFallidos = 0;
                user.BloqueadoHasta = null;
                await _context.SaveChangesAsync();

                var response = await GetAuthResponseAsync(user);
                await _auditService.LogActionAsync(user.IdUsuario, "LOGIN", "Inicio de sesión exitoso (Usuario DIITRA)", "SEGURIDAD");
                return (response, null);
            }

            // ── Fallo: incrementar intentos y calcular bloqueo progresivo ────────
            user.IntentosFallidos++;
            user.BloqueadoHasta = user.IntentosFallidos switch
            {
                >= 12 => DateTime.Now.AddMinutes(60),
                >= 9  => DateTime.Now.AddMinutes(30),
                >= 6  => DateTime.Now.AddMinutes(15),
                >= 3  => DateTime.Now.AddMinutes(5),
                _     => null  // < 3 intentos: aún no se bloquea
            };
            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync(user.IdUsuario, "LOGIN_FAILED",
                $"Intento fallido #{user.IntentosFallidos}{(user.BloqueadoHasta.HasValue ? $" — cuenta bloqueada hasta {user.BloqueadoHasta:u}" : "")}", "SEGURIDAD");

            // Si acaba de superar un umbral, devolver bloqueo
            if (user.BloqueadoHasta.HasValue)
            {
                var remaining = (int)(user.BloqueadoHasta.Value - DateTime.Now).TotalSeconds;
                return (null, new LoginBlockedResponse
                {
                    Message = $"Demasiados intentos fallidos. Cuenta bloqueada por {GetLockoutMinutes(user.IntentosFallidos)} minutos.",
                    BloqueadoHasta = user.BloqueadoHasta.Value,
                    SegundosRestantes = remaining
                });
            }

            // Intentos 1 y 2: credenciales incorrectas sin bloqueo
            return (null, null);
        }

        // ── 2. JIT Provisioning: Docentes (por cédula/IdProfesor o por Email) ────
        var profesor = await _context.Profesores
            .FirstOrDefaultAsync(p => (p.IdProfesor.Trim() == username || p.EmailInstitucional == username || p.Email == username) && (p.Activo == 1 || p.Activo == null));

        if (profesor != null)
        {
            if (profesor.Clave == password || (profesor.Clave != null && BCrypt.Net.BCrypt.Verify(password, profesor.Clave)))
            {
                string fullNombre = $"{profesor.PrimerNombre} {profesor.SegundoNombre} {profesor.PrimerApellido} {profesor.SegundoApellido}".Replace("  ", " ").Trim();
                user = await ProvisionUserAsync(profesor.IdProfesor, fullNombre, password, "profesor", profesor.IdProfesor);
                var response = await GetAuthResponseAsync(user);
                await _auditService.LogActionAsync(user.IdUsuario, "LOGIN", "Inicio de sesión exitoso (JIT Profesor)", "SEGURIDAD");
                return (response, null);
            }
        }

        // ── 3. JIT Provisioning: Alumnos (por UserAlumno o por Email) ───────────
        var alumno = await _context.Alumnos
            .FirstOrDefaultAsync(a => (a.UserAlumno == username || a.EmailInstitucional == username || a.Email == username) && a.Password == password);

        if (alumno != null)
        {
            string fullNombre = $"{alumno.PrimerNombre} {alumno.SegundoNombre} {alumno.ApellidoPaterno} {alumno.ApellidoMaterno}".Replace("  ", " ").Trim();
            user = await ProvisionUserAsync(alumno.IdAlumno, fullNombre, password, "alumno", alumno.IdAlumno);
            var response = await GetAuthResponseAsync(user);
            await _auditService.LogActionAsync(user.IdUsuario, "LOGIN", "Inicio de sesión exitoso (JIT Alumno)", "SEGURIDAD");
            return (response, null);
        }

        return (null, null);
    }

    private static int GetLockoutMinutes(int intentos) => intentos switch
    {
        >= 12 => 60,
        >= 9  => 30,
        >= 6  => 15,
        _     => 5
    };

    private static int GetIpLockoutMinutes(int attempts) => attempts switch
    {
        >= 12 => 60,
        >= 9  => 30,
        >= 6  => 15,
        _     => 5
    };

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
            string pwd = !string.IsNullOrEmpty(p.Clave) ? p.Clave : "cambiame";
            return await ProvisionUserAsync(cedula, fullNombre, pwd, "profesor", cedula);
        }

        // 3. Buscar en Alumnos
        var a = await _context.Alumnos.FirstOrDefaultAsync(alum => alum.IdAlumno == cedula);
        if (a != null)
        {
            string fullNombre = $"{a.PrimerNombre} {a.SegundoNombre} {a.ApellidoPaterno} {a.ApellidoMaterno}".Replace("  ", " ").Trim();
            string pwd = !string.IsNullOrEmpty(a.Password) ? a.Password : "cambiame";
            return await ProvisionUserAsync(cedula, fullNombre, pwd, "alumno", cedula);
        }

        return null;
    }

    private bool IsBCryptHash(string password)
    {
        if (string.IsNullOrEmpty(password)) return false;
        return password.Length == 60 && (password.StartsWith("$2a$") || password.StartsWith("$2b$") || password.StartsWith("$2y$"));
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
        string contraseniaHash = IsBCryptHash(password) ? password : BCrypt.Net.BCrypt.HashPassword(password, 11);
        string? email = null;
        if (table == "profesor")
        {
            var p = await _context.Profesores.FirstOrDefaultAsync(prof => prof.IdProfesor == sigafiId);
            if (p != null) email = p.EmailInstitucional ?? p.Email;
        }
        else if (table == "alumno")
        {
            var a = await _context.Alumnos.FirstOrDefaultAsync(al => al.IdAlumno == sigafiId);
            if (a != null) email = a.EmailInstitucional ?? a.Email;
        }

        var user = new User
        {
            IdSigafi = sigafiId,
            Nombre = name.Trim(),
            Contrasenia = contraseniaHash,
            Activo = true,
            Administrador = (username == _masterAdminId),
            TablaSigafi = table,
            EmailInstitucional = email
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
            .AsSplitQuery()
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
            metadata.FechaUltimoAcceso = DateTime.Now;
            await _context.SaveChangesAsync();
        }

        var roleCodes = userRoles.Select(ur => ur.Role.CodigoRol).ToList();
        var sistemas = await _context.RoleModuleOperations
            .AsNoTracking()
            .Include(rmo => rmo.Role)
            .Include(rmo => rmo.ModuleOperation)
                .ThenInclude(mo => mo.Module)
                    .ThenInclude(m => m.Sistema)
            .Where(rmo => rmo.EsActivo == true
                       && roleCodes.Contains(rmo.Role.CodigoRol)
                       && rmo.ModuleOperation.Module.Sistema != null)
            .Select(rmo => rmo.ModuleOperation.Module.Sistema.Codigo)
            .Distinct()
            .ToListAsync();

        var systemsClaim = string.Join(",", sistemas);

        var hasAcceptedLopdp = await _context.InvLopdpConsentimientos
            .AnyAsync(c => c.IdUsuario == user.IdUsuario && c.VersionPolitica == "LOPDP_GENERAL" && c.Estado == "Otorgado");

        var response = new AuthResponse
        {
            IdReferencia = user.IdSigafi.Trim(),
            IdUsuario = user.IdUsuario,
            UserUuid = metadata?.Uuid.ToString() ?? "",
            Usuario = user.IdSigafi,
            NombreCompleto = user.Nombre ?? "",
            Role = userRoles.FirstOrDefault()?.Role?.Nombre ?? "Usuario",
            Roles = userRoles.Select(ur => ur.Role.Nombre).ToList(),
            RoleCodes = roleCodes,
            TipoUsuario = user.TablaSigafi,
            Permissions = permissions,
            Administrador = (user.IdSigafi == _masterAdminId) || user.Administrador,
            Email = user.EmailInstitucional ?? "",
            Sistemas = systemsClaim,
            AceptoLopdp = hasAcceptedLopdp
        };

        response.Token = GenerateToken(response);
        response.RefreshToken = GenerateRefreshToken(response.IdReferencia);
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
        if (user.IdSigafi == _masterAdminId) requiredRoleCode = "DIITRA_ADMIN";
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
                FechaCreacion = DateOnly.FromDateTime(DateTime.Now)
            });
            await _context.SaveChangesAsync();
        }
    }

    public string GenerateToken(AuthResponse user)
    {
        var jwtSettings = _configuration.GetSection("JWTSettings");
        var secret = jwtSettings["Secret"] ?? "ISTPET_Sistemas_Seguridad_ClaveCompartidaSecretSymmetricKey2026!";
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
        var secret = jwtSettings["Secret"] ?? "ISTPET_Sistemas_Seguridad_ClaveCompartidaSecretSymmetricKey2026!";
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

    private async Task SeedRbacStructureAsync()
    {
        if (_rbacSeeded) return;

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

        if (!permissions.Any())
        {
            _rbacSeeded = true;
            return;
        }

        // 3. Traer todos los módulos, operaciones y relaciones de DIITRA a memoria en una sola tanda
        var existingModules = await _context.Modules
            .Where(m => m.IdSistema == system.IdSistema)
            .ToDictionaryAsync(m => m.Nombre, m => m);

        var existingOperations = await _context.Operations
            .ToDictionaryAsync(o => o.NombreOperacion, o => o);

        var existingRelations = await _context.ModuleOperations
            .Where(mo => mo.Module.IdSistema == system.IdSistema)
            .Select(mo => new { mo.IdModulos, mo.IdOperaciones })
            .ToListAsync();

        var relationSet = new HashSet<(int, int)>(
            existingRelations.Select(r => (r.IdModulos, r.IdOperaciones))
        );

        bool changesMade = false;

        foreach (var p in permissions)
        {
            // Asegurar Módulo en memoria / DB
            if (!existingModules.TryGetValue(p.Modulo, out var module))
            {
                module = new IdentityModule { Nombre = p.Modulo, IdSistema = system.IdSistema, EsActivo = true };
                _context.Modules.Add(module);
                changesMade = true;
                // Guardamos cambios temporalmente para obtener el ID generado por la base de datos
                await _context.SaveChangesAsync();
                existingModules[p.Modulo] = module;
            }

            // Asegurar Operación en memoria / DB
            if (!existingOperations.TryGetValue(p.Operacion, out var operation))
            {
                operation = new IdentityOperation { NombreOperacion = p.Operacion };
                _context.Operations.Add(operation);
                changesMade = true;
                await _context.SaveChangesAsync();
                existingOperations[p.Operacion] = operation;
            }

            // Asegurar Relación Módulo-Operación
            var relKey = (module.IdModulos, operation.IdOperaciones);
            if (!relationSet.Contains(relKey))
            {
                _context.ModuleOperations.Add(new ModuleOperation
                {
                    IdModulos = module.IdModulos,
                    IdOperaciones = operation.IdOperaciones,
                    EsActivo = true,
                    FechaCreacion = DateOnly.FromDateTime(DateTime.Now)
                });
                changesMade = true;
                relationSet.Add(relKey);
            }
        }

        if (changesMade)
        {
            await _context.SaveChangesAsync();
        }

        _rbacSeeded = true;
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
                    FechaAsignacion = DateOnly.FromDateTime(DateTime.Now),
                    UsuarioAsigno = "SISTEMA_DIITRA_JIT"
                });
            }
        }
        await _context.SaveChangesAsync();
    }

    public async Task<AuthResponse?> RefreshAuthResponseAsync(string username)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == username && u.Activo);
        if (user == null) return null;
        return await GetAuthResponseAsync(user);
    }

    public async Task<AuthResponse?> GetAuthResponseForUserByIdAsync(int idUsuario)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario && u.Activo);
        if (user == null) return null;
        return await GetAuthResponseAsync(user);
    }

    public async Task<MagicLoginResponseDto?> ValidateAndConsumeMagicLinkAsync(string tokenHash, string? ipAddress, string? userAgent)
    {
        // El magic link es MULTI-USO hasta FechaExpiracion (fecha límite del arbitraje).
        // No se marca como "utilizado" en cada acceso — solo puede ser invalidado
        // administrativamente (Utilizado = true) o cuando vence la fecha del arbitraje.
        // Esto permite al revisor volver al enlace del correo en cualquier momento durante el período.
        var magicLink = await _context.Set<InvMagicLink>()
            .FirstOrDefaultAsync(l => l.TokenHash == tokenHash && !l.Utilizado && l.FechaExpiracion > DateTime.Now);

        if (magicLink == null) return null;

        // Auditoría del último acceso (sin marcar como utilizado definitivamente)
        magicLink.FechaUtilizado = DateTime.Now;
        magicLink.IpUtilizacion = ipAddress;
        magicLink.UserAgent = userAgent;

        // Generar un PIN nuevo en cada uso — de 5 caracteres
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I para evitar confusiones
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        var bytes = new byte[5];
        rng.GetBytes(bytes);
        var pin = new string(bytes.Select(b => chars[b % chars.Length]).ToArray());
        magicLink.CodigoPinHandoff = pin;
        magicLink.FechaExpiracionPin = DateTime.Now.AddMinutes(30);

        await _context.SaveChangesAsync();

        var authResponse = await GetAuthResponseForUserByIdAsync(magicLink.IdUsuario);
        if (authResponse == null) return null;

        return new MagicLoginResponseDto
        {
            Auth = authResponse,
            Pin = pin
        };
    }

    public async Task<AuthResponse?> ValidateAndConsumeHandoffPinAsync(string pin, string? ipAddress)
    {
        // ── 1. Verificar bloqueo por IP ──────────────────────────────────────────
        if (!string.IsNullOrEmpty(ipAddress))
        {
            if (_ipLockouts.TryGetValue(ipAddress, out var lockout))
            {
                if (lockout.LockedUntil > DateTime.Now)
                {
                    var secondsLeft = (int)(lockout.LockedUntil - DateTime.Now).TotalSeconds;
                    throw new IpLockoutException($"Demasiados intentos fallidos. Esta dirección IP está bloqueada por {GetIpLockoutMinutes(lockout.Attempts)} minutos.", secondsLeft);
                }
            }
        }

        var magicLink = await _context.Set<InvMagicLink>()
            .FirstOrDefaultAsync(l => l.CodigoPinHandoff == pin && l.FechaExpiracionPin > DateTime.Now);

        if (magicLink == null)
        {
            // Incrementar contador de fallos por IP
            if (!string.IsNullOrEmpty(ipAddress))
            {
                _ipLockouts.AddOrUpdate(ipAddress,
                    (Attempts: 1, LockedUntil: DateTime.MinValue),
                    (key, old) =>
                    {
                        var newAttempts = old.Attempts + 1;
                        DateTime lockedUntil = DateTime.MinValue;
                        if (newAttempts >= 3)
                        {
                            int minutes = GetIpLockoutMinutes(newAttempts);
                            lockedUntil = DateTime.Now.AddMinutes(minutes);
                        }
                        return (newAttempts, lockedUntil);
                    });

                if (_ipLockouts.TryGetValue(ipAddress, out var updatedLockout) && updatedLockout.LockedUntil > DateTime.Now)
                {
                    var secondsLeft = (int)(updatedLockout.LockedUntil - DateTime.Now).TotalSeconds;
                    throw new IpLockoutException($"Demasiados intentos fallidos de PIN. Esta dirección IP ha sido bloqueada por {GetIpLockoutMinutes(updatedLockout.Attempts)} minutos.", secondsLeft);
                }
            }
            return null;
        }

        // ── 2. Limpiar bloqueo e intentos en caso de éxito ─────────────────────────
        if (!string.IsNullOrEmpty(ipAddress))
        {
            _ipLockouts.TryRemove(ipAddress, out _);
        }

        // Clear pin to make it one-time use
        magicLink.CodigoPinHandoff = null;
        magicLink.FechaExpiracionPin = null;

        // Audit/log IP
        magicLink.IpUtilizacion = ipAddress;

        await _context.SaveChangesAsync();

        return await GetAuthResponseForUserByIdAsync(magicLink.IdUsuario);
    }

    public async Task<string> CreateMagicLinkAsync(int idUsuario, DateTime expirationDate)
    {
        // Generar token aleatorio criptográficamente seguro
        var tokenBytes = new byte[32];
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(tokenBytes);
        }
        var plainToken = Convert.ToHexString(tokenBytes);

        // Calcular Hash SHA-256
        var tokenHashBytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(plainToken));
        var tokenHash = Convert.ToHexString(tokenHashBytes);

        // Guardar en inv_magic_links
        var magicLink = new InvMagicLink
        {
            IdUsuario = idUsuario,
            TokenHash = tokenHash,
            FechaCreacion = DateTime.Now,
            FechaExpiracion = expirationDate,
            Utilizado = false
        };

        _context.Set<InvMagicLink>().Add(magicLink);
        await _context.SaveChangesAsync();

        return plainToken;
    }

    public async Task<bool> ResendMagicLinkAsync(string email)
    {
        email = email.Trim().ToLower();

        // 1. Buscar alguna revisión/arbitraje pendiente activa cuyo revisor coincida con el email.
        // Se permite incluso si la fecha límite ya pasó, de modo que el revisor pueda
        // ingresar a completar evaluaciones retrasadas.
        var pendingReview = await _context.Set<InvRevisionesPares>()
            .Include(r => r.Revisor)
            .Include(r => r.Proyecto)
            .Where(r => r.Estado == "Pendiente" &&
                        r.Revisor != null &&
                        r.Revisor.Activo &&
                        ((r.Revisor.EmailInstitucional != null && r.Revisor.EmailInstitucional.ToLower() == email) ||
                         (r.Revisor.IdSigafi != null && r.Revisor.IdSigafi.ToLower() == email)))
            .OrderByDescending(r => r.FechaLimite)
            .FirstOrDefaultAsync();

        if (pendingReview == null) return false;

        // Validar si el plazo de la revisión ya venció
        if (pendingReview.FechaLimite < DateTime.Now)
        {
            var autoExtend = pendingReview.Proyecto != null && pendingReview.Proyecto.AutoExtendDeadlines;
            if (autoExtend)
            {
                var extensionDays = pendingReview.Proyecto != null ? pendingReview.Proyecto.AutoExtendDays : 7;
                if (extensionDays <= 0) extensionDays = 7;

                pendingReview.FechaLimite = DateTime.Now.AddDays(extensionDays);
                await _context.SaveChangesAsync();
            }
            else
            {
                throw new InvalidOperationException("El plazo de evaluación para este arbitraje ha vencido. Póngase en contacto con el administrador para solicitar una prórroga.");
            }
        }

        var user = pendingReview.Revisor!;

        // 2. Buscar si tiene un enlace mágico activo. Si lo tiene, lo invalidamos para generar uno nuevo.
        var activeLink = await _context.Set<InvMagicLink>()
            .Where(l => l.IdUsuario == user.IdUsuario && !l.Utilizado && l.FechaExpiracion > DateTime.Now)
            .OrderByDescending(l => l.FechaExpiracion)
            .FirstOrDefaultAsync();

        DateTime expirationDate = pendingReview.FechaLimite;
        if (activeLink != null)
        {
            activeLink.Utilizado = true;
            expirationDate = activeLink.FechaExpiracion;
        }

        // Si la fecha del enlace activo es menor a la fecha límite del arbitraje (por ejemplo, después de extender),
        // usamos el plazo extendido como expiración.
        if (expirationDate < pendingReview.FechaLimite)
        {
            expirationDate = pendingReview.FechaLimite;
        }

        // 3. Crear un enlace nuevo con la fecha de expiración correspondiente
        var plainToken = await CreateMagicLinkAsync(user.IdUsuario, expirationDate);

        // 4. Enviar por correo
        var baseUrl = _configuration["Email:FrontendUrl"] ?? "http://localhost:3000";
        var magicLinkUrl = $"{baseUrl.TrimEnd('/')}/auth/magic-login?token={plainToken}";

        var emailTitle = "Acceso de Arbitraje Científico - DIITRA (Reenvío)";
        string emailBody;

        var templatePath = Path.Combine(AppContext.BaseDirectory, "Resources", "Templates", "Email", "MagicLinkResend.html");
        if (File.Exists(templatePath))
        {
            var templateHtml = await File.ReadAllTextAsync(templatePath);
            var template = HandlebarsDotNet.Handlebars.Compile(templateHtml);
            emailBody = template(new
            {
                fecha_limite = expirationDate.ToString("dd/MM/yyyy"),
                username = user.IdSigafi
            });
        }
        else
        {
            emailBody = $"<p>Usted ha solicitado el reenvío de su enlace de acceso para el módulo de arbitraje científico.</p>" +
                        $"<p>Acceso válido hasta: {expirationDate:dd/MM/yyyy}</p>";
        }

        await _notificationService.NotifyUserAsync(
            user.IdUsuario,
            emailTitle,
            emailBody,
            "PEER_REVIEW",
            magicLinkUrl
        );

        return true;
    }

    public async Task<AuthResponse?> LoginWithMicrosoftAsync(MicrosoftLoginRequest request)
    {
        if (string.IsNullOrEmpty(request.IdToken))
            return null;

        string email;
        string fullName;

        // ── DESARROLLO: Simulación de Microsoft SSO para pruebas sin Azure AD ──
        if (request.IdToken.StartsWith("mock-email:", StringComparison.OrdinalIgnoreCase))
        {
            var parts = request.IdToken.Split(':');
            email = parts.Length > 1 ? parts[1] : "docente.test@istpet.edu.ec";
            fullName = parts.Length > 2 ? parts[2] : "Docente Pruebas Microsoft";
        }
        else
        {
            try
            {
                var validated = await ValidateMicrosoftTokenAsync(request.IdToken);
                if (validated == null)
                {
                    return null;
                }
                email = validated.Value.Email;
                fullName = validated.Value.Name;
            }
            catch (Exception ex)
            {
                await _auditService.LogActionAsync(0, "LOGIN_FAILED", $"Fallo en validación de token Microsoft: {ex.Message}", "SEGURIDAD");
                return null;
            }
        }

        if (string.IsNullOrEmpty(email))
            return null;

        var emailPrefix = email.Contains('@') ? email.Split('@')[0] : email;

        // 1. Buscar en usuarios de DIITRA
        var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.Activo &&
            ((u.EmailInstitucional != null && u.EmailInstitucional.ToLower() == email) ||
             u.IdSigafi.ToLower() == email ||
             u.IdSigafi.ToLower() == emailPrefix));

        if (user == null)
        {
            // 2. Intentar buscar en Profesores para JIT Provisioning
            var profesor = await _context.Profesores.FirstOrDefaultAsync(p =>
                (p.Activo == 1 || p.Activo == null) &&
                ((p.EmailInstitucional != null && p.EmailInstitucional.ToLower() == email) ||
                 (p.Email != null && p.Email.ToLower() == email) ||
                 p.IdProfesor.Trim() == emailPrefix));

            if (profesor != null)
            {
                string name = $"{profesor.PrimerNombre} {profesor.SegundoNombre} {profesor.PrimerApellido} {profesor.SegundoApellido}".Replace("  ", " ").Trim();
                if (string.IsNullOrEmpty(name)) name = fullName;

                user = await ProvisionUserAsync(emailPrefix, name, Guid.NewGuid().ToString("N"), "profesor", profesor.IdProfesor.Trim());
                await _auditService.LogActionAsync(user.IdUsuario, "LOGIN", "Inicio de sesión exitoso (JIT Profesor vía Microsoft SSO)", "SEGURIDAD");
            }
            else
            {
                // 3. Intentar buscar en Alumnos para JIT Provisioning
                var alumno = await _context.Alumnos.FirstOrDefaultAsync(a =>
                    ((a.EmailInstitucional != null && a.EmailInstitucional.ToLower() == email) ||
                     (a.Email != null && a.Email.ToLower() == email) ||
                     a.IdAlumno.Trim() == emailPrefix ||
                     (a.UserAlumno != null && a.UserAlumno.Trim() == emailPrefix)));

                if (alumno != null)
                {
                    string name = $"{alumno.PrimerNombre} {alumno.SegundoNombre} {alumno.ApellidoPaterno} {alumno.ApellidoMaterno}".Replace("  ", " ").Trim();
                    if (string.IsNullOrEmpty(name)) name = fullName;

                    user = await ProvisionUserAsync(emailPrefix, name, Guid.NewGuid().ToString("N"), "alumno", alumno.IdAlumno.Trim());
                    await _auditService.LogActionAsync(user.IdUsuario, "LOGIN", "Inicio de sesión exitoso (JIT Alumno vía Microsoft SSO)", "SEGURIDAD");
                }
            }
        }
        else
        {
            // Si el usuario existe, registrar auditoría de login
            await _auditService.LogActionAsync(user.IdUsuario, "LOGIN", "Inicio de sesión exitoso (Usuario DIITRA vía Microsoft SSO)", "SEGURIDAD");
        }

        // Si no se encuentra/provisiona el usuario, se bloquea el acceso retornando null
        if (user == null)
        {
            return null;
        }

        return await GetAuthResponseAsync(user);
    }

    private async Task<(string Email, string Name)?> ValidateMicrosoftTokenAsync(string idToken)
    {
        var clientId = _configuration["Authentication:Microsoft:ClientId"];
        var tenantId = _configuration["Authentication:Microsoft:TenantId"] ?? "common";

        if (string.IsNullOrEmpty(clientId))
        {
            throw new InvalidOperationException("La autenticación con Microsoft no está configurada en el servidor (falta ClientId).");
        }

        var stsDiscoveryEndpoint = $"https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration";

        var configurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            stsDiscoveryEndpoint,
            new OpenIdConnectConfigurationRetriever(),
            new HttpDocumentRetriever { RequireHttps = true }
        );

        var config = await configurationManager.GetConfigurationAsync(CancellationToken.None);

        var validationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = clientId,
            ValidateIssuer = !tenantId.Equals("common", StringComparison.OrdinalIgnoreCase),
            ValidIssuers = new[]
            {
                $"https://login.microsoftonline.com/{tenantId}/v2.0",
                $"https://sts.windows.net/{tenantId}/"
            },
            IssuerSigningKeys = config.SigningKeys,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(idToken, validationParameters, out SecurityToken validatedToken);

            var email = principal.FindFirst("preferred_username")?.Value
                     ?? principal.FindFirst(ClaimTypes.Email)?.Value
                     ?? principal.FindFirst(ClaimTypes.Name)?.Value;

            var name = principal.FindFirst("name")?.Value
                    ?? $"{principal.FindFirst(ClaimTypes.GivenName)?.Value} {principal.FindFirst(ClaimTypes.Surname)?.Value}";

            if (string.IsNullOrEmpty(email))
            {
                return null;
            }

            return (email.Trim().ToLower(), name ?? "");
        }
        catch (Exception ex)
        {
            throw new SecurityTokenException("El token de Microsoft no es válido o ha expirado.", ex);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  RECUPERACIÓN DE CONTRASEÑA
    //  Flujo: Solicitud → Token en inv_magic_links (proposito=PASSWORD_RECOVERY)
    //         → Enlace por email → Validación → Contraseña SIGAFI en pantalla
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Genera un token seguro de recuperación de contraseña y envía el enlace al correo
    /// institucional del usuario. SIEMPRE retorna true para evitar enumeración de cuentas.
    /// Rate limit: máximo 3 tokens activos por usuario en los últimos 15 minutos.
    /// </summary>
    public async Task<bool> RequestPasswordRecoveryAsync(string identificador, string? ipAddress)
    {
        if (string.IsNullOrWhiteSpace(identificador)) return true;

        identificador = identificador.Trim().ToLower();

        // 1. Buscar usuario en DIITRA (por cédula o email)
        var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.Activo &&
            (u.IdSigafi.ToLower() == identificador || (u.EmailInstitucional != null && u.EmailInstitucional.ToLower() == identificador)));

        if (user == null) return true; // Sin revelar que no existe

        // Verificar que tiene email institucional
        var emailDestino = user.EmailInstitucional;
        if (string.IsNullOrEmpty(emailDestino)) return true;

        // 2. Rate limiting: máximo 3 tokens de recuperación activos en 15 min
        var ventana = DateTime.Now.AddMinutes(-15);
        var tokensRecientes = await _context.Set<InvMagicLink>()
            .CountAsync(l => l.IdUsuario == user.IdUsuario
                          && l.Proposito == "PASSWORD_RECOVERY"
                          && l.FechaCreacion >= ventana
                          && !l.Utilizado);

        if (tokensRecientes >= 3)
        {
            await _auditService.LogActionAsync(user.IdUsuario, "PASSWORD_RECOVERY_RATE_LIMIT",
                $"Rate limit alcanzado para recuperación de contraseña desde IP {ipAddress}", "SEGURIDAD");
            return true; // Sin revelar el rate limit externamente
        }

        // 3. Invalidar tokens anteriores de recuperación activos para este usuario
        var tokensAnteriores = await _context.Set<InvMagicLink>()
            .Where(l => l.IdUsuario == user.IdUsuario && l.Proposito == "PASSWORD_RECOVERY" && !l.Utilizado)
            .ToListAsync();

        foreach (var t in tokensAnteriores)
        {
            t.Utilizado = true;
            t.FechaUtilizado = DateTime.Now;
        }

        // 4. Generar token criptográfico seguro (32 bytes → hex → SHA-256 en BD)
        var tokenBytes = new byte[32];
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(tokenBytes);
        }
        var plainToken = Convert.ToHexString(tokenBytes);
        var tokenHashBytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(plainToken));
        var tokenHash = Convert.ToHexString(tokenHashBytes);

        // 5. Guardar en inv_magic_links con proposito=PASSWORD_RECOVERY
        var recoveryLink = new InvMagicLink
        {
            IdUsuario = user.IdUsuario,
            TokenHash = tokenHash,
            FechaCreacion = DateTime.Now,
            FechaExpiracion = DateTime.Now.AddMinutes(30),
            Utilizado = false,
            IpCreacion = ipAddress,
            Proposito = "PASSWORD_RECOVERY"
        };

        _context.Set<InvMagicLink>().Add(recoveryLink);
        await _context.SaveChangesAsync();

        // 6. Construir enlace y enviar email usando el MasterLayout institucional
        var baseUrl = _configuration["Email:FrontendUrl"] ?? "http://localhost:3000";
        var recoveryUrl = $"{baseUrl.TrimEnd('/')}/auth/ver-contrasenia?token={plainToken}";

        // El body se inyecta dentro del MasterLayout — sin repetir cabecera ni pie
        var emailBody =
            $"<p>Has solicitado recuperar tu contraseña de acceso a <strong>DIITRA</strong>.</p>" +
            $"<p>Haz clic en el botón a continuación para ver tu contraseña de forma segura. " +
            $"<strong>Este enlace expira en 30 minutos y es de un solo uso.</strong></p>" +
            $"<p style=\"color:#888888; font-size:12px;\">Si no realizaste esta solicitud, ignora este correo. " +
            $"Tu contraseña no será revelada sin que hagas clic en el enlace.</p>";

        await _notificationService.NotifyUserAsync(
            user.IdUsuario,
            "Recuperación de Contraseña — DIITRA",
            emailBody,
            "SISTEMA",
            recoveryUrl
        );

        await _auditService.LogActionAsync(user.IdUsuario, "PASSWORD_RECOVERY_REQUESTED",
            $"Enlace de recuperación de contraseña generado y enviado a {emailDestino} desde IP {ipAddress}", "SEGURIDAD");

        return true;
    }

    /// <summary>
    /// Valida el token de recuperación (un solo uso, 30 min) y retorna la contraseña
    /// original de SIGAFI si está en texto plano. Consume el token al validarlo.
    /// </summary>
    public async Task<PasswordRecoveryValidationResult> ValidatePasswordRecoveryTokenAsync(string plainToken, string? ipAddress)
    {
        var invalido = new PasswordRecoveryValidationResult { Valido = false };

        if (string.IsNullOrWhiteSpace(plainToken))
            return invalido;

        // 1. Hash del token recibido
        byte[] tokenHashBytes;
        try
        {
            tokenHashBytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(plainToken));
        }
        catch { return invalido; }

        var tokenHash = Convert.ToHexString(tokenHashBytes);

        // 2. Buscar token válido (no utilizado, no expirado, propósito correcto)
        var link = await _context.Set<InvMagicLink>()
            .Include(l => l.Usuario)
            .FirstOrDefaultAsync(l =>
                l.TokenHash == tokenHash &&
                l.Proposito == "PASSWORD_RECOVERY" &&
                !l.Utilizado &&
                l.FechaExpiracion > DateTime.Now);

        if (link == null) return invalido;

        // 3. Consumir token (un solo uso)
        link.Utilizado = true;
        link.FechaUtilizado = DateTime.Now;
        link.IpUtilizacion = ipAddress;
        await _context.SaveChangesAsync();

        var user = link.Usuario;

        // 4. Obtener contraseña original de SIGAFI según la tabla fuente
        string? passwordOriginal = null;
        bool esHashInaccesible = false;

        if (user.TablaSigafi == "profesor")
        {
            var profesor = await _context.Profesores
                .FirstOrDefaultAsync(p => p.IdProfesor == user.IdSigafi);

            if (profesor?.Clave != null)
            {
                if (IsBCryptHash(profesor.Clave))
                    esHashInaccesible = true;
                else
                    passwordOriginal = profesor.Clave;
            }
        }
        else if (user.TablaSigafi == "alumno")
        {
            var alumno = await _context.Alumnos
                .FirstOrDefaultAsync(a => a.IdAlumno == user.IdSigafi);

            if (!string.IsNullOrEmpty(alumno?.Password))
                passwordOriginal = alumno.Password;
        }

        // Si no se encontró contraseña en la fuente, indicar que debe contactar admin
        if (passwordOriginal == null && !esHashInaccesible)
            esHashInaccesible = true;

        await _auditService.LogActionAsync(user.IdUsuario, "PASSWORD_RECOVERY_VIEWED",
            $"Contraseña consultada mediante token de recuperación desde IP {ipAddress}. " +
            (esHashInaccesible ? "Hash inaccesible." : "Contraseña entregada."), "SEGURIDAD");

        return new PasswordRecoveryValidationResult
        {
            Valido = true,
            Password = passwordOriginal,
            NombreUsuario = user.Nombre,
            EsHashInaccesible = esHashInaccesible
        };
    }
}

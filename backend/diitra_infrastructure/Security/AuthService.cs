using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
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
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ITokenService _tokenService;
    private readonly IPasswordService _passwordService;
    private readonly IRbacService _rbacService;
    private readonly IMagicLinkService _magicLinkService;
    private readonly IMicrosoftAuthService _microsoftAuthService;
    private readonly IPasswordRecoveryService _passwordRecoveryService;
    private readonly string _masterAdminId;

    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (int Attempts, DateTime? LockedUntil)> _userLockouts = new();

    public AuthService(
        DiitraContext context, 
        IConfiguration configuration, 
        IAuditService auditService, 
        IHttpContextAccessor httpContextAccessor,
        ITokenService tokenService,
        IPasswordService passwordService,
        IRbacService rbacService,
        IMagicLinkService magicLinkService,
        IMicrosoftAuthService microsoftAuthService,
        IPasswordRecoveryService passwordRecoveryService)
    {
        _context = context;
        _configuration = configuration;
        _auditService = auditService;
        _httpContextAccessor = httpContextAccessor;
        _tokenService = tokenService;
        _passwordService = passwordService;
        _rbacService = rbacService;
        _magicLinkService = magicLinkService;
        _microsoftAuthService = microsoftAuthService;
        _passwordRecoveryService = passwordRecoveryService;
        _masterAdminId = configuration["Security:MasterAdminId"] ?? "0302144159";
    }

    private string GetFrontendUrl()
    {
        var configuredUrl = _configuration["Email:FrontendUrl"] ?? "http://localhost:3000";
        var httpContext = _httpContextAccessor?.HttpContext;
        if (httpContext != null)
        {
            var request = httpContext.Request;
            var host = request.Host.Value;
            if ((host.Contains("localhost") || host.Contains("127.0.0.1")) && 
                (configuredUrl.Contains("localhost:3000") || configuredUrl.Contains("localhost:5173")))
            {
                return configuredUrl;
            }
            var scheme = request.Scheme;
            return $"{scheme}://{host}/diitra";
        }
        return configuredUrl;
    }

    private static int GetLockoutMinutes(int intentos) => intentos switch
    {
        >= 12 => 60,
        >= 9  => 30,
        >= 6  => 15,
        _     => 5
    };

    public async Task<(AuthResponse? Auth, LoginBlockedResponse? Blocked)> LoginAsync(LoginRequest request)
    {
        var username = request.Username.Trim();
        var password = request.Password.Trim();

        // ── 1. Buscar usuario en DIITRA (por cédula/IdSigafi o por Email) ─────────
        var user = await _context.Users.FirstOrDefaultAsync(u => (u.IdSigafi == username || u.EmailInstitucional == username) && u.Activo);

        if (user != null)
        {
            var userKey = user.IdSigafi.ToLower();
            _userLockouts.TryGetValue(userKey, out var lockout);

            // ── Verificar bloqueo activo ─────────────────────────────────────────
            if (lockout.LockedUntil.HasValue && lockout.LockedUntil.Value > DateTime.Now)
            {
                var remaining = (int)(lockout.LockedUntil.Value - DateTime.Now).TotalSeconds;
                return (null, new LoginBlockedResponse
                {
                    Message = $"Cuenta bloqueada temporalmente por exceso de intentos fallidos. Intenta de nuevo en {remaining} segundos.",
                    BloqueadoHasta = lockout.LockedUntil.Value,
                    SegundosRestantes = remaining
                });
            }

            if (VerifyPassword(user, password))
            {
                // ── Éxito: resetear contadores ───────────────────────────────────
                _userLockouts.TryRemove(userKey, out _);

                var response = await GetAuthResponseAsync(user);
                await _auditService.LogActionAsync(user.IdUsuario, "LOGIN", "Inicio de sesión exitoso (Usuario DIITRA)", "SEGURIDAD");
                return (response, null);
            }

            // ── Fallo: incrementar intentos y calcular bloqueo progresivo ────────
            var newAttempts = lockout.Attempts + 1;
            DateTime? lockedUntil = newAttempts switch
            {
                >= 12 => DateTime.Now.AddMinutes(60),
                >= 9  => DateTime.Now.AddMinutes(30),
                >= 6  => DateTime.Now.AddMinutes(15),
                >= 3  => DateTime.Now.AddMinutes(5),
                _     => null
            };

            _userLockouts.AddOrUpdate(userKey, 
                (newAttempts, lockedUntil), 
                (key, old) => (newAttempts, lockedUntil));

            await _auditService.LogActionAsync(user.IdUsuario, "LOGIN_FAILED",
                $"Intento fallido #{newAttempts}{(lockedUntil.HasValue ? $" — cuenta bloqueada hasta {lockedUntil:u}" : "")}", "SEGURIDAD");

            if (lockedUntil.HasValue)
            {
                var remaining = (int)(lockedUntil.Value - DateTime.Now).TotalSeconds;
                return (null, new LoginBlockedResponse
                {
                    Message = $"Demasiados intentos fallidos. Cuenta bloqueada por {GetLockoutMinutes(newAttempts)} minutos.",
                    BloqueadoHasta = lockedUntil.Value,
                    SegundosRestantes = remaining
                });
            }

            return (null, null);
        }

        // ── 2. JIT Provisioning: Docentes (por cédula/IdProfesor o por Email) ────
        var profesor = await _context.Profesores
            .FirstOrDefaultAsync(p => (p.IdProfesor.Trim() == username || p.EmailInstitucional == username || p.Email == username) && (p.Activo == 1 || p.Activo == null));

        if (profesor != null)
        {
            var verification = _passwordService.VerifyPassword(password, profesor.Clave ?? "");
            if (verification.Success)
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

    public string GenerateToken(AuthResponse user)
        => _tokenService.GenerateToken(user);

    public string GenerateRefreshToken(string username)
        => _tokenService.GenerateRefreshToken(username);

    public async Task<User?> GetOrProvisionUserByCedulaAsync(string cedula)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == cedula);
        if (user != null) return user;

        var p = await _context.Profesores.FirstOrDefaultAsync(prof => prof.IdProfesor == cedula);
        if (p != null)
        {
            string fullNombre = $"{p.PrimerNombre} {p.SegundoNombre} {p.PrimerApellido} {p.SegundoApellido}".Replace("  ", " ").Trim();
            string pwd = !string.IsNullOrEmpty(p.Clave) ? p.Clave : "cambiame";
            return await ProvisionUserAsync(cedula, fullNombre, pwd, "profesor", cedula);
        }

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
        => _passwordService.IsBCryptHash(password);

    private bool VerifyPassword(User user, string password)
    {
        var verification = _passwordService.VerifyPassword(password, user.Contrasenia);
        if (verification.Success)
        {
            if (verification.NeedsRehash)
            {
                user.Contrasenia = _passwordService.HashPassword(password);
                _context.SaveChanges();
            }
            return true;
        }
        return false;
    }

    public async Task<User> ProvisionUserAsync(string username, string name, string password, string table, string sigafiId)
    {
        string contraseniaHash = IsBCryptHash(password) ? password : _passwordService.HashPassword(password);
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

        _context.InvUsuariosMetadata.Add(new InvUsuarioMetadata
        {
            IdUsuario = user.IdUsuario,
            Uuid = Guid.NewGuid(),
            Version = 1
        });
        await _context.SaveChangesAsync();

        return user;
    }

    public async Task<AuthResponse> GetAuthResponseAsync(User user)
    {
        await _rbacService.SeedRbacStructureAsync();
        await _rbacService.SynchronizeUserRolesAsync(user);

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

        var lastConsent = await _context.InvLopdpConsentimientos
            .Where(c => c.IdUsuario == user.IdUsuario && c.VersionPolitica == "LOPDP_GENERAL")
            .OrderByDescending(c => c.FechaConsentimiento)
            .FirstOrDefaultAsync();

        var hasAcceptedLopdp = lastConsent != null && lastConsent.Estado == "Otorgado";

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

        response.Token = _tokenService.GenerateToken(response);
        response.RefreshToken = _tokenService.GenerateRefreshToken(response.IdReferencia);
        return response;
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

    // ── DELEGACIÓN DE SUBSERVICIOS (FACHADA) ───────────────────────────────────

    public Task<MagicLoginResponseDto?> ValidateAndConsumeMagicLinkAsync(string tokenHash, string? ipAddress, string? userAgent)
        => _magicLinkService.ValidateAndConsumeMagicLinkAsync(tokenHash, ipAddress, userAgent);

    public Task<AuthResponse?> ValidateAndConsumeHandoffPinAsync(string pin, string? ipAddress)
        => _magicLinkService.ValidateAndConsumeHandoffPinAsync(pin, ipAddress);

    public Task<string> CreateMagicLinkAsync(int idUsuario, DateTime expirationDate)
        => _magicLinkService.CreateMagicLinkAsync(idUsuario, expirationDate);

    public Task<bool> ResendMagicLinkAsync(string email)
        => _magicLinkService.ResendMagicLinkAsync(email);

    public Task<AuthResponse?> LoginWithMicrosoftAsync(MicrosoftLoginRequest request)
        => _microsoftAuthService.LoginWithMicrosoftAsync(request);

    public Task<PasswordRecoveryRequestResult> RequestPasswordRecoveryAsync(string identificador, string? cedula, string? ipAddress)
        => _passwordRecoveryService.RequestPasswordRecoveryAsync(identificador, cedula, ipAddress);

    public Task<PasswordRecoveryValidationResult> ValidatePasswordRecoveryTokenAsync(string plainToken, string? ipAddress)
        => _passwordRecoveryService.ValidatePasswordRecoveryTokenAsync(plainToken, ipAddress);

    public Task<bool> ChangePasswordAsync(int idUsuario, string currentPassword, string newPassword)
        => _passwordRecoveryService.ChangePasswordAsync(idUsuario, currentPassword, newPassword);

    public Task<bool> RevertSuspiciousPasswordChangeAsync(string plainToken, string newPassword, string? ipAddress)
        => _passwordRecoveryService.RevertSuspiciousPasswordChangeAsync(plainToken, newPassword, ipAddress);

    public Task<bool> ResetPasswordWithRecoveryTokenAsync(string plainToken, string newPassword, string? ipAddress)
        => _passwordRecoveryService.ResetPasswordWithRecoveryTokenAsync(plainToken, newPassword, ipAddress);
}

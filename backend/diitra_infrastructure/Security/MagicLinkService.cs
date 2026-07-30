using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using diitra_domain.Identity.Entities;
using diitra_infrastructure.data.models;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using diitra_application.Common.Notifications;
using Microsoft.Extensions.DependencyInjection;

namespace diitra_infrastructure.Security;

public class MagicLinkService : IMagicLinkService
{
    private readonly DiitraContext _context;
    private readonly IConfiguration _configuration;
    private readonly IAuditService _auditService;
    private readonly diitra_application.Common.Notifications.INotificationService _notificationService;
    private readonly IServiceProvider _serviceProvider;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IPasswordService _passwordService;
    
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (int Attempts, DateTime LockedUntil)> _ipLockouts = new();

    public MagicLinkService(
        DiitraContext context,
        IConfiguration configuration,
        IAuditService auditService,
        diitra_application.Common.Notifications.INotificationService notificationService,
        IServiceProvider serviceProvider,
        IHttpContextAccessor httpContextAccessor,
        IPasswordService passwordService)
    {
        _context = context;
        _configuration = configuration;
        _auditService = auditService;
        _notificationService = notificationService;
        _serviceProvider = serviceProvider;
        _httpContextAccessor = httpContextAccessor;
        _passwordService = passwordService;
    }

    private string GetFrontendUrl()
    {
        var configuredUrl = _configuration["Email:FrontendUrl"] ?? _configuration["FrontendUrl"] ?? "http://localhost:3000";
        
        var httpContext = _httpContextAccessor?.HttpContext;
        if (httpContext != null)
        {
            var request = httpContext.Request;
            var host = request.Host.Value;
            
            if (host.Contains(":5175") || host.Contains(":5000") || host.Contains("localhost") || host.Contains("127.0.0.1"))
            {
                return configuredUrl;
            }
            
            var scheme = request.Scheme;
            return $"{scheme}://{host}/diitra";
        }

        return configuredUrl;
    }

    private static int GetIpLockoutMinutes(int attempts) => attempts switch
    {
        >= 12 => 60,
        >= 9  => 30,
        >= 6  => 15,
        _     => 5
    };

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

    public async Task<MagicLoginResponseDto?> ValidateAndConsumeMagicLinkAsync(string tokenHash, string? ipAddress, string? userAgent)
    {
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

        // Obtener el AuthService de forma diferida para obtener los roles y armar el AuthResponse final
        // Esto evita dependencias circulares directas en constructor
        using var scope = _serviceProvider.CreateScope();
        var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
        var authResponse = await authService.GetAuthResponseForUserByIdAsync(magicLink.IdUsuario);
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

        using var scope = _serviceProvider.CreateScope();
        var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
        return await authService.GetAuthResponseForUserByIdAsync(magicLink.IdUsuario);
    }

    public async Task<bool> ResendMagicLinkAsync(string email)
    {
        email = email.Trim().ToLower();

        // 1. Buscar alguna revisión/arbitraje pendiente activa cuyo revisor coincida con el email.
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

        if (expirationDate < pendingReview.FechaLimite)
        {
            expirationDate = pendingReview.FechaLimite;
        }

        // 3. Crear un enlace nuevo con la fecha de expiración correspondiente
        var plainToken = await CreateMagicLinkAsync(user.IdUsuario, expirationDate);

        // 4. Enviar por correo
        var baseUrl = GetFrontendUrl();
        var magicLinkUrl = $"{baseUrl.TrimEnd('/')}/auth/magic-login?token={plainToken}";

        var emailTitle = "Acceso de Arbitraje Científico - DIITRA (Reenvío)";
        string emailBody;

        var templatePath = Path.Combine(AppContext.BaseDirectory, "Resources", "Templates", "Email", "MagicLinkResend.html");
        if (File.Exists(templatePath))
        {
            bool mostrarCredenciales = _passwordService.VerifyPassword("Diitra2026*", user.Contrasenia).Success;

            var templateHtml = await File.ReadAllTextAsync(templatePath);
            var template = HandlebarsDotNet.Handlebars.Compile(templateHtml);
            emailBody = template(new
            {
                fecha_limite = expirationDate.ToString("dd/MM/yyyy"),
                username = user.IdSigafi,
                mostrar_credenciales = mostrarCredenciales
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
}

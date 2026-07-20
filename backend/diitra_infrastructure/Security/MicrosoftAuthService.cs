using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using diitra_domain.Identity.Entities;
using diitra_infrastructure.data.models;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using Microsoft.Extensions.DependencyInjection;

namespace diitra_infrastructure.Security;

public class MicrosoftAuthService : IMicrosoftAuthService
{
    private readonly DiitraContext _context;
    private readonly IConfiguration _configuration;
    private readonly IAuditService _auditService;
    private readonly IServiceProvider _serviceProvider;

    public MicrosoftAuthService(
        DiitraContext context,
        IConfiguration configuration,
        IAuditService auditService,
        IServiceProvider serviceProvider)
    {
        _context = context;
        _configuration = configuration;
        _auditService = auditService;
        _serviceProvider = serviceProvider;
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

        // Obtener el servicio AuthService de manera diferida
        using var scope = _serviceProvider.CreateScope();
        var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();

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

                user = await authService.ProvisionUserAsync(emailPrefix, name, Guid.NewGuid().ToString("N"), "profesor", profesor.IdProfesor.Trim());
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

                    user = await authService.ProvisionUserAsync(emailPrefix, name, Guid.NewGuid().ToString("N"), "alumno", alumno.IdAlumno.Trim());
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

        return await authService.GetAuthResponseForUserByIdAsync(user.IdUsuario);
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
}

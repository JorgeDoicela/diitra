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

public class PasswordRecoveryService : IPasswordRecoveryService
{
    private readonly DiitraContext _context;
    private readonly IConfiguration _configuration;
    private readonly IAuditService _auditService;
    private readonly IServiceProvider _serviceProvider;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IPasswordService _passwordService;

    public PasswordRecoveryService(
        DiitraContext context,
        IConfiguration configuration,
        IAuditService auditService,
        IServiceProvider serviceProvider,
        IHttpContextAccessor httpContextAccessor,
        IPasswordService passwordService)
    {
        _context = context;
        _configuration = configuration;
        _auditService = auditService;
        _serviceProvider = serviceProvider;
        _httpContextAccessor = httpContextAccessor;
        _passwordService = passwordService;
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

    public async Task<PasswordRecoveryRequestResult> RequestPasswordRecoveryAsync(string identificador, string? cedula, string? ipAddress)
    {
        var result = new PasswordRecoveryRequestResult { Exito = false };

        if (string.IsNullOrWhiteSpace(identificador))
        {
            result.Exito = true;
            return result;
        }

        identificador = identificador.Trim().ToLower();

        // 1. Buscar coincidencias por correo o identificación
        var userList = await _context.Users
            .Where(u => u.Activo &&
                (u.IdSigafi.ToLower() == identificador || (u.EmailInstitucional != null && u.EmailInstitucional.ToLower() == identificador)))
            .ToListAsync();

        if (!userList.Any())
        {
            result.Exito = true;
            return result;
        }

        User? user = null;

        if (userList.Count > 1)
        {
            if (string.IsNullOrWhiteSpace(cedula))
            {
                result.RequiereDesambiguacion = true;
                result.Message = "Hemos detectado múltiples cuentas vinculadas a esta dirección de correo. Por favor, introduce tu número de cédula o identificación para confirmar a cuál de ellas deseas acceder.";
                return result;
            }

            var cleanCedula = cedula.Trim().ToLower();
            user = userList.FirstOrDefault(u => u.IdSigafi.ToLower() == cleanCedula);

            if (user == null)
            {
                result.RequiereDesambiguacion = true;
                result.Message = "El número de cédula o identificación provisto no coincide con ninguna de las cuentas vinculadas a este correo.";
                return result;
            }
        }
        else
        {
            user = userList.First();
        }

        var emailDestino = user.EmailInstitucional;
        if (string.IsNullOrEmpty(emailDestino))
        {
            result.Exito = true;
            return result;
        }

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
            result.Exito = true;
            return result;
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

        // 4. Generar token criptográfico seguro
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

        // 6. Construir enlace y enviar email
        var baseUrl = GetFrontendUrl();
        var recoveryUrl = $"{baseUrl.TrimEnd('/')}/auth/ver-contrasenia?token={plainToken}";

        var emailBody =
            $"<p>Has solicitado recuperar tu contraseña de acceso a <strong>DIITRA</strong>.</p>" +
            $"<p>Haz clic en el botón a continuación para ver tu contraseña de forma segura. " +
            $"<strong>Este enlace expira en 30 minutos y es de un solo uso.</strong></p>" +
            $"<p style=\"color:#888888; font-size:12px;\">Si no realizaste esta solicitud, ignora este correo. " +
            $"Tu contraseña no será revelada sin que hagas clic en el enlace.</p>";

        using (var scope = _serviceProvider.CreateScope())
        {
            var emailEngine = scope.ServiceProvider.GetRequiredService<diitra_application.Common.Notifications.IEmailEngineService>();
            await emailEngine.SendTemplatedEmailAsync(new EmailSendRequest
            {
                DestinatariosUserIds = new List<int> { user.IdUsuario },
                CustomSubject = "Recuperación de Contraseña — DIITRA",
                CustomBody = emailBody,
                TemplateData = new Dictionary<string, string>
                {
                    { "[[action_url]]", recoveryUrl }
                }
            });
        }

        await _auditService.LogActionAsync(user.IdUsuario, "PASSWORD_RECOVERY_REQUESTED",
            $"Enlace de recuperación de contraseña generado y enviado a {emailDestino} desde IP {ipAddress}", "SEGURIDAD");

        result.Exito = true;
        return result;
    }

    public async Task<PasswordRecoveryValidationResult> ValidatePasswordRecoveryTokenAsync(string plainToken, string? ipAddress)
    {
        var invalido = new PasswordRecoveryValidationResult { Valido = false };

        if (string.IsNullOrWhiteSpace(plainToken))
            return invalido;

        byte[] tokenHashBytes;
        try
        {
            tokenHashBytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(plainToken));
        }
        catch { return invalido; }

        var tokenHash = Convert.ToHexString(tokenHashBytes);

        var link = await _context.Set<InvMagicLink>()
            .Include(l => l.Usuario)
            .FirstOrDefaultAsync(l =>
                l.TokenHash == tokenHash &&
                l.Proposito == "PASSWORD_RECOVERY" &&
                !l.Utilizado &&
                l.FechaExpiracion > DateTime.Now);

        if (link == null) return invalido;

        var user = link.Usuario;

        if (user.TablaSigafi != "otros")
        {
            link.Utilizado = true;
            link.FechaUtilizado = DateTime.Now;
            link.IpUtilizacion = ipAddress;
            await _context.SaveChangesAsync();
        }

        string? passwordOriginal = null;
        bool esHashInaccesible = false;

        if (user.TablaSigafi == "profesor")
        {
            var profesor = await _context.Profesores
                .FirstOrDefaultAsync(p => p.IdProfesor == user.IdSigafi);

            if (profesor?.Clave != null)
            {
                if (_passwordService.IsBCryptHash(profesor.Clave))
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
            EsHashInaccesible = esHashInaccesible,
            EsRevisorExterno = (user.TablaSigafi == "otros")
        };
    }

    public async Task<bool> ChangePasswordAsync(int idUsuario, string currentPassword, string newPassword)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario && u.Activo);
        if (user == null)
        {
            throw new InvalidOperationException("El usuario no existe o está inactivo.");
        }

        if (user.TablaSigafi != "otros")
        {
            throw new InvalidOperationException("Las cuentas institucionales deben cambiar su contraseña a través del portal de autogestión de la institución (SIGAFI).");
        }

        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 8)
        {
            throw new InvalidOperationException("La nueva contraseña debe tener al menos 8 caracteres.");
        }

        if (!VerifyPassword(user, currentPassword))
        {
            throw new InvalidOperationException("La contraseña actual ingresada es incorrecta.");
        }

        user.Contrasenia = _passwordService.HashPassword(newPassword);
        await _context.SaveChangesAsync();

        string? emailDestino = user.EmailInstitucional;
        if (!string.IsNullOrEmpty(emailDestino))
        {
            try
            {
                var tokensAnteriores = await _context.Set<InvMagicLink>()
                    .Where(l => l.IdUsuario == user.IdUsuario && l.Proposito == "PASSWORD_RECOVERY" && !l.Utilizado)
                    .ToListAsync();

                foreach (var t in tokensAnteriores)
                {
                    t.Utilizado = true;
                    t.FechaUtilizado = DateTime.Now;
                }

                var tokenBytes = new byte[32];
                using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
                {
                    rng.GetBytes(tokenBytes);
                }
                var plainToken = Convert.ToHexString(tokenBytes);
                var tokenHashBytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(plainToken));
                var tokenHash = Convert.ToHexString(tokenHashBytes);

                var recoveryLink = new InvMagicLink
                {
                    IdUsuario = user.IdUsuario,
                    TokenHash = tokenHash,
                    FechaCreacion = DateTime.Now,
                    FechaExpiracion = DateTime.Now.AddDays(7),
                    Utilizado = false,
                    Proposito = "PASSWORD_SECURITY_ALERT"
                };

                _context.Set<InvMagicLink>().Add(recoveryLink);
                await _context.SaveChangesAsync();

                var baseUrl = GetFrontendUrl();
                var recoveryUrl = $"{baseUrl.TrimEnd('/')}/auth/reestablecer-alerta?token={plainToken}";

                var emailBody =
                    $"<p>Hola, <strong>{user.Nombre}</strong>.</p>" +
                    $"<p>Te informamos que la contraseña de tu cuenta de acceso a <strong>DIITRA</strong> ha sido cambiada recientemente.</p>" +
                    $"<p>Si realizaste este cambio, no necesitas hacer nada.</p>" +
                    $"<p><strong>¿No fuiste tú?</strong> Si no realizaste esta acción o consideras que se trata de un acceso no autorizado, por favor restablece tu contraseña inmediatamente haciendo clic en el siguiente enlace para expulsar cualquier sesión sospechosa:</p>" +
                    $"<p><a href=\"{recoveryUrl}\" style=\"color:#0070f3; text-decoration:none; font-weight:600;\">Restablecer mi contraseña de seguridad</a></p>" +
                    $"<p style=\"color:#888888; font-size:12px; margin-top: 15px;\">Por motivos de seguridad, este enlace es de un solo uso y es válido durante 7 días.</p>";

                var emailRequest = new EmailSendRequest
                {
                    DestinatariosUserIds = new List<int> { user.IdUsuario },
                    CustomSubject = "Notificación de seguridad: cambio de contraseña — DIITRA",
                    CustomBody = emailBody
                };

                _ = Task.Run(async () =>
                {
                    try
                    {
                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var emailEngine = scope.ServiceProvider.GetRequiredService<diitra_application.Common.Notifications.IEmailEngineService>();
                            await emailEngine.SendTemplatedEmailAsync(emailRequest);

                            var audit = scope.ServiceProvider.GetRequiredService<IAuditService>();
                            await audit.LogActionAsync(user.IdUsuario, "PASSWORD_CHANGED_NOTIFICATION_SENT",
                                $"Correo exclusivo de cambio de contraseña enviado a {emailDestino} con token de seguridad.", "SEGURIDAD");
                        }
                    }
                    catch (Exception ex)
                    {
                        try
                        {
                            using (var scope = _serviceProvider.CreateScope())
                            {
                                var audit = scope.ServiceProvider.GetRequiredService<IAuditService>();
                                await audit.LogActionAsync(user.IdUsuario, "PASSWORD_CHANGED_NOTIFICATION_FAILED",
                                    $"Error al enviar notificación de cambio de contraseña en segundo plano: {ex.Message}", "SEGURIDAD");
                            }
                        }
                        catch { }
                    }
                });
            }
            catch (Exception ex)
            {
                await _auditService.LogActionAsync(user.IdUsuario, "PASSWORD_CHANGED_NOTIFICATION_FAILED",
                    $"Error al programar notificación de cambio de contraseña: {ex.Message}", "SEGURIDAD");
            }
        }

        return true;
    }

    public async Task<bool> RevertSuspiciousPasswordChangeAsync(string plainToken, string newPassword, string? ipAddress)
    {
        if (string.IsNullOrWhiteSpace(plainToken))
        {
            throw new InvalidOperationException("El token es obligatorio.");
        }

        var tokenHashBytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(plainToken));
        var tokenHash = Convert.ToHexString(tokenHashBytes);

        var magicLink = await _context.Set<InvMagicLink>()
            .FirstOrDefaultAsync(l => l.TokenHash == tokenHash 
                                   && l.Proposito == "PASSWORD_SECURITY_ALERT" 
                                   && !l.Utilizado 
                                   && l.FechaExpiracion > DateTime.Now);

        if (magicLink == null)
        {
            throw new InvalidOperationException("El enlace de alerta de seguridad ha expirado, ya fue utilizado o es inválido.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == magicLink.IdUsuario && u.Activo);
        if (user == null)
        {
            throw new InvalidOperationException("El usuario asociado no existe o está inactivo.");
        }

        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 8)
        {
            throw new InvalidOperationException("La nueva contraseña debe tener al menos 8 caracteres.");
        }

        user.Contrasenia = _passwordService.HashPassword(newPassword);
        
        magicLink.Utilizado = true;
        magicLink.FechaUtilizado = DateTime.Now;
        magicLink.IpUtilizacion = ipAddress;

        await _context.SaveChangesAsync();

        await _auditService.LogActionAsync(user.IdUsuario, "PASSWORD_REVERTED_ALERT",
            $"Contraseña restablecida de emergencia tras reporte de actividad sospechosa desde IP {ipAddress}.", "SEGURIDAD");

        return true;
    }

    public async Task<bool> ResetPasswordWithRecoveryTokenAsync(string plainToken, string newPassword, string? ipAddress)
    {
        if (string.IsNullOrWhiteSpace(plainToken))
        {
            throw new InvalidOperationException("El token es obligatorio.");
        }

        var tokenHashBytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(plainToken));
        var tokenHash = Convert.ToHexString(tokenHashBytes);

        var magicLink = await _context.Set<InvMagicLink>()
            .Include(l => l.Usuario)
            .FirstOrDefaultAsync(l => l.TokenHash == tokenHash 
                                   && l.Proposito == "PASSWORD_RECOVERY" 
                                   && !l.Utilizado 
                                   && l.FechaExpiracion > DateTime.Now);

        if (magicLink == null)
        {
            throw new InvalidOperationException("El enlace de recuperación ha expirado, ya fue utilizado o es inválido.");
        }

        var user = magicLink.Usuario;
        if (user == null || !user.Activo)
        {
            throw new InvalidOperationException("El usuario asociado no existe o está inactivo.");
        }

        if (user.TablaSigafi != "otros")
        {
            throw new InvalidOperationException("Solo los evaluadores externos pueden restablecer su contraseña local.");
        }

        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 8)
        {
            throw new InvalidOperationException("La nueva contraseña debe tener al menos 8 caracteres.");
        }

        user.Contrasenia = _passwordService.HashPassword(newPassword);
        
        magicLink.Utilizado = true;
        magicLink.FechaUtilizado = DateTime.Now;
        magicLink.IpUtilizacion = ipAddress;

        await _context.SaveChangesAsync();

        await _auditService.LogActionAsync(user.IdUsuario, "PASSWORD_RESET_RECOVERY",
            $"Contraseña restablecida de forma exitosa mediante flujo de recuperación desde IP {ipAddress}.", "SEGURIDAD");

        return true;
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using diitra_infrastructure.data.models;
using diitra_application.Common.Notifications;

namespace diitra_infrastructure.Security;

public class LopdpService : ILopdpService
{
    private readonly DiitraContext _context;
    private readonly ILogger<LopdpService> _logger;
    private readonly INotificationService _notificationService;

    public LopdpService(DiitraContext context, INotificationService notificationService, ILogger<LopdpService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task RegistrarConsentimientoAsync(int idUsuario, string versionPolitica, string? ip, string? userAgent)
    {
        try
        {
            var consentimiento = new InvLopdpConsentimiento
            {
                IdUsuario = idUsuario,
                VersionPolitica = versionPolitica,
                Canal = "Web",
                FechaConsentimiento = DateTime.Now,
                IpDireccion = ip,
                UserAgent = userAgent,
                Estado = "Otorgado"
            };

            _context.InvLopdpConsentimientos.Add(consentimiento);

            // Si es consentimiento para firma electrónica, actualizamos la tabla de metadata del usuario
            if (versionPolitica.Equals("FIRMA_ELECTRONICA", StringComparison.OrdinalIgnoreCase) ||
                versionPolitica.Equals("FIRMA", StringComparison.OrdinalIgnoreCase))
            {
                var metadata = await _context.InvUsuariosMetadata.FirstOrDefaultAsync(m => m.IdUsuario == idUsuario);
                if (metadata != null)
                {
                    metadata.AceptoTerminosFirma = true;
                    metadata.FechaConsentimientoFirma = DateTime.Now;
                }
            }

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registrando consentimiento LOPDP para Usuario={IdUsuario}", idUsuario);
            throw;
        }
    }

    public async Task RegistrarSolicitudArcoAsync(int idUsuario, string tipoSolicitud, string detalleSolicitud, string? evidenciaPath)
    {
        try
        {
            var solicitud = new InvLopdpDerechoArco
            {
                IdUsuario = idUsuario,
                TipoSolicitud = tipoSolicitud,
                DetalleSolicitud = detalleSolicitud,
                FechaSolicitud = DateTime.Now,
                FechaLimiteResolucion = DateOnly.FromDateTime(DateTime.Now.AddDays(15)), // LOPDP 15 días límite
                Estado = "Recibido",
                EvidenciaPath = evidenciaPath
            };

            _context.InvLopdpDerechosArco.Add(solicitud);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(idUsuario);
            var userName = user?.Nombre ?? $"Usuario {idUsuario}";

            // Notify admin
            try
            {
                await _notificationService.NotifyByRoleCodesAsync(
                    "Nueva Solicitud ARCO LOPDP",
                    $"El usuario {userName} ha registrado una solicitud de tipo '{tipoSolicitud}'.",
                    new[] { "DIITRA_ADMIN" },
                    "/lopdp/admin"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al notificar nueva solicitud ARCO a los administradores");
            }

            // Notify user
            try
            {
                await _notificationService.NotifyUserAsync(
                    idUsuario,
                    "Solicitud ARCO Recibida",
                    $"Tu solicitud de tipo '{tipoSolicitud}' ha sido registrada y está en proceso de revisión. Fecha límite de resolución: {solicitud.FechaLimiteResolucion:dd/MM/yyyy}.",
                    "INFO",
                    "/lopdp/arco"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar notificación de confirmación de solicitud ARCO al usuario");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registrando solicitud ARCO LOPDP para Usuario={IdUsuario}", idUsuario);
            throw;
        }
    }

    public async Task ResolverSolicitudArcoAsync(int idSolicitudArco, string resolucionDetalle, string estado, string? documentPath)
    {
        try
        {
            var solicitud = await _context.InvLopdpDerechosArco.FirstOrDefaultAsync(s => s.IdSolicitudArco == idSolicitudArco);
            if (solicitud == null)
            {
                throw new KeyNotFoundException($"No se encontró la solicitud ARCO con ID {idSolicitudArco}");
            }

            solicitud.ResolucionDetalle = resolucionDetalle;
            solicitud.Estado = estado; // Aprobado, Rechazado, etc.
            solicitud.FechaResolucion = DateTime.Now;
            solicitud.DocumentoResolucionPath = documentPath;

            await _context.SaveChangesAsync();

            // Notify user
            try
            {
                await _notificationService.NotifyUserAsync(
                    solicitud.IdUsuario,
                    "Solicitud ARCO Resuelta",
                    $"Tu solicitud ARCO de tipo '{solicitud.TipoSolicitud}' ha sido resuelta con estado: '{estado}'. Detalle: {resolucionDetalle}",
                    "INFO",
                    "/lopdp/arco"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar notificación de resolución de solicitud ARCO al usuario");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al resolver solicitud ARCO LOPDP con ID={IdSolicitudArco}", idSolicitudArco);
            throw;
        }
    }

    public async Task<List<SolicitudArcoResponse>> GetMisSolicitudesArcoAsync(int idUsuario)
    {
        try
        {
            return await _context.InvLopdpDerechosArco
                .Where(s => s.IdUsuario == idUsuario)
                .OrderByDescending(s => s.FechaSolicitud)
                .Select(s => new SolicitudArcoResponse
                {
                    IdSolicitudArco = s.IdSolicitudArco,
                    Uuid = s.Uuid,
                    IdUsuario = s.IdUsuario,
                    NombreUsuario = s.User != null ? (s.User.Nombre ?? "Usuario " + s.IdUsuario) : "Usuario " + s.IdUsuario,
                    TipoSolicitud = s.TipoSolicitud,
                    DetalleSolicitud = s.DetalleSolicitud,
                    FechaSolicitud = s.FechaSolicitud,
                    FechaLimiteResolucion = s.FechaLimiteResolucion,
                    Estado = s.Estado,
                    ResolucionDetalle = s.ResolucionDetalle,
                    FechaResolucion = s.FechaResolucion,
                    DocumentoResolucionPath = s.DocumentoResolucionPath,
                    EvidenciaPath = s.EvidenciaPath
                })
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener solicitudes ARCO para Usuario={IdUsuario}", idUsuario);
            throw;
        }
    }

    public async Task<List<SolicitudArcoResponse>> GetAllSolicitudesArcoAsync()
    {
        try
        {
            return await _context.InvLopdpDerechosArco
                .OrderByDescending(s => s.FechaSolicitud)
                .Select(s => new SolicitudArcoResponse
                {
                    IdSolicitudArco = s.IdSolicitudArco,
                    Uuid = s.Uuid,
                    IdUsuario = s.IdUsuario,
                    NombreUsuario = s.User != null ? (s.User.Nombre ?? "Usuario " + s.IdUsuario) : "Usuario " + s.IdUsuario,
                    TipoSolicitud = s.TipoSolicitud,
                    DetalleSolicitud = s.DetalleSolicitud,
                    FechaSolicitud = s.FechaSolicitud,
                    FechaLimiteResolucion = s.FechaLimiteResolucion,
                    Estado = s.Estado,
                    ResolucionDetalle = s.ResolucionDetalle,
                    FechaResolucion = s.FechaResolucion,
                    DocumentoResolucionPath = s.DocumentoResolucionPath,
                    EvidenciaPath = s.EvidenciaPath
                })
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener todas las solicitudes ARCO");
            throw;
        }
    }

    public async Task<List<ConsentimientoResponse>> GetAllConsentimientosAsync()
    {
        try
        {
            return await _context.InvLopdpConsentimientos
                .OrderByDescending(c => c.FechaConsentimiento)
                .Select(c => new ConsentimientoResponse
                {
                    IdConsentimiento = c.IdConsentimiento,
                    Uuid = c.Uuid,
                    IdUsuario = c.IdUsuario,
                    NombreUsuario = c.User != null ? (c.User.Nombre ?? "Usuario " + c.IdUsuario) : "Usuario " + c.IdUsuario,
                    VersionPolitica = c.VersionPolitica,
                    Canal = c.Canal,
                    FechaConsentimiento = c.FechaConsentimiento,
                    IpDireccion = c.IpDireccion,
                    UserAgent = c.UserAgent,
                    Estado = c.Estado
                })
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener todos los consentimientos LOPDP");
            throw;
        }
    }

    public async Task AuditoriaAccesoDatosAsync(int? idUsuarioActor, int idUsuarioAfectado, string tablaAfectada, string? columnaAfectada, string operacion, string? motivo, string? ip, string? userAgent)
    {
        try
        {
            var auditoria = new InvLopdpAuditoriaDatos
            {
                IdUsuarioActor = idUsuarioActor,
                IdUsuarioAfectado = idUsuarioAfectado,
                TablaAfectada = tablaAfectada,
                ColumnaAfectada = columnaAfectada,
                Operacion = operacion,
                Motivo = motivo,
                IpDireccion = ip,
                UserAgent = userAgent,
                FechaAcceso = DateTime.Now
            };

            _context.InvLopdpAuditoriaDatos.Add(auditoria);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registrando auditoría LOPDP de datos sensibles para Actor={Actor}, Afectado={Afectado}", idUsuarioActor, idUsuarioAfectado);
            // No propagamos la excepción en auditoría para evitar interrumpir la operación principal
        }
    }

    public async Task<PerfilLopdpDto?> GetPerfilAsync(int idUsuario)
    {
        try
        {
            var meta = await _context.InvUsuariosMetadata.FirstOrDefaultAsync(m => m.IdUsuario == idUsuario);
            if (meta == null)
            {
                meta = new InvUsuarioMetadata
                {
                    IdUsuario = idUsuario,
                    Uuid = Guid.NewGuid(),
                    Version = 1
                };
                _context.InvUsuariosMetadata.Add(meta);
                await _context.SaveChangesAsync();
            }

            return new PerfilLopdpDto
            {
                OrcidId = meta.OrcidId,
                ScopusId = meta.ScopusId,
                GoogleScholarUrl = meta.GoogleScholarUrl,
                ResearchGateUrl = meta.ResearchGateUrl,
                Especialidad = meta.Especialidad,
                GradoAcademicoMaximo = meta.GradoAcademicoMaximo,
                AceptoTerminosFirma = meta.AceptoTerminosFirma,
                FechaConsentimientoFirma = meta.FechaConsentimientoFirma,
                HasP12Certificate = !string.IsNullOrEmpty(meta.RutaFirmaP12)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener perfil LOPDP para Usuario={IdUsuario}", idUsuario);
            throw;
        }
    }

    public async Task UpdatePerfilAsync(int idUsuario, ActualizarPerfilRequest request)
    {
        try
        {
            var meta = await _context.InvUsuariosMetadata.FirstOrDefaultAsync(m => m.IdUsuario == idUsuario);
            if (meta == null)
            {
                meta = new InvUsuarioMetadata
                {
                    IdUsuario = idUsuario,
                    Uuid = Guid.NewGuid(),
                    Version = 1
                };
                _context.InvUsuariosMetadata.Add(meta);
            }

            meta.OrcidId = request.OrcidId;
            meta.ScopusId = request.ScopusId;
            meta.GoogleScholarUrl = request.GoogleScholarUrl;
            meta.ResearchGateUrl = request.ResearchGateUrl;
            meta.Especialidad = request.Especialidad;
            meta.GradoAcademicoMaximo = request.GradoAcademicoMaximo;
            meta.Version++;

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar perfil LOPDP para Usuario={IdUsuario}", idUsuario);
            throw;
        }
    }

    public async Task GuardarFirmaElectronicaAsync(int idUsuario, string rutaArchivo, string passwordCifrada)
    {
        try
        {
            var meta = await _context.InvUsuariosMetadata.FirstOrDefaultAsync(m => m.IdUsuario == idUsuario);
            if (meta == null)
            {
                meta = new InvUsuarioMetadata
                {
                    IdUsuario = idUsuario,
                    Uuid = Guid.NewGuid(),
                    Version = 1
                };
                _context.InvUsuariosMetadata.Add(meta);
            }

            meta.RutaFirmaP12 = rutaArchivo;
            meta.P12PasswordEncrypted = passwordCifrada;
            meta.FirmaHabilitada = true;
            meta.Version++;

            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al guardar firma electrónica para Usuario={IdUsuario}", idUsuario);
            throw;
        }
    }
}


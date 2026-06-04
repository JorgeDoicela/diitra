using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Security;

public class LopdpService : ILopdpService
{
    private readonly DiitraContext _context;
    private readonly ILogger<LopdpService> _logger;

    public LopdpService(DiitraContext context, ILogger<LopdpService> logger)
    {
        _context = context;
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

    public async Task RegistrarSolicitudArcoAsync(int idUsuario, string tipoSolicitud, string detalleSolicitud)
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
                Estado = "Recibido"
            };

            _context.InvLopdpDerechosArco.Add(solicitud);
            await _context.SaveChangesAsync();
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
                    DocumentoResolucionPath = s.DocumentoResolucionPath
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
                    DocumentoResolucionPath = s.DocumentoResolucionPath
                })
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener todas las solicitudes ARCO");
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
}

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using diitra_application.Common.Notifications;
using diitra_application.Feedback;
using diitra_application.Feedback.DTOs;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Feedback;

public class FeedbackService : IFeedbackService
{
    private readonly DiitraContext _context;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<FeedbackService> _logger;
    private readonly INotificationService _notificationService;
    private readonly string _whatsAppNumber;
    private readonly long _maxImageSizeBytes;
    private readonly long _maxVideoSizeBytes;

    private static readonly string[] AllowedImageExtensions = { ".png", ".jpg", ".jpeg", ".webp" };
    private static readonly string[] AllowedVideoExtensions = { ".mp4", ".webm" };

    public FeedbackService(
        DiitraContext context,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger<FeedbackService> logger,
        INotificationService notificationService)
    {
        _context = context;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
        _notificationService = notificationService;

        _whatsAppNumber = configuration["Support:DeveloperWhatsAppNumber"] ?? "593969677280";
        _maxImageSizeBytes = long.TryParse(configuration["Support:MaxImageSizeBytes"], out var maxImg) ? maxImg : 5 * 1024 * 1024;
        _maxVideoSizeBytes = long.TryParse(configuration["Support:MaxVideoSizeBytes"], out var maxVid) ? maxVid : 15 * 1024 * 1024;
    }

    public FeedbackSupportConfigDto GetSupportConfig()
    {
        return new FeedbackSupportConfigDto
        {
            WhatsAppNumber = _whatsAppNumber,
            MaxImageSizeBytes = _maxImageSizeBytes,
            MaxVideoSizeBytes = _maxVideoSizeBytes
        };
    }

    public async Task<FeedbackReporteDto> CreateFeedbackAsync(
        CreateFeedbackDto dto,
        int? idUsuario,
        string? cedula,
        string nombreUsuario,
        string rolUsuario)
    {
        var adjuntos = new List<FeedbackAdjuntoDto>();

        if (dto.Archivos != null && dto.Archivos.Count > 0)
        {
            // Validaciones defensivas de cantidad
            var imageFiles = dto.Archivos.Where(f => AllowedImageExtensions.Contains(Path.GetExtension(f.FileName).ToLower())).ToList();
            var videoFiles = dto.Archivos.Where(f => AllowedVideoExtensions.Contains(Path.GetExtension(f.FileName).ToLower())).ToList();

            if (imageFiles.Count > 3)
            {
                throw new InvalidOperationException("Solo se permite un máximo de 3 capturas de imagen por reporte.");
            }

            if (videoFiles.Count > 1)
            {
                throw new InvalidOperationException("Solo se permite un máximo de 1 clip de video por reporte.");
            }

            var basePath = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "feedback", DateTime.Now.ToString("yyyyMM"));
            if (!Directory.Exists(basePath))
            {
                Directory.CreateDirectory(basePath);
            }

            foreach (var file in dto.Archivos)
            {
                if (file.Length == 0) continue;

                var ext = Path.GetExtension(file.FileName).ToLower();
                bool isImage = AllowedImageExtensions.Contains(ext);
                bool isVideo = AllowedVideoExtensions.Contains(ext);

                if (!isImage && !isVideo)
                {
                    throw new InvalidOperationException($"Formato de archivo '{ext}' no permitido. Formatos aceptados: PNG, JPG, WEBP, MP4, WEBM.");
                }

                if (isImage && file.Length > _maxImageSizeBytes)
                {
                    throw new InvalidOperationException($"La imagen '{file.FileName}' supera el límite permitido de {_maxImageSizeBytes / (1024 * 1024)} MB.");
                }

                if (isVideo && file.Length > _maxVideoSizeBytes)
                {
                    throw new InvalidOperationException($"El video '{file.FileName}' supera el límite permitido de {_maxVideoSizeBytes / (1024 * 1024)} MB.");
                }

                var safeFileName = $"{Guid.NewGuid():N}{ext}";
                var targetPath = Path.Combine(basePath, safeFileName);

                using (var stream = new FileStream(targetPath, FileMode.Create))
                {
                    await file.Stream.CopyToAsync(stream);
                }

                var relativeUrl = $"/api/feedback/attachments/{DateTime.Now:yyyyMM}/{safeFileName}";
                adjuntos.Add(new FeedbackAdjuntoDto
                {
                    NombreOriginal = Path.GetFileName(file.FileName),
                    Url = relativeUrl,
                    TipoMime = file.ContentType ?? (isImage ? "image/jpeg" : "video/mp4"),
                    TamanoBytes = file.Length
                });
            }
        }

        var payloadObj = new
        {
            archivos = adjuntos,
            metadata = !string.IsNullOrWhiteSpace(dto.MetadataNavegador) ? dto.MetadataNavegador : null
        };

        var entidad = new InvFeedbackReporte
        {
            Uuid = Guid.NewGuid().ToString(),
            IdUsuario = idUsuario,
            Cedula = cedula,
            NombreUsuario = string.IsNullOrWhiteSpace(nombreUsuario) ? "Usuario Anónimo" : nombreUsuario.Trim(),
            RolUsuario = string.IsNullOrWhiteSpace(rolUsuario) ? "USUARIO" : rolUsuario.Trim().ToUpper(),
            Tipo = string.IsNullOrWhiteSpace(dto.Tipo) ? "SUGERENCIA" : dto.Tipo.Trim().ToUpper(),
            Titulo = dto.Titulo.Trim(),
            Descripcion = dto.Descripcion.Trim(),
            RutaOrigen = dto.RutaOrigen?.Trim(),
            ArchivosAdjuntosJson = (adjuntos.Count > 0 || !string.IsNullOrWhiteSpace(dto.MetadataNavegador)) ? JsonSerializer.Serialize(payloadObj) : null,
            Estado = "PENDIENTE",
            FechaCreacion = DateTime.Now
        };

        _context.InvFeedbackReportes.Add(entidad);
        await _context.SaveChangesAsync();

        // Notificación multicanal inmediata (SignalR tiempo real, Web Push, DB) al Super Administrador
        try
        {
            var tipoLabel = entidad.Tipo == "ERROR" ? "Algo no funciona" : (entidad.Tipo == "DUDA" ? "Falta una opción" : "Incidencia");
            var notifTitulo = $"Incidencia: {tipoLabel}";
            var notifMensaje = $"{entidad.NombreUsuario} ({entidad.RolUsuario}) reportó: {entidad.Titulo}";
            var notifUrl = $"/admin/incidencias?id={entidad.IdFeedback}";
            var notifExtra = new Dictionary<string, string>
            {
                { "Categoria", "SOPORTE" },
                { "Tipo", entidad.Tipo },
                { "FeedbackId", entidad.IdFeedback.ToString() },
                { "FeedbackUuid", entidad.Uuid },
                { "SkipEmail", "true" }
            };

            await _notificationService.NotifyByRoleCodesAsync(
                title: notifTitulo,
                body: notifMensaje,
                roleCodes: new[] { "DIITRA_SUPER_ADMIN", "SUPERADMIN" },
                url: notifUrl,
                extraData: notifExtra,
                excludeUserId: idUsuario
            );
        }
        catch (Exception exNotif)
        {
            _logger.LogWarning(exNotif, "No se pudo despachar la notificación de incidencia al Super Administrador para el reporte {IdFeedback}", entidad.IdFeedback);
        }

        return MapToDto(entidad, adjuntos, dto.MetadataNavegador);
    }

    public async Task<List<FeedbackReporteDto>> GetAllFeedbackAsync(string? tipo = null, string? estado = null)
    {
        var query = _context.InvFeedbackReportes.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(tipo))
        {
            var tipoUpper = tipo.Trim().ToUpper();
            query = query.Where(f => f.Tipo == tipoUpper);
        }

        if (!string.IsNullOrWhiteSpace(estado))
        {
            var estadoUpper = estado.Trim().ToUpper();
            query = query.Where(f => f.Estado == estadoUpper);
        }

        var reportes = await query
            .OrderByDescending(f => f.FechaCreacion)
            .ToListAsync();

        return reportes.Select(r =>
        {
            var (files, meta) = ParsePayload(r.ArchivosAdjuntosJson);
            return MapToDto(r, files, meta);
        }).ToList();
    }

    public async Task<List<FeedbackReporteDto>> GetMyFeedbackAsync(int? idUsuario, string? cedula)
    {
        var query = _context.InvFeedbackReportes.AsNoTracking();

        if (idUsuario.HasValue && !string.IsNullOrWhiteSpace(cedula))
        {
            query = query.Where(f => f.IdUsuario == idUsuario.Value || f.Cedula == cedula);
        }
        else if (idUsuario.HasValue)
        {
            query = query.Where(f => f.IdUsuario == idUsuario.Value);
        }
        else if (!string.IsNullOrWhiteSpace(cedula))
        {
            query = query.Where(f => f.Cedula == cedula);
        }
        else
        {
            return new List<FeedbackReporteDto>();
        }

        var reportes = await query
            .OrderByDescending(f => f.FechaCreacion)
            .ToListAsync();

        return reportes.Select(r =>
        {
            var (files, meta) = ParsePayload(r.ArchivosAdjuntosJson);
            return MapToDto(r, files, meta);
        }).ToList();
    }

    public async Task<FeedbackReporteDto?> UpdateStatusAsync(int idFeedback, UpdateFeedbackStatusDto dto)
    {
        var entidad = await _context.InvFeedbackReportes.FirstOrDefaultAsync(f => f.IdFeedback == idFeedback);
        if (entidad == null) return null;

        entidad.Estado = dto.Estado.Trim().ToUpper();
        entidad.ObservacionAdmin = dto.ObservacionAdmin?.Trim();
        entidad.FechaActualizacion = DateTime.Now;

        await _context.SaveChangesAsync();

        var (files, meta) = ParsePayload(entidad.ArchivosAdjuntosJson);
        return MapToDto(entidad, files, meta);
    }

    public async Task<FeedbackReporteDto?> UpdateUserFeedbackAsync(
        int idFeedback, 
        UpdateUserFeedbackDto dto, 
        int? idUsuario, 
        string? cedula, 
        bool isSuperAdmin)
    {
        var entidad = await _context.InvFeedbackReportes.FirstOrDefaultAsync(f => f.IdFeedback == idFeedback);
        if (entidad == null) return null;

        bool esAutor = (idUsuario.HasValue && entidad.IdUsuario == idUsuario.Value)
            || (!string.IsNullOrWhiteSpace(cedula) && string.Equals(entidad.Cedula, cedula, StringComparison.OrdinalIgnoreCase));

        if (!esAutor && !isSuperAdmin)
        {
            throw new UnauthorizedAccessException("No tienes permiso para modificar este reporte.");
        }

        var estadoNorm = entidad.Estado?.Trim().ToUpperInvariant() ?? "";
        if (!isSuperAdmin && estadoNorm != "PENDIENTE" && estadoNorm != "EN_ESPERA" && estadoNorm != "EN ESPERA")
        {
            throw new InvalidOperationException("Solo puedes editar el reporte mientras se encuentre en espera o pendiente de revisión.");
        }

        if (!string.IsNullOrWhiteSpace(dto.Tipo))
        {
            entidad.Tipo = dto.Tipo.Trim().ToUpper();
        }

        entidad.Titulo = dto.Titulo.Trim();
        entidad.Descripcion = dto.Descripcion.Trim();
        entidad.FechaActualizacion = DateTime.Now;

        await _context.SaveChangesAsync();
        var (files, meta) = ParsePayload(entidad.ArchivosAdjuntosJson);
        return MapToDto(entidad, files, meta);
    }

    public async Task<FeedbackReporteDto?> AddMessageAsync(
        int idFeedback,
        CreateFeedbackMensajeDto dto,
        int? idUsuario,
        string? cedula,
        string nombreUsuario,
        string rolUsuario,
        bool isSuperAdmin)
    {
        if (string.IsNullOrWhiteSpace(dto.Mensaje))
        {
            throw new ArgumentException("El mensaje no puede estar vacío.");
        }

        var entidad = await _context.InvFeedbackReportes.FirstOrDefaultAsync(f => f.IdFeedback == idFeedback);
        if (entidad == null) return null;

        bool esAutor = (idUsuario.HasValue && entidad.IdUsuario == idUsuario.Value)
            || (!string.IsNullOrWhiteSpace(cedula) && string.Equals(entidad.Cedula, cedula, StringComparison.OrdinalIgnoreCase));

        if (!esAutor && !isSuperAdmin)
        {
            throw new UnauthorizedAccessException("No tienes permiso para comentar en este reporte.");
        }

        var estadoNorm = entidad.Estado?.Trim().ToUpperInvariant() ?? "";
        if (!isSuperAdmin && (estadoNorm == "DESCARTADO" || estadoNorm == "CERRADO"))
        {
            throw new InvalidOperationException("No se pueden enviar mensajes en una incidencia cerrada.");
        }

        var mensajes = ParseConversacion(entidad.ConversacionJson);
        var nuevoMensaje = new FeedbackMensajeDto
        {
            Id = Guid.NewGuid().ToString("N"),
            IdUsuario = idUsuario,
            EsAdmin = isSuperAdmin,
            NombreAutor = isSuperAdmin ? "Superadministrador" : (string.IsNullOrWhiteSpace(nombreUsuario) ? "Usuario" : nombreUsuario.Trim()),
            RolAutor = string.IsNullOrWhiteSpace(rolUsuario) ? (isSuperAdmin ? "DIITRA_SUPER_ADMIN" : "USUARIO") : rolUsuario.Trim().ToUpper(),
            Mensaje = dto.Mensaje.Trim(),
            Fecha = DateTime.Now
        };

        mensajes.Add(nuevoMensaje);
        entidad.ConversacionJson = JsonSerializer.Serialize(mensajes);
        entidad.FechaActualizacion = DateTime.Now;

        await _context.SaveChangesAsync();

        // Notificación en tiempo real cruzada (silenciosa en UI, actualiza el hilo instantáneamente)
        try
        {
            var notifExtra = new Dictionary<string, string>
            {
                { "Categoria", "SOPORTE" },
                { "Tipo", entidad.Tipo },
                { "FeedbackId", entidad.IdFeedback.ToString() },
                { "FeedbackUuid", entidad.Uuid },
                { "SkipEmail", "true" }
            };

            if (isSuperAdmin)
            {
                var targetUserId = entidad.IdUsuario;
                if (!targetUserId.HasValue && !string.IsNullOrWhiteSpace(entidad.Cedula))
                {
                    var destUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.IdSigafi == entidad.Cedula);
                    if (destUser != null) targetUserId = destUser.IdUsuario;
                }

                if (targetUserId.HasValue)
                {
                    await _notificationService.NotifyUserAsync(
                        userId: targetUserId.Value,
                        title: $"Nuevo mensaje en: {entidad.Titulo}",
                        body: nuevoMensaje.Mensaje,
                        category: "SOPORTE",
                        url: $"/incidencias?id={entidad.IdFeedback}",
                        extraData: notifExtra
                    );
                }
            }
            else
            {
                await _notificationService.NotifyByRoleCodesAsync(
                    title: $"Nuevo mensaje en: {entidad.Titulo}",
                    body: $"{nuevoMensaje.NombreAutor} ({entidad.RolUsuario}): {nuevoMensaje.Mensaje}",
                    roleCodes: new[] { "DIITRA_SUPER_ADMIN", "SUPERADMIN" },
                    url: $"/admin/incidencias?id={entidad.IdFeedback}",
                    extraData: notifExtra,
                    excludeUserId: idUsuario
                );
            }
        }
        catch (Exception exNotif)
        {
            _logger.LogWarning(exNotif, "No se pudo despachar la sincronización en tiempo real para el mensaje del reporte {IdFeedback}", entidad.IdFeedback);
        }

        var (files, meta) = ParsePayload(entidad.ArchivosAdjuntosJson);
        return MapToDto(entidad, files, meta);
    }

    public async Task<bool> DeleteFeedbackAsync(int idFeedback, int? idUsuario, string? cedula, bool isSuperAdmin)
    {
        var entidad = await _context.InvFeedbackReportes.FirstOrDefaultAsync(f => f.IdFeedback == idFeedback);
        if (entidad == null) return false;

        bool esAutor = (idUsuario.HasValue && entidad.IdUsuario == idUsuario.Value)
            || (!string.IsNullOrWhiteSpace(cedula) && string.Equals(entidad.Cedula, cedula, StringComparison.OrdinalIgnoreCase));

        if (!esAutor && !isSuperAdmin)
        {
            throw new UnauthorizedAccessException("No tienes permiso para eliminar este reporte.");
        }

        var estadoNorm = entidad.Estado?.Trim().ToUpperInvariant() ?? "";
        if (!isSuperAdmin && estadoNorm != "PENDIENTE" && estadoNorm != "EN_ESPERA" && estadoNorm != "EN ESPERA")
        {
            throw new InvalidOperationException("Solo puedes eliminar el reporte mientras se encuentre en espera o pendiente de revisión.");
        }

        // Limpieza de archivos físicos adjuntos
        var (files, _) = ParsePayload(entidad.ArchivosAdjuntosJson);
        foreach (var file in files)
        {
            try
            {
                var segments = file.Url.Split('/', StringSplitOptions.RemoveEmptyEntries);
                if (segments.Length >= 2)
                {
                    var yearMonth = Path.GetFileName(segments[^2]);
                    var fileName = Path.GetFileName(segments[^1]);
                    var root = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var fullPath = Path.Combine(root, "uploads", "feedback", yearMonth, fileName);
                    if (File.Exists(fullPath))
                    {
                        File.Delete(fullPath);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo eliminar el archivo físico {Url}", file.Url);
            }
        }

        int? idUsuarioReporte = entidad.IdUsuario;
        string uuidReporte = entidad.Uuid;
        string tipoReporte = entidad.Tipo;

        _context.InvFeedbackReportes.Remove(entidad);
        await _context.SaveChangesAsync();

        return true;
    }

    private static (List<FeedbackAdjuntoDto> archivos, string? metadata) ParsePayload(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return (new List<FeedbackAdjuntoDto>(), null);
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind == JsonValueKind.Array)
            {
                var list = JsonSerializer.Deserialize<List<FeedbackAdjuntoDto>>(json) ?? new List<FeedbackAdjuntoDto>();
                NormalizeUrls(list);
                return (list, null);
            }
            else if (doc.RootElement.ValueKind == JsonValueKind.Object)
            {
                List<FeedbackAdjuntoDto> files = new();
                string? meta = null;
                if (doc.RootElement.TryGetProperty("archivos", out var filesElem) && filesElem.ValueKind == JsonValueKind.Array)
                {
                    files = JsonSerializer.Deserialize<List<FeedbackAdjuntoDto>>(filesElem.GetRawText()) ?? new();
                    NormalizeUrls(files);
                }
                if (doc.RootElement.TryGetProperty("metadata", out var metaElem))
                {
                    meta = metaElem.ValueKind == JsonValueKind.String ? metaElem.GetString() : metaElem.GetRawText();
                }
                return (files, meta);
            }
        }
        catch { }
        return (new List<FeedbackAdjuntoDto>(), null);
    }

    private static List<FeedbackMensajeDto> ParseConversacion(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<FeedbackMensajeDto>();
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<List<FeedbackMensajeDto>>(json, options) ?? new List<FeedbackMensajeDto>();
        }
        catch
        {
            return new List<FeedbackMensajeDto>();
        }
    }

    private static void NormalizeUrls(List<FeedbackAdjuntoDto> list)
    {
        foreach (var item in list)
        {
            if (!string.IsNullOrEmpty(item.Url) && item.Url.StartsWith("/uploads/feedback/", StringComparison.OrdinalIgnoreCase))
            {
                item.Url = item.Url.Replace("/uploads/feedback/", "/api/feedback/attachments/", StringComparison.OrdinalIgnoreCase);
            }
        }
    }

    private static FeedbackReporteDto MapToDto(InvFeedbackReporte entidad, List<FeedbackAdjuntoDto> adjuntos, string? metadataNavegador = null)
    {
        return new FeedbackReporteDto
        {
            IdFeedback = entidad.IdFeedback,
            Uuid = entidad.Uuid,
            IdUsuario = entidad.IdUsuario,
            Cedula = entidad.Cedula,
            NombreUsuario = entidad.NombreUsuario,
            RolUsuario = entidad.RolUsuario,
            Tipo = entidad.Tipo,
            Titulo = entidad.Titulo,
            Descripcion = entidad.Descripcion,
            RutaOrigen = entidad.RutaOrigen,
            MetadataNavegador = metadataNavegador,
            Archivos = adjuntos,
            Estado = entidad.Estado,
            ObservacionAdmin = entidad.ObservacionAdmin,
            Conversacion = ParseConversacion(entidad.ConversacionJson),
            FechaCreacion = entidad.FechaCreacion,
            FechaActualizacion = entidad.FechaActualizacion
        };
    }
}

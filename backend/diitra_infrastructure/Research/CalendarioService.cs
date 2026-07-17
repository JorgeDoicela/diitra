using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using diitra_application.Research;
using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.Research;

public class CalendarioService : ICalendarioService
{
    private readonly DiitraContext _context;
    private readonly IEmailEngineService _emailEngine;
    private readonly ILogger<CalendarioService> _logger;

    public CalendarioService(
        DiitraContext context,
        IEmailEngineService emailEngine,
        ILogger<CalendarioService> logger)
    {
        _context = context;
        _emailEngine = emailEngine;
        _logger = logger;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EVENTOS — Consulta la vista v_calendario_eventos
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<IEnumerable<CalendarioEventoDto>> GetEventosAsync(
        DateOnly desde, DateOnly hasta, string rolUsuario, int idUsuario)
    {
        var misProyectosIdsStr = "";

        if (rolUsuario != "DIITRA_ADMIN")
        {
            // Obtener IDs de proyectos de interés de forma fuertemente tipada usando LINQ
            var proyectosDocente = await _context.Set<InvProyectoProfesor>()
                .Where(p => p.IdUsuario == idUsuario && (p.Activo ?? true))
                .Select(p => p.IdProyecto)
                .ToListAsync();

            var proyectosAlumno = await _context.Set<InvProyectoAlumno>()
                .Where(a => a.IdUsuario == idUsuario && (a.Activo ?? true))
                .Select(a => a.IdProyecto)
                .ToListAsync();

            var gruposUsuario = await _context.Set<InvGrupoMiembro>()
                .Where(m => m.IdUsuario == idUsuario && (m.Activo ?? true))
                .Select(m => m.IdGrupo)
                .ToListAsync();

            var proyectosGrupo = await _context.Set<InvProyecto>()
                .Where(p => p.IdGrupo.HasValue && (p.Activo ?? true) && gruposUsuario.Contains(p.IdGrupo.Value))
                .Select(p => p.IdProyecto)
                .ToListAsync();

            var misProyectosIds = proyectosDocente
                .Union(proyectosAlumno)
                .Union(proyectosGrupo)
                .Distinct()
                .ToList();

            misProyectosIdsStr = string.Join(",", misProyectosIds);
        }

        var sql = @"
            SELECT
                idEventoCalendario, uuid, titulo, descripcion,
                categoriaGlobal, subcategoria,
                fechaInicio, fechaFin, esTodoElDia, colorHex,
                idEntidadOrigen, uuidEntidadOrigen, tipoEntidadOrigen,
                urlAccion, rolesVisibles, esPrivado, prioridad, estado, creadoPor,
                alertaDias, recurrenciaAnual
            FROM v_calendario_eventos
            WHERE activo = 1
              AND fechaInicio <= {1}
              AND COALESCE(fechaFin, fechaInicio) >= {0}
              AND (rolesVisibles IS NULL OR FIND_IN_SET({2}, rolesVisibles) > 0)
              AND (esPrivado = 0 OR creadoPor = {3})
              AND (
                  {2} = 'DIITRA_ADMIN'
                  OR tipoEntidadOrigen NOT IN ('PROYECTO', 'INFORME_AVANCE', 'PEER_REVIEW')
                  OR (idEntidadOrigen IS NOT NULL AND FIND_IN_SET(idEntidadOrigen, {4}) > 0)
              )
            ORDER BY fechaInicio ASC";

        var eventos = await _context.Database
            .SqlQueryRaw<CalendarioEventoRaw>(sql,
                desde.ToString("yyyy-MM-dd"),
                hasta.ToString("yyyy-MM-dd"),
                rolUsuario,
                idUsuario,
                misProyectosIdsStr)
            .ToListAsync();

        // Expandir eventos con recurrencia anual de la tabla normativa
        var normativos = await _context.Set<InvCalendarioEventoNormativo>()
            .Where(e => e.Activo && e.RecurrenciaAnual)
            .ToListAsync();

        var resultado = eventos.Select(MapRawToDto).ToList();

        foreach (var norm in normativos)
        {
            if (!norm.FechaInicio.HasValue) continue;

            if (!string.IsNullOrEmpty(norm.RolesVisibles) &&
                !norm.RolesVisibles.Split(',').Select(r => r.Trim()).Contains(rolUsuario)) continue;

            // Filtro de privacidad para eventos recurrentes
            if (norm.EsPrivado && norm.CreadoPor != idUsuario) continue;

            // Proyectar la recurrencia en el rango solicitado
            int añoDesde = desde.Year;
            int añoHasta = hasta.Year;
            for (int año = añoDesde; año <= añoHasta; año++)
            {
                if (norm.RecurrenciaHasta.HasValue && año > norm.RecurrenciaHasta.Value.Year) break;
                var fechaOcurrencia = new DateOnly(año, norm.FechaInicio.Value.Month, norm.FechaInicio.Value.Day);
                if (fechaOcurrencia < desde || fechaOcurrencia > hasta) continue;

                // No duplicar si ya existe por el SELECT de la vista (mismo año de creación)
                var idCompuesto = $"NORM-{norm.IdEvento}-{año}";
                if (resultado.Any(e => e.IdEventoCalendario == idCompuesto)) continue;

                resultado.Add(new CalendarioEventoDto(
                    idCompuesto, norm.Uuid, norm.Titulo, norm.Descripcion,
                    "Normativo", norm.TipoEvento,
                    fechaOcurrencia, norm.FechaFin.HasValue
                        ? new DateOnly(año, norm.FechaFin.Value.Month, norm.FechaFin.Value.Day)
                        : null,
                    norm.EsTodoElDia, norm.ColorHex,
                    norm.IdEvento, norm.Uuid, "CALENDARIO_NORMATIVO",
                    norm.UrlAccion, norm.RolesVisibles,
                    norm.EsPrivado, norm.Prioridad, norm.Estado, norm.CreadoPor,
                    norm.AlertaDias, norm.RecurrenciaAnual
                ));
            }
        }

        return resultado.OrderBy(e => e.FechaInicio);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // iCAL FEED — RFC 5545
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<string?> GenerarIcalFeedAsync(string token)
    {
        var record = await _context.Set<InvIcalToken>()
            .FirstOrDefaultAsync(t => t.Token == token && t.Activo);
        if (record == null) return null;

        // Actualizar timestamp de uso
        record.FechaUltimoUso = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Obtener usuario para determinar su rol
        var usuario = await _context.Users.FindAsync(record.IdUsuario);
        var rol = "DIITRA_DOCENTE"; // fallback
        if (usuario != null)
        {
            var userRole = await _context.UserRoles
                .Include(ur => ur.Role)
                .Where(ur => ur.IdUsuario == usuario.IdUsuario && (ur.EsActivo ?? true))
                .FirstOrDefaultAsync();
            if (userRole?.Role != null)
            {
                rol = userRole.Role.CodigoRol;
            }
        }

        var desde = DateOnly.FromDateTime(DateTime.Today.AddMonths(-1));
        var hasta = DateOnly.FromDateTime(DateTime.Today.AddMonths(6));
        var eventos = await GetEventosAsync(desde, hasta, rol, record.IdUsuario);

        var sb = new StringBuilder();
        sb.AppendLine("BEGIN:VCALENDAR");
        sb.AppendLine("VERSION:2.0");
        sb.AppendLine("PRODID:-//DIITRA//IST Traversari//ES");
        sb.AppendLine("CALSCALE:GREGORIAN");
        sb.AppendLine("METHOD:PUBLISH");
        sb.AppendLine("X-WR-CALNAME:DIITRA — Calendario Institucional");
        sb.AppendLine("X-WR-TIMEZONE:America/Guayaquil");

        foreach (var ev in eventos)
        {
            sb.AppendLine("BEGIN:VEVENT");
            sb.AppendLine($"UID:{ev.IdEventoCalendario}@diitra.isttraversari.edu.ec");
            sb.AppendLine($"DTSTART;VALUE=DATE:{ev.FechaInicio:yyyyMMdd}");
            if (ev.FechaFin.HasValue)
                sb.AppendLine($"DTEND;VALUE=DATE:{ev.FechaFin.Value.AddDays(1):yyyyMMdd}");
            else
                sb.AppendLine($"DTEND;VALUE=DATE:{ev.FechaInicio.AddDays(1):yyyyMMdd}");
            sb.AppendLine($"SUMMARY:{EscapeIcal(ev.Titulo)}");
            if (!string.IsNullOrEmpty(ev.Descripcion))
                sb.AppendLine($"DESCRIPTION:{EscapeIcal(ev.Descripcion)}");
            if (!string.IsNullOrEmpty(ev.UrlAccion))
                sb.AppendLine($"URL:https://diitra.isttraversari.edu.ec{ev.UrlAccion}");
            sb.AppendLine($"CATEGORIES:{ev.CategoriaGlobal}");
            sb.AppendLine("END:VEVENT");
        }

        sb.AppendLine("END:VCALENDAR");
        return sb.ToString();
    }

    public async Task<string> GenerarORegenerarTokenIcalAsync(int idUsuario)
    {
        var existing = await _context.Set<InvIcalToken>()
            .FirstOrDefaultAsync(t => t.IdUsuario == idUsuario);

        var nuevoToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLower();

        if (existing != null)
        {
            existing.Token = nuevoToken;
            existing.FechaGenerado = DateTime.UtcNow;
            existing.Activo = true;
        }
        else
        {
            _context.Set<InvIcalToken>().Add(new InvIcalToken
            {
                Uuid = Guid.NewGuid().ToString(),
                IdUsuario = idUsuario,
                Token = nuevoToken,
                Activo = true,
                FechaGenerado = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return nuevoToken;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CRUD Normativos
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<IEnumerable<EventoNormativoDto>> GetNormativosAsync()
    {
        return await _context.Set<InvCalendarioEventoNormativo>()
            .OrderBy(e => e.FechaInicio)
            .Select(e => ToDto(e))
            .ToListAsync();
    }

    public async Task<string> CreateNormativoAsync(EventoNormativoDto dto, int idUsuarioAdmin)
    {
        var uuid = Guid.NewGuid().ToString();
        var entity = new InvCalendarioEventoNormativo
        {
            Uuid = uuid,
            Titulo = dto.Titulo,
            Descripcion = dto.Descripcion,
            TipoEvento = dto.TipoEvento,
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin,
            EsTodoElDia = dto.EsTodoElDia,
            RecurrenciaAnual = dto.RecurrenciaAnual,
            RecurrenciaHasta = dto.RecurrenciaHasta,
            RolesVisibles = dto.RolesVisibles,
            ModuloOrigen = dto.ModuloOrigen,
            UrlAccion = dto.UrlAccion,
            ColorHex = dto.ColorHex ?? "#6B7280",
            AlertaDias = dto.AlertaDias,
            Activo = dto.Activo,
            EsPrivado = dto.EsPrivado,
            Prioridad = dto.Prioridad,
            Estado = dto.Estado,
            CreadoPor = idUsuarioAdmin,
            NotaDetalle = dto.NotaDetalle,
            OrdenBandeja = dto.OrdenBandeja
        };
        _context.Set<InvCalendarioEventoNormativo>().Add(entity);
        await _context.SaveChangesAsync();
        return uuid;
    }

    public async Task<bool> UpdateNormativoAsync(string uuid, EventoNormativoDto dto)
    {
        var entity = await _context.Set<InvCalendarioEventoNormativo>()
            .FirstOrDefaultAsync(e => e.Uuid == uuid);
        if (entity == null) return false;

        entity.Titulo = dto.Titulo;
        entity.Descripcion = dto.Descripcion;
        entity.TipoEvento = dto.TipoEvento;
        entity.FechaInicio = dto.FechaInicio;
        entity.FechaFin = dto.FechaFin;
        entity.EsTodoElDia = dto.EsTodoElDia;
        entity.RecurrenciaAnual = dto.RecurrenciaAnual;
        entity.RecurrenciaHasta = dto.RecurrenciaHasta;
        entity.RolesVisibles = dto.RolesVisibles;
        entity.ModuloOrigen = dto.ModuloOrigen;
        entity.UrlAccion = dto.UrlAccion;
        entity.ColorHex = dto.ColorHex ?? "#6B7280";
        entity.AlertaDias = dto.AlertaDias;
        entity.Activo = dto.Activo;
        entity.EsPrivado = dto.EsPrivado;
        entity.Prioridad = dto.Prioridad;
        entity.Estado = dto.Estado;
        entity.NotaDetalle = dto.NotaDetalle;
        entity.OrdenBandeja = dto.OrdenBandeja;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteNormativoAsync(string uuid)
    {
        var entity = await _context.Set<InvCalendarioEventoNormativo>()
            .FirstOrDefaultAsync(e => e.Uuid == uuid);
        if (entity == null) return false;
        _context.Set<InvCalendarioEventoNormativo>().Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ALERTAS DIARIAS
    // ─────────────────────────────────────────────────────────────────────────
    public async Task ProcesarAlertasDiariasAsync()
    {
        _logger.LogInformation("[Calendario] Procesando alertas diarias...");

        // Obtener todos los usuarios activos
        var usuarios = await _context.Users
            .Where(u => u.Activo)
            .ToListAsync();

        var hoy = DateOnly.FromDateTime(DateTime.Today);

        // Obtener TODOS los eventos (normativos y personales) con alerta configurada
        var eventos = await _context.Set<InvCalendarioEventoNormativo>()
            .Where(e => e.Activo && e.AlertaDias.HasValue && e.AlertaDias.Value >= 0)
            .ToListAsync();

        foreach (var usuario in usuarios)
        {
            // Determinar rol del usuario
            var userRole = await _context.UserRoles
                .Include(ur => ur.Role)
                .Where(ur => ur.IdUsuario == usuario.IdUsuario && (ur.EsActivo ?? true))
                .FirstOrDefaultAsync();
            var rol = userRole?.Role?.CodigoRol ?? "DIITRA_DOCENTE";

            try
            {
                foreach (var evento in eventos)
                {
                    if (!evento.FechaInicio.HasValue) continue;

                    // ── Filtro de privacidad ──────────────────────────────────
                    // Eventos privados/personales solo van al creador, no a todos
                    if (evento.EsPrivado && evento.CreadoPor != usuario.IdUsuario) continue;

                    // ── Filtro de roles (solo para eventos no privados) ───────
                    if (!evento.EsPrivado &&
                        !string.IsNullOrEmpty(evento.RolesVisibles) &&
                        !evento.RolesVisibles.Split(',').Select(r => r.Trim()).Contains(rol)) continue;

                    // ── Proyección de Recurrencia Anual para la Alerta ───────
                    DateOnly fechaInicioOcurrencia = evento.FechaInicio.Value;
                    if (evento.RecurrenciaAnual)
                    {
                        // Si ya expiró la recurrencia, la ignoramos
                        if (evento.RecurrenciaHasta.HasValue && hoy.Year > evento.RecurrenciaHasta.Value.Year) continue;
                        
                        fechaInicioOcurrencia = new DateOnly(hoy.Year, evento.FechaInicio.Value.Month, evento.FechaInicio.Value.Day);
                    }

                    // No alertar si el evento de este año ya pasó antes del día de hoy
                    if (fechaInicioOcurrencia < hoy) continue;

                    var fechaAlerta = fechaInicioOcurrencia.AddDays(-(evento.AlertaDias ?? 0));
                    
                    // Tolerancia a fallos: alertamos si hoy es igual o posterior a la fecha programada
                    if (fechaAlerta > hoy) continue;

                    var idCompuesto = $"NORM-{evento.IdEvento}";

                    // Verificar si ya se envió esta alerta para la ocurrencia de este año/fecha
                    var yaEnviada = await _context.Set<InvCalendarioAlertaEnviada>()
                        .AnyAsync(a =>
                            a.IdEventoCalendario == idCompuesto &&
                            a.IdUsuario == usuario.IdUsuario &&
                            a.FechaEvento == evento.FechaInicio.Value);

                    if (yaEnviada) continue;

                    // Enviar email usando el motor existente
                    try
                    {
                        var diasRestantes = evento.FechaInicio.Value.DayNumber - hoy.DayNumber;
                        var sendRequest = new EmailSendRequest
                        {
                            TemplateCodigo = "CALENDARIO_ALERTA_EVENTO",
                            DestinatariosEmails = new List<string> { usuario.EmailInstitucional ?? "" },
                            TemplateData = new Dictionary<string, string>
                            {
                                ["[[titulo_evento]]"]      = evento.Titulo,
                                ["[[dias_restantes]]"]     = diasRestantes.ToString(),
                                ["[[fecha_evento]]"]       = evento.FechaInicio.Value.ToString("dd 'de' MMMM 'de' yyyy"),
                                ["[[descripcion_evento]]"] = evento.Descripcion ?? "",
                                ["[[url_accion]]"]         = evento.UrlAccion ?? "/calendario",
                                ["[[nombre_usuario]]"]     = usuario.Nombre ?? usuario.EmailInstitucional ?? ""
                            }
                        };

                        await _emailEngine.SendTemplatedEmailAsync(sendRequest);

                        // Registrar alerta enviada para no duplicar
                        _context.Set<InvCalendarioAlertaEnviada>().Add(new InvCalendarioAlertaEnviada
                        {
                            IdEventoCalendario = idCompuesto,
                            IdUsuario          = usuario.IdUsuario,
                            FechaEvento        = evento.FechaInicio.Value,
                            FechaEnvio         = DateTime.UtcNow
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "[Calendario] Error al enviar alerta al usuario {Id}", usuario.IdUsuario);
                    }
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Calendario] Error procesando usuario {Id}", usuario.IdUsuario);
            }
        }

        _logger.LogInformation("[Calendario] Alertas diarias procesadas.");
    }

    public async Task<IEnumerable<EventoNormativoDto>> GetStickyNotesAsync(int idUsuario)
    {
        // Notas sin fecha = Inbox. Se ordenan primero por OrdenBandeja (manual),
        // luego por fecha de registro descendente como fallback.
        return await _context.Set<InvCalendarioEventoNormativo>()
            .Where(e => e.CreadoPor == idUsuario && e.FechaInicio == null && e.Activo)
            .OrderBy(e => e.OrdenBandeja == null ? 1 : 0)
            .ThenBy(e => e.OrdenBandeja)
            .ThenByDescending(e => e.FechaRegistro)
            .Select(e => ToDto(e))
            .ToListAsync();
    }

    public async Task<bool> DevolverAInboxAsync(string uuid, int idUsuario)
    {
        var entity = await _context.Set<InvCalendarioEventoNormativo>()
            .FirstOrDefaultAsync(e => e.Uuid == uuid && e.CreadoPor == idUsuario);
        if (entity == null) return false;

        entity.FechaInicio = null;
        entity.FechaFin = null;
        entity.Estado = "Inbox";
        entity.OrdenBandeja = null; // Irá al fondo de la bandeja

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task ReordenarBandejaAsync(IEnumerable<ReordenarBandejaItem> items, int idUsuario)
    {
        var uuids = items.Select(i => i.Uuid).ToList();
        var entities = await _context.Set<InvCalendarioEventoNormativo>()
            .Where(e => uuids.Contains(e.Uuid) && e.CreadoPor == idUsuario && e.FechaInicio == null)
            .ToListAsync();

        foreach (var item in items)
        {
            var entity = entities.FirstOrDefault(e => e.Uuid == item.Uuid);
            if (entity != null)
                entity.OrdenBandeja = item.Orden;
        }

        await _context.SaveChangesAsync();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    private static CalendarioEventoDto MapRawToDto(CalendarioEventoRaw r) => new(
        r.IdEventoCalendario, r.Uuid, r.Titulo, r.Descripcion,
        r.CategoriaGlobal, r.Subcategoria,
        r.FechaInicio, r.FechaFin, r.EsTodoElDia, r.ColorHex,
        r.IdEntidadOrigen, r.UuidEntidadOrigen, r.TipoEntidadOrigen,
        r.UrlAccion, r.RolesVisibles,
        r.EsPrivado, r.Prioridad, r.Estado, r.CreadoPor,
        r.AlertaDias, r.RecurrenciaAnual
    );

    private static EventoNormativoDto ToDto(InvCalendarioEventoNormativo e) => new(
        e.Uuid, e.Titulo, e.Descripcion, e.TipoEvento,
        e.FechaInicio, e.FechaFin, e.EsTodoElDia,
        e.RecurrenciaAnual, e.RecurrenciaHasta,
        e.RolesVisibles, e.ModuloOrigen, e.UrlAccion,
        e.ColorHex, e.AlertaDias, e.Activo,
        e.EsPrivado, e.Prioridad, e.Estado,
        e.NotaDetalle, e.OrdenBandeja
    );

    private static string EscapeIcal(string s) =>
        s.Replace("\\", "\\\\").Replace(";", "\\;").Replace(",", "\\,").Replace("\n", "\\n");
}

// Clase auxiliar para mapear la vista SQL cruda
internal class CalendarioEventoRaw
{
    public string IdEventoCalendario { get; set; } = "";
    public string Uuid { get; set; } = "";
    public string Titulo { get; set; } = "";
    public string? Descripcion { get; set; }
    public string CategoriaGlobal { get; set; } = "";
    public string Subcategoria { get; set; } = "";
    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public bool EsTodoElDia { get; set; }
    public string? ColorHex { get; set; }
    public int? IdEntidadOrigen { get; set; }
    public string? UuidEntidadOrigen { get; set; }
    public string TipoEntidadOrigen { get; set; } = "";
    public string? UrlAccion { get; set; }
    public string? RolesVisibles { get; set; }
    public bool EsPrivado { get; set; }
    public string Prioridad { get; set; } = "Media";
    public string Estado { get; set; } = "Pendiente";
    public int? CreadoPor { get; set; }
    public int? AlertaDias { get; set; }
    public bool RecurrenciaAnual { get; set; } = false;
}

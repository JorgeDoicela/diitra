namespace diitra_application.Research;

public record CalendarioEventoDto(
    string IdEventoCalendario,
    string Uuid,
    string Titulo,
    string? Descripcion,
    string CategoriaGlobal,
    string Subcategoria,
    DateOnly FechaInicio,
    DateOnly? FechaFin,
    bool EsTodoElDia,
    string? ColorHex,
    int? IdEntidadOrigen,
    string? UuidEntidadOrigen,
    string TipoEntidadOrigen,
    string? UrlAccion,
    string? RolesVisibles,
    bool EsPrivado,
    string Prioridad,
    string Estado,
    int? CreadoPor,
    int? AlertaDias,
    bool RecurrenciaAnual
);

public record EventoNormativoDto(
    string? Uuid,
    string Titulo,
    string? Descripcion,
    string TipoEvento,
    DateOnly? FechaInicio,
    DateOnly? FechaFin,
    bool EsTodoElDia,
    bool RecurrenciaAnual,
    DateOnly? RecurrenciaHasta,
    string? RolesVisibles,
    string? ModuloOrigen,
    string? UrlAccion,
    string? ColorHex,
    int? AlertaDias,
    bool Activo,
    bool EsPrivado,
    string Prioridad,
    string Estado,
    // Notas Rápidas — campos extendidos
    string? NotaDetalle = null,
    int? OrdenBandeja = null
);

/// <summary>Payload para reordenar notas en la bandeja Inbox.</summary>
public record ReordenarBandejaItem(string Uuid, int Orden);

public interface ICalendarioService
{
    /// <summary>Obtiene todos los eventos del rango indicado, filtrados por rol y idUsuario (para eventos privados).</summary>
    Task<IEnumerable<CalendarioEventoDto>> GetEventosAsync(DateOnly desde, DateOnly hasta, string rolUsuario, int idUsuario);

    /// <summary>Genera el feed .ics (iCalendar RFC 5545) para un token de suscripción dado.</summary>
    Task<string?> GenerarIcalFeedAsync(string token);

    /// <summary>Genera o regenera el token iCal personal del usuario.</summary>
    Task<string> GenerarORegenerarTokenIcalAsync(int idUsuario);

    // ── CRUD normativos y personales ──────────────────────────────────────────────
    Task<IEnumerable<EventoNormativoDto>> GetNormativosAsync();
    Task<string> CreateNormativoAsync(EventoNormativoDto dto, int idUsuarioAdmin);
    Task<bool> UpdateNormativoAsync(string uuid, EventoNormativoDto dto);
    Task<bool> DeleteNormativoAsync(string uuid);

    /// <summary>Obtiene las notas adhesivas/rápidas sin programar del usuario, ordenadas por OrdenBandeja.</summary>
    Task<IEnumerable<EventoNormativoDto>> GetStickyNotesAsync(int idUsuario);

    /// <summary>Devuelve un evento del Kanban a la bandeja Inbox (limpia FechaInicio, estado = Inbox).</summary>
    Task<bool> DevolverAInboxAsync(string uuid, int idUsuario);

    /// <summary>Reordena las notas de la bandeja actualizando OrdenBandeja en batch.</summary>
    Task ReordenarBandejaAsync(IEnumerable<ReordenarBandejaItem> items, int idUsuario);

    /// <summary>Llamado por el job diario: envía alertas por email de eventos próximos.</summary>
    Task ProcesarAlertasDiariasAsync();
}

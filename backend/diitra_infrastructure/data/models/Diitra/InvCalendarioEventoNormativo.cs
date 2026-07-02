namespace diitra_infrastructure.data.models;

public partial class InvCalendarioEventoNormativo
{
    public int IdEvento { get; set; }
    public string Uuid { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public string? Descripcion { get; set; }
    public string TipoEvento { get; set; } = "Normativo";
    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public bool EsTodoElDia { get; set; } = true;
    public bool RecurrenciaAnual { get; set; } = false;
    public DateOnly? RecurrenciaHasta { get; set; }
    public string? RolesVisibles { get; set; }
    public string? ModuloOrigen { get; set; }
    public string? UrlAccion { get; set; }
    public string? ColorHex { get; set; } = "#6B7280";
    public int? AlertaDias { get; set; } = 7;
    public bool Activo { get; set; } = true;
    public int? CreadoPor { get; set; }
    public DateTime FechaRegistro { get; set; }
    public DateTime FechaModificacion { get; set; }
}

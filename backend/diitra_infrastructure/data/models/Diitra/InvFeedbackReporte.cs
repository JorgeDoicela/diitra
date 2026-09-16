using System;

namespace diitra_infrastructure.data.models;

public partial class InvFeedbackReporte
{
    public int IdFeedback { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int? IdUsuario { get; set; }
    public string? Cedula { get; set; }
    public string NombreUsuario { get; set; } = null!;
    public string RolUsuario { get; set; } = null!;
    public string Tipo { get; set; } = "SUGERENCIA"; // SUGERENCIA | ERROR | DUDA
    public string Titulo { get; set; } = null!;
    public string Descripcion { get; set; } = null!;
    public string? RutaOrigen { get; set; }
    public string? ArchivosAdjuntosJson { get; set; }
    public string? ConversacionJson { get; set; }
    public string Estado { get; set; } = "PENDIENTE"; // PENDIENTE | EN_REVISION | ATENDIDO | DESCARTADO
    public string? ObservacionAdmin { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.Now;
    public DateTime? FechaActualizacion { get; set; }
}

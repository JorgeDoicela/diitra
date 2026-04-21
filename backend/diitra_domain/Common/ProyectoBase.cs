namespace diitra_domain.Common;

public abstract class ProyectoBase : IEntity<int>, IAuditable
{
    public int Id { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public string Titulo { get; set; } = string.Empty;
    public string Resumen { get; set; } = string.Empty;
    public string Metodologia { get; set; } = string.Empty;
    public string Justificacion { get; set; } = string.Empty;
    public decimal PresupuestoAsignado { get; set; }
    public decimal PresupuestoEjecutado { get; set; }
    public EstadoProyecto Estado { get; set; } = EstadoProyecto.Borrador;
    public int Version { get; set; } = 1;
    
    // Auditable members
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

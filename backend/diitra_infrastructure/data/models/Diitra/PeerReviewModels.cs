using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace diitra_infrastructure.data.models;

[Table("inv_revisiones_pares")]
public class InvRevisionesPares
{
    [Key]
    public int IdRevision { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int IdProyecto { get; set; }
    public int IdRevisor { get; set; }
    public DateTime FechaAsignacion { get; set; } = DateTime.Now;
    public DateTime FechaLimite { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public bool EsExterno { get; set; }
    public string? ObservacionesGral { get; set; }

    [ForeignKey("IdProyecto")]
    public virtual InvProyecto Proyecto { get; set; } = null!;
    
    // Suponiendo que existe un modelo Usuario o similar
    // [ForeignKey("IdRevisor")]
    // public virtual Usuario Revisor { get; set; } = null!;

    public virtual ICollection<InvEvaluacionesDetalle> Detalles { get; set; } = new List<InvEvaluacionesDetalle>();
}

[Table("inv_evaluaciones_detalle")]
public class InvEvaluacionesDetalle
{
    [Key]
    public int IdDetalle { get; set; }
    public int IdRevision { get; set; }
    public string Criterio { get; set; } = null!;
    public decimal Puntaje { get; set; }
    public string? Observaciones { get; set; }

    [ForeignKey("IdRevision")]
    public virtual InvRevisionesPares Revision { get; set; } = null!;
}

using diitra_domain.Common;

namespace diitra_domain.Research;

public class InvestigacionProyecto : ProyectoBase
{
    public string LineaInvestigacion { get; set; } = string.Empty;
    public string CodigoInstitucional { get; set; } = string.Empty;
    public bool AnonimizadoParaRevision { get; set; }
    public decimal PuntajeEvaluacion { get; set; }
    
    // Peer review details would go here
    public List<string> RevisoresAsignados { get; set; } = new();
}

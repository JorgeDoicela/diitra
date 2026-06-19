using diitra_domain.Common;

namespace diitra_domain.Research;

public class InvestigacionProyecto : ProyectoBase
{
    public string LineaInvestigacion { get; set; } = string.Empty;
    public string CodigoInstitucional { get; set; } = string.Empty;
    public bool AnonimizadoParaRevision { get; set; }
    public decimal PuntajeEvaluacion { get; set; }

    // Extensiones Core
    public string? IdDspaceHandle { get; set; }
    public string? MetadataCacesJson { get; set; }

    // Peer review details
    public List<string> RevisoresAsignados { get; set; } = new();
}

namespace diitra_application.Research.Dtos;

public class PeerReviewDto
{
    public string Uuid { get; set; } = null!;
    public int IdProyecto { get; set; }
    public string ProyectoUuid { get; set; } = null!;
    public string ProyectoTitulo { get; set; } = null!;
    public int IdRevisor { get; set; }
    public string RevisorNombre { get; set; } = null!;
    public DateTime FechaAsignacion { get; set; }
    public DateTime FechaLimite { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public bool EsExterno { get; set; }
}

public class CreatePeerReviewDto
{
    public int IdProyecto { get; set; }
    public int IdRevisor { get; set; }
    public DateTime FechaLimite { get; set; }
    public bool EsExterno { get; set; }
}

public class EvaluationDto
{
    public string RevisionUuid { get; set; } = null!;
    public List<EvaluationDetailDto> Detalles { get; set; } = new();
    public string? ObservacionesGral { get; set; }
}

public class EvaluationDetailDto
{
    public string Criterio { get; set; } = null!;
    public decimal Puntaje { get; set; }
    public string? Observaciones { get; set; }
}

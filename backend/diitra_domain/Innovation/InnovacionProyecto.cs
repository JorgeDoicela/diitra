using diitra_domain.Common;

namespace diitra_domain.Innovation;

public class InnovacionProyecto : ProyectoBase
{
    public string TipoPropiedadIntelectual { get; set; } = string.Empty; // Patente, Software, DerechoAutor
    public string NumeroRegistroSENADI { get; set; } = string.Empty;
    public string EmpresaTransferencia { get; set; } = string.Empty;
    public bool PublicadoEnRepositorio { get; set; }
    public string DSpaceUrl { get; set; } = string.Empty;
}

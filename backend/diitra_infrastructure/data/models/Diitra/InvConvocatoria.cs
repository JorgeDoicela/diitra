using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvConvocatoria
{
    public int IdConvocatoria { get; set; }
    public string Uuid { get; set; } = null!;
    public string CodigoConvocatoria { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public string IdPeriodo { get; set; } = null!;
    public DateOnly FechaApertura { get; set; }
    public DateOnly FechaCierre { get; set; }
    public string Estado { get; set; } = "Borrador";

    public virtual Periodo IdPeriodoNavigation { get; set; } = null!;
    public virtual ICollection<InvProyecto> Proyectos { get; set; } = new List<InvProyecto>();
}

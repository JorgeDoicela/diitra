using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvInformeAvance
{
    public int IdInforme { get; set; }
    public int IdProyecto { get; set; }
    public string NumeroInforme { get; set; } = null!;
    public DateOnly FechaInforme { get; set; }
    public string? ResumenActividades { get; set; }
    public decimal PorcentajeAvance { get; set; }
    public string Estado { get; set; } = "Borrador";
    public DateTime? FechaRegistro { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual ICollection<InvEvidencia> InvEvidencias { get; set; } = new List<InvEvidencia>();
}

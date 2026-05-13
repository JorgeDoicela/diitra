using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvRubrica
{
    public int IdRubrica { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public string Version { get; set; } = "1.0";
    public bool Activo { get; set; } = true;
    public DateTime FechaRegistro { get; set; } = DateTime.Now;

    public virtual ICollection<InvConvocatoria> Convocatorias { get; set; } = new List<InvConvocatoria>();
    public virtual ICollection<InvRubricaCriterio> InvRubricaCriterios { get; set; } = new List<InvRubricaCriterio>();
}

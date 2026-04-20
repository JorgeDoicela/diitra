using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvLineaInvestigacion
{
    public int IdLinea { get; set; }

    public string NombreLinea { get; set; } = null!;

    public string? Descripcion { get; set; }

    public string? ResolucionAprobacion { get; set; }

    public sbyte? Activo { get; set; }

    public virtual ICollection<InvConvocatoria> InvConvocatorias { get; set; } = new List<InvConvocatoria>();
}

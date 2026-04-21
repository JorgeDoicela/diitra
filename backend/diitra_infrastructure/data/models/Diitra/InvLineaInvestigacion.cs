using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvLineaInvestigacion
{
    public int IdLinea { get; set; }

    public string Uuid { get; set; } = Guid.NewGuid().ToString();

    public string CodigoLinea { get; set; } = null!;

    public string NombreLinea { get; set; } = null!;

    public string? Descripcion { get; set; }

    public string? ResolucionAprobacion { get; set; }

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public DateTime FechaModificacion { get; set; } = DateTime.UtcNow;

    public int Version { get; set; } = 1;

    public sbyte? Activo { get; set; }

    public virtual ICollection<InvConvocatoria> InvConvocatorias { get; set; } = new List<InvConvocatoria>();
}

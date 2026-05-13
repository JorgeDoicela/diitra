using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvConvocatoriaHito
{
    public int IdHito { get; set; }
    public string Uuid { get; set; } = null!;
    public int IdConvocatoria { get; set; }
    public string NombreHito { get; set; } = null!;
    public DateOnly FechaHito { get; set; }
    public bool? EsCritico { get; set; }
    public string? Descripcion { get; set; }

    public virtual InvConvocatoria IdConvocatoriaNavigation { get; set; } = null!;
}

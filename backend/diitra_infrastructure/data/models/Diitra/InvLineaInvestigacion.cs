using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvLineaInvestigacion
{
    public int IdLinea { get; set; }
    public string Uuid { get; set; } = null!;
    public string CodigoLinea { get; set; } = null!;
    public string NombreLinea { get; set; } = null!;
    public string? Descripcion { get; set; }
    public bool? Activo { get; set; }
    public DateTime? FechaRegistro { get; set; }

    public virtual ICollection<InvSublinea> InvSublineas { get; set; } = new List<InvSublinea>();
}

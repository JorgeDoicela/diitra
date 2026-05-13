using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvCatTipoEvidencia
{
    public int IdTipoEvidencia { get; set; }
    public string Uuid { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public string? Extensiones { get; set; }
    public bool? Activo { get; set; }

    public virtual ICollection<InvEvidencia> InvEvidencias { get; set; } = new List<InvEvidencia>();
}

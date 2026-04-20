using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class UsuarioRol
{
    public int IdUsuarioRol { get; set; }

    public string Usuario { get; set; } = null!;

    public int IdRol { get; set; }

    public DateOnly? FechaCreacion { get; set; }

    public DateOnly? FechaModificacion { get; set; }

    public sbyte? EsActivo { get; set; }

    public virtual Rol IdRolNavigation { get; set; } = null!;
}

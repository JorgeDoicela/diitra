using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Rol
{
    public int IdRol { get; set; }

    public string Nombre { get; set; } = null!;

    public string CodigoRol { get; set; } = null!;

    public sbyte? EsActivo { get; set; }
    public virtual ICollection<UsuarioRol> UsuarioRols { get; set; } = new List<UsuarioRol>();
}

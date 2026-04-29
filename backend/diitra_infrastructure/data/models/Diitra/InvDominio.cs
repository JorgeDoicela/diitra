using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvDominio
{
    public int IdDominio { get; set; }
    public string Uuid { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public bool? Activo { get; set; }
    public DateTime? FechaRegistro { get; set; }

    public virtual ICollection<InvDominioCarrera> InvDominiosCarreras { get; set; } = new List<InvDominioCarrera>();
    public virtual ICollection<InvProyectoDominio> InvProyectosDominios { get; set; } = new List<InvProyectoDominio>();
}

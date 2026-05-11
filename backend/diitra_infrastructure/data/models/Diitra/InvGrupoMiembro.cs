using System;
using System.Collections.Generic;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;

public partial class InvGrupoMiembro
{
    public int IdGrupoMiembro { get; set; }
    public int IdGrupo { get; set; }
    public int IdUsuario { get; set; }
    public string? Rol { get; set; }
    public bool? Activo { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }

    public virtual InvGrupoInvestigacion IdGrupoNavigation { get; set; } = null!;
    public virtual User IdUsuarioNavigation { get; set; } = null!;
}

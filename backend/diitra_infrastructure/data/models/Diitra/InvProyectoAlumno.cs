using System;
using System.Collections.Generic;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;

public partial class InvProyectoAlumno
{
    public int IdProyectoAlumno { get; set; }
    public int IdProyecto { get; set; }
    public int IdUsuario { get; set; }
    public string? Rol { get; set; }
    public string? NivelAcademico { get; set; }
    public string? Telefono { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual User IdUsuarioNavigation { get; set; } = null!;
}

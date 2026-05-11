using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvGrupoMiembro
{
    public int IdGrupoMiembro { get; set; }
    public int IdGrupo { get; set; }
    public string? IdProfesor { get; set; }
    public string? IdAlumno { get; set; }
    public string? Rol { get; set; }
    public bool? Activo { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }

    public virtual InvGrupoInvestigacion IdGrupoNavigation { get; set; } = null!;
    public virtual Profesore? IdProfesorNavigation { get; set; }
    public virtual Alumno? IdAlumnoNavigation { get; set; }
}

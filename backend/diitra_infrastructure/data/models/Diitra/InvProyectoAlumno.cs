using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvProyectoAlumno
{
    public int IdProyectoAlumno { get; set; }
    public int IdProyecto { get; set; }
    public string IdAlumno { get; set; } = null!;
    public string? Rol { get; set; }
    public string? NivelAcademico { get; set; }
    public string? Telefono { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual Alumno IdAlumnoNavigation { get; set; } = null!;
}

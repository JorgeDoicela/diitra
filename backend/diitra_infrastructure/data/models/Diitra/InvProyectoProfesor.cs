using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvProyectoProfesor
{
    public int IdProyectoProfesor { get; set; }
    public int IdProyecto { get; set; }
    public string IdProfesor { get; set; } = null!;
    public bool? EsDirector { get; set; }
    public string? Rol { get; set; }
    public string? NivelAcademico { get; set; }
    public string? Telefono { get; set; }
    public decimal? HorasSemanales { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual Profesore IdProfesorNavigation { get; set; } = null!;
}

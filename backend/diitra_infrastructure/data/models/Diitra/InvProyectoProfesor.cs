using System;
using System.Collections.Generic;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;

public partial class InvProyectoProfesor
{
    public int IdProyectoProfesor { get; set; }
    public int IdProyecto { get; set; }
    public int IdUsuario { get; set; }
    public bool? EsDirector { get; set; }
    public string? Rol { get; set; }
    public string? NivelAcademico { get; set; }
    public string? Telefono { get; set; }
    public decimal? HorasSemanales { get; set; }
    public bool? Activo { get; set; } = true;
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public string? MotivoCambio { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual User IdUsuarioNavigation { get; set; } = null!;
}

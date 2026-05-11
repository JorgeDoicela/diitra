using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Periodo
{
    public string IdPeriodo { get; set; } = null!;
    public string? Detalle { get; set; }
    public DateOnly? FechaInicial { get; set; }
    public DateOnly? FechaFinal { get; set; }
    public bool? Cerrado { get; set; }
    public DateOnly? FechaMaximaAutocierre { get; set; }
    public bool? Activo { get; set; }
    public bool? Creditos { get; set; }
    public uint? NumeroPagos { get; set; }
    public DateOnly? FechaMatruclaExtraordinaria { get; set; }
    public int? Foliop { get; set; }
    public sbyte? PermiteMatricula { get; set; }
    public sbyte? IngresoCalificaciones { get; set; }
    public sbyte? PermiteCalificacionesInstituto { get; set; }
    public sbyte? Periodoactivoinstituto { get; set; }
    public sbyte? VisualizaPowerBi { get; set; }
    public sbyte? EsInstituto { get; set; }
    public sbyte? PeriodoPlanificacion { get; set; }
    public virtual ICollection<Matricula> Matriculas { get; set; } = new List<Matricula>();

    public virtual ICollection<ProfesoresCarrerasPeriodo> ProfesoresCarrerasPeriodos { get; set; } = new List<ProfesoresCarrerasPeriodo>();

    public virtual ICollection<ProfesoresDedicacion> ProfesoresDedicacions { get; set; } = new List<ProfesoresDedicacion>();
}

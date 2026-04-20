using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Carrera
{
    public int IdCarrera { get; set; }

    public string? Carrera1 { get; set; }

    public DateOnly? FechaCreacion { get; set; }

    public bool? Activa { get; set; }

    public string? DirectorCarrera { get; set; }

    public int? NumeroCreditos { get; set; }

    public int? OrdenCarrera { get; set; }

    public int? NumeroAlumnos { get; set; }

    public sbyte? RevisaArrastres { get; set; }

    public string? CodigoCases { get; set; }

    public string? AliasCarrera { get; set; }

    public bool? BolsaEmpleo { get; set; }

    public sbyte? EsInstituto { get; set; }
    public virtual ICollection<Espacio> Espacios { get; set; } = new List<Espacio>();

    public virtual ICollection<ProfesoresCarrerasPeriodo> ProfesoresCarrerasPeriodos { get; set; } = new List<ProfesoresCarrerasPeriodo>();

}

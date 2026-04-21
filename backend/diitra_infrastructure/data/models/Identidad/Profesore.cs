using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Profesore
{
    public string IdProfesor { get; set; } = null!;

    public string? Tipodocumento { get; set; }

    public string? Apellidos { get; set; }

    public string? Nombres { get; set; }

    public string? PrimerApellido { get; set; }

    public string? SegundoApellido { get; set; }

    public string? PrimerNombre { get; set; }

    public string? SegundoNombre { get; set; }

    public int EstadoCivil { get; set; }

    public string? Direccion { get; set; }

    public string? CallePrincipal { get; set; }

    public string? CalleSecundaria { get; set; }

    public string? NumeroCasa { get; set; }

    public string? Telefono { get; set; }

    public string? Celular { get; set; }

    public string? Email { get; set; }

    public DateOnly? FechaNacimiento { get; set; }

    public string? Sexo { get; set; }

    public string? Clave { get; set; }

    public sbyte? Practicas { get; set; }

    public string? Tipo { get; set; }

    public string? Nacionalidad { get; set; }

    public string? Titulo { get; set; }

    public string? Abreviatura { get; set; }

    public string? AbreviaturaPost { get; set; }

    public sbyte? Activo { get; set; }

    public int? IdEtnia { get; set; }

    public int? IdNacionalidad { get; set; }

    public int? IdParroquiaNacimiento { get; set; }

    public string? EmailInstitucional { get; set; }

    public DateOnly? FechaIngreso { get; set; }

    public DateOnly? FechaIngresoIess { get; set; }

    public DateOnly? FechaRetiro { get; set; }

    public int? IdParroquiaResidencia { get; set; }

    public string? TipoSangre { get; set; } = null!;

    public string? CodigoPostal { get; set; }

    public int? IdDiscapacidad { get; set; }

    public int? PorcentajeDiscapacidad { get; set; }

    public string? NumeroConadis { get; set; }

    public string? Foto { get; set; }

    public sbyte? EsReal { get; set; }
    public virtual Discapacidade IdDiscapacidadNavigation { get; set; } = null!;

    public virtual Etnia IdEtniaNavigation { get; set; } = null!;

    public virtual ICollection<ProfesoresCarrerasPeriodo> ProfesoresCarrerasPeriodos { get; set; } = new List<ProfesoresCarrerasPeriodo>();

    public virtual ICollection<ProfesoresDedicacion> ProfesoresDedicacions { get; set; } = new List<ProfesoresDedicacion>();

    public virtual ICollection<TitulosProfesore> TitulosProfesores { get; set; } = new List<TitulosProfesore>();
}

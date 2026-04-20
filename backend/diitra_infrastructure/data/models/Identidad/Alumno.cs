using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Alumno
{
    public string IdAlumno { get; set; } = null!;

    public string? TipoDocumento { get; set; }

    public string? ApellidoPaterno { get; set; }

    public string? ApellidoMaterno { get; set; }

    public string? PrimerNombre { get; set; }

    public string? SegundoNombre { get; set; }

    public DateOnly? FechaNacimiento { get; set; }

    public string? Direccion { get; set; }

    public string? Telefono { get; set; }

    public string? Celular { get; set; }

    public string? Email { get; set; }

    public string? CiudadNacimiento { get; set; }

    public string? ProvinciaNacimiento { get; set; }

    public byte[]? Foto { get; set; }

    public string? Sexo { get; set; }

    public string? Nacionalidad { get; set; }

    public int? IdNivel { get; set; }

    public string? IdPeriodo { get; set; }

    public int? IdSeccion { get; set; }

    public int? IdModalidad { get; set; }

    public int? IdInstitucion { get; set; }

    public string? TituloColegio { get; set; }

    public DateTime? FechaInscripcion { get; set; }

    public string? ParroquiaNacimiento { get; set; }

    public string? NombrePadre { get; set; }

    public string? OcupacionPadre { get; set; }

    public string? NacionalidadPadre { get; set; }

    public string? NombreMadre { get; set; }

    public string? OcupacionMadre { get; set; }

    public string? NacionalidadMadre { get; set; }

    public string? BarrioResidencia { get; set; }

    public string? ParroquiaResidencia { get; set; }

    public string? CiudadResidencia { get; set; }

    public string? TipoSangre { get; set; }

    public string? UserAlumno { get; set; }

    public string? Password { get; set; }

    public int? IdDiscapacidad { get; set; }

    public int? IdEtnia { get; set; }

    public int? IdNacionalidad { get; set; }

    public int? PorcentajeDiscapacidad { get; set; }

    public string? CarnetConadis { get; set; }

    public string? EmailInstitucional { get; set; }

    public sbyte? PrimerIngreso { get; set; }

    public string? Archivofoto { get; set; }
    public virtual ICollection<Matricula> Matriculas { get; set; } = new List<Matricula>();
}

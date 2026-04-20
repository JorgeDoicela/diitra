using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class TitulosProfesore
{
    public int IdTitulosProfesor { get; set; }

    public string IdProfesor { get; set; } = null!;

    public string? Titulo { get; set; }

    public int IdUniversidad { get; set; }

    public int IdGradoAcademico { get; set; }

    public string? CodigoSenescyt { get; set; }

    public DateOnly? FechaObtencion { get; set; }

    public DateOnly? FechaRegistro { get; set; }

    public int IdCampoDetalladoUnesco { get; set; }

    public string? ArchivoTitulo { get; set; }

    public virtual CampoDetalladoUnesco IdCampoDetalladoUnescoNavigation { get; set; } = null!;

    public virtual GradosAcademico IdGradoAcademicoNavigation { get; set; } = null!;

    public virtual Profesore IdProfesorNavigation { get; set; } = null!;

    public virtual Universidade IdUniversidadNavigation { get; set; } = null!;
}

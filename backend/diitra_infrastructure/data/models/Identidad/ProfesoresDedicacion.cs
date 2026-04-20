using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class ProfesoresDedicacion
{
    public int IdProfesoresDedicacion { get; set; }

    public string IdProfesor { get; set; } = null!;

    public int IdDedicacionCategorias { get; set; }

    public string IdPeriodo { get; set; } = null!;

    public sbyte? EsActivo { get; set; }
    public virtual Periodo IdPeriodoNavigation { get; set; } = null!;

    public virtual Profesore IdProfesorNavigation { get; set; } = null!;
}

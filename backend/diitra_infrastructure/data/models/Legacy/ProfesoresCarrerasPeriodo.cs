using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class ProfesoresCarrerasPeriodo
{
    public int IdProfesoresCarrerasPeriodos { get; set; }

    public string IdPeriodo { get; set; } = null!;

    public string IdProfesor { get; set; } = null!;

    public int? IdCarrera { get; set; }

    public sbyte? EsActivo { get; set; }

    public sbyte? SonTodas { get; set; }

    public virtual Carrera? IdCarreraNavigation { get; set; }

    public virtual Periodo IdPeriodoNavigation { get; set; } = null!;

    public virtual Profesore IdProfesorNavigation { get; set; } = null!;
}

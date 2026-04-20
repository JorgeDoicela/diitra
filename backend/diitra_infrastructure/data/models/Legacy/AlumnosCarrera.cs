using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class AlumnosCarrera
{
    public string IdAlumno { get; set; } = null!;

    public int IdCarrera { get; set; }

    public sbyte? Convalidacion { get; set; }

    public string? CarreraConvalidada { get; set; }

    public string? InstitucionConvalidada { get; set; }

    public int? CreditosConvalidados { get; set; }

    public sbyte? Pasantias { get; set; }

    public decimal? NotaPasantia { get; set; }

    public int? CreditosPasantia { get; set; }

    public sbyte? TrabajoGrado { get; set; }

    public decimal? NotaDocumento { get; set; }

    public decimal? NotaDefensa { get; set; }

    public decimal? NotaTesis { get; set; }

    public int? CreditosTitulo { get; set; }
}

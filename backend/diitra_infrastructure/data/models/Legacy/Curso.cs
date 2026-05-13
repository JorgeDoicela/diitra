using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Curso
{
    public int IdNivel { get; set; }

    public int IdCarrera { get; set; }

    public string? Nivel { get; set; }

    public int? Jerarquia { get; set; }

    public int? Orden { get; set; }

    public sbyte? EsRecuperacion { get; set; }

    public string? AliasCurso { get; set; }
}

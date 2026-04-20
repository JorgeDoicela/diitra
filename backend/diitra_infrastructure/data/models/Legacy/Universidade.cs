using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Universidade
{
    public int IdUniversidad { get; set; }

    public int Idpaises { get; set; }

    public string? Nombre { get; set; }

    public string? CodigoSiees { get; set; }
    public virtual ICollection<TitulosProfesore> TitulosProfesores { get; set; } = new List<TitulosProfesore>();
}

using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Etnia
{
    public int IdEtnia { get; set; }

    public string? Etnia1 { get; set; }

    public sbyte? EsIndigena { get; set; }

    public sbyte? NoRegistra { get; set; }

    public virtual ICollection<Profesore> Profesores { get; set; } = new List<Profesore>();
}

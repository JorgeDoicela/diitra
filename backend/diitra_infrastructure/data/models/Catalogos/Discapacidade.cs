using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Discapacidade
{
    public int IdDiscapacidad { get; set; }

    public string? Discapacidad { get; set; }

    public sbyte? EsDefecto { get; set; }

    public virtual ICollection<Profesore> Profesores { get; set; } = new List<Profesore>();
}

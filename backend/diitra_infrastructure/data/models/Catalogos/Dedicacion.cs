using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Dedicacion
{
    public int IdDedicacion { get; set; }

    public string? Nombre { get; set; }
    public virtual ICollection<HorasAcademica> HorasAcademicas { get; set; } = new List<HorasAcademica>();

}

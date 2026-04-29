using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvOds
{
    public int IdOds { get; set; }
    public int IdEje { get; set; }
    public int NumeroOds { get; set; }
    public string Titulo { get; set; } = null!;

    public virtual InvOdsEje IdEjeNavigation { get; set; } = null!;
    public virtual ICollection<InvProyectoOds> InvProyectosOds { get; set; } = new List<InvProyectoOds>();
}

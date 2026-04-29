using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvOdsEje
{
    public int IdEje { get; set; }
    public string Nombre { get; set; } = null!;

    public virtual ICollection<InvOds> InvOds { get; set; } = new List<InvOds>();
}

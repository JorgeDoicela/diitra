using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvDominioCarrera
{
    public int IdDominioCarrera { get; set; }
    public int IdDominio { get; set; }
    public int IdCarrera { get; set; }

    public virtual InvDominio IdDominioNavigation { get; set; } = null!;
    public virtual Carrera IdCarreraNavigation { get; set; } = null!;
}

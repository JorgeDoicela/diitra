using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvCronogramaSemana
{
    public int IdSemana { get; set; }
    public int IdTarea { get; set; }
    public int NumeroSemana { get; set; }
    public bool Planificado { get; set; }
    public bool? Ejecutado { get; set; }

    public virtual InvCronograma IdTareaNavigation { get; set; } = null!;
}

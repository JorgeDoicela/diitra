using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvCronograma
{
    public int IdTarea { get; set; }
    public int IdProyecto { get; set; }
    public int? IdObjetivo { get; set; }
    public string NombreTarea { get; set; } = null!;
    public string? Entregable { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual InvObjetivoProyecto? IdObjetivoNavigation { get; set; }
    public virtual ICollection<InvCronogramaSemana> InvCronogramaSemanas { get; set; } = new List<InvCronogramaSemana>();
}

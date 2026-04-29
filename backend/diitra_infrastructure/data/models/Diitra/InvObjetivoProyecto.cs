using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvObjetivoProyecto
{
    public int IdObjetivo { get; set; }
    public int IdProyecto { get; set; }
    public sbyte EsGeneral { get; set; }
    public string Descripcion { get; set; } = null!;
    public int? Orden { get; set; }

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual ICollection<InvCronograma> InvCronogramas { get; set; } = new List<InvCronograma>();
}

using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvRubricaCriterio
{
    public int IdCriterio { get; set; }
    public int IdRubrica { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public decimal PesoPorcentaje { get; set; }
    public int? Orden { get; set; }

    public virtual InvRubrica IdRubricaNavigation { get; set; } = null!;
}

using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvTipoConvocatoria
{
    public int IdTipoConvocatoria { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
}

public partial class InvAgendaZonal
{
    public int IdAgendaZonal { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
}

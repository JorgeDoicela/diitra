using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class FechasHorario
{
    public int IdFecha { get; set; }

    public DateOnly? Fecha { get; set; }

    public sbyte? Finsemana { get; set; }

    public string? Dia { get; set; }
}

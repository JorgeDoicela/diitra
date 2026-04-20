using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class HorasClase
{
    public int Idhora { get; set; }

    public int? IdSeccion { get; set; }

    public int? IdCarrera { get; set; }

    public string? HoraInicio { get; set; }

    public string? HoraFin { get; set; }

    public int? Minutos { get; set; }

    public int? NumeroHora { get; set; }

    public string? Tipo { get; set; }

    public sbyte? Activo { get; set; }
}

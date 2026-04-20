using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Asignatura
{
    public int IdAsignatura { get; set; }

    public string? Asignatura1 { get; set; }

    public bool? Anulada { get; set; }

    public string? Codigo { get; set; }
}

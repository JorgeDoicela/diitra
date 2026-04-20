using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class Departamento
{
    public int Iddepartamentos { get; set; }

    public string? NombreDepartamento { get; set; }

    public string? Abreviacion { get; set; }

    public string? Descripcion { get; set; }
}

using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InstitucionesInstituto
{
    public int IdInstitucionesInstituto { get; set; }

    public string? Nombre { get; set; }

    public string? Ruc { get; set; }

    public string? Ubicado { get; set; }

    public string? Representante { get; set; }

    public string? CedulaRepresentante { get; set; }
}

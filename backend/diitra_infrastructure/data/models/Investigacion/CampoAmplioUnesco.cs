using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class CampoAmplioUnesco
{
    public int IdCampoAmplioUnesco { get; set; }

    public string? Nombre { get; set; }

    public string? CodigoAmplio { get; set; }

    public sbyte? Activo { get; set; }

    public virtual ICollection<CampoEspecificoUnesco> CampoEspecificoUnescos { get; set; } = new List<CampoEspecificoUnesco>();
}

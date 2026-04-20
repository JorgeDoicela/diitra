using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class CampoEspecificoUnesco
{
    public int IdCampospecificoUnesco { get; set; }

    public int? IdCampoAmplioUnesco { get; set; }

    public string? NombreEspecifico { get; set; }

    public string? CodigoEspecifico { get; set; }

    public sbyte? Activo { get; set; }

    public virtual ICollection<CampoDetalladoUnesco> CampoDetalladoUnescos { get; set; } = new List<CampoDetalladoUnesco>();

    public virtual CampoAmplioUnesco? IdCampoAmplioUnescoNavigation { get; set; }
}

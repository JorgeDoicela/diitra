using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class CampoDetalladoUnesco
{
    public int IdCampoDetalladoUnesco { get; set; }

    public int? IdCampospecificoUnesco { get; set; }

    public string? NombreDetallado { get; set; }

    public string? CodigoDetallado { get; set; }

    public sbyte? Activo { get; set; }

    public virtual CampoEspecificoUnesco? IdCampospecificoUnescoNavigation { get; set; }

    public virtual ICollection<TitulosProfesore> TitulosProfesores { get; set; } = new List<TitulosProfesore>();

}

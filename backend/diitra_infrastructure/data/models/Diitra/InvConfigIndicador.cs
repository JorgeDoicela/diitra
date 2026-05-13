using System;
using System.Collections.Generic;

namespace diitra_infrastructure.data.models;

public partial class InvConfigIndicador
{
    public int IdConfig { get; set; }
    public int? IdInstitucion { get; set; }
    public string CodigoIndicador { get; set; } = null!;
    public string NombreIndicador { get; set; } = null!;
    public string? Descripcion { get; set; }
    public string? TipoDato { get; set; } // Cantidad, Monto, Booleano, Porcentaje
    public decimal? ValorReferencia { get; set; }
    public int AñoNormativa { get; set; }
    public bool? Activo { get; set; }
}

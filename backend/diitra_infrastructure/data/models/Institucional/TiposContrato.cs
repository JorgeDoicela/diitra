using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace diitra_infrastructure.data.models;

[Table("tipos_contratos")]
public class TiposContrato
{
    [Key]
    [Column("idTiposContratos")]
    public int IdTiposContratos { get; set; }

    [Column("nombre")]
    public string? Nombre { get; set; }

    [Column("codigo")]
    public string? Codigo { get; set; }
}

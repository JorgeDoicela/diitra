using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace diitra_infrastructure.data.models;

[Table("contratos")]
public class Contrato
{
    [Key]
    [Column("idContratos")]
    public int IdContrato { get; set; }

    [Column("idProfesor")]
    public string IdProfesor { get; set; } = string.Empty;

    [Column("idTiposContratos")]
    public int? IdTiposContratos { get; set; }

    [Column("esActivo")]
    public sbyte? EsActivo { get; set; }

    [ForeignKey("IdTiposContratos")]
    public virtual TiposContrato? TipoContratoNavigation { get; set; }
}

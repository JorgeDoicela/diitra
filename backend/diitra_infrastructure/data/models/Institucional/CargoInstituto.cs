using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace diitra_infrastructure.data.models;

[Table("cargo_instituto")]
public class CargoInstituto
{
    [Key]
    [Column("idCargoInstituto")]
    public int IdCargoInstituto { get; set; }

    [Column("idTipoFuncionario")]
    public int IdTipoFuncionario { get; set; }

    [Column("nombre")]
    public string? Nombre { get; set; }

    [Column("disponibilidad_cargo")]
    public int? DisponibilidadCargo { get; set; }
}

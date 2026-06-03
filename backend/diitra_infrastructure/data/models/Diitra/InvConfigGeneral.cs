using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace diitra_infrastructure.data.models
{
    [Table("inv_config_general")]
    public class InvConfigGeneral
    {
        [Key]
        [MaxLength(100)]
        public string Clave { get; set; } = null!;

        [Required]
        public string Valor { get; set; } = null!;

        [MaxLength(255)]
        public string? Descripcion { get; set; }
    }
}

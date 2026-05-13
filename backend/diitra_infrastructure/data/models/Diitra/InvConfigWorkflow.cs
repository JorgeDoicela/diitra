using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace diitra_infrastructure.data.models
{
    [Table("inv_config_workflow")]
    public class InvConfigWorkflow
    {
        [Key]
        public int IdWorkflow { get; set; }

        public int? IdTipoProyecto { get; set; }

        [Required]
        [MaxLength(50)]
        public string EstadoOrigen { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string EstadoDestino { get; set; } = null!;

        [MaxLength(100)]
        public string? RolRequerido { get; set; }

        public bool RequiereObservacion { get; set; } = true;

        public bool Activo { get; set; } = true;

        [ForeignKey("IdTipoProyecto")]
        public virtual InvTipoInvestigacion? TipoProyecto { get; set; }
    }
}

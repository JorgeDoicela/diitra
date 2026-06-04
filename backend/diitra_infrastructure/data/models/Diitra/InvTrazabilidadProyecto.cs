using System;

namespace diitra_infrastructure.data.models
{
    public partial class InvTrazabilidadProyecto
    {
        public int IdTrazabilidad { get; set; }
        public string Uuid { get; set; } = null!;
        public int IdProyecto { get; set; }
        public int? IdUsuario { get; set; }
        public string EstadoAnterior { get; set; } = null!;
        public string EstadoNuevo { get; set; } = null!;
        public string? Observacion { get; set; }
        public DateTime? FechaTransicion { get; set; }
        public string? HashAnterior { get; set; }
        public string? HashActual { get; set; }

        public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    }
}

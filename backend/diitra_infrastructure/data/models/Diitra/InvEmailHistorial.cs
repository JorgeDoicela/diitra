using System;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models
{
    public partial class InvEmailHistorial
    {
        public int IdEmailHistorial { get; set; }
        public string Uuid { get; set; } = null!;
        public string Destinatario { get; set; } = null!;
        public int? IdUsuarioDestinatario { get; set; }
        public string Asunto { get; set; } = null!;
        public string Cuerpo { get; set; } = null!;
        public string Estado { get; set; } = "Pendiente"; // Pendiente, Enviado, Fallido
        public string? ErrorMensaje { get; set; }
        public DateTime FechaEnvio { get; set; } = DateTime.UtcNow;
        
        // Mapped to JSON columns
        public string? AdjuntosJson { get; set; }
        public string? MetadataJson { get; set; }

        // Navigation
        public virtual User? IdUsuarioDestinatarioNavigation { get; set; }
    }
}

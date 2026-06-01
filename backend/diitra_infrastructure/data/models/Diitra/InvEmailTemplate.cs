using System;

namespace diitra_infrastructure.data.models
{
    public partial class InvEmailTemplate
    {
        public int IdEmailTemplate { get; set; }
        public string Uuid { get; set; } = null!;
        public string Codigo { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string Asunto { get; set; } = null!;
        public string CuerpoHtml { get; set; } = null!;
        public bool Activo { get; set; } = true;
        public DateTime FechaCreado { get; set; } = DateTime.UtcNow;
        public DateTime FechaActualizado { get; set; } = DateTime.UtcNow;
    }
}

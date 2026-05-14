using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace diitra_infrastructure.data.models.Cowork
{
    /// <summary>
    /// Metadatos de secciones de un documento colaborativo.
    /// Permite rastrear el estado de cada sección de un informe o proyecto.
    /// </summary>
    [Table("inv_documentos_secciones_metadata")]
    public class InvDocumentoSeccionMetadata
    {
        [Key]
        [Column("idMetadata")]
        [JsonPropertyName("idMetadata")]
        public int IdMetadata { get; set; }

        [Column("instanceUuid", TypeName = "varchar(100)")]
        [Required, MaxLength(100)]
        [JsonPropertyName("documentoUuid")]
        public string DocumentoUuid { get; set; } = string.Empty;

        [Column("sectionName")]
        [Required, MaxLength(100)]
        [JsonPropertyName("seccionNombre")]
        public string SeccionNombre { get; set; } = string.Empty;

        [Column("status")]
        [Required, MaxLength(50)]
        [JsonPropertyName("estado")]
        public string Estado { get; set; } = "Borrador";

        [Column("lastUserUuid", TypeName = "varchar(36)")]
        [MaxLength(36)]
        [JsonPropertyName("ultimoUsuarioUuid")]
        public string? UltimoUsuarioUuid { get; set; }

        [Column("actualizadoEn")]
        public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;
    }

    [Table("inv_collaboration_comments")]
    public class InvCollaborationComment
    {
        [Key]
        [Column("idComment")]
        [JsonPropertyName("idComentario")]
        public int IdComentario { get; set; }

        [Column("instanceUuid", TypeName = "varchar(100)")]
        [Required, MaxLength(100)]
        [JsonPropertyName("documentoUuid")]
        public string DocumentoUuid { get; set; } = string.Empty;

        [Column("userUuid", TypeName = "varchar(36)")]
        [Required, MaxLength(36)]
        [JsonPropertyName("usuarioUuid")]
        public string UsuarioUuid { get; set; } = string.Empty;

        [Column("userName")]
        [Required, MaxLength(255)]
        [JsonPropertyName("nombreUsuario")]
        public string NombreUsuario { get; set; } = string.Empty;

        [Column("content", TypeName = "text")]
        [Required]
        [JsonPropertyName("contenido")]
        public string Contenido { get; set; } = string.Empty;

        [Column("parentId")]
        [JsonPropertyName("idPadre")]
        public int? IdPadre { get; set; }

        [Column("creadoEn")]
        [JsonPropertyName("creadoEn")]
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(IdPadre))]
        public virtual InvCollaborationComment? Padre { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
        public int IdMetadata { get; set; }

        [Column("documentoUuid", TypeName = "varchar(100)")]
        [Required, MaxLength(100)]
        public string DocumentoUuid { get; set; } = string.Empty;

        [Column("seccionNombre")]
        [Required, MaxLength(100)]
        public string SeccionNombre { get; set; } = string.Empty;

        [Column("estado")]
        [Required, MaxLength(50)]
        public string Estado { get; set; } = "Borrador"; // Borrador, En Revisión, Aprobado

        [Column("asignadoAUuid", TypeName = "varchar(36)")]
        [MaxLength(36)]
        public string? AsignadoAUuid { get; set; }

        [Column("ultimaModificacionPor", TypeName = "varchar(36)")]
        [MaxLength(36)]
        public string? UltimaModificacionPor { get; set; }

        [Column("actualizadoEn")]
        public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Comentarios colaborativos vinculados a un documento o instancia.
    /// Soporta hilos de conversación (threaded comments).
    /// </summary>
    [Table("inv_collaboration_comments")]
    public class InvCollaborationComment
    {
        [Key]
        [Column("idComentario")]
        public int IdComentario { get; set; }

        [Column("uuid", TypeName = "varchar(36)")]
        [Required, MaxLength(36)]
        public string Uuid { get; set; } = Guid.NewGuid().ToString();

        [Column("documentoUuid", TypeName = "varchar(100)")]
        [Required, MaxLength(100)]
        public string DocumentoUuid { get; set; } = string.Empty;

        [Column("usuarioUuid", TypeName = "varchar(36)")]
        [Required, MaxLength(36)]
        public string UsuarioUuid { get; set; } = string.Empty;

        [Column("nombreUsuario")]
        [Required, MaxLength(255)]
        public string NombreUsuario { get; set; } = string.Empty;

        [Column("contenido", TypeName = "text")]
        [Required]
        public string Contenido { get; set; } = string.Empty;

        [Column("idPadre")]
        public int? IdPadre { get; set; }

        [Column("estaResuelto")]
        public bool EstaResuelto { get; set; } = false;

        [Column("creadoEn")]
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(IdPadre))]
        public virtual InvCollaborationComment? Padre { get; set; }
    }
}

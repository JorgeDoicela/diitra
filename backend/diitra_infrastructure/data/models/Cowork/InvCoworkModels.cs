// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Modelos de Entity Framework
// Mapea las tablas inv_cowork_documentos e inv_cowork_sesiones
// ═══════════════════════════════════════════════════════════════════

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace diitra_infrastructure.data.models.Cowork
{
    /// <summary>
    /// Representa el estado persistente de un documento colaborativo Yjs.
    /// Tabla: inv_cowork_documentos
    /// </summary>
    [Table("inv_cowork_documentos")]
    public class InvCoworkDocumento
    {
        [Key]
        [Column("idDocumento")]
        public int IdDocumento { get; set; }

        /// <summary>UUID público del documento (generalmente = UUID del proyecto).</summary>
        [Column("uuid", TypeName = "varchar(100)")]
        [Required, MaxLength(100)]
        public string Uuid { get; set; } = string.Empty;

        /// <summary>Tipo de entidad que contiene este documento (PROYECTO, INFORME_AVANCE, etc.).</summary>
        [Column("entidadTipo")]
        [Required, MaxLength(50)]
        public string EntidadTipo { get; set; } = "PROYECTO";

        /// <summary>UUID de la entidad padre (el proyecto, el informe, etc.).</summary>
        [Column("entidadUuid", TypeName = "varchar(36)")]
        [Required, MaxLength(36)]
        public string EntidadUuid { get; set; } = string.Empty;

        /// <summary>Nombre del campo del formulario (antecedentes, metodologia, etc.).</summary>
        [Column("campoNombre")]
        [Required, MaxLength(100)]
        public string CampoNombre { get; set; } = "contenido_principal";

        /// <summary>
        /// Estado binario completo del Yjs Doc.
        /// Se actualiza en cada SendYjsUpdate que recibe el hub.
        /// NULL si el documento nunca fue editado.
        /// </summary>
        [Column("yjsState")]
        public byte[]? YjsState { get; set; }

        /// <summary>
        /// Versión en HTML puro del contenido (Snapshot).
        /// Se actualiza cuando el cliente lo envía explícitamente o al finalizar.
        /// El DIITRA Builder usa este campo para generar los PDF oficiales.
        /// </summary>
        [Column("contentHtml")]
        public string? ContentHtml { get; set; }

        /// <summary>
        /// Versión en JSON (Tiptap) del contenido.
        /// Útil para análisis de datos por el IA Assistant.
        /// </summary>
        [Column("contentJson")]
        public string? ContentJson { get; set; }

        /// <summary>Versión del documento (incrementa en cada update).</summary>
        [Column("version")]
        public int Version { get; set; } = 0;

        [Column("creadoEn")]
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        [Column("actualizadoEn")]
        public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Registro de auditoría de acceso a documentos colaborativos.
    /// Cumple LOPDP Art. 26 — trazabilidad de acceso a datos con propiedad intelectual.
    /// Tabla: inv_cowork_sesiones
    /// </summary>
    [Table("inv_cowork_sesiones")]
    public class InvCoworkSesion
    {
        [Key]
        [Column("idSesion")]
        public int IdSesion { get; set; }

        [Column("documentoUuid", TypeName = "varchar(100)")]
        [Required, MaxLength(100)]
        public string DocumentoUuid { get; set; } = string.Empty;

        [Column("usuarioUuid", TypeName = "varchar(36)")]
        [Required, MaxLength(36)]
        public string UsuarioUuid { get; set; } = string.Empty;

        [Column("nombreUsuario")]
        [Required, MaxLength(255)]
        public string NombreUsuario { get; set; } = string.Empty;

        [Column("rolUsuario")]
        [Required, MaxLength(100)]
        public string RolUsuario { get; set; } = string.Empty;

        [Column("signalrConId")]
        [MaxLength(255)]
        public string? SignalrConId { get; set; }

        [Column("seccionNombre", TypeName = "varchar(100)")]
        [MaxLength(100)]
        public string? SeccionNombre { get; set; }

        [Column("accion", TypeName = "varchar(255)")]
        [MaxLength(255)]
        public string? Accion { get; set; }

        [Column("conectadoEn")]
        public DateTime ConectadoEn { get; set; } = DateTime.UtcNow;

        /// <summary>NULL mientras la sesión esté activa.</summary>
        [Column("desconectadoEn")]
        public DateTime? DesconectadoEn { get; set; }
    }

    /// <summary>
    /// Almacena los deltas (actualizaciones incrementales) de Yjs.
    /// Estrategia Append-Only para evitar corrupción de datos.
    /// </summary>
    [Table("inv_cowork_updates")]
    public class InvCoworkUpdate
    {
        [Key]
        [Column("idUpdate")]
        public int IdUpdate { get; set; }

        [Column("documentoUuid", TypeName = "varchar(100)")]
        [Required, MaxLength(100)]
        public string DocumentoUuid { get; set; } = string.Empty;

        /// <summary>El delta binario generado por Yjs.</summary>
        [Column("updateData")]
        [Required]
        public byte[] UpdateData { get; set; } = Array.Empty<byte>();

        [Column("creadoEn")]
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    }
}

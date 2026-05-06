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
        [Column("uuid")]
        [Required, MaxLength(36)]
        public string Uuid { get; set; } = string.Empty;

        /// <summary>Tipo de entidad que contiene este documento (PROYECTO, INFORME_AVANCE, etc.).</summary>
        [Column("entidadTipo")]
        [Required, MaxLength(50)]
        public string EntidadTipo { get; set; } = "PROYECTO";

        /// <summary>UUID de la entidad padre (el proyecto, el informe, etc.).</summary>
        [Column("entidadUuid")]
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

        [Column("documentoUuid")]
        [Required, MaxLength(36)]
        public string DocumentoUuid { get; set; } = string.Empty;

        [Column("usuarioUuid")]
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

        [Column("conectadoEn")]
        public DateTime ConectadoEn { get; set; } = DateTime.UtcNow;

        /// <summary>NULL mientras la sesión esté activa.</summary>
        [Column("desconectadoEn")]
        public DateTime? DesconectadoEn { get; set; }
    }
}

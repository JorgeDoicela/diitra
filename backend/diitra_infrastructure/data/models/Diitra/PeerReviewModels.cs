using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;

// ─────────────────────────────────────────────────────────────────────────────
//  REVISIONES DE PARES
//  Tabla: inv_revisiones_pares
// ─────────────────────────────────────────────────────────────────────────────
[Table("inv_revisiones_pares")]
public class InvRevisionesPares
{
    [Key]
    public int IdRevision { get; set; }
    public string Uuid { get; set; } = Guid.NewGuid().ToString();
    public int IdProyecto { get; set; }
    /// <summary>
    /// Referencia al evaluador (interno o externo) en la tabla usuarios.
    /// </summary>
    public int? IdRevisor { get; set; }
    public DateTime FechaAsignacion { get; set; } = DateTime.Now;
    public DateTime FechaLimite { get; set; }
    /// <summary>Fecha en que el árbitro completó su evaluación (para KPI de tiempo promedio).</summary>
    public DateTime? FechaCompletado { get; set; }
    public string Estado { get; set; } = "Pendiente";
    /// <summary>Dictamen individual: Pendiente | Aprueba | Rechaza (calculado al completar evaluación).</summary>
    public string DictamenRevisor { get; set; } = "Pendiente";
    public bool EsExterno { get; set; }
    public bool EsDobleCiego { get; set; } = true;
    public decimal? PuntajeTotal { get; set; }
    public string? ObservacionesGral { get; set; }

    [ForeignKey("IdProyecto")]
    public virtual InvProyecto Proyecto { get; set; } = null!;

    [ForeignKey("IdRevisor")]
    public virtual User? Revisor { get; set; }

    public virtual ICollection<InvEvaluacionesDetalle> Detalles { get; set; } = new List<InvEvaluacionesDetalle>();
}

[Table("inv_evaluaciones_detalle")]
public class InvEvaluacionesDetalle
{
    [Key]
    public int IdDetalle { get; set; }
    public int IdRevision { get; set; }
    public string Criterio { get; set; } = null!;
    public decimal Puntaje { get; set; }
    public string? Observaciones { get; set; }

    [ForeignKey("IdRevision")]
    public virtual InvRevisionesPares Revision { get; set; } = null!;
}

[Table("inv_magic_links")]
public class InvMagicLink
{
    [Key]
    [Column("id_magic_link")]
    public int IdMagicLink { get; set; }

    [Column("id_usuario")]
    public int IdUsuario { get; set; }

    [Column("token_hash")]
    [Required]
    [MaxLength(64)]
    public string TokenHash { get; set; } = null!;

    [Column("fecha_creacion")]
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    [Column("fecha_expiracion")]
    public DateTime FechaExpiracion { get; set; }

    [Column("utilizado")]
    public bool Utilizado { get; set; } = false;

    [Column("fecha_utilizado")]
    public DateTime? FechaUtilizado { get; set; }

    [Column("ip_creacion")]
    [MaxLength(45)]
    public string? IpCreacion { get; set; }

    [Column("ip_utilizacion")]
    [MaxLength(45)]
    public string? IpUtilizacion { get; set; }

    [Column("user_agent")]
    [MaxLength(255)]
    public string? UserAgent { get; set; }

    [Column("codigo_pin_handoff")]
    [MaxLength(12)]
    public string? CodigoPinHandoff { get; set; }

    [Column("fecha_expiracion_pin")]
    public DateTime? FechaExpiracionPin { get; set; }

    /// <summary>Propósito del token: MAGIC_LINK | PASSWORD_RECOVERY</summary>
    [Column("proposito")]
    [MaxLength(30)]
    public string Proposito { get; set; } = "MAGIC_LINK";

    [ForeignKey("IdUsuario")]
    public virtual User Usuario { get; set; } = null!;
}

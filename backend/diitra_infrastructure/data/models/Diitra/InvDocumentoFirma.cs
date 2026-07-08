using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using diitra_domain.Signatures;

namespace diitra_infrastructure.data.models;

/// <summary>
/// Registro inmutable de una firma DIITRA o FirmaEC ejecutada sobre un documento.
/// Mapeado a: inv_documentos_firmas
/// IMPORTANTE: Nunca se eliminan registros — solo se marcan como revocados.
/// </summary>
[Table("inv_documentos_firmas")]
public class InvDocumentoFirma
{
    [Key]
    [Column("idFirma")]
    public int IdFirma { get; set; }

    [Column("uuid")]
    public string Uuid { get; set; } = Guid.NewGuid().ToString();

    [Column("documento_uuid")]
    public string DocumentoUuid { get; set; } = string.Empty;

    [Column("firmante_id")]
    public string FirmanteId { get; set; } = string.Empty;

    [Column("firmante_rol")]
    public string FirmanteRol { get; set; } = string.Empty;

    [Column("fecha_firma")]
    public DateTime FechaFirma { get; set; } = DateTime.UtcNow;

    /// <summary>FirmaEC = certificado .p12 PAdES | DIITRA = firma institucional propia</summary>
    [Column("tipo_firma")]
    public string TipoFirma { get; set; } = "DIITRA";

    /// <summary>Código legible estampado en el PDF. Ej: DFRM-2026-A1B2C3D4</summary>
    [Column("firma_code")]
    public string? FirmaCode { get; set; }

    /// <summary>Prueba criptográfica de autenticidad: HMAC-SHA256(docHash:userUuid:timestamp:code, secret)</summary>
    [Column("hmac_hash")]
    public string? HmacHash { get; set; }

    /// <summary>SHA-256 del PDF en el momento exacto de la firma. Detecta manipulaciones posteriores.</summary>
    [Column("doc_hash")]
    public string? DocHash { get; set; }

    [Column("ip_address")]
    public string? IpAddress { get; set; }

    [Column("user_agent")]
    public string? UserAgent { get; set; }

    /// <summary>JSON con metadatos del certificado .p12 (para FirmaEC) o snapshot del perfil DIITRA.</summary>
    [Column("firma_metadata")]
    public string? FirmaMetadata { get; set; }

    [Column("archivo_pdf_firmado")]
    public string ArchivoPdfFirmado { get; set; } = string.Empty;

    [Column("es_valida")]
    public bool EsValida { get; set; } = true;

    [Column("revocada_en")]
    public DateTime? RevocadaEn { get; set; }

    [Column("motivo_revocacion")]
    public string? MotivoRevocacion { get; set; }
}

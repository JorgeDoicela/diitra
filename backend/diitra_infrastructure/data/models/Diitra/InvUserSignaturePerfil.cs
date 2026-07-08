using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace diitra_infrastructure.data.models;

/// <summary>
/// Perfil de firma DIITRA del usuario.
/// Mapeado a: inv_user_signature_profiles
/// </summary>
[Table("inv_user_signature_profiles")]
public class InvUserSignaturePerfil
{
    [Key]
    [Column("idPerfil")]
    public int IdPerfil { get; set; }

    [Column("uuid")]
    public string Uuid { get; set; } = Guid.NewGuid().ToString();

    [Column("idUsuario")]
    public int IdUsuario { get; set; }

    /// <summary>PNG en Base64 del trazo de firma dibujado en canvas.</summary>
    [Column("firma_imagen_b64")]
    public string? FirmaImagenB64 { get; set; }

    [Column("iniciales")]
    public string? Iniciales { get; set; }

    [Column("cargo")]
    public string? Cargo { get; set; }

    [Column("departamento")]
    public string? Departamento { get; set; }

    [Column("es_configurado")]
    public bool EsConfigurado { get; set; } = false;

    [Column("creado_en")]
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

    [Column("actualizado_en")]
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;
}

using System;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;

/// <summary>
/// [LOPDP] Registro histórico del consentimiento otorgado por los titulares
/// </summary>
public class InvLopdpConsentimiento
{
    public int IdConsentimiento { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public int IdUsuario { get; set; }
    public string VersionPolitica { get; set; } = null!;
    public string Canal { get; set; } = "Web"; // Web, Movil, Presencial
    public DateTime FechaConsentimiento { get; set; } = DateTime.Now;
    public string? IpDireccion { get; set; }
    public string? UserAgent { get; set; }
    public string? FirmaHash { get; set; }
    public string Estado { get; set; } = "Otorgado"; // Otorgado, Revocado
    public DateTime? FechaRevocacion { get; set; }

    // Propiedad de Navegación
    public virtual User? User { get; set; }
}

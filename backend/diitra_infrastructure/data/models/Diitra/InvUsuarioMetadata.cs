using System;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;


/// <summary>
/// [SISTEMA] Perfil extendido del investigador y configuraciones de firma/seguridad
/// </summary>
public partial class InvUsuarioMetadata
{
    public int IdMetadata { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public int IdUsuario { get; set; }
    
    // Perfil Investigador (Normativa CACES/SENESCYT)
    public string? OrcidId { get; set; }
    public string? ScopusId { get; set; }
    public string? GoogleScholarUrl { get; set; }
    public string? ResearchGateUrl { get; set; }
    public string? Especialidad { get; set; } // Para emparejamiento automático de revisores
    public string? GradoAcademicoMaximo { get; set; }
    
    // Configuración de Firma Electrónica (.p12)
    public string? RutaFirmaP12 { get; set; }
    public string? RutaFirmaImagen { get; set; } // Imagen de firma manuscrita
    public bool FirmaHabilitada { get; set; } = false;
    public bool AceptoTerminosFirma { get; set; } = false;
    public DateTime? FechaConsentimientoFirma { get; set; }
    public string? P12PasswordEncrypted { get; set; }
    
    // Preferencias y UI (JSON)
    public string? Configuracion { get; set; }
    
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public DateTime? FechaUltimoAcceso { get; set; }
    public int Version { get; set; } = 1;

    // Navegación
    public virtual User? User { get; set; }
}

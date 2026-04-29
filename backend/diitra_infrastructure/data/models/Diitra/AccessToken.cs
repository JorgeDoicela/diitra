using System;

namespace diitra_infrastructure.data.models;

/// <summary>
/// [SISTEMA] Seguridad para accesos externos (Evaluadores por Pares, Revisores Éticos)
/// </summary>
public partial class AccessToken
{
    public int IdToken { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public string Token { get; set; } = null!;
    
    // Vinculación opcional a un proyecto específico
    public int? IdProyecto { get; set; }
    
    public int IdReferencia { get; set; }
    public string TipoReferencia { get; set; } = "Externo"; // Externo, Profesor, etc.
    
    public string? Scopes { get; set; } // Ej: 'REVIEW:READ', 'REVIEW:WRITE'
    
    // Control de seguridad avanzado
    public int MaxUsos { get; set; } = 1; 
    public int UsosActuales { get; set; } = 0;
    public string? IpOrigen { get; set; } 
    
    public bool Activo { get; set; } = true;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public DateTime? FechaExpiracion { get; set; }
    public int Version { get; set; } = 1;

    // Navegación opcional
    public virtual InvProyecto? IdProyectoNavigation { get; set; }
}

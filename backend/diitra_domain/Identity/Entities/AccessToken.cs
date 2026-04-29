using System;

namespace diitra_domain.Identity.Entities;

/// <summary>
/// [SISTEMA] Tokens temporales para acceso externo seguro (Revisores, etc.)
/// </summary>
public partial class AccessToken
{
    public int IdToken { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public string Token { get; set; } = null!;
    public int IdReferencia { get; set; }
    public string TipoReferencia { get; set; } = null!; // profesor, externo, etc
    public string? Scopes { get; set; }
    public sbyte Usado { get; set; } = 0;
    public sbyte Activo { get; set; } = 1;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public DateTime? FechaExpiracion { get; set; }
    public int Version { get; set; } = 1;
}

using System;

namespace diitra_domain.Identity.Entities;

/// <summary>
/// Tokens para acceso directo (Magic Links)
/// </summary>
public class AccessToken
{
    public int IdToken { get; set; }
    public string Token { get; set; } = string.Empty;
    public string IdReferencia { get; set; } = string.Empty; // idProfesor o Revisor Externo
    public string TipoReferencia { get; set; } = string.Empty; // 'profesor', 'externo'
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime FechaExpiracion { get; set; }
    public bool Usado { get; set; } = false;
    public string? Scopes { get; set; } // Opcional: limitar a qué tiene acceso este token
    public bool Activo { get; set; } = true;

    public bool IsExpired => DateTime.UtcNow > FechaExpiracion;
}

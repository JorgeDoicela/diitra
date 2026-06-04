using System;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;

/// <summary>
/// [LOPDP] Bitácora inalterable de accesos y modificaciones a datos sensibles
/// </summary>
public class InvLopdpAuditoriaDatos
{
    public int IdAuditoriaDatos { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public int? IdUsuarioActor { get; set; }
    public int IdUsuarioAfectado { get; set; }
    public string TablaAfectada { get; set; } = null!;
    public string? ColumnaAfectada { get; set; }
    public string Operacion { get; set; } = null!; // LECTURA, ESCRITURA, ELIMINACION, DESCARGA
    public string? Motivo { get; set; }
    public string? IpDireccion { get; set; }
    public string? UserAgent { get; set; }
    public DateTime FechaAcceso { get; set; } = DateTime.Now;

    // Propiedades de Navegación
    public virtual User? UsuarioActor { get; set; }
    public virtual User? UsuarioAfectado { get; set; }
}

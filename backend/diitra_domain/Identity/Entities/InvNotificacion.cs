using System;
using diitra_infrastructure.data.models;

namespace diitra_domain.Identity.Entities;

/// <summary>
/// [SISTEMA] Notificaciones automáticas del sistema
/// </summary>
public partial class InvNotificacion
{
    public int IdNotificacion { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public int? IdProyecto { get; set; }
    public int Destinatario { get; set; } // idUsuario
    public string TipoDestinatario { get; set; } = "Usuario"; // Usuario, Profesor, Alumno
    public string? Tipo { get; set; }
    public string Titulo { get; set; } = null!;
    public string? Mensaje { get; set; }
    public sbyte Leido { get; set; } = 0;
    public DateTime FechaEnvio { get; set; } = DateTime.UtcNow;
    public DateTime? FechaLectura { get; set; }
    public int Version { get; set; } = 1;

    // Navegación
    public virtual InvProyecto? IdProyectoNavigation { get; set; }
    public virtual User DestinatarioNavigation { get; set; } = null!;
}

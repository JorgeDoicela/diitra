using System;
using diitra_infrastructure.data.models;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;


/// <summary>
/// [SISTEMA] Notificaciones dinámicas con soporte para flujos de trabajo (workflow)
/// </summary>
public partial class InvNotificacion
{
    public int IdNotificacion { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public int? IdProyecto { get; set; }
    public int Destinatario { get; set; } // idUsuario
    public string TipoDestinatario { get; set; } = "Usuario"; // Usuario, Profesor, Alumno
    
    // Categorización para filtrado en UI (Ej: 'PROYECTO', 'PRESUPUESTO', 'REVISION')
    public string Categoria { get; set; } = "SISTEMA";
    
    // Prioridad para alertas visuales (Ej: 'BAJA', 'NORMAL', 'ALTA', 'URGENTE')
    public string Prioridad { get; set; } = "NORMAL";
    
    public string Titulo { get; set; } = null!;
    public string? Mensaje { get; set; }
    
    // URL a la que el sistema redirigirá al usuario cuando haga clic
    public string? UrlAccion { get; set; }
    
    public bool Leido { get; set; } = false;
    public DateTime FechaEnvio { get; set; } = DateTime.UtcNow;
    public DateTime? FechaLectura { get; set; }
    public int Version { get; set; } = 1;

    // Navegación
    public virtual InvProyecto? IdProyectoNavigation { get; set; }
    public virtual User? DestinatarioNavigation { get; set; }
}

using System;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;

/// <summary>
/// [LOPDP] Seguimiento de solicitudes de derechos ARCO de los titulares
/// </summary>
public class InvLopdpDerechoArco
{
    public int IdSolicitudArco { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public int IdUsuario { get; set; }
    public string TipoSolicitud { get; set; } = null!; // Acceso, Rectificacion, Eliminacion, Oposicion, Portabilidad, Limitacion
    public string DetalleSolicitud { get; set; } = null!;
    public DateTime FechaSolicitud { get; set; } = DateTime.Now;
    public DateOnly FechaLimiteResolucion { get; set; }
    public string Estado { get; set; } = "Recibido"; // Recibido, En_Analisis, Aprobado, Rechazado
    public string? ResolucionDetalle { get; set; }
    public DateTime? FechaResolucion { get; set; }
    public string? DocumentoResolucionPath { get; set; }

    // Propiedad de Navegación
    public virtual User? User { get; set; }
}

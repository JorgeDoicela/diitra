using System;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;

/// <summary>
/// [SEGURIDAD] Registro y trazabilidad de copias de seguridad (LOPDP Art. 47 & EGSI)
/// </summary>
public class InvBackupLog
{
    public int IdBackup { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public DateTime FechaBackup { get; set; } = DateTime.Now;
    public string Tipo { get; set; } = null!; // Completo, BaseDatos, Archivos
    public string Destino { get; set; } = null!;
    public string NombreArchivo { get; set; } = null!;
    public long TamanioBytes { get; set; }
    public string Estado { get; set; } = "En_Proceso"; // Exitoso, Fallido, En_Proceso
    public string? HashVerificacion { get; set; }
    public string? ErrorMensaje { get; set; }
    public int? EjecutadoPor { get; set; }

    // Propiedad de Navegación
    public virtual User? Ejecutor { get; set; }
}

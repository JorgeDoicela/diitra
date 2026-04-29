using System;
using System.Collections.Generic;
using diitra_domain.Identity.Entities;

namespace diitra_infrastructure.data.models;

/// <summary>
/// [SISTEMA] Informes de avance mensual/trimestral con soporte para Firma Electrónica
/// </summary>
public partial class InvInformeAvance
{
    public int IdInforme { get; set; }
    public Guid Uuid { get; set; } = Guid.NewGuid();
    public int IdProyecto { get; set; }
    public int NumeroInforme { get; set; }
    public DateOnly FechaReporte { get; set; }
    public string ResumenActividades { get; set; } = null!;
    
    // Soporte Firma Electrónica (FirmaEC/Ecuador)
    public bool EsFirmadoDigital { get; set; } = false;
    public string? HashFirma { get; set; }
    public DateTime? FechaFirma { get; set; }
    public int? ValidadoPor { get; set; } // ID del Director de Investigación
    
    public string Estado { get; set; } = "Pendiente";

    public virtual InvProyecto IdProyectoNavigation { get; set; } = null!;
    public virtual User? ValidadoPorNavigation { get; set; }
    public virtual ICollection<InvEvidencia> InvEvidencias { get; set; } = new List<InvEvidencia>();
}

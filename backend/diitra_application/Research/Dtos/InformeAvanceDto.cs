using System;
using System.Collections.Generic;

namespace diitra_application.Research.Dtos;

// ─────────────────────────────────────────────────────────────
//  DTOs de Informes de Avance
// ─────────────────────────────────────────────────────────────

public class InformeAvanceDto
{
    public int IdInforme { get; set; }
    public Guid Uuid { get; set; }
    public int IdProyecto { get; set; }
    public string? ProyectoTitulo { get; set; }
    public string? CodigoInstitucional { get; set; }
    public int NumeroInforme { get; set; }
    public DateOnly FechaReporte { get; set; }
    public string ResumenActividades { get; set; } = null!;
    public bool EsFirmadoDigital { get; set; }
    public string? HashFirma { get; set; }
    public DateTime? FechaFirma { get; set; }
    public int? ValidadoPor { get; set; }
    public string? ValidadoPorNombre { get; set; }
    /// <summary>Pendiente | Aprobado | Observado</summary>
    public string Estado { get; set; } = "Pendiente";
    public List<EvidenciaDto> Evidencias { get; set; } = new();
}

public class EvidenciaDto
{
    public int IdEvidencia { get; set; }
    public string Uuid { get; set; } = null!;
    public string? Descripcion { get; set; }
    public string RutaArchivo { get; set; } = null!;
    public string? TipoEvidencia { get; set; }
    public DateTime FechaRegistro { get; set; }
}

public class CreateInformeAvanceDto
{
    public int IdProyecto { get; set; }
    public DateOnly FechaReporte { get; set; }
    public string ResumenActividades { get; set; } = null!;
}

public class ObservarInformeAvanceDto
{
    public string Observacion { get; set; } = null!;
}

public class FirmarInformeAvanceDto
{
    public string CertificadoBase64 { get; set; } = null!;
    public string PasswordCertificado { get; set; } = null!;
}

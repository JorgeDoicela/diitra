using System;
using System.Collections.Generic;

namespace diitra_application.Research.Dtos;

// ─────────────────────────────────────────────────────────────
//  DTOs del Portal del Revisor
// ─────────────────────────────────────────────────────────────

public class PeerReviewDto
{
    public string Uuid { get; set; } = null!;
    public int IdProyecto { get; set; }
    public string ProyectoUuid { get; set; } = null!;
    public string ProyectoTitulo { get; set; } = null!;
    public int IdRevisor { get; set; }
    public string RevisorNombre { get; set; } = null!;
    public string? RevisorEspecialidad { get; set; }
    public string? RevisorGrado { get; set; }
    public DateTime FechaAsignacion { get; set; }
    public DateTime FechaLimite { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public bool EsExterno { get; set; }
    public bool EsDobleCiego { get; set; } = true;
    public decimal? PuntajeTotal { get; set; }
    public string? ObservacionesGral { get; set; }
}

// ─────────────────────────────────────────────────────────────
//  DTOs del Panel del Director (Arbitraje)
// ─────────────────────────────────────────────────────────────

/// <summary>
/// Resumen de arbitraje para la vista global del Director de Investigación.
/// </summary>
public class ArbitrajeProyectoDto
{
    public string ProyectoUuid { get; set; } = null!;
    public int IdProyecto { get; set; }
    public string ProyectoTitulo { get; set; } = null!;
    public string? CodigoInstitucional { get; set; }
    public string EstadoProyecto { get; set; } = null!;
    public string? Convocatoria { get; set; }
    public int TotalArbitros { get; set; }
    public int ArbitrosCompletados { get; set; }
    public decimal? PuntajePromedio { get; set; }
    public string EstadoArbitraje { get; set; } = "Pendiente"; // Subestados: Pendiente, EnProceso, Completado, Desempate
    public List<PeerReviewDto> Revisiones { get; set; } = new();
}

/// <summary>
/// KPIs globales para el dashboard del Director.
/// </summary>
public class ArbitrajeStatsDto
{
    public int ProyectosEnRevision { get; set; }
    public int TotalArbitrosAsignados { get; set; }
    public int EvaluacionesCompletadas { get; set; }
    public int EvaluacionesPendientes { get; set; }
    public int CasosDesempate { get; set; }
    public decimal PorcentajeAvance { get; set; }
}

// ─────────────────────────────────────────────────────────────
//  DTOs de Rúbrica Dinámica
// ─────────────────────────────────────────────────────────────

/// <summary>
/// Rúbrica dinámica cargada desde la InvConvocatoria del proyecto.
/// Reemplaza los criterios hardcodeados del frontend.
/// </summary>
public class RubricaDinamicaDto
{
    public int IdRubrica { get; set; }
    public string NombreRubrica { get; set; } = null!;
    public string ProyectoTitulo { get; set; } = null!; // Anonimizado si es doble ciego
    public string? LineaInvestigacion { get; set; }
    public string? Justificacion { get; set; }       // Anonimizado
    public string? Metodologia { get; set; }         // Anonimizado
    public string ProyectoUuid { get; set; } = null!;
    public bool EsDobleCiego { get; set; }
    public decimal PuntajeMinimoAprobacion { get; set; }
    public List<CriterioRubricaDto> Criterios { get; set; } = new();
}

public class CriterioRubricaDto
{
    public int IdCriterio { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public decimal PesoPorcentaje { get; set; }
    public int Orden { get; set; }
    /// <summary>
    /// Puntaje máximo derivado del peso. Ej: Peso=30% → PuntajeMaximo=30.
    /// </summary>
    public decimal PuntajeMaximo => PesoPorcentaje;
}

// ─────────────────────────────────────────────────────────────
//  DTOs de Asignación y Búsqueda de Árbitros
// ─────────────────────────────────────────────────────────────

public class AsignarArbitroDto
{
    public string ProjectUuid { get; set; } = null!;
    public int IdRevisor { get; set; }
    public DateTime FechaLimite { get; set; }
    public bool EsExterno { get; set; }
    public bool EsDobleCiego { get; set; } = true;
    public string? Observaciones { get; set; }
}

/// <summary>
/// Perfil de un revisor disponible para asignación, con datos de InvUsuarioMetadata.
/// </summary>
public class RevisorDisponibleDto
{
    public int IdUsuario { get; set; }
    public string NombreCompleto { get; set; } = null!;
    public string? Email { get; set; }
    public string? Especialidad { get; set; }
    public string? GradoAcademicoMaximo { get; set; }
    public string? OrcidId { get; set; }
    public string? Institucion { get; set; }
    public bool EsExterno { get; set; }
    public int RevisionesActivas { get; set; } // Carga de trabajo actual
}

// ─────────────────────────────────────────────────────────────
//  DTOs de Evaluación y Cierre de Arbitraje
// ─────────────────────────────────────────────────────────────

public class EvaluationDto
{
    public string RevisionUuid { get; set; } = null!;
    public List<EvaluationDetailDto> Detalles { get; set; } = new();
    public string? ObservacionesGral { get; set; }
}

public class EvaluationDetailDto
{
    public int? IdCriterio { get; set; }   // Referencia al criterio dinámico
    public string Criterio { get; set; } = null!;
    public decimal Puntaje { get; set; }
    public string? Observaciones { get; set; }
}

/// <summary>
/// Dictamen generado al cerrar el arbitraje de un proyecto.
/// </summary>
public class DictamenDto
{
    public string ProyectoUuid { get; set; } = null!;
    public string ProyectoTitulo { get; set; } = null!;
    public string? CodigoInstitucional { get; set; }
    public decimal PuntajePromedio { get; set; }
    public decimal PuntajeMinimoAprobacion { get; set; }
    public string Resultado { get; set; } = null!; // Aprobado, Rechazado, Desempate
    public string EstadoAnterior { get; set; } = null!;
    public string EstadoNuevo { get; set; } = null!;
    public List<PeerReviewDto> Evaluaciones { get; set; } = new();
    public DateTime FechaCierre { get; set; } = DateTime.Now;
    public string? MensajeDesempate { get; set; }
}

// Mantenemos compatibilidad con el código legado
public class CreatePeerReviewDto : AsignarArbitroDto { }

/// <summary>
/// DTO para registrar un árbitro externo (sin cuenta institucional).
/// Normativa CACES: los proyectos deben ser evaluados por al menos un revisor externo a la institución.
/// </summary>
public class RegistrarRevisorExternoDto
{
    public string? Cedula { get; set; }
    public string Nombres { get; set; } = null!;
    public string Apellidos { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Institucion { get; set; } = null!;
    public string? GradoAcademico { get; set; }
    public string? OrcidId { get; set; }
    public string? Especialidad { get; set; }
}

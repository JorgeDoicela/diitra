using System.Threading.Tasks;
using System.Collections.Generic;
using Diitra.Application.Research.Dtos;

namespace Diitra.Application.Research
{
    /// <summary>
    /// Orquestador de persistencia para el Módulo de Investigación.
    /// Encargado de centralizar la lógica de sincronización del Workspace con el núcleo nuclear.
    /// </summary>
    public interface IProjectOrchestrator
    {
        /// <summary>
        /// Sincroniza de forma atómica todos los componentes de un proyecto desde el DTO colaborativo.
        /// </summary>
        Task<SyncResult> SyncProjectWizardDataAsync(ProyectoDto dto, string? creatorUserIdRef = null);

        /// <summary>
        /// Obtiene todos los proyectos registrados (vista de Administrador/Director).
        /// </summary>
        Task<List<ProyectoResumenDto>> GetAllProjectsAsync();

        /// <summary>
        /// Obtiene los proyectos en los que participa el usuario autenticado (docente/estudiante).
        /// </summary>
        Task<List<ProyectoResumenDto>> GetMyProjectsAsync(string userIdReferencia);

        /// <summary>
        /// Obtiene el detalle completo de un proyecto por UUID.
        /// </summary>
        Task<ProyectoDto?> GetProjectDetailAsync(string uuid);

        /// <summary>
        /// Resuelve un identificador de proyecto (UUID completo, prefijo corto o ID numérico) al UUID canónico.
        /// </summary>
        Task<string?> ResolveCanonicalUuidAsync(string identifier);

        /// <summary>
        /// Estadísticas agregadas para el dashboard según el rol del usuario.
        /// </summary>
        Task<DashboardStatsDto> GetDashboardStatsAsync(string userIdReferencia, bool isAdmin);

        /// <summary>
        /// Elimina físicamente un proyecto y todas sus relaciones en cascada (solo permitido para borradores/correcciones).
        /// </summary>
        Task<SyncResult> DeleteProjectAsync(string uuid, string? userIdRef);

        /// <summary>
        /// Sincroniza y actualiza dinámicamente el equipo de investigadores de un proyecto en cualquier fase.
        /// </summary>
        Task<SyncResult> UpdateProjectTeamAsync(string uuid, List<InvestigadorDto> investigadores, string? grupoInvestigacion = null, bool? tieneGrupoInvestigacion = null);

        /// <summary>
        /// Transfiere la dirección de un proyecto de forma formal a un nuevo docente con justificación.
        /// </summary>
        Task<SyncResult> TransferDirectorAsync(string uuid, TransferDirectorRequest request);

        /// <summary>
        /// Valida si un usuario tiene permisos para modificar un proyecto según su vinculación y membresía.
        /// </summary>
        Task<bool> UserCanModifyProjectAsync(string projectUuid, string userSigafiId);

        /// <summary>
        /// Valida si un usuario tiene permisos para ver un proyecto según su vinculación y membresía.
        /// </summary>
        Task<bool> UserCanViewProjectAsync(string projectUuid, string userSigafiId);

        /// <summary>
        /// Determina si el usuario autenticado tiene el rol de Administrador del Sistema (DIITRA_ADMIN o ADMIN_SISTEMA).
        /// </summary>
        Task<bool> IsSystemAdminAsync(string userSigafiId);

        /// <summary>
        /// Determina si el usuario es el Director del Proyecto activo.
        /// </summary>
        Task<bool> IsProjectDirectorAsync(string projectUuid, string userSigafiId);

        /// <summary>
        /// Determina si el usuario puede registrar solicitudes formales de cambio de equipo
        /// (independiente del estado Borrador; aplica en ejecución y fases posteriores).
        /// Incluye director, coordinador del grupo e integrantes activos del proyecto/grupo.
        /// </summary>
        Task<bool> UserCanRequestTeamChangeAsync(string projectUuid, string userSigafiId);

        /// <summary>
        /// Devuelve la actividad reciente de un proyecto: sesiones CoWork, cambios de estado
        /// de sección y transiciones de workflow. Para el panel de actividad del Workspace.
        /// </summary>
        Task<List<ProyectoActividadDto>> GetProjectActivityAsync(string projectUuid, int maxItems = 20);

        /// <summary>
        /// Registra una solicitud formal de cambio de equipo para trazabilidad institucional.
        /// </summary>
        Task<SyncResult> CreateTeamChangeRequestAsync(string projectUuid, string requesterSigafiId, TeamChangeRequestDto request);

        /// <summary>
        /// Lista el historial de solicitudes de cambio de equipo de un proyecto.
        /// </summary>
        Task<List<TeamChangeRequestRecordDto>> GetTeamChangeRequestsAsync(string projectUuid);

        /// <summary>
        /// Revisa (aprueba/rechaza) una solicitud de cambio y, opcionalmente, la ejecuta.
        /// Solo administradores del sistema (DIITRA_ADMIN / ADMIN_SISTEMA).
        /// </summary>
        Task<SyncResult> ReviewTeamChangeRequestAsync(string projectUuid, string requestUuid, string reviewerSigafiId, TeamChangeReviewDto review);
    }

    public class TransferDirectorRequest
    {
        public string NuevoDirectorCedula { get; set; } = null!;
        public string Motivo { get; set; } = null!;
        public string? Descripcion { get; set; }
    }

    public class SyncResult
    {
        public bool Success { get; set; }
        public string? Uuid { get; set; }
        public string? Message { get; set; }
    }

    public class TeamChangeRequestDto
    {
        public string Tipo { get; set; } = null!; // ALTA | BAJA | CAMBIO_DIRECTOR
        public string? CedulaObjetivo { get; set; }
        public string? RolPropuesto { get; set; }
        public string Motivo { get; set; } = null!;
        public string? ResolucionReferencia { get; set; }
        public DateTime? FechaEfectiva { get; set; }
        public string? Observacion { get; set; }
    }

    public class TeamChangeReviewDto
    {
        public bool Aprobar { get; set; }
        public bool Ejecutar { get; set; } = true;
        public string? ResolucionAprobacion { get; set; }
        public string? ObservacionRevision { get; set; }
    }

    public class TeamChangeRequestRecordDto
    {
        public string RequestUuid { get; set; } = null!;
        public string Estado { get; set; } = null!;
        public string Tipo { get; set; } = null!;
        public string? CedulaObjetivo { get; set; }
        public string? RolPropuesto { get; set; }
        public string Motivo { get; set; } = null!;
        public string? ResolucionReferencia { get; set; }
        public string? ResolucionAprobacion { get; set; }
        public string? Observacion { get; set; }
        public string? SolicitadoPor { get; set; }
        public string? RevisadoPor { get; set; }
        public DateTime FechaSolicitud { get; set; }
        public DateTime? FechaRevision { get; set; }
        public DateTime? FechaEfectiva { get; set; }
    }
}

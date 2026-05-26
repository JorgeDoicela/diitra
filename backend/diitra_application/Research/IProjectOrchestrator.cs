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
        Task<SyncResult> UpdateProjectTeamAsync(string uuid, List<InvestigadorDto> investigadores);

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
        /// Devuelve la actividad reciente de un proyecto: sesiones CoWork, cambios de estado
        /// de sección y transiciones de workflow. Para el panel de actividad del Workspace.
        /// </summary>
        Task<List<ProyectoActividadDto>> GetProjectActivityAsync(string projectUuid, int maxItems = 20);
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
}

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
    }

    public class SyncResult
    {
        public bool Success { get; set; }
        public string? Uuid { get; set; }
        public string? Message { get; set; }
    }
}

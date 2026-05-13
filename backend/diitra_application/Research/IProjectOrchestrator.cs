using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;

namespace Diitra.Application.Research
{
    /// <summary>
    /// Orquestador de persistencia para el Módulo de Investigación.
    /// Encargado de centralizar la lógica de sincronización del Wizard con el núcleo nuclear.
    /// </summary>
    public interface IProjectOrchestrator
    {
        /// <summary>
        /// Sincroniza de forma atómica todos los componentes de un proyecto (Identificación, Equipo, 
        /// Presupuesto, MML, TRL e Indicadores) desde el DTO del Wizard.
        /// </summary>
        /// <param name="dto">Datos provenientes del frontend colaborativo.</param>
        /// <returns>Resultado de la operación con el UUID del proyecto.</returns>
        Task<SyncResult> SyncProjectWizardDataAsync(ProyectoDto dto);
    }

    public class SyncResult
    {
        public bool Success { get; set; }
        public string? Uuid { get; set; }
        public string? Message { get; set; }
    }
}

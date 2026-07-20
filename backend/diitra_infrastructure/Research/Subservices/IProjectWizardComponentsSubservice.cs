using System.Collections.Generic;
using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;

namespace diitra_infrastructure.Research.Subservices
{
    public interface IProjectWizardComponentsSubservice
    {
        Task<List<int>> SyncObjetivosAsync(int projectId, string? objetivoGeneral, List<string>? objetivos);
        Task SyncPresupuestoAsync(int projectId, List<RecursoNecesarioDto>? recursos);
        Task SyncMmlAsync(int projectId, List<MmlRowDto>? mml);
        Task SyncImpactosAsync(int projectId, ImpactoProyectoDto? impacto);
        Task SyncProductosAsync(int projectId, List<ProductoEsperadoDto>? productos);
        Task SyncCronogramaAsync(int projectId, List<int> objetivosCreadosIds, List<ActividadCronogramaDto>? cronograma);
        Task SyncBibliografiaAsync(int projectId, List<string>? biblio);
        Task SyncRecursosDisponiblesAsync(int projectId, List<RecursoDisponibleDto>? recursos);
    }
}

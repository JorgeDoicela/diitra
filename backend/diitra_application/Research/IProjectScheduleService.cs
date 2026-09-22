using System.Security.Claims;
using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;

namespace Diitra.Application.Research
{
    public interface IProjectScheduleService
    {
        Task<ExpenseOperationResult<CronogramaResumenDto>> GetCronogramaResumenAsync(string projectUuid, ClaimsPrincipal user);

        Task<ExpenseOperationResult<ActividadCronogramaItemDto>> ActualizarProgresoActividadAsync(
            string projectUuid, 
            int actividadId, 
            ActualizarProgresoActividadRequest request, 
            ClaimsPrincipal user);

        Task<ExpenseOperationResult<ActividadCronogramaItemDto>> GuardarActividadAsync(
            string projectUuid, 
            GuardarActividadRequest request, 
            ClaimsPrincipal user);

        Task<ExpenseOperationResult<bool>> EliminarActividadAsync(
            string projectUuid, 
            int actividadId, 
            ClaimsPrincipal user);
    }
}

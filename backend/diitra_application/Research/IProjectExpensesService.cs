using System.Security.Claims;
using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;

namespace Diitra.Application.Research
{
    public interface IProjectExpensesService
    {
        Task<ExpenseOperationResult<PresupuestoResumenDto>> GetPresupuestoResumenAsync(string projectUuid, ClaimsPrincipal user);
        
        Task<ExpenseOperationResult<PresupuestoItemDto>> GuardarPresupuestoItemAsync(string projectUuid, GuardarPresupuestoItemRequest request, ClaimsPrincipal user);
        
        Task<ExpenseOperationResult<bool>> EliminarPresupuestoItemAsync(string projectUuid, int itemId, ClaimsPrincipal user);
        
        Task<ExpenseOperationResult<GastoDetalleDto>> RegistrarGastoAsync(string projectUuid, RegistrarGastoRequest request, ClaimsPrincipal user);
        
        Task<ExpenseOperationResult<bool>> EliminarGastoAsync(string projectUuid, string gastoUuid, ClaimsPrincipal user);
        
        Task<ExpenseOperationResult<FinanciamientoItemDto>> GuardarFinanciamientoAsync(string projectUuid, GuardarFinanciamientoRequest request, ClaimsPrincipal user);
        
        Task<ExpenseOperationResult<bool>> EliminarFinanciamientoAsync(string projectUuid, int financiamientoId, ClaimsPrincipal user);
        
        Task<ExpenseOperationResult<LiquidacionFinancieraDto>> ObtenerLiquidacionFinancieraAsync(string projectUuid, ClaimsPrincipal user);
    }

    public class ExpenseOperationResult<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Message { get; set; }
        public int StatusCode { get; set; } = 400;
    }
}

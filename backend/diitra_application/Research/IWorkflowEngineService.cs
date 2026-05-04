using System.Threading.Tasks;

namespace Diitra.Application.Research
{
    public interface IWorkflowEngineService
    {
        Task<bool> TransicionarEstadoAsync(string proyectoUuid, string nuevoEstado, int idUsuario, string observacion);
    }
}

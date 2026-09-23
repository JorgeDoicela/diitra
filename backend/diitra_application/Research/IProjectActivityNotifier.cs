using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;

namespace Diitra.Application.Research
{
    /// <summary>
    /// Contrato desacoplado para la emisión en tiempo real de telemetría y eventos
    /// de actividad sobre proyectos a través de WebSockets / SignalR.
    /// </summary>
    public interface IProjectActivityNotifier
    {
        Task NotifyActivityAsync(string projectUuid, ProyectoActividadDto activity);
    }
}

// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — SignalR Hub (Backend)
//
// Hub de SignalR que actúa como servidor de relay para DIITRA CoWork.
// Su responsabilidad es ÚNICAMENTE retransmitir los updates de Yjs
// entre los participantes de un mismo documento.
//
// Arquitectura:
//   Cliente A escribe → Hub → Clientes B, C, D reciben
//
// El Hub NO modifica el contenido: es un relay puro.
// La lógica del documento vive en el Yjs Doc del cliente.
// ═══════════════════════════════════════════════════════════════════

using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Collaboration
{
    /// <summary>
    /// Hub de relay para DIITRA CoWork.
    /// 
    /// Cada "sala" (Group) corresponde a un documento abierto (identificado por su UUID).
    /// Un cliente al conectarse hace JoinDocument para entrar a la sala de su documento.
    /// Después de eso, todo update de Yjs o de presencia que envíe se retransmite
    /// automáticamente a los demás participantes de esa sala.
    /// 
    /// Compatibilidad con JWT:
    /// Si Program.cs registra el hub con autenticación, el Hub puede leer
    /// Context.User?.Identity?.Name para obtener el nombre del usuario.
    /// Si no hay autenticación configurada, funciona igualmente (modo anónimo).
    /// </summary>
    public class CollaborationHub : Hub
    {
        private readonly ILogger<CollaborationHub> _logger;

        public CollaborationHub(ILogger<CollaborationHub> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// El cliente se une a la sala de un documento específico.
        /// Debe llamarse inmediatamente después de establecer la conexión.
        /// </summary>
        /// <param name="documentId">UUID del documento/proyecto (identifica la sala)</param>
        /// <param name="userName">Nombre del participante (backup; la identidad real viene del JWT Awareness)</param>
        public async Task JoinDocument(string documentId, string userName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, documentId);

            var identity = Context.User?.Identity?.Name ?? userName;
            _logger.LogInformation(
                "[DIITRA CoWork] {User} (ID: {ConnectionId}) se unió al documento {DocumentId}",
                identity, Context.ConnectionId[..8], documentId);
        }

        /// <summary>
        /// Retransmite un update del documento Yjs a todos los demás participantes de la sala.
        /// El origen NO recibe su propio update (OthersInGroup).
        /// </summary>
        /// <param name="documentId">UUID del documento (sala destino)</param>
        /// <param name="updateBase64">Bytes del Yjs update en Base64</param>
        public async Task SendYjsUpdate(string documentId, string updateBase64)
        {
            await Clients.OthersInGroup(documentId)
                         .SendAsync("ReceiveYjsUpdate", updateBase64);
        }

        /// <summary>
        /// Retransmite el estado de presencia (cursor, nombre, color) a los demás.
        /// Es lo que permite ver los cursores de otros usuarios en tiempo real.
        /// </summary>
        /// <param name="documentId">UUID del documento (sala destino)</param>
        /// <param name="updateBase64">Bytes del Yjs Awareness update en Base64</param>
        public async Task SendAwarenessUpdate(string documentId, string updateBase64)
        {
            await Clients.OthersInGroup(documentId)
                         .SendAsync("ReceiveAwarenessUpdate", updateBase64);
        }

        /// <summary>
        /// Se ejecuta automáticamente cuando un cliente se desconecta.
        /// SignalR elimina al cliente de todos sus grupos automáticamente,
        /// pero aquí podemos registrar el evento para auditoría.
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var identity = Context.User?.Identity?.Name ?? Context.ConnectionId[..8];
            if (exception is not null)
            {
                _logger.LogWarning(
                    "[DIITRA CoWork] {User} desconectado con error: {Error}",
                    identity, exception.Message);
            }
            else
            {
                _logger.LogInformation(
                    "[DIITRA CoWork] {User} se desconectó correctamente.",
                    identity);
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}

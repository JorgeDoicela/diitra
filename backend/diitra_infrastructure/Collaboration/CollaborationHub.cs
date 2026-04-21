using Microsoft.AspNetCore.SignalR;

namespace diitra_infrastructure.Collaboration
{
    // Hub unificado para la colaboración en tiempo real.
    // Maneja la sincronización de texto (deltas) y cursores remotos.
    public class CollaborationHub : Hub
    {
        // Unirse a la edición de un documento específico
        public async Task JoinDocument(string documentId, string userName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, documentId);
            
            // Notificar a otros que alguien se unió
            await Clients.OthersInGroup(documentId).SendAsync("UserJoined", new { 
                connectionId = Context.ConnectionId, 
                name = userName 
            });
        }

        // Salir del documento
        public async Task LeaveDocument(string documentId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, documentId);
            await Clients.OthersInGroup(documentId).SendAsync("UserLeft", Context.ConnectionId);
        }

        // Enviar cambios parciales (deltas)
        public async Task SendDelta(string documentId, string deltaJson)
        {
            // Reenviar el delta a todos en el grupo, EXCEPTO al que lo envió
            await Clients.OthersInGroup(documentId).SendAsync("ReceiveDelta", deltaJson);
        }

        // Sincronizar posición del cursor para ver qué está haciendo el compañero
        public async Task UpdateCursor(string documentId, object cursorInfo)
        {
            await Clients.OthersInGroup(documentId).SendAsync("ReceiveCursor", new {
                connectionId = Context.ConnectionId,
                cursor = cursorInfo
            });
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Opcional: Podríamos rastrear a qué documento pertenecía esta conexión
            // para notificar la salida. Por ahora es genérico.
            await base.OnDisconnectedAsync(exception);
        }
    }
}

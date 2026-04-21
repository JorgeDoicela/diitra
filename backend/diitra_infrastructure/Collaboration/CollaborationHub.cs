using Microsoft.AspNetCore.SignalR;

namespace diitra_infrastructure.Collaboration
{
    public class CollaborationHub : Hub
    {
        public async Task JoinDocument(string documentId, string userName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, documentId);
            // La presencia ahora la maneja Yjs Awareness, pero dejamos esto para logs si quieres
        }

        public async Task SendYjsUpdate(string documentId, string updateBase64)
        {
            await Clients.OthersInGroup(documentId).SendAsync("ReceiveYjsUpdate", updateBase64);
        }

        // Método para sincronizar cursores vía Yjs Awareness
        public async Task SendAwarenessUpdate(string documentId, string updateBase64)
        {
            await Clients.OthersInGroup(documentId).SendAsync("ReceiveAwarenessUpdate", updateBase64);
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}

using Microsoft.AspNetCore.SignalR;

namespace diitra_infrastructure.hubs;

public class document_hub : Hub
{
    // Unirse a un proyecto específico (como una "sala" de chat)
    public async Task unirse_a_proyecto(string proyecto_id)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, proyecto_id);
    }

    // Enviar cambios de texto
    public async Task enviar_cambio_texto(string proyecto_id, object cambio)
    {
        // Reenvía el cambio a todos en la sala menos al que lo envió
        await Clients.OthersInGroup(proyecto_id).SendAsync("recibir_cambio", cambio);
    }
}

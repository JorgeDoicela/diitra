using Microsoft.AspNetCore.SignalR;

namespace diitra_infrastructure.Collaboration;

public class DocumentHub : Hub
{
    // Part of Phase 2: Logic for delta synchronisation (simulated for now)
    public async Task BroadcastDelta(string projectId, string delta)
    {
        // Broadcast the delta change to all other participants in the same project room
        await Clients.OthersInGroup(projectId).SendAsync("OnDeltaReceived", delta);
    }

    public async Task JoinProjectRoom(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, projectId);
    }

    public async Task LeaveProjectRoom(string projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, projectId);
    }
}

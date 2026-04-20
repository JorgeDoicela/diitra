namespace diitra_application.Common;

public interface ICollaborationService
{
    Task NotifyProjectUpdateAsync(int projectId, string message);
    Task TrackDeltaAsync(int projectId, string delta);
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Classroom.API.Hubs;

[Authorize]
public class LiveStreamHub : Hub
{
    private static readonly Dictionary<string, HashSet<string>> _viewers = new();

    public async Task JoinStream(string streamId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"stream-{streamId}");
        lock (_viewers)
        {
            if (!_viewers.ContainsKey(streamId))
                _viewers[streamId] = new HashSet<string>();
            _viewers[streamId].Add(Context.ConnectionId);
        }
        await NotifyViewerCount(streamId);
    }

    public async Task LeaveStream(string streamId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"stream-{streamId}");
        lock (_viewers)
        {
            _viewers.GetValueOrDefault(streamId)?.Remove(Context.ConnectionId);
        }
        await NotifyViewerCount(streamId);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Remove from all streams
        List<string> toNotify = new();
        lock (_viewers)
        {
            foreach (var (streamId, viewers) in _viewers)
            {
                if (viewers.Remove(Context.ConnectionId))
                    toNotify.Add(streamId);
            }
        }
        foreach (var streamId in toNotify)
            await NotifyViewerCount(streamId);

        await base.OnDisconnectedAsync(exception);
    }

    private async Task NotifyViewerCount(string streamId)
    {
        int count;
        lock (_viewers)
        {
            count = _viewers.GetValueOrDefault(streamId)?.Count ?? 0;
        }
        await Clients.Group($"stream-{streamId}")
            .SendAsync("ViewerCountUpdated", streamId, count);
    }

    // Called by admin when stream starts/ends
    public async Task NotifyStreamStarted(string streamId, string hlsUrl) =>
        await Clients.Group($"stream-{streamId}").SendAsync("StreamStarted", streamId, hlsUrl);

    public async Task NotifyStreamEnded(string streamId) =>
        await Clients.Group($"stream-{streamId}").SendAsync("StreamEnded", streamId);
}

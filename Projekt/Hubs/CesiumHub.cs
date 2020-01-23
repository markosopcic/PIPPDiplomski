using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Projekt.Hubs
{
    public class CesiumHub:Hub
    {
        public static Dictionary<String, DateTime> ClientsActive = new Dictionary<string, DateTime>();
        public static Dictionary<String, String> ClientsConnections = new Dictionary<string, string>();
        public override Task OnConnectedAsync()
        {
            return base.OnConnectedAsync();
        }
        public override Task OnDisconnectedAsync(Exception exception)
        {
            return base.OnDisconnectedAsync(exception);
        }
        

        public async Task AddNewFollowing(string user)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, user);
         
        }

        public async Task RemoveFollowing(string user)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, user);
        }
    }
}

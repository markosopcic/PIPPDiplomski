using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Projekt.Hubs
{
    public class CesiumHub:Hub
    {
        public static Dictionary<String, List<String>> ClientsToUsers = new Dictionary<string, List<string>>();
        public static Dictionary<String, DateTime> ClientsActive = new Dictionary<string, DateTime>();


        public override Task OnConnectedAsync()
        {
            ClientsToUsers.Add(Context.ConnectionId, new List<string>());
            return base.OnConnectedAsync();
        }
        public override Task OnDisconnectedAsync(Exception exception)
        {
            ClientsToUsers.Remove(Context.ConnectionId);
            return base.OnDisconnectedAsync(exception);
        }


        public async Task AddNewFollowing(string user)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, user);
            ClientsToUsers.GetValueOrDefault(Context.ConnectionId).Add(user);
         
        }

        public async Task RemoveFollowing(string user)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, user);
            ClientsToUsers.GetValueOrDefault(Context.ConnectionId).Add(user);
        }
    }
}

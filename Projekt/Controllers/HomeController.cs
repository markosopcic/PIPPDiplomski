using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Projekt.Hubs;
using Projekt.Models;
using Microsoft.AspNetCore.SignalR;
using Projekt.DTOS;
using System.IO;
using Microsoft.AspNetCore.Cors;

namespace Projekt.Controllers
{

    public class HomeController : Controller
    {
        private readonly IHubContext<CesiumHub> wsContext;
        private readonly ILogger<HomeController> _logger;
        public HomeController(ILogger<HomeController> logger, IHubContext<CesiumHub> wsContext)
        {
            _logger = logger;
            this.wsContext = wsContext;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [Route("/ActiveUsers")]
        public IActionResult ActiveUsers()
        {
            return Json(CesiumHub.ClientsActive.Where(f => (DateTime.Now - f.Value).TotalMinutes < 10).Select(e => e.Key));
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

 
        
        [HttpPost]
        [Route("/Position")]
        public IActionResult Position([FromBody]PositionDTO position)
        {
            if(position == null)
            {
                throw new ArgumentNullException(nameof(position));
            }
            foreach(KeyValuePair<string,DateTime> pair in new Dictionary<string,DateTime>(CesiumHub.ClientsActive))
            {
                if(pair.Value != DateTime.MinValue && (DateTime.Now - pair.Value).TotalMinutes > 10)
                {
                    CesiumHub.ClientsActive[pair.Key] = DateTime.MinValue;
                    wsContext.Clients.All.SendAsync("InactiveUser", pair.Key);
                }
            }
            if (CesiumHub.ClientsActive.GetValueOrDefault(position.Name,DateTime.MinValue) == DateTime.MinValue)
            {
                CesiumHub.ClientsActive[position.Name] = DateTime.Now;
                wsContext.Clients.All.SendAsync("NewActiveUser", position.Name);
            }
            wsContext.Clients.Group(position.Name).SendAsync("Position",position.Name,position.Latitude, position.Longitude);
            return Ok();
        }

        public IActionResult GetActiveUsers()
        {
            return Json(CesiumHub.ClientsActive.Where((pair) => pair.Value != DateTime.MinValue).ToList());
        }
    }
}

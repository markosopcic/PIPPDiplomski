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
        private readonly DbContext context;
        public HomeController(ILogger<HomeController> logger, IHubContext<CesiumHub> wsContext, DbContext context)
        {
            _logger = logger;
            this.wsContext = wsContext;
            this.context = context;
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
        [Route("/AddPosition")]
        public IActionResult AddPosition([FromBody]PositionDTO position)
        {
            Position p = new Position { Name = position.Name, Latitude = position.Latitude, Longitude = position.Longitude, Time = DateTime.Now };
            context.Positions.Add(p);
            context.SaveChanges();
            return Ok();
        }

        [HttpPost]
        [Route("/AddHistoricalPositions")]
        public IActionResult AddHistoricalPositions([FromBody]HistoricPositionsDTO positions)
        {
            if(positions == null || positions.Name == null || positions.Positions == null)
            {
                throw new ArgumentNullException(nameof(positions));
            }
            foreach(var position in positions.Positions)
            {
                context.Add(new Position { Name = positions.Name, Longitude = position.Longitude, Latitude = position.Latitude, Time = position.Time });
            }
            context.SaveChanges();

            return Ok();
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

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
using Projekt.DAL.Interfaces;

namespace Projekt.Controllers
{

    public class PositionController : Controller
    {
        private readonly IHubContext<CesiumHub> wsContext;
        private readonly ILogger<PositionController> _logger;
        private readonly IArtifactRepository artifactRepository;
        private IPositionRepository positionRepository;
        public PositionController(ILogger<PositionController> logger, IHubContext<CesiumHub> wsContext, IPositionRepository  positionRepository,IArtifactRepository artifactRepo)
        {
            _logger = logger;
            this.wsContext = wsContext;
            this.positionRepository = positionRepository;
            this.artifactRepository = artifactRepo;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [Route("/AllUsers")]
        public IActionResult AllUsers()
        {
            return Json(positionRepository.GetAllUsers());
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
        [Route("/GetHistoricalData")]
        public IActionResult GetHistoricalData(HistoricRequestDTO request)
        {
            Dictionary<string, List<TimePositionDTO>> positionsByUsers = new Dictionary<string, List<TimePositionDTO>>();
            foreach(var name in request.Names)
            {
                var positions = positionRepository.GetPositions(name, request.From, request.To).Select(e => new TimePositionDTO { Longitude = e.Longitude, Latitude = e.Latitude, Time = e.Time }).OrderBy(e => e.Time).ToList();
                if(positions.Count == 0)
                {
                    continue;
                }
                positionsByUsers.Add(name, positions );
            }
            return Json(positionsByUsers);
        }

        [HttpPost]
        [Route("/AddHistoricalPositions")]
        public IActionResult AddHistoricalPositions([FromBody]HistoricPositionsDTO positions)
        {
            if(positions == null || positions.Name == null || positions.Positions == null)
            {
                throw new ArgumentNullException(nameof(positions));
            }
            if(positionRepository.AddPositions(positions)){
                return Ok();
            }

            return BadRequest();
        }

 
        
        [HttpPost]
        [Route("/Position")]
        public IActionResult Position([FromBody]PositionDTO position)
        {
            if(position == null)
            {
                throw new ArgumentNullException(nameof(position));
            }
            if (!positionRepository.AddPosition(position))
            {
                return BadRequest("Position couldn't be saved");
            }
            foreach(KeyValuePair<string,DateTime> pair in new Dictionary<string,DateTime>(CesiumHub.ClientsActive))
            {
                if(pair.Value != DateTime.MinValue && (DateTime.Now - pair.Value).TotalMinutes > 10)
                {
                    CesiumHub.ClientsActive[pair.Key] = DateTime.MinValue;
                    CesiumHub.ClientsConnections.Remove(pair.Key);
                    wsContext.Clients.All.SendAsync("InactiveUser", pair.Key);
                }
            }
            if (CesiumHub.ClientsActive.GetValueOrDefault(position.Name,DateTime.MinValue) == DateTime.MinValue)
            {
                CesiumHub.ClientsActive[position.Name] = position.Time;
                wsContext.Clients.All.SendAsync("NewActiveUser", position.Name);
            }

            var nearArtifacts = artifactRepository.GetWonArtifacts(position.Longitude, position.Latitude, position.Time);
            if (nearArtifacts.Count > 0)
            {
                foreach (var artifact in nearArtifacts)
                {
                    wsContext.Clients.All.SendAsync("ArtifactWon", artifact.Id.ToString());
                }
                artifactRepository.GivePoints(nearArtifacts.Count, position.Name);
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

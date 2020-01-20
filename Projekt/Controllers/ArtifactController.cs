using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Projekt.DAL.Interfaces;
using Projekt.DTOS;
using Projekt.Hubs;

namespace Projekt.Controllers
{
    public class ArtifactController : Controller
    {

        private IArtifactRepository artifactRepository;
        private IHubContext<CesiumHub> wsContext;

        public ArtifactController(IArtifactRepository artifactRepository, IHubContext<CesiumHub> wsContext)
        {
            this.artifactRepository = artifactRepository;
            this.wsContext = wsContext;
        }
        [Route("/Artifact/AddArtifact")]
        [HttpPost]
        public IActionResult AddArtifact([FromBody]ArtifactDTO artifact)
        {
            if(artifact.Latitude < -90 || artifact.Latitude > 90 || artifact.Longitude <-180 || artifact.Longitude > 180)
            {
                return BadRequest("Invalid coordinates");
            }
            var id = artifactRepository.AddArtifact(artifact);
            if (id.HasValue)
            {
                var art = artifactRepository.GetById(id.Value);
                wsContext.Clients.All.SendAsync("ArtifactSet", id, art.Longitude, art.Latitude);
                return Json(id.Value);
            }
            return BadRequest();
        }


        [Route("/Artifact/GetActiveArtifacts")]
        public IActionResult GetActiveArtifacts()
        {
            return Json(artifactRepository.GetAllArtifacts());
        }

        public IActionResult Index()
        {
            return View();
        }
    }
}
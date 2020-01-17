using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Projekt.DAL.Interfaces;
using Projekt.DTOS;

namespace Projekt.Controllers
{
    public class ArtifactController : Controller
    {

        private IArtifactRepository artifactRepository;

        public ArtifactController(IArtifactRepository artifactRepository)
        {
            this.artifactRepository = artifactRepository;
        }
        [Route("/Artifact/AddArtifact")]
        [HttpPost]
        public IActionResult AddArtifact([FromBody]ArtifactDTO artifact)
        {
            if(artifact.Latitude < -90 || artifact.Latitude > 90 || artifact.Longitude <-180 || artifact.Longitude > 180)
            {
                return BadRequest("Invalid coordinates");
            }
            if (artifactRepository.AddArtifact(artifact))
            {
                return Ok();
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
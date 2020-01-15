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

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }


 
        


    }
}

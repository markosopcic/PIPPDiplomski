using Microsoft.AspNetCore.Mvc;
using System;

namespace Projekt.DTOS
{
    public class PositionDTO
    {
        public string Name { get; set; }
        public double Longitude { get; set; }
        public double Latitude { get; set; }

        public DateTime Time { get; set; }
    }
}
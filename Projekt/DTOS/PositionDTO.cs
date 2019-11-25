using Microsoft.AspNetCore.Mvc;

namespace Projekt.DTOS
{
    public class PositionDTO
    {
        public string Name { get; set; }
        public double Longitude { get; set; }
        public double Latitude { get; set; }
    }
}
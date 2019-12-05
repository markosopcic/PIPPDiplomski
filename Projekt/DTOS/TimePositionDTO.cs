using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Projekt.DTOS
{
    public class TimePositionDTO
    {
        public double Longitude { get; set; }
        public double Latitude { get; set; }
        public DateTime Time { get; set; }
    }
}

using System;
using System.Collections.Generic;

namespace Projekt.Models
{
    public partial class Artifact
    {
        public double Longitude { get; set; }
        public double Latitude { get; set; }
        public DateTime Expires { get; set; }
    }
}

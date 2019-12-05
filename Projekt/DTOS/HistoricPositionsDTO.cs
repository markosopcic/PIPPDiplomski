using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Projekt.DTOS
{
    public class HistoricPositionsDTO
    {
        public string Name { get; set; }
        public List<TimePositionDTO> Positions { get; set; }
    }
}

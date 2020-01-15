using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Projekt.DTOS
{
    public class HistoricRequestDTO
    {
        public List<string> Names { get; set; }
        public DateTime From { get; set; }
        public DateTime To { get; set; }
    }
}

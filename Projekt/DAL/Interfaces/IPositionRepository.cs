using Projekt.DTOS;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Projekt.DAL.Interfaces
{
    public interface IPositionRepository
    {

        public bool AddPosition(Position position);

        public bool AddPosition(PositionDTO position);

        public bool AddPositions(HistoricPositionsDTO position);

        public List<Position> GetPositions(string Name, DateTime from, DateTime to);

        public List<string> GetAllUsers();
    }
}

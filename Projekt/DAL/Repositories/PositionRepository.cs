using Projekt.DAL.Interfaces;
using Projekt.DTOS;
using Projekt.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Projekt.DAL.Repositories
{
    public class PositionRepository : IPositionRepository
    {
        private DbContext context { get; set; }
        public PositionRepository(DbContext context)
        {
            this.context = context;
        }

        public bool AddPosition(Position position)
        {
            try
            {
                context.Positions.Add(position);
                context.SaveChanges();
                return true;
            }catch(Exception e)
            {
                return false;
            }
        }

        public List<Position> GetPositions(string Name, DateTime from, DateTime to)
        {
            return context.Positions.Where(e => e.Name == Name && e.Time >= from && e.Time <= to).OrderBy(e => e.Time).ToList();
        }

        public bool AddPosition(PositionDTO position)
        {
            try
            {
                Position p = new Position { Name = position.Name, Time = position.Time != null ? position.Time : DateTime.Now, Longitude = position.Longitude, Latitude = position.Latitude };
                context.Positions.Add(p);
                context.SaveChanges();
                return true;
            }catch(Exception e)
            {
                return false;
            }
        }

        public bool AddPositions(HistoricPositionsDTO positions)
        {
            try
            {
                foreach (var position in positions.Positions)
                {
                    Position p = new Position { Name = positions.Name, Longitude = position.Longitude, Latitude = position.Latitude, Time = position.Time };
                    context.Positions.Add(p);
                }
                context.SaveChanges();
                return true;
            }catch(Exception e)
            {
                return false;
            }
        }

        public List<string> GetAllUsers()
        {
            return context.Positions.Select(e => e.Name).Distinct().OrderBy(e => e).ToList();
        }
    }
}

using Projekt.DAL.Interfaces;
using Projekt.DTOS;
using Projekt.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Projekt.DAL.Repositories
{
    public class ArtifactRepository : IArtifactRepository
    {
        private DbContext context;
        public ArtifactRepository(DbContext context)
        {
            this.context = context;
        }

        public List<Artifact> GetAllArtifacts()
        {
            return context.Artifacts.ToList();
        }

        public List<Artifact> GetNearArtifacts(double longitude, double latitude)
        {
            return context.Artifacts.Where(e => DistanceTo(e.Latitude, e.Longitude, latitude, longitude) < 5).ToList();
        }

        public List<Artifact> GetWonArtifacts(double longitude, double latitude,DateTime time)
        {
            var artifacts = context.Artifacts.AsEnumerable().Where(e => DistanceTo(e.Latitude, e.Longitude, latitude, longitude) < 0.015).ToList();
            context.Artifacts.RemoveRange(artifacts);
            context.SaveChanges();
            return artifacts.ToList();
        }

        public static double DistanceTo(double lat1, double lon1, double lat2, double lon2)
        {
            double rlat1 = Math.PI * lat1 / 180;
            double rlat2 = Math.PI * lat2 / 180;
            double theta = lon1 - lon2;
            double rtheta = Math.PI * theta / 180;
            double dist =
                Math.Sin(rlat1) * Math.Sin(rlat2) + Math.Cos(rlat1) *
                Math.Cos(rlat2) * Math.Cos(rtheta);
            dist = Math.Acos(dist);
            dist = dist * 180 / Math.PI;
            dist = dist * 60 * 1.1515;
            return dist * 1.609344;

        }

        public int? AddArtifact(ArtifactDTO artifact)
        {
            try
            {
                context.Artifacts.Add(new Artifact { Longitude = artifact.Longitude, Latitude = artifact.Latitude});
                context.SaveChanges();
                return context.Artifacts.Where(e => e.Longitude == artifact.Longitude && e.Latitude == artifact.Latitude).First().Id;
            }catch(Exception e)
            {
                return null;
            }
        }

        public Artifact GetById(int id)
        {
            var res = context.Artifacts.Where(e => e.Id == id).FirstOrDefault();
            return res;
        }

        public void GivePoints(int points, string user)
        {
            var u = context.Scores.Where(e => e.User == user).ToList();
            if(u.Count == 0)
            {
                context.Scores.Add(new Score { User = user, Points = points });
                context.SaveChanges();
            }
            else
            {
                var us = u.ElementAt(0);
                us.Points += points;
                context.Scores.Update(us);
                context.SaveChanges();
            }
        }
    }
}

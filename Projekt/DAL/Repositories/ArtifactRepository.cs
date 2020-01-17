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
            return context.Artifacts.Where(e => e.Expires > time && DistanceTo(e.Latitude, e.Longitude, latitude, longitude) < 0.005).ToList();
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

        public bool AddArtifact(ArtifactDTO artifact)
        {
            try
            {
                context.Artifacts.Add(new Artifact { Longitude = artifact.Longitude, Latitude = artifact.Latitude, Expires = artifact.Expires });
                context.SaveChanges();
                return true;
            }catch(Exception e)
            {
                return false;
            }
        }
    }
}

﻿using Projekt.DTOS;
using Projekt.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Projekt.DAL.Interfaces
{
    public interface IArtifactRepository
    {

        List<Artifact> GetNearArtifacts(double longitude, double latitude);

        List<Artifact> GetAllArtifacts();

        List<Artifact> GetWonArtifacts(double longitude, double latitude,DateTime time);

        bool AddArtifact(ArtifactDTO artifact);
    }
}
using System;
using System.Configuration;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage;
using Projekt.Models;

namespace Projekt
{
    public partial class DbContext : Microsoft.EntityFrameworkCore.DbContext
    {
        public DbContext()
        {

        }

        bool CheckTableExists()
        {
            try
            {
                this.Positions.Where(s => s.Longitude == -100000).Count();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public DbContext(DbContextOptions<DbContext> options)
            : base(options)
        {
            if (!CheckTableExists())
            {
                var databaseCreator = this.GetService<IRelationalDatabaseCreator>();
                databaseCreator.CreateTables();
            }
        }

        public virtual DbSet<Artifact> Artifacts { get; set; }
        public virtual DbSet<Position> Positions { get; set; }
        public virtual DbSet<Score> Scores { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Artifact>(entity =>
            {
                entity.HasKey(e => new { e.Longitude, e.Latitude })
                    .HasName("artifacts_pkey");

                entity.ToTable("artifacts");

                entity.Property(e => e.Longitude).HasColumnName("longitude");

                entity.Property(e => e.Latitude).HasColumnName("latitude");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .ValueGeneratedOnAdd()
                    .UseIdentityAlwaysColumn();
            });

            modelBuilder.Entity<Position>(entity =>
            {
                entity.ToTable("positions");

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Latitude).HasColumnName("latitude");

                entity.Property(e => e.Longitude).HasColumnName("longitude");

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasColumnName("name")
                    .HasMaxLength(50);

                entity.Property(e => e.Time).HasColumnName("time");
            });

            modelBuilder.Entity<Score>(entity =>
            {
                entity.HasKey(e => e.User)
                    .HasName("scores_pkey");

                entity.ToTable("scores");

                entity.Property(e => e.User)
                    .HasColumnName("user")
                    .HasColumnType("character varying");

                entity.Property(e => e.Points).HasColumnName("points");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}

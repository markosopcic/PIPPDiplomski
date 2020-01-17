using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Projekt.Models;

namespace Projekt
{
    public partial class DbContext : Microsoft.EntityFrameworkCore.DbContext
    {
        public DbContext()
        {
        }

        public DbContext(DbContextOptions<DbContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Artifact> Artifacts { get; set; }
        public virtual DbSet<Position> Positions { get; set; }
        public virtual DbSet<Score> Scores { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. See http://go.microsoft.com/fwlink/?LinkId=723263 for guidance on storing connection strings.
                optionsBuilder.UseNpgsql("Host=msopcic.hopto.org;Database=projekt;Username=postgres;Password=projekt1234");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Artifact>(entity =>
            {
                entity.HasKey(e => new { e.Longitude, e.Latitude })
                    .HasName("artifacts_pkey");

                entity.ToTable("artifacts");

                entity.Property(e => e.Longitude).HasColumnName("longitude");

                entity.Property(e => e.Latitude).HasColumnName("latitude");
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

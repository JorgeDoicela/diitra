using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace diitra_infrastructure.data.models.Configurations;

public class InvFeedbackReporteConfiguration : IEntityTypeConfiguration<InvFeedbackReporte>
{
    public void Configure(EntityTypeBuilder<InvFeedbackReporte> entity)
    {
        entity.HasKey(e => e.IdFeedback).HasName("PRIMARY");
        entity.ToTable("inv_feedback_reportes");

        entity.Property(e => e.IdFeedback).HasColumnName("idFeedback");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();

        entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
        entity.Property(e => e.Cedula).HasColumnName("cedula").HasMaxLength(20);
        entity.Property(e => e.NombreUsuario).HasColumnName("nombreUsuario").HasMaxLength(255).IsRequired();
        entity.Property(e => e.RolUsuario).HasColumnName("rolUsuario").HasMaxLength(50).IsRequired();
        entity.Property(e => e.Tipo).HasColumnName("tipo").HasMaxLength(30).HasDefaultValue("SUGERENCIA");
        entity.Property(e => e.Titulo).HasColumnName("titulo").HasMaxLength(200).IsRequired();
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text").IsRequired();
        entity.Property(e => e.RutaOrigen).HasColumnName("rutaOrigen").HasMaxLength(255);
        entity.Property(e => e.ArchivosAdjuntosJson).HasColumnName("archivosAdjuntosJson").HasColumnType("json");
        entity.Property(e => e.Estado).HasColumnName("estado").HasMaxLength(30).HasDefaultValue("PENDIENTE");
        entity.Property(e => e.ObservacionAdmin).HasColumnName("observacionAdmin").HasColumnType("text");
        entity.Property(e => e.FechaCreacion).HasColumnName("fechaCreacion").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(e => e.FechaActualizacion).HasColumnName("fechaActualizacion");
    }
}

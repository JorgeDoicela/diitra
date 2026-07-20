using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace diitra_infrastructure.data.models.Configurations;

public class InvRevisionesParesConfiguration : IEntityTypeConfiguration<InvRevisionesPares>
{
    public void Configure(EntityTypeBuilder<InvRevisionesPares> entity)
    {
        entity.HasKey(e => e.IdRevision).HasName("PRIMARY");
        entity.ToTable("inv_revisiones_pares");
        entity.Property(e => e.IdRevision).HasColumnName("idRevision");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.IdRevisor).HasColumnName("idRevisor").IsRequired(false);
        entity.Property(e => e.FechaAsignacion).HasColumnName("fechaAsignacion").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(e => e.FechaLimite).HasColumnName("fechaLimite");
        entity.Property(e => e.FechaCompletado).HasColumnName("fechaCompletado").IsRequired(false);
        entity.Property(e => e.Estado).HasColumnName("estado").HasMaxLength(50).HasDefaultValueSql("'Pendiente'");
        entity.Property(e => e.DictamenRevisor).HasColumnName("dictamenRevisor")
            .HasColumnType("enum('Pendiente','Aprueba','Rechaza')")
            .HasDefaultValueSql("'Pendiente'");
        entity.Property(e => e.EsExterno).HasColumnName("esExterno").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
        entity.Property(e => e.EsDobleCiego).HasColumnName("esDobleCiego").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
        entity.Property(e => e.PuntajeTotal).HasColumnName("puntajeTotal").HasPrecision(5, 2);
        entity.Property(e => e.ObservacionesGral).HasColumnName("observacionesGral").HasColumnType("text");

        entity.HasOne(d => d.Proyecto).WithMany().HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_rev_proyecto");
        entity.HasOne(d => d.Revisor).WithMany().HasForeignKey(d => d.IdRevisor).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_rev_usuario").IsRequired(false);
    }
}

public class InvEvaluacionesDetalleConfiguration : IEntityTypeConfiguration<InvEvaluacionesDetalle>
{
    public void Configure(EntityTypeBuilder<InvEvaluacionesDetalle> entity)
    {
        entity.HasKey(e => e.IdDetalle).HasName("PRIMARY");
        entity.ToTable("inv_evaluaciones_detalle");
        entity.Property(e => e.IdDetalle).HasColumnName("idDetalle");
        entity.Property(e => e.IdRevision).HasColumnName("idRevision");
        entity.Property(e => e.Criterio).HasColumnName("criterio").HasMaxLength(255).IsRequired();
        entity.Property(e => e.Puntaje).HasColumnName("puntaje").HasPrecision(5, 2);
        entity.Property(e => e.Observaciones).HasColumnName("observaciones").HasColumnType("text");

        entity.HasOne(d => d.Revision).WithMany(p => p.Detalles).HasForeignKey(d => d.IdRevision).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_eval_revision");
    }
}

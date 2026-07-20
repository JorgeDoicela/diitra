using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace diitra_infrastructure.data.models.Configurations;

public class InvConvocatoriaConfiguration : IEntityTypeConfiguration<InvConvocatoria>
{
    public void Configure(EntityTypeBuilder<InvConvocatoria> entity)
    {
        entity.HasKey(e => e.IdConvocatoria).HasName("PRIMARY");
        entity.ToTable("inv_convocatorias");
        entity.Property(e => e.IdConvocatoria).HasColumnName("idConvocatoria");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.CodigoConvocatoria).HasColumnName("codigoConvocatoria").HasMaxLength(30).IsRequired();
        entity.HasIndex(e => e.CodigoConvocatoria).IsUnique();
        entity.Property(e => e.Titulo).HasColumnName("titulo").HasMaxLength(255).IsRequired();
        entity.Property(e => e.IdPeriodo).HasColumnName("idPeriodo").HasMaxLength(7).IsFixedLength().IsRequired();
        entity.Property(e => e.FechaApertura).HasColumnName("fechaApertura");
        entity.Property(e => e.FechaCierre).HasColumnName("fechaCierre");
        entity.Property(e => e.Anio).HasColumnName("anio").HasMaxLength(50).IsRequired();
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text");
        entity.Property(e => e.UrlBases).HasColumnName("urlBases").HasMaxLength(512);
        entity.Property(e => e.RequisitosMinimos).HasColumnName("requisitosMinimos").HasColumnType("text");
        entity.Property(e => e.IdTipoConvocatoria).HasColumnName("idTipoConvocatoria");
        entity.Property(e => e.IdRubrica).HasColumnName("idRubrica");
        entity.Property(e => e.Estado).HasColumnName("estado").HasColumnType("enum('Borrador','Abierta','Cerrada','Anulada')").HasDefaultValueSql("'Borrador'");
        entity.Property(e => e.Eliminado).HasColumnName("eliminado").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
        entity.Property(e => e.FechaEliminacion).HasColumnName("fechaEliminacion");
        entity.Property(e => e.EliminadoPorUsuarioId).HasColumnName("eliminadoPorUsuarioId");

        entity.HasOne(d => d.IdPeriodoNavigation).WithMany().HasForeignKey(d => d.IdPeriodo).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_conv_periodo");
        entity.HasOne(d => d.IdRubricaNavigation).WithMany().HasForeignKey(d => d.IdRubrica).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_conv_rubrica");
    }
}

public class InvRubricaConfiguration : IEntityTypeConfiguration<InvRubrica>
{
    public void Configure(EntityTypeBuilder<InvRubrica> entity)
    {
        entity.HasKey(e => e.IdRubrica).HasName("PRIMARY");
        entity.ToTable("inv_rubricas");
        entity.Property(e => e.IdRubrica).HasColumnName("idRubrica");
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(255).IsRequired();
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text");
        entity.Property(e => e.Version).HasColumnName("version").HasMaxLength(20).HasDefaultValueSql("'1.0'");
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
        entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}

public class InvRubricaCriterioConfiguration : IEntityTypeConfiguration<InvRubricaCriterio>
{
    public void Configure(EntityTypeBuilder<InvRubricaCriterio> entity)
    {
        entity.HasKey(e => e.IdCriterio).HasName("PRIMARY");
        entity.ToTable("inv_rubrica_criterios");
        entity.Property(e => e.IdCriterio).HasColumnName("idCriterio");
        entity.Property(e => e.IdRubrica).HasColumnName("idRubrica");
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(255).IsRequired();
        entity.Property(e => e.Descripcion).HasColumnType("text").HasColumnName("descripcion");
        entity.Property(e => e.PesoPorcentaje).HasColumnName("pesoPorcentaje").HasPrecision(5, 2).IsRequired();
        entity.Property(e => e.Orden).HasColumnName("orden").HasDefaultValueSql("'0'");

        entity.HasOne(d => d.IdRubricaNavigation).WithMany(p => p.InvRubricaCriterios).HasForeignKey(d => d.IdRubrica).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_crit_rubrica");
    }
}

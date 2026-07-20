using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace diitra_infrastructure.data.models.Configurations;

public class InvGrupoInvestigacionConfiguration : IEntityTypeConfiguration<InvGrupoInvestigacion>
{
    public void Configure(EntityTypeBuilder<InvGrupoInvestigacion> entity)
    {
        entity.HasKey(e => e.IdGrupo).HasName("PRIMARY");
        entity.ToTable("inv_grupos_investigacion");
        entity.Property(e => e.IdGrupo).HasColumnName("idGrupo");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(255).IsRequired();
        entity.Property(e => e.Siglas).HasColumnName("siglas").HasMaxLength(50);
        entity.Property(e => e.TipoGrupo).HasColumnName("tipoGrupo").HasMaxLength(20).IsRequired().HasDefaultValue("Investigación");
        entity.Property(e => e.IdDominio).HasColumnName("idDominio");
        entity.Property(e => e.IdCoordinador).HasColumnName("idCoordinador");
        entity.Property(e => e.ObjetivoGeneral).HasColumnName("objetivoGeneral").HasColumnType("text");
        entity.Property(e => e.Mision).HasColumnName("mision").HasColumnType("text");
        entity.Property(e => e.Vision).HasColumnName("vision").HasColumnType("text");
        entity.Property(e => e.ResolucionAprobacion).HasColumnName("resolucionAprobacion").HasMaxLength(100);
        entity.Property(e => e.FechaCreacion).HasColumnName("fechaCreacion");
        entity.Property(e => e.CategoriaConsolidacion).HasColumnName("categoriaConsolidacion").HasMaxLength(50).HasDefaultValue("En Formación");
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
        entity.Property(e => e.Eliminado).HasColumnName("eliminado").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
        entity.Property(e => e.FechaEliminacion).HasColumnName("fechaEliminacion");
        entity.Property(e => e.EliminadoPorUsuarioId).HasColumnName("eliminadoPorUsuarioId");
        entity.Property(e => e.Estado).HasColumnName("estado").HasMaxLength(20).HasDefaultValue("Aprobado");
        entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(e => e.LinkWhatsapp).HasColumnName("linkWhatsapp").HasMaxLength(255);
        entity.Property(e => e.TelefonoCoordinador).HasColumnName("telefonoCoordinador").HasMaxLength(20);

        entity.HasOne(d => d.IdCoordinadorNavigation).WithMany()
            .HasForeignKey(d => d.IdCoordinador).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_grupo_coordinador");

        entity.HasOne(d => d.IdDominioNavigation).WithMany()
            .HasForeignKey(d => d.IdDominio).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_grupo_dominio");

        entity.HasMany(d => d.IdLineas).WithMany(p => p.IdGrupos)
            .UsingEntity<System.Collections.Generic.Dictionary<string, object>>(
                "inv_grupos_lineas",
                r => r.HasOne<InvLineaInvestigacion>().WithMany().HasForeignKey("idLinea").OnDelete(DeleteBehavior.Cascade),
                l => l.HasOne<InvGrupoInvestigacion>().WithMany().HasForeignKey("idGrupo").OnDelete(DeleteBehavior.Cascade),
                j =>
                {
                    j.HasKey("idGrupo", "idLinea");
                    j.ToTable("inv_grupos_lineas");
                });

        entity.HasMany(d => d.IdCarreras).WithMany()
            .UsingEntity<System.Collections.Generic.Dictionary<string, object>>(
                "inv_grupos_carreras",
                r => r.HasOne<Carrera>().WithMany().HasForeignKey("idCarrera").OnDelete(DeleteBehavior.Cascade),
                l => l.HasOne<InvGrupoInvestigacion>().WithMany().HasForeignKey("idGrupo").OnDelete(DeleteBehavior.Cascade),
                j =>
                {
                    j.HasKey("idGrupo", "idCarrera");
                    j.ToTable("inv_grupos_carreras");
                });
    }
}

public class InvGrupoMiembroConfiguration : IEntityTypeConfiguration<InvGrupoMiembro>
{
    public void Configure(EntityTypeBuilder<InvGrupoMiembro> entity)
    {
        entity.HasKey(e => e.IdGrupoMiembro).HasName("PRIMARY");
        entity.ToTable("inv_grupos_miembros");
        entity.Property(e => e.IdGrupoMiembro).HasColumnName("idGrupoMiembro");
        entity.Property(e => e.IdGrupo).HasColumnName("idGrupo");
        entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
        entity.Property(e => e.Rol).HasColumnName("rol").HasMaxLength(100);
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
        entity.Property(e => e.FechaInicio).HasColumnName("fechaInicio");
        entity.Property(e => e.FechaFin).HasColumnName("fechaFin");
        entity.Property(e => e.MotivoSalida).HasColumnName("motivoSalida").HasMaxLength(255);
        entity.Property(e => e.TelefonoContacto).HasColumnName("telefonoContacto").HasMaxLength(20);

        entity.HasOne(d => d.IdGrupoNavigation).WithMany(p => p.InvGruposMiembros)
            .HasForeignKey(d => d.IdGrupo).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_miembro_grupo");
        entity.HasOne(d => d.IdUsuarioNavigation).WithMany()
            .HasForeignKey(d => d.IdUsuario).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_miembro_usuario");
    }
}

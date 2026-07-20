using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace diitra_infrastructure.data.models.Configurations;

public class InvLineaInvestigacionConfiguration : IEntityTypeConfiguration<InvLineaInvestigacion>
{
    public void Configure(EntityTypeBuilder<InvLineaInvestigacion> entity)
    {
        entity.HasKey(e => e.IdLinea).HasName("PRIMARY");
        entity.ToTable("inv_lineas_investigacion");
        entity.Property(e => e.IdLinea).HasColumnName("idLinea");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.CodigoLinea).HasColumnName("codigoLinea").HasMaxLength(30).IsRequired();
        entity.HasIndex(e => e.CodigoLinea).IsUnique();
        entity.Property(e => e.NombreLinea).HasColumnName("nombreLinea").HasMaxLength(255).IsRequired();
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text");
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
        entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}

public class InvProgramaConfiguration : IEntityTypeConfiguration<InvPrograma>
{
    public void Configure(EntityTypeBuilder<InvPrograma> entity)
    {
        entity.HasKey(e => e.IdPrograma).HasName("PRIMARY");
        entity.ToTable("inv_programas");
        entity.Property(e => e.IdPrograma).HasColumnName("idPrograma");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(255).IsRequired();
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
        entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}

public class InvDominioConfiguration : IEntityTypeConfiguration<InvDominio>
{
    public void Configure(EntityTypeBuilder<InvDominio> entity)
    {
        entity.HasKey(e => e.IdDominio).HasName("PRIMARY");
        entity.ToTable("inv_dominios");
        entity.Property(e => e.IdDominio).HasColumnName("idDominio");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(255).IsRequired();
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
        entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}

public class InvDominioCarreraConfiguration : IEntityTypeConfiguration<InvDominioCarrera>
{
    public void Configure(EntityTypeBuilder<InvDominioCarrera> entity)
    {
        entity.HasKey(e => e.IdDominioCarrera).HasName("PRIMARY");
        entity.ToTable("inv_dominios_carrera");
        entity.Property(e => e.IdDominioCarrera).HasColumnName("idDominioCarrera");
        entity.Property(e => e.IdDominio).HasColumnName("idDominio");
        entity.Property(e => e.IdCarrera).HasColumnName("idCarrera");

        entity.HasOne(d => d.IdDominioNavigation).WithMany(p => p.InvDominiosCarreras)
            .HasForeignKey(d => d.IdDominio).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_idc_dominio");
        entity.HasOne(d => d.IdCarreraNavigation).WithMany()
            .HasForeignKey(d => d.IdCarrera).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_idc_carrera");
    }
}

public class InvSublineaConfiguration : IEntityTypeConfiguration<InvSublinea>
{
    public void Configure(EntityTypeBuilder<InvSublinea> entity)
    {
        entity.HasKey(e => e.IdSublinea).HasName("PRIMARY");
        entity.ToTable("inv_sublineas");
        entity.Property(e => e.IdSublinea).HasColumnName("idSublinea");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.IdLinea).HasColumnName("idLinea");
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(255).IsRequired();
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);

        entity.HasOne(d => d.IdLineaNavigation).WithMany(p => p.InvSublineas)
            .HasForeignKey(d => d.IdLinea).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_sub_linea");
    }
}

public class InvTipoInvestigacionConfiguration : IEntityTypeConfiguration<InvTipoInvestigacion>
{
    public void Configure(EntityTypeBuilder<InvTipoInvestigacion> entity)
    {
        entity.HasKey(e => e.IdTipo).HasName("PRIMARY");
        entity.ToTable("inv_tipos_investigacion");
        entity.Property(e => e.IdTipo).HasColumnName("idTipo");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(150).IsRequired();
        entity.Property(e => e.IdTipoPadre).HasColumnName("idTipoPadre");
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);

        entity.HasOne(d => d.IdTipoPadreNavigation).WithMany(p => p.InverseIdTipoPadreNavigation)
            .HasForeignKey(d => d.IdTipoPadre).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_tipo_padre");
    }
}

public class InvTipoConvocatoriaConfiguration : IEntityTypeConfiguration<InvTipoConvocatoria>
{
    public void Configure(EntityTypeBuilder<InvTipoConvocatoria> entity)
    {
        entity.HasKey(e => e.IdTipoConvocatoria).HasName("PRIMARY");
        entity.ToTable("inv_tipos_convocatoria");
        entity.Property(e => e.IdTipoConvocatoria).HasColumnName("idTipoConvocatoria");
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasMaxLength(255);
    }
}

public class InvAgendaZonalConfiguration : IEntityTypeConfiguration<InvAgendaZonal>
{
    public void Configure(EntityTypeBuilder<InvAgendaZonal> entity)
    {
        entity.HasKey(e => e.IdAgendaZonal).HasName("PRIMARY");
        entity.ToTable("inv_agendas_zonales");
        entity.Property(e => e.IdAgendaZonal).HasColumnName("idAgendaZonal");
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(150).IsRequired();
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasMaxLength(255);
    }
}

public class InvOdsEjeConfiguration : IEntityTypeConfiguration<InvOdsEje>
{
    public void Configure(EntityTypeBuilder<InvOdsEje> entity)
    {
        entity.HasKey(e => e.IdEje).HasName("PRIMARY");
        entity.ToTable("inv_ods_ejes");
        entity.Property(e => e.IdEje).HasColumnName("idEje");
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
    }
}

public class InvOdsConfiguration : IEntityTypeConfiguration<InvOds>
{
    public void Configure(EntityTypeBuilder<InvOds> entity)
    {
        entity.HasKey(e => e.IdOds).HasName("PRIMARY");
        entity.ToTable("inv_ods");
        entity.Property(e => e.IdOds).HasColumnName("idOds");
        entity.Property(e => e.IdEje).HasColumnName("idEje");
        entity.Property(e => e.NumeroOds).HasColumnName("numeroOds");
        entity.Property(e => e.Titulo).HasColumnName("titulo").HasMaxLength(255).IsRequired();

        entity.HasOne(d => d.IdEjeNavigation).WithMany(p => p.InvOds).HasForeignKey(d => d.IdEje).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_ods_eje");
    }
}

public class InvCatImpactoConfiguration : IEntityTypeConfiguration<InvCatImpacto>
{
    public void Configure(EntityTypeBuilder<InvCatImpacto> entity)
    {
        entity.HasKey(e => e.IdCatImpacto).HasName("PRIMARY");
        entity.ToTable("inv_cat_impactos");
        entity.Property(e => e.IdCatImpacto).HasColumnName("idCatImpacto");
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
    }
}

public class InvCatTipoProductoConfiguration : IEntityTypeConfiguration<InvCatTipoProducto>
{
    public void Configure(EntityTypeBuilder<InvCatTipoProducto> entity)
    {
        entity.HasKey(e => e.IdTipoProducto).HasName("PRIMARY");
        entity.ToTable("inv_cat_tipo_producto");
        entity.Property(e => e.IdTipoProducto).HasColumnName("idTipoProducto");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
        entity.Property(e => e.Categoria).HasColumnName("categoria").HasColumnType("enum('Académico','Tecnológico','Innovación','Transferencia')").IsRequired();
        entity.Property(e => e.RequiereRegistro).HasColumnName("requiereRegistro").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'");
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");
    }
}

public class InvCatTipoEvidenciaConfiguration : IEntityTypeConfiguration<InvCatTipoEvidencia>
{
    public void Configure(EntityTypeBuilder<InvCatTipoEvidencia> entity)
    {
        entity.HasKey(e => e.IdTipoEvidencia).HasName("PRIMARY");
        entity.ToTable("inv_cat_tipo_evidencia");
        entity.Property(e => e.IdTipoEvidencia).HasColumnName("idTipoEvidencia");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasMaxLength(255);
        entity.Property(e => e.Extensiones).HasColumnName("extensiones").HasMaxLength(50).HasDefaultValueSql("'pdf,jpg,png,zip'");
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");
    }
}

public class InvEntidadExternaConfiguration : IEntityTypeConfiguration<InvEntidadExterna>
{
    public void Configure(EntityTypeBuilder<InvEntidadExterna> entity)
    {
        entity.HasKey(e => e.IdEntidad).HasName("PRIMARY");
        entity.ToTable("inv_entidades_externas");
        entity.Property(e => e.IdEntidad).HasColumnName("idEntidad");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.Ruc).HasColumnName("ruc").HasMaxLength(13);
        entity.HasIndex(e => e.Ruc).IsUnique();
        entity.Property(e => e.RazonSocial).HasColumnName("razonSocial").HasMaxLength(255).IsRequired();
        entity.Property(e => e.Tipo).HasColumnName("tipo").HasColumnType("enum('Pública','Privada','ONG','Académica')").HasDefaultValueSql("'Privada'");
        entity.Property(e => e.Sector).HasColumnName("sector").HasMaxLength(100);
        entity.Property(e => e.ContactoNombre).HasColumnName("contactoNombre").HasMaxLength(150);
        entity.Property(e => e.ContactoEmail).HasColumnName("contactoEmail").HasMaxLength(150);
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");
        entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}

public class InvPndObjetivoConfiguration : IEntityTypeConfiguration<InvPndObjetivo>
{
    public void Configure(EntityTypeBuilder<InvPndObjetivo> entity)
    {
        entity.HasKey(e => e.IdObjetivoPnd).HasName("PRIMARY");
        entity.ToTable("inv_pnd_objetivos");
        entity.Property(e => e.IdObjetivoPnd).HasColumnName("idObjetivoPnd");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.Codigo).HasColumnName("codigo").HasMaxLength(20).IsRequired();
        entity.HasIndex(e => e.Codigo).IsUnique();
        entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(255).IsRequired();
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text");
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
    }
}

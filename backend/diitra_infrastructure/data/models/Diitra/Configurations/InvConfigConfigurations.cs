using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace diitra_infrastructure.data.models.Configurations;

public class InvConfigIndicadorConfiguration : IEntityTypeConfiguration<InvConfigIndicador>
{
    public void Configure(EntityTypeBuilder<InvConfigIndicador> entity)
    {
        entity.HasKey(e => e.IdConfig).HasName("PRIMARY");
        entity.ToTable("inv_config_indicadores");
        entity.Property(e => e.IdConfig).HasColumnName("idConfig");
        entity.Property(e => e.IdInstitucion).HasColumnName("idInstitucion").HasDefaultValueSql("'1'");
        entity.Property(e => e.CodigoIndicador).HasColumnName("codigoIndicador").HasMaxLength(20).IsRequired();
        entity.Property(e => e.NombreIndicador).HasColumnName("nombreIndicador").HasMaxLength(255).IsRequired();
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text");
        entity.Property(e => e.TipoDato).HasColumnName("tipoDato").HasColumnType("enum('Cantidad','Monto','Booleano','Porcentaje')").HasDefaultValueSql("'Cantidad'");
        entity.Property(e => e.ValorReferencia).HasColumnName("valorReferencia").HasPrecision(12, 2);
        entity.Property(e => e.AñoNormativa).HasColumnName("añoNormativa").IsRequired();
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");
        entity.Property(e => e.UmbralCumplido).HasColumnName("umbralCumplido").HasPrecision(12, 2);
        entity.Property(e => e.UmbralEnProceso).HasColumnName("umbralEnProceso").HasPrecision(12, 2);
        entity.Property(e => e.FormulaCalculo).HasColumnName("formulaCalculo").HasMaxLength(50);
        entity.Property(e => e.UnidadMedida).HasColumnName("unidadMedida").HasMaxLength(50);
    }
}

public class InvConfigWorkflowConfiguration : IEntityTypeConfiguration<InvConfigWorkflow>
{
    public void Configure(EntityTypeBuilder<InvConfigWorkflow> entity)
    {
        entity.HasKey(e => e.IdWorkflow).HasName("PRIMARY");
        entity.ToTable("inv_config_workflow");
        entity.Property(e => e.EstadoOrigen).HasMaxLength(50).IsRequired();
        entity.Property(e => e.EstadoDestino).HasMaxLength(50).IsRequired();
        entity.Property(e => e.ContabilizaCargaHoraria).HasColumnName("contabilizaCargaHoraria").HasColumnType("tinyint(1)").HasDefaultValue(false);
        entity.Property(e => e.PermiteInformesAvance).HasColumnName("permiteInformesAvance").HasColumnType("tinyint(1)").HasDefaultValue(false);
        entity.Property(e => e.PermiteRegistroEgresos).HasColumnName("permiteRegistroEgresos").HasColumnType("tinyint(1)").HasDefaultValue(false);
        entity.Property(e => e.PermiteGastosCapital).HasColumnName("permiteGastosCapital").HasColumnType("tinyint(1)").HasDefaultValue(false);
        entity.Property(e => e.EsEstadoFinal).HasColumnName("esEstadoFinal").HasColumnType("tinyint(1)").HasDefaultValue(false);
        entity.Property(e => e.EtiquetaUi).HasColumnName("etiquetaUi").HasMaxLength(80);
        entity.Property(e => e.ColorHex).HasColumnName("colorHex").HasMaxLength(7);
    }
}

using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace diitra_infrastructure.data.models.Configurations;

public class InvProyectoConfiguration : IEntityTypeConfiguration<InvProyecto>
{
    public void Configure(EntityTypeBuilder<InvProyecto> entity)
    {
        entity.HasKey(e => e.IdProyecto).HasName("PRIMARY");
        entity.ToTable("inv_proyectos");
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired().HasConversion<string>();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.IdConvocatoria).HasColumnName("idConvocatoria");
        entity.Property(e => e.CodigoInstitucional).HasColumnName("codigoInstitucional").HasMaxLength(50);
        entity.HasIndex(e => e.CodigoInstitucional).IsUnique();
        entity.Property(e => e.Titulo).HasColumnName("titulo").HasMaxLength(500).IsRequired();
        entity.Property(e => e.IdSublinea).HasColumnName("idSublinea");
        entity.Property(e => e.IdPrograma).HasColumnName("idPrograma");
        entity.Property(e => e.IdGrupo).HasColumnName("idGrupo");
        entity.Property(e => e.TieneGrupo).HasColumnName("tieneGrupo").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
        entity.Property(e => e.IdTipo).HasColumnName("idTipo");
        entity.Property(e => e.FechaPresentacion).HasColumnName("fechaPresentacion");
        entity.Property(e => e.FechaInicio).HasColumnName("fechaInicio");
        entity.Property(e => e.FechaFin).HasColumnName("fechaFin");
        entity.Property(e => e.TiempoEjecucion).HasColumnName("tiempoEjecucion").HasMaxLength(100);
        entity.Property(e => e.Estado).HasColumnName("estado").HasColumnType("varchar(50)").HasMaxLength(50).HasDefaultValueSql("'Borrador'");
        entity.Property(e => e.DisponibleAdopcion).HasColumnName("disponibleAdopcion").HasColumnType("tinyint(1)").HasDefaultValue(false);
        entity.Property(e => e.PuntajeEvaluacion).HasColumnName("puntajeEvaluacion").HasPrecision(5, 2);
        entity.Property(e => e.ValorEjecucion).HasColumnName("valorEjecucion").HasPrecision(12, 2).HasDefaultValueSql("'0.00'");
        entity.Property(e => e.PresupuestoEstimado).HasColumnName("presupuesto_estimado").HasPrecision(12, 2).HasDefaultValueSql("'0.00'");
        entity.Property(e => e.IdDspaceHandle).HasColumnName("idDspaceHandle").HasMaxLength(255);
        entity.Property(e => e.MetadataCacesJson).HasColumnName("metadataCacesJson").HasColumnType("json");
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
        entity.Property(e => e.Eliminado).HasColumnName("eliminado").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
        entity.Property(e => e.FechaEliminacion).HasColumnName("fechaEliminacion");
        entity.Property(e => e.EliminadoPorUsuarioId).HasColumnName("eliminadoPorUsuarioId");
        entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(e => e.FechaModificacion).HasColumnName("fechaModificacion").HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();
        entity.Property(e => e.IdObjetivoPnd).HasColumnName("idObjetivoPnd");
        entity.Property(e => e.IdEntidadAliada).HasColumnName("idEntidadAliada");
        entity.Property(e => e.TrlInicial).HasColumnName("trlInicial");
        entity.Property(e => e.TrlActual).HasColumnName("trlActual");
        entity.Property(e => e.TrlMeta).HasColumnName("trlMeta");
        entity.Property(e => e.AutoExtendDeadlines).HasColumnName("autoExtendDeadlines").HasColumnType("tinyint(1)").HasDefaultValue(false);
        entity.Property(e => e.AutoExtendDays).HasColumnName("autoExtendDays").HasColumnType("int").HasDefaultValue(7);

        entity.HasOne(d => d.IdObjetivoPndNavigation).WithMany(p => p.InvProyectos).HasForeignKey(d => d.IdObjetivoPnd).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_proy_pnd_obj");
        entity.HasOne(d => d.IdConvocatoriaNavigation).WithMany(p => p.Proyectos).HasForeignKey(d => d.IdConvocatoria).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_proy_conv");
        entity.HasOne(d => d.IdSublineaNavigation).WithMany(p => p.InvProyectos).HasForeignKey(d => d.IdSublinea).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_proy_sublinea");
        entity.HasOne(d => d.IdProgramaNavigation).WithMany(p => p.InvProyectos).HasForeignKey(d => d.IdPrograma).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_proy_programa");
        entity.HasOne(d => d.IdGrupoNavigation).WithMany(p => p.InvProyectos).HasForeignKey(d => d.IdGrupo).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_proy_grupo");
        entity.HasOne(d => d.IdTipoNavigation).WithMany(p => p.InvProyectos).HasForeignKey(d => d.IdTipo).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_proy_tipo");
        entity.HasOne(d => d.IdEntidadAliadaNavigation).WithMany(p => p.InvProyectos).HasForeignKey(d => d.IdEntidadAliada).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_proy_entidad_aliada");
    }
}

public class InvTrazabilidadProyectoConfiguration : IEntityTypeConfiguration<InvTrazabilidadProyecto>
{
    public void Configure(EntityTypeBuilder<InvTrazabilidadProyecto> entity)
    {
        entity.HasKey(e => e.IdTrazabilidad).HasName("PRIMARY");
        entity.ToTable("inv_trazabilidad_proyectos");
        entity.Property(e => e.IdTrazabilidad).HasColumnName("idTrazabilidad");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired().HasConversion<string>();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
        entity.Property(e => e.EstadoAnterior).HasColumnName("estadoAnterior").HasMaxLength(50).IsRequired();
        entity.Property(e => e.EstadoNuevo).HasColumnName("estadoNuevo").HasMaxLength(50).IsRequired();
        entity.Property(e => e.Observacion).HasColumnName("observacion").HasColumnType("text");
        entity.Property(e => e.FechaTransicion).HasColumnName("fechaTransicion").HasDefaultValueSql("CURRENT_TIMESTAMP");
        entity.Property(e => e.HashAnterior).HasColumnName("hashAnterior").HasMaxLength(100);
        entity.Property(e => e.HashActual).HasColumnName("hashActual").HasMaxLength(100);

        entity.HasOne(d => d.IdProyectoNavigation).WithMany().HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_trazabilidad_proyecto");
    }
}

public class InvProyectoCarreraConfiguration : IEntityTypeConfiguration<InvProyectoCarrera>
{
    public void Configure(EntityTypeBuilder<InvProyectoCarrera> entity)
    {
        entity.HasKey(e => e.IdProyectoCarrera).HasName("PRIMARY");
        entity.ToTable("inv_proyectos_carreras");
        entity.Property(e => e.IdProyectoCarrera).HasColumnName("idProyectoCarrera");
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.IdCarrera).HasColumnName("idCarrera");
        entity.Property(e => e.Modalidad).HasColumnName("modalidad").HasMaxLength(100);

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProyectosCarreras).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pc_proyecto");
        entity.HasOne(d => d.IdCarreraNavigation).WithMany().HasForeignKey(d => d.IdCarrera).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pc_carrera");
    }
}

public class InvProyectoDominioConfiguration : IEntityTypeConfiguration<InvProyectoDominio>
{
    public void Configure(EntityTypeBuilder<InvProyectoDominio> entity)
    {
        entity.HasKey(e => e.IdProyectoDominio).HasName("PRIMARY");
        entity.ToTable("inv_proyectos_dominios");
        entity.Property(e => e.IdProyectoDominio).HasColumnName("idProyectoDominio");
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.IdDominio).HasColumnName("idDominio");

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProyectosDominios).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pd_proyecto");
        entity.HasOne(d => d.IdDominioNavigation).WithMany(p => p.InvProyectosDominios).HasForeignKey(d => d.IdDominio).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pd_dominio");
    }
}

public class InvProyectoParticipanteConfiguration : IEntityTypeConfiguration<InvProyectoParticipante>
{
    public void Configure(EntityTypeBuilder<InvProyectoParticipante> entity)
    {
        entity.HasKey(e => e.IdParticipante).HasName("PRIMARY");
        entity.ToTable("inv_proyecto_participantes");
        entity.Property(e => e.IdParticipante).HasColumnName("idParticipante");
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
        entity.Property(e => e.TipoParticipante).HasColumnName("tipoParticipante").HasMaxLength(20).HasDefaultValue("Docente");
        entity.Property(e => e.EsDirector).HasColumnName("esDirector").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
        entity.Property(e => e.Rol).HasColumnName("rol").HasMaxLength(100);
        entity.Property(e => e.NivelAcademico).HasColumnName("nivelAcademico").HasMaxLength(150);
        entity.Property(e => e.Telefono).HasColumnName("telefono").HasMaxLength(20);
        entity.Property(e => e.HorasSemanales).HasColumnName("horasSemanales").HasPrecision(4, 1);
        entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(false);
        entity.Property(e => e.FechaInicio).HasColumnName("fecha_inicio").HasColumnType("datetime");
        entity.Property(e => e.FechaFin).HasColumnType("datetime").HasColumnName("fecha_fin");
        entity.Property(e => e.MotivoCambio).HasColumnName("motivo_change").HasMaxLength(150); // wait: let's verify if it's "motivo_cambio" or "motivo_change" from original code:
        // Line 337: entity.Property(e => e.MotivoCambio).HasColumnName("motivo_cambio").HasMaxLength(150);
        entity.Property(e => e.MotivoCambio).HasColumnName("motivo_cambio").HasMaxLength(150);

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProyectoParticipantes).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_part_proyecto");
        entity.HasOne(d => d.IdUsuarioNavigation).WithMany().HasForeignKey(d => d.IdUsuario).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_part_usuario");
    }
}

public class InvObjetivoProyectoConfiguration : IEntityTypeConfiguration<InvObjetivoProyecto>
{
    public void Configure(EntityTypeBuilder<InvObjetivoProyecto> entity)
    {
        entity.HasKey(e => e.IdObjetivo).HasName("PRIMARY");
        entity.ToTable("inv_objetivos_proyecto");
        entity.Property(e => e.IdObjetivo).HasColumnName("idObjetivo");
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.EsGeneral).HasColumnName("esGeneral").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text").IsRequired();
        entity.Property(e => e.Orden).HasColumnName("orden");

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvObjetivosProyecto).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_obj_proyecto");
    }
}

public class InvProyectoOdsConfiguration : IEntityTypeConfiguration<InvProyectoOds>
{
    public void Configure(EntityTypeBuilder<InvProyectoOds> entity)
    {
        entity.HasKey(e => e.IdProyectoOds).HasName("PRIMARY");
        entity.ToTable("inv_proyectos_ods");
        entity.Property(e => e.IdProyectoOds).HasColumnName("idProyectoOds");
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.IdOds).HasColumnName("idOds");
        entity.Property(e => e.ObjetivoEspecificoODS).HasColumnName("objetivoEspecificoODS").HasColumnType("text").IsRequired();

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProyectosOds).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pods_proyecto");
        entity.HasOne(d => d.IdOdsNavigation).WithMany(p => p.InvProyectosOds).HasForeignKey(d => d.IdOds).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pods_ods");
    }
}

public class InvRecursoDisponibleConfiguration : IEntityTypeConfiguration<InvRecursoDisponible>
{
    public void Configure(EntityTypeBuilder<InvRecursoDisponible> entity)
    {
        entity.HasKey(e => e.IdRecurso).HasName("PRIMARY");
        entity.ToTable("inv_recursos_disponibles");
        entity.Property(e => e.IdRecurso).HasColumnName("idRecurso");
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.Detalle).HasColumnName("detalle").HasMaxLength(255).IsRequired();
        entity.Property(e => e.Cantidad).HasColumnName("cantidad").HasPrecision(10, 2).IsRequired();
        entity.Property(e => e.Fuente).HasColumnName("fuente").HasMaxLength(150);

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvRecursosDisponibles).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_rec_proyecto");
    }
}

public class InvPresupuestoItemConfiguration : IEntityTypeConfiguration<InvPresupuestoItem>
{
    public void Configure(EntityTypeBuilder<InvPresupuestoItem> entity)
    {
        entity.HasKey(e => e.IdItem).HasName("PRIMARY");
        entity.ToTable("inv_presupuesto_items");
        entity.Property(e => e.IdItem).HasColumnName("idItem");
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.Categoria).HasColumnName("categoria").HasMaxLength(100).IsRequired();
        entity.Property(e => e.Detalle).HasColumnName("detalle").HasColumnType("text").IsRequired();
        entity.Property(e => e.IdPartida).HasColumnName("idPartida").HasMaxLength(50);
        entity.Property(e => e.Cantidad).HasColumnName("cantidad").HasPrecision(10, 2).HasDefaultValueSql("'1'");
        entity.Property(e => e.ValorUnitario).HasColumnName("valorUnitario").HasPrecision(12, 2).IsRequired();
        entity.Property(e => e.ValorTotal).HasColumnName("valorTotal").HasPrecision(12, 2).ValueGeneratedOnAddOrUpdate();
        entity.Property(e => e.EsGastoCapital).HasColumnName("esGastoCapital").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvPresupuestoItems).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pres_proyecto");
    }
}

public class InvFinanciamientoConfiguration : IEntityTypeConfiguration<InvFinanciamiento>
{
    public void Configure(EntityTypeBuilder<InvFinanciamiento> entity)
    {
        entity.HasKey(e => e.IdFinanciamiento).HasName("PRIMARY");
        entity.ToTable("inv_financiamientos");
        entity.Property(e => e.IdFinanciamiento).HasColumnName("idFinanciamiento");
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.EsIstpet).HasColumnName("esIstpet").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
        entity.Property(e => e.NombreEmpresa).HasColumnName("nombreEmpresa").HasMaxLength(255);
        entity.Property(e => e.OtrasFuentes).HasColumnName("otrasFuentes").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
        entity.Property(e => e.Monto).HasColumnName("monto").HasPrecision(12, 2);

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvFinanciamientos).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_fin_proyecto");
    }
}

public class InvProductoConfiguration : IEntityTypeConfiguration<InvProducto>
{
    public void Configure(EntityTypeBuilder<InvProducto> entity)
    {
        entity.HasKey(e => e.IdProducto).HasName("PRIMARY");
        entity.ToTable("inv_productos");
        entity.Property(e => e.IdProducto).HasColumnName("idProducto");
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.IdTipoProducto).HasColumnName("idTipoProducto");
        entity.Property(e => e.Titulo).HasColumnName("titulo").HasMaxLength(500).IsRequired();
        entity.Property(e => e.Cantidad).HasColumnName("cantidad").HasDefaultValueSql("'1'");
        entity.Property(e => e.UrlProducto).HasColumnName("urlProducto").HasMaxLength(512);
        entity.Property(e => e.EsPropiedadIntelectual).HasColumnName("esPropiedadIntelectual").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'");
        entity.Property(e => e.NumeroRegistro).HasColumnName("numeroRegistro").HasMaxLength(100);
        entity.Property(e => e.FechaRegistroSenadi).HasColumnName("fechaRegistroSenadi");
        entity.Property(e => e.MetadataJson).HasColumnName("metadataJson").HasColumnType("json");

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProductos).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_prod_proyecto");
        entity.HasOne(d => d.IdTipoProductoNavigation).WithMany(p => p.InvProductos).HasForeignKey(d => d.IdTipoProducto).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_prod_tipo");
    }
}

public class InvImpactoProyectoConfiguration : IEntityTypeConfiguration<InvImpactoProyecto>
{
    public void Configure(EntityTypeBuilder<InvImpactoProyecto> entity)
    {
        entity.HasKey(e => e.IdImpactoProyecto).HasName("PRIMARY");
        entity.ToTable("inv_impactos_proyecto");
        entity.Property(e => e.IdImpactoProyecto).HasColumnName("idImpactoProyecto");
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.IdCatImpacto).HasColumnName("idCatImpacto");
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text").IsRequired();

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvImpactosProyecto).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_imp_proyecto");
        entity.HasOne(d => d.IdCatImpactoNavigation).WithMany(p => p.InvImpactosProyecto).HasForeignKey(d => d.IdCatImpacto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_imp_categoria");
    }
}

public class InvCronogramaConfiguration : IEntityTypeConfiguration<InvCronograma>
{
    public void Configure(EntityTypeBuilder<InvCronograma> entity)
    {
        entity.HasKey(e => e.IdActividad).HasName("PRIMARY");
        entity.ToTable("inv_cronograma");
        entity.Property(e => e.IdActividad).HasColumnName("idActividad");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.IdObjetivo).HasColumnName("idObjetivo");
        entity.Property(e => e.NumeroActividad).HasColumnName("numeroActividad");
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text").IsRequired();
        entity.Property(e => e.RecursosNecesarios).HasColumnName("recursosNecesarios").HasColumnType("text");
        entity.Property(e => e.FechaInicioPrevista).HasColumnName("fechaInicioPrevista");
        entity.Property(e => e.FechaFinPrevista).HasColumnName("fechaFinPrevista");
        entity.Property(e => e.Progreso).HasColumnName("progreso").HasPrecision(5, 2).HasDefaultValueSql("'0.00'");
        entity.Property(e => e.Ponderacion).HasColumnName("ponderacion").HasPrecision(5, 2).HasDefaultValueSql("'0.00'");
        entity.Property(e => e.EsEntregableCaces).HasColumnName("esEntregableCaces").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
        entity.Property(e => e.IdActividadPadre).HasColumnName("idActividadPadre");
        entity.Property(e => e.ColorHex).HasColumnName("colorHex").HasMaxLength(7).HasDefaultValueSql("'#0070f3'");

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvCronogramas).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_cron_proyecto");
        entity.HasOne(d => d.IdObjetivoNavigation).WithMany(p => p.InvCronogramas).HasForeignKey(d => d.IdObjetivo).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_cron_objetivo");
        entity.HasOne(d => d.IdActividadPadreNavigation).WithMany(p => p.InverseIdActividadPadreNavigation).HasForeignKey(d => d.IdActividadPadre).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_cron_padre");
    }
}

public class InvBibliografiaProyectoConfiguration : IEntityTypeConfiguration<InvBibliografiaProyecto>
{
    public void Configure(EntityTypeBuilder<InvBibliografiaProyecto> entity)
    {
        entity.HasKey(e => e.IdBibliografia).HasName("PRIMARY");
        entity.ToTable("inv_bibliografia_proyecto");
        entity.Property(e => e.IdBibliografia).HasColumnName("idBibliografia");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.CitaApa).HasColumnName("citaAPA").HasColumnType("text").IsRequired();
        entity.Property(e => e.Doi).HasColumnName("doi").HasMaxLength(100);
        entity.Property(e => e.Isbn).HasColumnName("isbn").HasMaxLength(20);
        entity.Property(e => e.Autores).HasColumnName("autores").HasColumnType("text");
        entity.Property(e => e.AnioPublicacion).HasColumnName("anioPublicacion");
        entity.Property(e => e.TituloFuente).HasColumnName("tituloFuente").HasColumnType("text");
        entity.Property(e => e.Url).HasColumnName("url").HasMaxLength(512);

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvBibliografiasProyecto).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_bib_proyecto");
    }
}

public class InvInformeAvanceConfiguration : IEntityTypeConfiguration<InvInformeAvance>
{
    public void Configure(EntityTypeBuilder<InvInformeAvance> entity)
    {
        entity.HasKey(e => e.IdInforme).HasName("PRIMARY");
        entity.ToTable("inv_informes_avance");
        entity.Property(e => e.IdInforme).HasColumnName("idInforme");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.NumeroInforme).HasColumnName("numeroInforme").IsRequired();
        entity.Property(e => e.FechaReporte).HasColumnName("fechaReporte");
        entity.Property(e => e.ResumenActividades).HasColumnName("resumenActividades").HasColumnType("text").IsRequired();
        entity.Property(e => e.EsFirmadoDigital).HasColumnName("esFirmadoDigital").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
        entity.Property(e => e.HashFirma).HasColumnName("hashFirma").HasColumnType("text");
        entity.Property(e => e.FechaFirma).HasColumnName("fechaFirma");
        entity.Property(e => e.ValidadoPor).HasColumnName("validadoPor");
        entity.Property(e => e.Estado).HasColumnName("estado").HasColumnType("enum('Pendiente','Aprobado','Observado')").HasDefaultValueSql("'Pendiente'");

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvInformesAvance).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_inf_proyecto");
        entity.HasOne(d => d.ValidadoPorNavigation).WithMany().HasForeignKey(d => d.ValidadoPor).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_inf_validador");
    }
}

public class InvEvidenciaConfiguration : IEntityTypeConfiguration<InvEvidencia>
{
    public void Configure(EntityTypeBuilder<InvEvidencia> entity)
    {
        entity.HasKey(e => e.IdEvidencia).HasName("PRIMARY");
        entity.ToTable("inv_evidencias");
        entity.Property(e => e.IdEvidencia).HasColumnName("idEvidencia");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.IdInforme).HasColumnName("idInforme");
        entity.Property(e => e.IdTipoEvidencia).HasColumnName("idTipoEvidencia");
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasMaxLength(255);
        entity.Property(e => e.RutaArchivo).HasColumnName("rutaArchivo").HasMaxLength(512).IsRequired();
        entity.Property(e => e.MetadataJson).HasColumnName("metadataJson").HasColumnType("json");
        entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");

        entity.HasOne(d => d.IdInformeNavigation).WithMany(p => p.InvEvidencias).HasForeignKey(d => d.IdInforme).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_ev_informe");
        entity.HasOne(d => d.IdTipoEvidenciaNavigation).WithMany(p => p.InvEvidencias).HasForeignKey(d => d.IdTipoEvidencia).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_ev_tipo");
    }
}

public class InvGastoConfiguration : IEntityTypeConfiguration<InvGasto>
{
    public void Configure(EntityTypeBuilder<InvGasto> entity)
    {
        entity.HasKey(e => e.IdGasto).HasName("PRIMARY");
        entity.ToTable("inv_gastos");
        entity.Property(e => e.IdGasto).HasColumnName("idGasto");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.IdItem).HasColumnName("idItem");
        entity.Property(e => e.Monto).HasColumnName("monto").HasPrecision(12, 2).IsRequired();
        entity.Property(e => e.FechaGasto).HasColumnName("fechaGasto");
        entity.Property(e => e.NumeroFactura).HasColumnName("numeroFactura").HasMaxLength(100);
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text");
        entity.Property(e => e.IdEvidencia).HasColumnName("idEvidencia");

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvGastos).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_gast_proyecto");
        entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.InvGastos).HasForeignKey(d => d.IdItem).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_gast_item");
        entity.HasOne(d => d.IdEvidenciaNavigation).WithMany().HasForeignKey(d => d.IdEvidencia).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_gast_evidencia");
    }
}

public class InvTransferenciaConfiguration : IEntityTypeConfiguration<InvTransferencia>
{
    public void Configure(EntityTypeBuilder<InvTransferencia> entity)
    {
        entity.HasKey(e => e.IdTransferencia).HasName("PRIMARY");
        entity.ToTable("inv_transferencias");
        entity.Property(e => e.IdTransferencia).HasColumnName("idTransferencia");
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.EntidadReceptora).HasColumnName("entidadReceptora").HasMaxLength(255).IsRequired();
        entity.Property(e => e.NumeroConvenio).HasColumnName("numeroConvenio").HasMaxLength(100);
        entity.Property(e => e.FechaConvenio).HasColumnName("fechaConvenio");
        entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text");

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvTransferencias).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_trans_proyecto");
    }
}

public class InvProyectoMmlConfiguration : IEntityTypeConfiguration<InvProyectoMml>
{
    public void Configure(EntityTypeBuilder<InvProyectoMml> entity)
    {
        entity.HasKey(e => e.IdMml).HasName("PRIMARY");
        entity.ToTable("inv_proyectos_mml");
        entity.Property(e => e.IdMml).HasColumnName("idMml");
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.Nivel).HasColumnName("nivel").HasMaxLength(20).IsRequired();
        entity.Property(e => e.ResumenNarrativo).HasColumnName("resumenNarrativo").HasColumnType("text").IsRequired();
        entity.Property(e => e.Indicadores).HasColumnName("indicadores").HasColumnType("text");
        entity.Property(e => e.MediosVerificacion).HasColumnName("mediosVerificacion").HasColumnType("text");
        entity.Property(e => e.Supuestos).HasColumnName("supuestos").HasColumnType("text");

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.MatrizMarcoLogico).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_mml_proyecto");
    }
}

public class InvProyectoDocumentoAdjuntoConfiguration : IEntityTypeConfiguration<InvProyectoDocumentoAdjunto>
{
    public void Configure(EntityTypeBuilder<InvProyectoDocumentoAdjunto> entity)
    {
        entity.HasKey(e => e.IdDocAdj).HasName("PRIMARY");
        entity.ToTable("inv_proyectos_documentos_adjuntos");
        entity.Property(e => e.IdDocAdj).HasColumnName("idDocAdj");
        entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
        entity.HasIndex(e => e.Uuid).IsUnique();
        entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
        entity.Property(e => e.NombreArchivo).HasColumnName("nombreArchivo").HasMaxLength(255).IsRequired();
        entity.Property(e => e.RutaArchivo).HasColumnName("rutaArchivo").HasMaxLength(512).IsRequired();
        entity.Property(e => e.FechaSubida).HasColumnName("fechaSubida").HasDefaultValueSql("CURRENT_TIMESTAMP");

        entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.DocumentosAdjuntos).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_docadj_proyecto");
    }
}

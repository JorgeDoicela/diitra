using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models.Cowork;

namespace diitra_infrastructure.data.models;

public partial class DiitraContext
{
    partial void OnModelCreatingDiitra(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InvLineaInvestigacion>(entity =>
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
        });

        modelBuilder.Entity<InvPrograma>(entity =>
        {
            entity.HasKey(e => e.IdPrograma).HasName("PRIMARY");
            entity.ToTable("inv_programas");
            entity.Property(e => e.IdPrograma).HasColumnName("idPrograma");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<InvDominio>(entity =>
        {
            entity.HasKey(e => e.IdDominio).HasName("PRIMARY");
            entity.ToTable("inv_dominios");
            entity.Property(e => e.IdDominio).HasColumnName("idDominio");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<InvDominioCarrera>(entity =>
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
        });

        modelBuilder.Entity<InvSublinea>(entity =>
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
        });

        modelBuilder.Entity<InvTipoInvestigacion>(entity =>
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
        });

        modelBuilder.Entity<InvGrupoInvestigacion>(entity =>
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
        });

        modelBuilder.Entity<InvGrupoMiembro>(entity =>
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
        });

        modelBuilder.Entity<InvConvocatoria>(entity =>
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
        });

        modelBuilder.Entity<InvRubrica>(entity =>
        {
            entity.HasKey(e => e.IdRubrica).HasName("PRIMARY");
            entity.ToTable("inv_rubricas");
            entity.Property(e => e.IdRubrica).HasColumnName("idRubrica");
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text");
            entity.Property(e => e.Version).HasColumnName("version").HasMaxLength(20).HasDefaultValueSql("'1.0'");
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<InvTipoConvocatoria>(entity =>
        {
            entity.HasKey(e => e.IdTipoConvocatoria).HasName("PRIMARY");
            entity.ToTable("inv_tipos_convocatoria");
            entity.Property(e => e.IdTipoConvocatoria).HasColumnName("idTipoConvocatoria");
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasMaxLength(255);
        });

        modelBuilder.Entity<InvAgendaZonal>(entity =>
        {
            entity.HasKey(e => e.IdAgendaZonal).HasName("PRIMARY");
            entity.ToTable("inv_agendas_zonales");
            entity.Property(e => e.IdAgendaZonal).HasColumnName("idAgendaZonal");
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(150).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasMaxLength(255);
        });

        modelBuilder.Entity<InvProyecto>(entity =>
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
        });

        modelBuilder.Entity<InvTrazabilidadProyecto>(entity =>
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
        });

        modelBuilder.Entity<InvProyectoCarrera>(entity =>
        {
            entity.HasKey(e => e.IdProyectoCarrera).HasName("PRIMARY");
            entity.ToTable("inv_proyectos_carreras");
            entity.Property(e => e.IdProyectoCarrera).HasColumnName("idProyectoCarrera");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.IdCarrera).HasColumnName("idCarrera");
            entity.Property(e => e.Modalidad).HasColumnName("modalidad").HasMaxLength(100);

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProyectosCarreras).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pc_proyecto");
            entity.HasOne(d => d.IdCarreraNavigation).WithMany().HasForeignKey(d => d.IdCarrera).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pc_carrera");
        });

        modelBuilder.Entity<InvProyectoDominio>(entity =>
        {
            entity.HasKey(e => e.IdProyectoDominio).HasName("PRIMARY");
            entity.ToTable("inv_proyectos_dominios");
            entity.Property(e => e.IdProyectoDominio).HasColumnName("idProyectoDominio");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.IdDominio).HasColumnName("idDominio");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProyectosDominios).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pd_proyecto");
            entity.HasOne(d => d.IdDominioNavigation).WithMany(p => p.InvProyectosDominios).HasForeignKey(d => d.IdDominio).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pd_dominio");
        });

        modelBuilder.Entity<InvProyectoParticipante>(entity =>
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
            entity.Property(e => e.MotivoCambio).HasColumnName("motivo_cambio").HasMaxLength(150);

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProyectoParticipantes).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_part_proyecto");
            entity.HasOne(d => d.IdUsuarioNavigation).WithMany().HasForeignKey(d => d.IdUsuario).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_part_usuario");
        });

        modelBuilder.Entity<InvObjetivoProyecto>(entity =>
        {
            entity.HasKey(e => e.IdObjetivo).HasName("PRIMARY");
            entity.ToTable("inv_objetivos_proyecto");
            entity.Property(e => e.IdObjetivo).HasColumnName("idObjetivo");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.EsGeneral).HasColumnName("esGeneral").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text").IsRequired();
            entity.Property(e => e.Orden).HasColumnName("orden");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvObjetivosProyecto).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_obj_proyecto");
        });

        modelBuilder.Entity<InvOdsEje>(entity =>
        {
            entity.HasKey(e => e.IdEje).HasName("PRIMARY");
            entity.ToTable("inv_ods_ejes");
            entity.Property(e => e.IdEje).HasColumnName("idEje");
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<InvOds>(entity =>
        {
            entity.HasKey(e => e.IdOds).HasName("PRIMARY");
            entity.ToTable("inv_ods");
            entity.Property(e => e.IdOds).HasColumnName("idOds");
            entity.Property(e => e.IdEje).HasColumnName("idEje");
            entity.Property(e => e.NumeroOds).HasColumnName("numeroOds");
            entity.Property(e => e.Titulo).HasColumnName("titulo").HasMaxLength(255).IsRequired();

            entity.HasOne(d => d.IdEjeNavigation).WithMany(p => p.InvOds).HasForeignKey(d => d.IdEje).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_ods_eje");
        });

        modelBuilder.Entity<InvProyectoOds>(entity =>
        {
            entity.HasKey(e => e.IdProyectoOds).HasName("PRIMARY");
            entity.ToTable("inv_proyectos_ods");
            entity.Property(e => e.IdProyectoOds).HasColumnName("idProyectoOds");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.IdOds).HasColumnName("idOds");
            entity.Property(e => e.ObjetivoEspecificoODS).HasColumnName("objetivoEspecificoODS").HasColumnType("text").IsRequired();

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProyectosOds).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pods_proyecto");
            entity.HasOne(d => d.IdOdsNavigation).WithMany(p => p.InvProyectosOds).HasForeignKey(d => d.IdOds).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pods_ods");
        });

        modelBuilder.Entity<InvRecursoDisponible>(entity =>
        {
            entity.HasKey(e => e.IdRecurso).HasName("PRIMARY");
            entity.ToTable("inv_recursos_disponibles");
            entity.Property(e => e.IdRecurso).HasColumnName("idRecurso");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.Detalle).HasColumnName("detalle").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Cantidad).HasColumnName("cantidad").HasPrecision(10, 2).IsRequired();
            entity.Property(e => e.Fuente).HasColumnName("fuente").HasMaxLength(150);

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvRecursosDisponibles).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_rec_proyecto");
        });

        modelBuilder.Entity<InvPresupuestoItem>(entity =>
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
        });

        modelBuilder.Entity<InvFinanciamiento>(entity =>
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
        });

        modelBuilder.Entity<InvProducto>(entity =>
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
        });

        modelBuilder.Entity<InvCatImpacto>(entity =>
        {
            entity.HasKey(e => e.IdCatImpacto).HasName("PRIMARY");
            entity.ToTable("inv_cat_impactos");
            entity.Property(e => e.IdCatImpacto).HasColumnName("idCatImpacto");
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<InvImpactoProyecto>(entity =>
        {
            entity.HasKey(e => e.IdImpactoProyecto).HasName("PRIMARY");
            entity.ToTable("inv_impactos_proyecto");
            entity.Property(e => e.IdImpactoProyecto).HasColumnName("idImpactoProyecto");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.IdCatImpacto).HasColumnName("idCatImpacto");
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text").IsRequired();

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvImpactosProyecto).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_imp_proyecto");
            entity.HasOne(d => d.IdCatImpactoNavigation).WithMany(p => p.InvImpactosProyecto).HasForeignKey(d => d.IdCatImpacto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_imp_categoria");
        });

        modelBuilder.Entity<InvCronograma>(entity =>
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
        });

        modelBuilder.Entity<InvBibliografiaProyecto>(entity =>
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
        });

        modelBuilder.Entity<InvInformeAvance>(entity =>
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
        });

        modelBuilder.Entity<InvEvidencia>(entity =>
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
        });

        modelBuilder.Entity<InvGasto>(entity =>
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
        });

        modelBuilder.Entity<InvTransferencia>(entity =>
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
        });

        modelBuilder.Entity<InvRevisionesPares>(entity =>
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
        });

        modelBuilder.Entity<InvEvaluacionesDetalle>(entity =>
        {
            entity.HasKey(e => e.IdDetalle).HasName("PRIMARY");
            entity.ToTable("inv_evaluaciones_detalle");
            entity.Property(e => e.IdDetalle).HasColumnName("idDetalle");
            entity.Property(e => e.IdRevision).HasColumnName("idRevision");
            entity.Property(e => e.Criterio).HasColumnName("criterio").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Puntaje).HasColumnName("puntaje").HasPrecision(5, 2);
            entity.Property(e => e.Observaciones).HasColumnName("observaciones").HasColumnType("text");

            entity.HasOne(d => d.Revision).WithMany(p => p.Detalles).HasForeignKey(d => d.IdRevision).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_eval_revision");
        });

        // --- DIITRA Document Engine ---
        modelBuilder.Entity<Diitra.Domain.Common.Documents.DocumentInstance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.ToTable("inv_documentos_instancias");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.TemplateCode).HasColumnName("template_code").HasMaxLength(100).IsRequired();
            entity.Property(e => e.TemplateVersion).HasColumnName("template_version").IsRequired();
            entity.Property(e => e.EntityUuid).HasColumnName("entity_uuid").HasMaxLength(36).IsRequired();
            entity.Property(e => e.EntityType).HasColumnName("entity_type").HasMaxLength(50).IsRequired().HasDefaultValue("Proyecto");
            entity.Property(e => e.Title).HasColumnName("titulo_instancia").HasMaxLength(255);
            entity.Property(e => e.State).HasColumnName("estado").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("created_by").HasMaxLength(100).IsRequired();
            entity.Property(e => e.FinalPdfPath).HasColumnName("final_pdf_path").HasMaxLength(512);
            entity.Property(e => e.FileHash).HasColumnName("file_hash").HasMaxLength(100);
            entity.Property(e => e.TraceabilityCode).HasColumnName("traceability_code").HasMaxLength(100);
            entity.Property(e => e.DataSnapshotJson).HasColumnName("data_snapshot_json").HasColumnType("longtext");
            entity.Property(e => e.IsFilePurged).HasColumnName("is_file_purged").HasDefaultValue(false).IsRequired();
            entity.Property(e => e.PurgedAt).HasColumnName("purged_at");
            entity.Property(e => e.PurgedBy).HasColumnName("purged_by").HasMaxLength(100);
        });

        modelBuilder.Entity<Diitra.Domain.Common.Documents.DocumentTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.ToTable("inv_document_templates");
            entity.Property(e => e.Code).HasColumnName("code").HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.HtmlContent).HasColumnName("html_content").HasColumnType("longtext").IsRequired();
            entity.Property(e => e.CustomCss).HasColumnName("custom_css").HasColumnType("longtext");
            entity.Property(e => e.Version).HasColumnName("version").IsRequired();
            entity.Property(e => e.Category).HasColumnName("category").IsRequired();
            entity.Property(e => e.RequiresLopdpClause).HasColumnName("requires_lopdp").IsRequired();
            entity.Property(e => e.SupportsBlindMode).HasColumnName("supports_blind_mode").IsRequired();
            entity.Property(e => e.RequiresTraceabilityCode).HasColumnName("requires_traceability").IsRequired();
            entity.Property(e => e.RequiresElectronicSignature).HasColumnName("requires_signature").IsRequired();
            entity.Property(e => e.SignatureType).HasColumnName("signature_type").HasMaxLength(50).HasDefaultValue("DIITRA").IsRequired();
            entity.Property(e => e.CollaborativeFieldsJson).HasColumnName("collaborative_fields_json");
            entity.Property(e => e.IsActive).HasColumnName("is_active").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by").HasMaxLength(100);
        });

        modelBuilder.Entity<Diitra.Domain.Common.Documents.DocumentAuditEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.ToTable("inv_document_audit");
            entity.Property(e => e.TraceabilityCode).HasColumnName("traceability_code").HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.TraceabilityCode).IsUnique();
            entity.Property(e => e.TemplateCode).HasColumnName("template_code").HasMaxLength(100).IsRequired();
            entity.Property(e => e.TemplateVersion).HasColumnName("template_version").IsRequired();
            entity.Ignore(e => e.Category); 
            entity.Property(e => e.ProjectUuid).HasColumnName("project_uuid").HasMaxLength(36);
            entity.Property(e => e.EntityUuid).HasColumnName("entity_uuid").HasMaxLength(36);
            entity.Property(e => e.GeneratedBy).HasColumnName("generated_by").HasMaxLength(255).IsRequired();
            entity.Property(e => e.GeneratedAt).HasColumnName("generated_at").IsRequired();
            entity.Property(e => e.WasBlindMode).HasColumnName("was_blind_mode").IsRequired();
            entity.Property(e => e.FileName).HasColumnName("file_name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.FileHash).HasColumnName("file_hash").HasMaxLength(100);
            entity.Property(e => e.DataSnapshotJson).HasColumnName("data_snapshot_json").HasColumnType("longtext");
        });

        // --- DIITRA CoWork ---
        modelBuilder.Entity<InvCoworkDocumento>(entity =>
        {
            entity.HasKey(e => e.IdDocumento);
            entity.ToTable("inv_cowork_documentos");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(100).IsRequired();
            entity.Property(e => e.EntidadTipo).HasColumnName("entidadTipo").HasMaxLength(50).IsRequired();
            entity.Property(e => e.EntidadUuid).HasColumnName("entidadUuid").HasMaxLength(100).IsRequired();
            entity.Property(e => e.CampoNombre).HasColumnName("campoNombre").HasMaxLength(100).IsRequired();
            entity.Property(e => e.YjsState).HasColumnName("yjsState");
            entity.Property(e => e.ContentHtml).HasColumnName("contentHtml");
            entity.Property(e => e.ContentJson).HasColumnName("contentJson");
            entity.Property(e => e.Version).HasColumnName("version").HasDefaultValue(0);
            entity.Property(e => e.CreadoEn).HasColumnName("creadoEn");
            entity.Property(e => e.ActualizadoEn).HasColumnName("actualizadoEn");
        });

        modelBuilder.Entity<InvCoworkUpdate>(entity =>
        {
            entity.HasKey(e => e.IdUpdate);
            entity.ToTable("inv_cowork_updates");
            entity.Property(e => e.DocumentoUuid).HasColumnName("documentoUuid").HasMaxLength(100).IsRequired();
            entity.Property(e => e.UpdateData).HasColumnName("updateData").IsRequired();
            entity.Property(e => e.CreadoEn).HasColumnName("creadoEn");
        });

        modelBuilder.Entity<InvCoworkSesion>(entity =>
        {
            entity.HasKey(e => e.IdSesion);
            entity.ToTable("inv_cowork_sesiones");
            entity.Property(e => e.DocumentoUuid).HasColumnName("documentoUuid").HasMaxLength(100).IsRequired();
            entity.Property(e => e.UsuarioUuid).HasColumnName("usuarioUuid").HasMaxLength(36).IsRequired();
            entity.Property(e => e.NombreUsuario).HasColumnName("nombreUsuario").HasMaxLength(255).IsRequired();
            entity.Property(e => e.RolUsuario).HasColumnName("rolUsuario").HasMaxLength(100).IsRequired();
            entity.Property(e => e.SignalrConId).HasColumnName("signalrConId").HasMaxLength(255);
            entity.Property(e => e.SeccionNombre).HasColumnName("seccionNombre").HasMaxLength(100);
            entity.Property(e => e.Accion).HasColumnName("accion").HasMaxLength(255);
            entity.Property(e => e.ConectadoEn).HasColumnName("conectadoEn");
            entity.Property(e => e.DesconectadoEn).HasColumnName("desconectadoEn");
        });

        modelBuilder.Entity<InvPndObjetivo>(entity =>
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
        });

        modelBuilder.Entity<InvProyectoMml>(entity =>
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
        });

        modelBuilder.Entity<InvProyectoDocumentoAdjunto>(entity =>
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
        });

        modelBuilder.Entity<InvCatTipoProducto>(entity =>
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
        });

        modelBuilder.Entity<InvCatTipoEvidencia>(entity =>
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
        });

        modelBuilder.Entity<InvEntidadExterna>(entity =>
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
        });

        modelBuilder.Entity<InvConfigIndicador>(entity =>
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
        });

        modelBuilder.Entity<InvRubricaCriterio>(entity =>
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
        });

        modelBuilder.Entity<InvConfigWorkflow>(entity =>
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
        });

        modelBuilder.Entity<InvDocumentoSeccionMetadata>(entity =>
        {
            entity.HasKey(e => e.IdMetadata).HasName("PRIMARY");
            entity.ToTable("inv_documentos_secciones_metadata");
            entity.HasIndex(e => new { e.DocumentoUuid, e.SeccionNombre }).IsUnique();
        });

        modelBuilder.Entity<InvCollaborationComment>(entity =>
        {
            entity.HasKey(e => e.IdComentario).HasName("PRIMARY");
            entity.ToTable("inv_collaboration_comments");
            entity.HasIndex(e => e.DocumentoUuid);
        });

        modelBuilder.Entity<InvCalendarioEventoNormativo>(entity =>
        {
            entity.ToTable("inv_calendario_eventos_normativos");
            entity.HasKey(e => e.IdEvento);
            entity.Property(e => e.IdEvento).HasColumnName("idEvento");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.Titulo).HasColumnName("titulo").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text");
            entity.Property(e => e.TipoEvento).HasColumnName("tipoEvento").HasMaxLength(50).HasDefaultValue("Normativo");
            entity.Property(e => e.FechaInicio).HasColumnName("fechaInicio");
            entity.Property(e => e.FechaFin).HasColumnName("fechaFin");
            entity.Property(e => e.EsTodoElDia).HasColumnName("esTodoElDia").HasDefaultValue(true);
            entity.Property(e => e.RecurrenciaAnual).HasColumnName("recurrenciaAnual").HasDefaultValue(false);
            entity.Property(e => e.RecurrenciaHasta).HasColumnName("recurrenciaHasta");
            entity.Property(e => e.RolesVisibles).HasColumnName("rolesVisibles").HasMaxLength(255);
            entity.Property(e => e.EsPrivado).HasColumnName("esPrivado").HasDefaultValue(true);
            entity.Property(e => e.Prioridad).HasColumnName("prioridad").HasMaxLength(15).HasDefaultValue("Media");
            entity.Property(e => e.Estado).HasColumnName("estado").HasMaxLength(20).HasDefaultValue("Pendiente");
            entity.Property(e => e.ModuloOrigen).HasColumnName("moduloOrigen").HasMaxLength(50);
            entity.Property(e => e.UrlAccion).HasColumnName("urlAccion").HasMaxLength(255);
            entity.Property(e => e.ColorHex).HasColumnName("colorHex").HasMaxLength(7).HasDefaultValue("#6B7280");
            entity.Property(e => e.AlertaDias).HasColumnName("alertaDias").HasDefaultValue(7);
            entity.Property(e => e.Activo).HasColumnName("activo").HasDefaultValue(true);
            entity.Property(e => e.CreadoPor).HasColumnName("creadoPor");
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaModificacion).HasColumnName("fechaModificacion").HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            entity.Property(e => e.NotaDetalle).HasColumnName("notaDetalle").HasColumnType("text");
            entity.Property(e => e.OrdenBandeja).HasColumnName("ordenBandeja");
        });

        modelBuilder.Entity<InvIcalToken>(entity =>
        {
            entity.ToTable("inv_ical_tokens");
            entity.HasKey(e => e.IdToken);
            entity.Property(e => e.IdToken).HasColumnName("idToken");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario").IsRequired();
            entity.HasIndex(e => e.IdUsuario).IsUnique();
            entity.Property(e => e.Token).HasColumnName("token").HasMaxLength(64).IsRequired();
            entity.HasIndex(e => e.Token).IsUnique();
            entity.Property(e => e.Activo).HasColumnName("activo").HasDefaultValue(true);
            entity.Property(e => e.FechaGenerado).HasColumnName("fechaGenerado").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaUltimoUso).HasColumnName("fechaUltimoUso");
        });

        modelBuilder.Entity<InvCalendarioAlertaEnviada>(entity =>
        {
            entity.ToTable("inv_calendario_alertas_enviadas");
            entity.HasKey(e => e.IdAlerta);
            entity.Property(e => e.IdAlerta).HasColumnName("idAlerta");
            entity.Property(e => e.IdEventoCalendario).HasColumnName("idEventoCalendario").HasMaxLength(50).IsRequired();
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario").IsRequired();
            entity.Property(e => e.FechaEvento).HasColumnName("fechaEvento").IsRequired();
            entity.Property(e => e.FechaEnvio).HasColumnName("fechaEnvio").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(e => new { e.IdEventoCalendario, e.IdUsuario, e.FechaEvento }).IsUnique().HasDatabaseName("uk_alerta");
        });
    }
}

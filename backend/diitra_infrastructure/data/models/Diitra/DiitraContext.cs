using Microsoft.EntityFrameworkCore;
using diitra_domain.Identity.Entities;
using diitra_infrastructure.data.models.Cowork;

namespace diitra_infrastructure.data.models;

/// <summary>
/// Contexto LIMPIO del sistema Diitra.
/// Solo contiene las tablas que el sistema de Investigación e Innovación
/// realmente usa. No confundirse con SigafiEsContext (que tiene las 235 
/// tablas del legacy completo y está solo como referencia).
///
/// TABLAS PROPIAS (inv_):      Tablas nuevas creadas para Diitra
/// TABLAS DE SIGAFI (lecturas): Solo las necesarias para el sistema
/// </summary>
public partial class DiitraContext : DbContext
{
    public DiitraContext() { }

    public DiitraContext(DbContextOptions<DiitraContext> options) : base(options) { }

    // ============================================================
    // TABLAS NUEVAS Diitra (inv_) - V3 Core Schema
    // ============================================================
    public virtual DbSet<InvLineaInvestigacion> InvLineasInvestigacion { get; set; }
    public virtual DbSet<InvPrograma>           InvProgramas           { get; set; }
    public virtual DbSet<InvDominio>            InvDominios            { get; set; }
    public virtual DbSet<InvDominioCarrera>     InvDominiosCarrera     { get; set; }
    public virtual DbSet<InvSublinea>           InvSublineas           { get; set; }
    public virtual DbSet<InvTipoInvestigacion>  InvTiposInvestigacion  { get; set; }
    public virtual DbSet<InvGrupoInvestigacion> InvGruposInvestigacion { get; set; }
    public virtual DbSet<InvGrupoMiembro>       InvGruposMiembros       { get; set; }
    public virtual DbSet<InvTipoConvocatoria>   InvTiposConvocatoria   { get; set; }
    public virtual DbSet<InvAgendaZonal>        InvAgendasZonales      { get; set; }
    public virtual DbSet<InvRubrica>             InvRubricas            { get; set; }
    public virtual DbSet<InvConvocatoria>       InvConvocatorias       { get; set; }
    public virtual DbSet<InvProyecto>           InvProyectos           { get; set; }
    public virtual DbSet<InvProyectoCarrera>    InvProyectosCarreras    { get; set; }
    public virtual DbSet<InvProyectoDominio>    InvProyectosDominios    { get; set; }
    public virtual DbSet<InvProyectoProfesor>   InvProyectosProfesores { get; set; }
    public virtual DbSet<InvProyectoAlumno>     InvProyectosAlumnos     { get; set; }
    public virtual DbSet<InvObjetivoProyecto>   InvObjetivosProyecto   { get; set; }
    public virtual DbSet<InvOdsEje>             InvOdsEjes             { get; set; }
    public virtual DbSet<InvOds>                InvOds                 { get; set; }
    public virtual DbSet<InvProyectoOds>        InvProyectosOds        { get; set; }
    public virtual DbSet<InvRecursoDisponible>  InvRecursosDisponibles { get; set; }
    public virtual DbSet<InvPresupuestoItem>    InvPresupuestoItems    { get; set; }
    public virtual DbSet<InvFinanciamiento>     InvFinanciamientos     { get; set; }
    public virtual DbSet<InvProducto>           InvProductos           { get; set; }
    public virtual DbSet<InvCatImpacto>         InvCatImpactos         { get; set; }
    public virtual DbSet<InvImpactoProyecto>    InvImpactosProyecto    { get; set; }
    public virtual DbSet<InvCronograma>         InvCronograma          { get; set; }
    public virtual DbSet<InvCronogramaSemana>   InvCronogramaSemanas   { get; set; }
    public virtual DbSet<InvBibliografiaProyecto> InvBibliografiasProyecto { get; set; }
    public virtual DbSet<InvInformeAvance>      InvInformesAvance      { get; set; }
    public virtual DbSet<InvEvidencia>          InvEvidencias          { get; set; }
    public virtual DbSet<InvGasto>              InvGastos              { get; set; }
    public virtual DbSet<InvTransferencia>      InvTransferencias      { get; set; }
    public virtual DbSet<InvTrazabilidadProyecto> InvTrazabilidadProyectos { get; set; }
    public virtual DbSet<InvRevisionesPares>      InvRevisionesPares      { get; set; }
    public virtual DbSet<InvEvaluacionesDetalle>  InvEvaluacionesDetalle  { get; set; }
    public virtual DbSet<InvPndObjetivo>               InvPndObjetivos              { get; set; }
    public virtual DbSet<InvConvocatoriaHito>          InvConvocatoriasHitos        { get; set; }
    public virtual DbSet<InvConvocatoriaDocumentoReq>  InvConvocatoriasDocumentosReq { get; set; }
    public virtual DbSet<InvProyectoMml>               InvProyectosMml               { get; set; }
    public virtual DbSet<InvProyectoDocumentoAdjunto>  InvProyectosDocumentosAdjuntos { get; set; }

    // --- Sistema y Seguridad ---
    public virtual DbSet<InvNotificacion>       InvNotificaciones      { get; set; }
    public virtual DbSet<AccessToken>           InvTokensAcceso        { get; set; }
    public virtual DbSet<InvUsuarioMetadata>    InvUsuariosMetadata    { get; set; }
    public virtual DbSet<InvAuditAdmin>       InvAuditAdmin          { get; set; }

    // --- DIITRA Document Engine (Persistence & Audit) ---
    public virtual DbSet<Diitra.Domain.Common.Documents.DocumentTemplate> DocumentTemplates { get; set; }
    public virtual DbSet<Diitra.Domain.Common.Documents.DocumentInstance> DocumentInstances { get; set; }
    public virtual DbSet<Diitra.Domain.Common.Documents.DocumentAuditEntry> DocumentAuditEntries { get; set; }

    // --- DIITRA CoWork (Persistencia Colaborativa) ---
    public virtual DbSet<InvCoworkDocumento> InvCoworkDocumentos { get; set; }
    public virtual DbSet<InvCoworkUpdate>    InvCoworkUpdates    { get; set; }
    public virtual DbSet<InvCoworkSesion>    InvCoworkSesiones   { get; set; }

    // ============================================================
    // TABLAS DE SIGAFI (solo lectura recomendada)
    // Los investigadores, alumnos, periodos, horarios y carreras 
    // ya existen en SIGAFI. Aquí solo los consultamos, NO los creamos.
    // ============================================================

    // --- Actores ---
    public virtual DbSet<Profesore>    Profesores  { get; set; }   // profesores
    public virtual DbSet<Alumno>       Alumnos     { get; set; }   // alumnos

    // Core de Identidad Centralizado (SIGAFI Centralization)
    public virtual DbSet<User>                Users                 { get; set; }   // usuarios
    public virtual DbSet<Role>                Roles                 { get; set; }   // rol
    public virtual DbSet<UserRole>            UserRoles             { get; set; }   // usuario_rol
    public virtual DbSet<SystemEntity>        Systems               { get; set; }   // sistema
    public virtual DbSet<IdentityModule>      Modules               { get; set; }   // modulos
    public virtual DbSet<IdentityOperation>   Operations            { get; set; }   // operaciones
    public virtual DbSet<ModuleOperation>     ModuleOperations      { get; set; }   // modulos_operaciones
    public virtual DbSet<RoleModuleOperation> RoleModuleOperations  { get; set; }   // rol_modulo_operacion

    // --- Académico ---
    public virtual DbSet<Periodo>              Periodos           { get; set; }  // periodos
    public virtual DbSet<Carrera>              Carreras           { get; set; }  // carreras
    public virtual DbSet<ProfesoresCarrerasPeriodo> ProfesoresCarrerasPeriodos { get; set; } // profesores_carreras_periodos
    public virtual DbSet<AlumnosCarrera>            AlumnosCarreras           { get; set; } // alumnos_carreras
    public virtual DbSet<Departamento>         Departamentos      { get; set; }  // departamentos
    public virtual DbSet<Espacio>              Espacios           { get; set; }  // espacios (labs/aulas)
    public virtual DbSet<AsignacionesProfesore>AsignacionesProfesores { get; set; } // asignaciones_profesores (carga horaria)
    public virtual DbSet<HorarioDetalle>       HorariosDetalle    { get; set; }  // horario_detalle (día/hora física)
    public virtual DbSet<FechasHorario>        FechasHorarios     { get; set; }  // fechas_horario (fechas de calendario para horarios)
    public virtual DbSet<HorasClase>           HorasClase         { get; set; }  // horas_clases (franjas horarias)
    public virtual DbSet<Matricula>            Matriculas         { get; set; }  // matriculas
    public virtual DbSet<Curso>                Cursos             { get; set; }  // cursos
    public virtual DbSet<Asignatura>           Asignaturas        { get; set; }  // asignaturas

    // --- Títulos y nivel académico (para reportes CACES) ---
    public virtual DbSet<TitulosProfesore>     TitulosProfesores  { get; set; }  // titulos_profesores
    public virtual DbSet<GradosAcademico>      GradosAcademicos   { get; set; }  // grados_academicos
    public virtual DbSet<NivelesAcademico>     NivelesAcademicos  { get; set; }  // niveles_academicos
    public virtual DbSet<Universidade>         Universidades       { get; set; } // universidades
    public virtual DbSet<Etnia>                Etnias             { get; set; }  // etnias (caces)
    public virtual DbSet<Discapacidade>        Discapacidades     { get; set; }  // discapacidades (caces)

    // --- Actividades del docente (horas de investigación) ---
    public virtual DbSet<ProfesoresActividade>     ProfesoresActividades    { get; set; } // profesores_actividades
    public virtual DbSet<SubcategoriasActividade>  SubcategoriasActividades { get; set; } // subcategorias_actividades
    public virtual DbSet<Contrato>                 Contratos                { get; set; } // contratos
    public virtual DbSet<TiposContrato>            TiposContratos           { get; set; } // tipos_contratos
    public virtual DbSet<HorasAcademica>           HorasAcademicas          { get; set; } // horas_academicas (los límites permitidos)

    // --- Clasificación UNESCO (obligatorio SENESCYT) ---
    public virtual DbSet<CampoDetalladoUnesco>  CamposDetalladoUnesco { get; set; } // campo_detallado_unesco
    public virtual DbSet<CampoEspecificoUnesco> CamposEspecificoUnesco { get; set; }// campo_especifico_unesco
    public virtual DbSet<CampoAmplioUnesco>     CamposAmplioUnesco    { get; set; } // campo_amplio_unesco

    // --- Datos institucionales (para actas y certificados) ---
    public virtual DbSet<InstitucionesInstituto>InstitucionesInstitutos{ get; set; } // instituciones_instituto (RUC, dirección)
    public virtual DbSet<Parametro>             Parametros            { get; set; } // parametros (rector, firma, sello)

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // La conexión se inyecta desde Program.cs vía AddDbContext<DiitraContext>
        // No se configura aquí para evitar credenciales en el código fuente
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ============================================================
        // TABLAS SIGAFI (configuración mínima necesaria)
        // Solo las propiedades y llaves que Diitra utiliza
        // ============================================================

        modelBuilder.Entity<Profesore>(entity =>
        {
            entity.HasKey(e => e.IdProfesor).HasName("PRIMARY");
            entity.ToTable("profesores");

            entity.Property(e => e.IdProfesor).HasColumnName("idProfesor");
            entity.Property(e => e.Tipodocumento).HasColumnName("tipodocumento");
            entity.Property(e => e.Apellidos).HasColumnName("apellidos");
            entity.Property(e => e.Nombres).HasColumnName("nombres");
            entity.Property(e => e.PrimerApellido).HasColumnName("primerApellido");
            entity.Property(e => e.SegundoApellido).HasColumnName("segundoApellido");
            entity.Property(e => e.PrimerNombre).HasColumnName("primerNombre");
            entity.Property(e => e.SegundoNombre).HasColumnName("segundoNombre");
            entity.Property(e => e.EstadoCivil).HasColumnName("estadoCivil");
            entity.Property(e => e.Direccion).HasColumnName("direccion");
            entity.Property(e => e.CallePrincipal).HasColumnName("callePrincipal");
            entity.Property(e => e.CalleSecundaria).HasColumnName("calleSecundaria");
            entity.Property(e => e.NumeroCasa).HasColumnName("numeroCasa");
            entity.Property(e => e.Telefono).HasColumnName("telefono");
            entity.Property(e => e.Celular).HasColumnName("celular");
            entity.Property(e => e.Email).HasColumnName("email");
            entity.Property(e => e.FechaNacimiento).HasColumnName("fecha_nacimiento");
            entity.Property(e => e.Sexo).HasColumnName("sexo");
            entity.Property(e => e.Clave).HasColumnName("clave");
            entity.Property(e => e.Practicas).HasColumnName("practicas");
            entity.Property(e => e.Tipo).HasColumnName("tipo");
            entity.Property(e => e.Nacionalidad).HasColumnName("nacionalidad");
            entity.Property(e => e.Titulo).HasColumnName("titulo");
            entity.Property(e => e.Abreviatura).HasColumnName("abreviatura");
            entity.Property(e => e.AbreviaturaPost).HasColumnName("abreviatura_post");
            entity.Property(e => e.Activo).HasColumnName("activo");
            entity.Property(e => e.IdEtnia).HasColumnName("idEtnia");
            entity.Property(e => e.IdNacionalidad).HasColumnName("idNacionalidad");
            entity.Property(e => e.IdParroquiaNacimiento).HasColumnName("idParroquiaNacimiento");
            entity.Property(e => e.EmailInstitucional).HasColumnName("emailInstitucional");
            entity.Property(e => e.FechaIngreso).HasColumnName("fecha_ingreso");
            entity.Property(e => e.FechaIngresoIess).HasColumnName("fechaIngresoIess");
            entity.Property(e => e.FechaRetiro).HasColumnName("fecha_retiro");
            entity.Property(e => e.IdParroquiaResidencia).HasColumnName("idParroquiaResidencia");
            entity.Property(e => e.TipoSangre).HasColumnName("tipoSangre");
            entity.Property(e => e.CodigoPostal).HasColumnName("codigoPostal");
            entity.Property(e => e.IdDiscapacidad).HasColumnName("idDiscapacidad");
            entity.Property(e => e.PorcentajeDiscapacidad).HasColumnName("porcentajeDiscapacidad");
            entity.Property(e => e.NumeroConadis).HasColumnName("numeroConadis");
            entity.Property(e => e.Foto).HasColumnName("foto");
            entity.Property(e => e.EsReal).HasColumnName("esReal");

            // Ignorar los que definitivamente no usaremos o sospechosos de relaciones rotas
            entity.Ignore(e => e.IdDiscapacidadNavigation);
            entity.Ignore(e => e.IdEtniaNavigation);
            entity.Ignore(e => e.ProfesoresCarrerasPeriodos);
            entity.Ignore(e => e.ProfesoresDedicacions);
            entity.Ignore(e => e.TitulosProfesores);
        });

        modelBuilder.Entity<Alumno>(entity =>
        {
            entity.HasKey(e => e.IdAlumno).HasName("PRIMARY");
            entity.ToTable("alumnos");
            
            entity.Property(e => e.IdAlumno).HasColumnName("idAlumno");
            entity.Property(e => e.TipoDocumento).HasColumnName("tipoDocumento");
            entity.Property(e => e.ApellidoPaterno).HasColumnName("apellidoPaterno");
            entity.Property(e => e.ApellidoMaterno).HasColumnName("apellidoMaterno");
            entity.Property(e => e.PrimerNombre).HasColumnName("primerNombre");
            entity.Property(e => e.SegundoNombre).HasColumnName("segundoNombre");
            entity.Property(e => e.FechaNacimiento).HasColumnName("fecha_Nacimiento");
            entity.Property(e => e.Direccion).HasColumnName("direccion");
            entity.Property(e => e.Telefono).HasColumnName("telefono");
            entity.Property(e => e.Celular).HasColumnName("celular");
            entity.Property(e => e.Email).HasColumnName("email");
            entity.Property(e => e.CiudadNacimiento).HasColumnName("ciudad_Nacimiento");
            entity.Property(e => e.ProvinciaNacimiento).HasColumnName("provincia_Nacimiento");
            entity.Property(e => e.Foto).HasColumnName("foto");
            entity.Property(e => e.Sexo).HasColumnName("sexo");
            entity.Property(e => e.Nacionalidad).HasColumnName("nacionalidad");
            entity.Property(e => e.IdNivel).HasColumnName("idNivel");
            entity.Property(e => e.IdPeriodo).HasColumnName("idPeriodo");
            entity.Property(e => e.IdSeccion).HasColumnName("idSeccion");
            entity.Property(e => e.IdModalidad).HasColumnName("idModalidad");
            entity.Property(e => e.IdInstitucion).HasColumnName("idInstitucion");
            entity.Property(e => e.TituloColegio).HasColumnName("tituloColegio");
            entity.Property(e => e.FechaInscripcion).HasColumnName("fecha_Inscripcion");
            entity.Property(e => e.ParroquiaNacimiento).HasColumnName("parroquia_nacimiento");
            entity.Property(e => e.NombrePadre).HasColumnName("nombre_padre");
            entity.Property(e => e.OcupacionPadre).HasColumnName("ocupacion_padre");
            entity.Property(e => e.NacionalidadPadre).HasColumnName("nacionalidad_padre");
            entity.Property(e => e.NombreMadre).HasColumnName("nombre_madre");
            entity.Property(e => e.OcupacionMadre).HasColumnName("ocupacion_madre");
            entity.Property(e => e.NacionalidadMadre).HasColumnName("nacionalidad_madre");
            entity.Property(e => e.BarrioResidencia).HasColumnName("barrio_residencia");
            entity.Property(e => e.ParroquiaResidencia).HasColumnName("parroquia_residencia");
            entity.Property(e => e.CiudadResidencia).HasColumnName("ciudad_residencia");
            entity.Property(e => e.TipoSangre).HasColumnName("tipo_sangre");
            entity.Property(e => e.UserAlumno).HasColumnName("user_alumno");
            entity.Property(e => e.Password).HasColumnName("password");
            entity.Property(e => e.IdDiscapacidad).HasColumnName("idDiscapacidad");
            entity.Property(e => e.IdEtnia).HasColumnName("idEtnia");
            entity.Property(e => e.IdNacionalidad).HasColumnName("idNacionalidad");
            entity.Property(e => e.PorcentajeDiscapacidad).HasColumnName("porcentaje_discapacidad");
            entity.Property(e => e.CarnetConadis).HasColumnName("carnet_conadis");
            entity.Property(e => e.EmailInstitucional).HasColumnName("email_institucional");
            entity.Property(e => e.PrimerIngreso).HasColumnName("primerIngreso");
            entity.Property(e => e.Archivofoto).HasColumnName("archivofoto");

            entity.Ignore(e => e.Matriculas);
        });


        modelBuilder.Entity<Periodo>(entity =>
        {
            entity.HasKey(e => e.IdPeriodo).HasName("PRIMARY");
            entity.ToTable("periodos");
            entity.Property(e => e.IdPeriodo).HasMaxLength(7).IsFixedLength().HasColumnName("idPeriodo");
            entity.Property(e => e.Detalle).HasMaxLength(100).HasColumnName("detalle");
            entity.Property(e => e.FechaInicial).HasColumnName("fecha_inicial");
            entity.Property(e => e.FechaFinal).HasColumnName("fecha_final");
            entity.Property(e => e.Cerrado).HasColumnName("cerrado");
            entity.Property(e => e.FechaMaximaAutocierre).HasColumnName("fecha_maxima_autocierre");
            entity.Property(e => e.Activo).HasColumnName("activo");
            entity.Property(e => e.Creditos).HasColumnName("creditos");
            entity.Property(e => e.NumeroPagos).HasColumnName("numero_pagos");
            entity.Property(e => e.FechaMatruclaExtraordinaria).HasColumnName("fecha_matrucla_extraordinaria");
            entity.Property(e => e.Foliop).HasColumnName("foliop");
            entity.Property(e => e.PermiteMatricula).HasColumnType("tinyint(4)").HasColumnName("permiteMatricula");
            entity.Property(e => e.IngresoCalificaciones).HasColumnType("tinyint(4)").HasColumnName("ingresoCalificaciones");
            entity.Property(e => e.PermiteCalificacionesInstituto).HasColumnType("tinyint(4)").HasColumnName("permiteCalificacionesInstituto");
            entity.Property(e => e.Periodoactivoinstituto).HasColumnType("tinyint(4)").HasColumnName("periodoactivoinstituto");
            entity.Property(e => e.VisualizaPowerBi).HasColumnType("tinyint(4)").HasColumnName("visualizaPowerBi");
            entity.Property(e => e.EsInstituto).HasColumnType("tinyint(4)").HasColumnName("esInstituto");
            entity.Property(e => e.PeriodoPlanificacion).HasColumnType("tinyint(4)").HasColumnName("periodoPlanificacion");

            entity.Ignore(e => e.Matriculas);
            entity.Ignore(e => e.ProfesoresCarrerasPeriodos);
            entity.Ignore(e => e.ProfesoresDedicacions);
        });

        modelBuilder.Entity<Carrera>(entity =>
        {
            entity.HasKey(e => e.IdCarrera).HasName("PRIMARY");
            entity.ToTable("carreras");
            
            entity.Property(e => e.IdCarrera).HasColumnName("idCarrera");
            entity.Property(e => e.Carrera1).HasColumnName("Carrera");
            entity.Property(e => e.FechaCreacion).HasColumnName("fechaCreacion");
            entity.Property(e => e.Activa).HasColumnName("activa");
            entity.Property(e => e.DirectorCarrera).HasColumnName("directorCarrera");
            entity.Property(e => e.NumeroCreditos).HasColumnName("numero_creditos");
            entity.Property(e => e.OrdenCarrera).HasColumnName("ordenCarrera");
            entity.Property(e => e.NumeroAlumnos).HasColumnName("numero_alumnos");
            entity.Property(e => e.RevisaArrastres).HasColumnName("revisaArrastres");
            entity.Property(e => e.CodigoCases).HasColumnName("codigo_cases");
            entity.Property(e => e.AliasCarrera).HasColumnName("aliasCarrera");
            entity.Property(e => e.BolsaEmpleo).HasColumnName("BolsaEmpleo");
            entity.Property(e => e.EsInstituto).HasColumnName("esInstituto");

            entity.Ignore(e => e.Espacios);
            entity.Ignore(e => e.ProfesoresCarrerasPeriodos);
        });

        modelBuilder.Entity<Departamento>(entity =>
        {
            entity.HasKey(e => e.Iddepartamentos).HasName("PRIMARY");
            entity.ToTable("departamentos");
            entity.Property(e => e.Iddepartamentos).HasColumnType("int(11)").HasColumnName("iddepartamentos");
            entity.Property(e => e.NombreDepartamento).HasMaxLength(90).HasColumnName("nombre_departamento");
        });

        modelBuilder.Entity<Espacio>(entity =>
        {
            entity.HasKey(e => e.IdEspacio).HasName("PRIMARY");
            entity.ToTable("espacios");
            entity.Property(e => e.IdEspacio).HasColumnType("int(11)").HasColumnName("idEspacio");
            entity.Property(e => e.Codigo).HasMaxLength(15).HasColumnName("codigo");
            entity.Property(e => e.Nombre).HasMaxLength(100).HasColumnName("nombre");
            entity.Property(e => e.Tipo).HasColumnType("enum('aula','laboratorio','taller','virtual','aula interactiva')").HasColumnName("tipo");
            entity.Property(e => e.Capacidad).HasColumnType("int(11)").HasColumnName("capacidad");
            entity.Ignore(e => e.IdCarreraNavigation);
        });

        modelBuilder.Entity<AsignacionesProfesore>(entity =>
        {
            entity.HasKey(e => e.IdAsignacion).HasName("PRIMARY");
            entity.ToTable("asignaciones_profesores");
            entity.Property(e => e.IdAsignacion).HasColumnType("int(11)").HasColumnName("idAsignacion");
            entity.Property(e => e.IdProfesor).HasMaxLength(14).HasColumnName("idProfesor");
            entity.Property(e => e.IdPeriodo).HasMaxLength(7).HasColumnName("idPeriodo");
            entity.Property(e => e.NumeroHoras).HasPrecision(10, 2).HasColumnName("numeroHoras");
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasColumnName("activo");
            entity.Ignore(e => e.HorarioDetalles);
        });

        modelBuilder.Entity<HorarioDetalle>(entity =>
        {
            entity.HasKey(e => e.IdHorario).HasName("PRIMARY");
            entity.ToTable("horario_detalle");
            entity.Property(e => e.IdHorario).HasColumnType("int(11)").HasColumnName("idHorario");
            entity.Property(e => e.IdAsignacion).HasColumnType("int(11)").HasColumnName("idAsignacion");
            entity.Property(e => e.IdEspacio).HasColumnType("int(11)").HasColumnName("idEspacio");
            entity.Property(e => e.DiaSemana).HasColumnType("int(11)").HasColumnName("diaSemana");
            entity.Property(e => e.HoraInicio).HasColumnName("horaInicio");
            entity.Property(e => e.HoraFin).HasColumnName("horaFin");
            entity.Property(e => e.TipoBloque).HasColumnType("enum('teorico','practico','taller')").HasColumnName("tipoBloque");
            entity.Ignore(e => e.IdAsignacionNavigation);
            entity.Ignore(e => e.IdEspacioNavigation);
            entity.Ignore(e => e.IdEspacioNavigation);
        });

        modelBuilder.Entity<FechasHorario>(entity =>
        {
            entity.HasKey(e => e.IdFecha).HasName("PRIMARY");
            entity.ToTable("fechas_horarios");
            entity.Property(e => e.IdFecha).HasColumnType("int(11)").HasColumnName("idFecha");
            entity.Property(e => e.Fecha).HasColumnName("fecha");
            entity.Property(e => e.Finsemana).HasColumnType("tinyint(4)").HasColumnName("finsemana");
            entity.Property(e => e.Dia).HasMaxLength(20).HasColumnName("dia");
        });

        modelBuilder.Entity<HorasClase>(entity =>
        {
            entity.HasKey(e => e.Idhora).HasName("PRIMARY");
            entity.ToTable("horas_clases");
            entity.Property(e => e.Idhora).HasColumnType("int(11)").HasColumnName("idhora");
            entity.Property(e => e.HoraInicio).HasMaxLength(5).HasColumnName("hora_inicio");
            entity.Property(e => e.HoraFin).HasMaxLength(5).HasColumnName("hora_fin");
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasColumnName("activo");
        });

        modelBuilder.Entity<Matricula>(entity =>
        {
            entity.HasKey(e => e.IdMatricula).HasName("PRIMARY");
            entity.ToTable("matriculas");

            entity.Property(e => e.IdMatricula).HasColumnName("idMatricula");
            entity.Property(e => e.IdAlumno).HasColumnName("idAlumno");
            entity.Property(e => e.IdNivel).HasColumnName("idNivel");
            entity.Property(e => e.IdSeccion).HasColumnName("idSeccion");
            entity.Property(e => e.IdModalidad).HasColumnName("idModalidad");
            entity.Property(e => e.IdPeriodo).HasColumnName("idPeriodo");
            
            entity.Property(e => e.FechaMatricula).HasColumnName("fechaMatricula");
            entity.Property(e => e.Paralelo).HasColumnName("paralelo");
            entity.Property(e => e.Arrastres).HasColumnName("arrastres");
            entity.Property(e => e.Folio).HasColumnName("folio");
            
            entity.Property(e => e.BecaMatricula).HasColumnName("beca_matricula");
            entity.Property(e => e.BecaColegiatura).HasColumnName("beca_colegiatura");
            
            entity.Property(e => e.Retirado).HasColumnName("retirado");
            entity.Property(e => e.FechaRetiro).HasColumnName("fechaRetiro");
            entity.Property(e => e.Observacion).HasColumnName("observacion");
            entity.Property(e => e.Convalidacion).HasColumnName("convalidacion");
            entity.Property(e => e.CarreraConvalidada).HasColumnName("carrera_convalidada");
            entity.Property(e => e.NumeroPermiso).HasColumnName("numero_permiso");
            entity.Property(e => e.UserMatricula).HasColumnName("user_matricula");
            entity.Property(e => e.Valida).HasColumnName("valida");
            entity.Property(e => e.EsOyente).HasColumnName("esOyente");
            entity.Property(e => e.DocumentoFactura).HasColumnName("documentoFactura");

            entity.Ignore(e => e.IdAlumnoNavigation);
            entity.Ignore(e => e.IdPeriodoNavigation);
        });

        modelBuilder.Entity<Asignatura>(entity =>
        {
            entity.HasKey(e => e.IdAsignatura).HasName("PRIMARY");
            entity.ToTable("asignaturas");
            entity.Property(e => e.IdAsignatura).HasColumnType("int(11)").HasColumnName("idAsignatura");
            entity.Property(e => e.Asignatura1).HasMaxLength(200).HasColumnName("asignatura");
            entity.Property(e => e.Codigo).HasMaxLength(30).HasColumnName("codigo");
        });

        modelBuilder.Entity<Curso>(entity =>
        {
            entity.HasKey(e => e.IdNivel).HasName("PRIMARY");
            entity.ToTable("cursos");

            entity.Property(e => e.IdNivel).HasColumnName("idNivel");
            entity.Property(e => e.IdCarrera).HasColumnName("idCarrera");
            entity.Property(e => e.Nivel).HasMaxLength(20).HasColumnName("Nivel");
            entity.Property(e => e.Jerarquia).HasColumnName("jerarquia");
            entity.Property(e => e.Orden).HasColumnName("orden");
            entity.Property(e => e.EsRecuperacion).HasColumnName("esRecuperacion");
            entity.Property(e => e.AliasCurso).HasMaxLength(5).HasColumnName("aliasCurso");
        });

        modelBuilder.Entity<TitulosProfesore>(entity =>
        {
            entity.HasKey(e => e.IdTitulosProfesor).HasName("PRIMARY");
            entity.ToTable("titulos_profesores");
            entity.Property(e => e.IdTitulosProfesor).HasColumnType("int(11)").HasColumnName("idTitulosProfesor");
            entity.Property(e => e.IdProfesor).HasMaxLength(14).HasColumnName("idProfesor");
            entity.Property(e => e.Titulo).HasMaxLength(200).HasColumnName("titulo");
            entity.Property(e => e.CodigoSenescyt).HasMaxLength(90).HasColumnName("codigo_senescyt");
            entity.Property(e => e.FechaObtencion).HasColumnName("fecha_obtencion");
            entity.Ignore(e => e.IdCampoDetalladoUnescoNavigation);
            entity.Ignore(e => e.IdGradoAcademicoNavigation);
            entity.Ignore(e => e.IdUniversidadNavigation);
            entity.Ignore(e => e.IdProfesorNavigation);
        });

        modelBuilder.Entity<GradosAcademico>(entity =>
        {
            entity.HasKey(e => e.IdGradoAcademico).HasName("PRIMARY");
            entity.ToTable("grados_academicos");
            entity.Property(e => e.IdGradoAcademico).HasColumnType("int(11)").HasColumnName("idGradoAcademico");
            entity.Property(e => e.Nombre).HasMaxLength(45).HasColumnName("nombre");
            entity.Ignore(e => e.IdNivelAcademicoNavigation);
        });

        modelBuilder.Entity<NivelesAcademico>(entity =>
        {
            entity.HasKey(e => e.IdNivelAcademico).HasName("PRIMARY");
            entity.ToTable("niveles_academicos");
            entity.Property(e => e.IdNivelAcademico).HasColumnType("int(11)").HasColumnName("idNivelAcademico");
            entity.Property(e => e.Nombre).HasMaxLength(60).HasColumnName("nombre");
        });

        modelBuilder.Entity<Universidade>(entity =>
        {
            entity.HasKey(e => e.IdUniversidad).HasName("PRIMARY");
            entity.ToTable("universidades");
            entity.Property(e => e.IdUniversidad).HasColumnType("int(11)").HasColumnName("idUniversidad");
            entity.Property(e => e.Nombre).HasMaxLength(150).HasColumnName("nombre");
            entity.Ignore(e => e.TitulosProfesores);
        });

        modelBuilder.Entity<ProfesoresActividade>(entity =>
        {
            entity.HasKey(e => new { e.IdPeriodo, e.IdProfesor, e.IdSubcategoria })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0, 0 });
            entity.ToTable("profesores_actividades");
            entity.Property(e => e.IdPeriodo).HasMaxLength(7).HasColumnName("idPeriodo");
            entity.Property(e => e.IdProfesor).HasMaxLength(14).HasColumnName("idProfesor");
            entity.Property(e => e.IdSubcategoria).HasColumnType("int(11)").HasColumnName("idSubcategoria");
            entity.Property(e => e.HorasSemana).HasColumnType("int(11)").HasColumnName("horas_semana");
            entity.Ignore(e => e.IdSubcategoriaNavigation);
        });

        modelBuilder.Entity<SubcategoriasActividade>(entity =>
        {
            entity.HasKey(e => e.IdSubcategoria).HasName("PRIMARY");
            entity.ToTable("subcategorias_actividades");
            entity.Property(e => e.IdSubcategoria).HasColumnType("int(11)").HasColumnName("idSubcategoria");
            entity.Property(e => e.Subcategoria).HasMaxLength(100).HasColumnName("subcategoria");
            entity.Property(e => e.IdCategoria).HasColumnName("idCategoria");
            entity.Property(e => e.EsDocencia).HasColumnName("esDocencia");
            entity.Property(e => e.Activa).HasColumnName("activa");
            entity.Ignore(e => e.ProfesoresActividades);
        });

        modelBuilder.Entity<ProfesoresDedicacion>(entity =>
        {
            entity.HasKey(e => e.IdProfesoresDedicacion).HasName("PRIMARY");
            entity.ToTable("profesores_dedicacion");
            entity.Property(e => e.IdProfesoresDedicacion).HasColumnType("int(11)").HasColumnName("idProfesoresDedicacion");
            entity.Property(e => e.IdProfesor).HasMaxLength(14).HasColumnName("idProfesor");
            entity.Property(e => e.IdPeriodo).HasMaxLength(7).IsFixedLength().HasColumnName("idPeriodo");
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");
            entity.Property(e => e.IdDedicacionCategorias).HasColumnName("idDedicacionCategorias");
            entity.Ignore(e => e.IdPeriodoNavigation);
            entity.Ignore(e => e.IdProfesorNavigation);
        });

        modelBuilder.Entity<Dedicacion>(entity =>
        {
            entity.HasKey(e => e.IdDedicacion).HasName("PRIMARY");
            entity.ToTable("dedicacion");
            entity.Property(e => e.IdDedicacion).HasColumnType("int(11)").HasColumnName("idDedicacion");
            entity.Property(e => e.Nombre).HasMaxLength(90).HasColumnName("nombre");
        });

        modelBuilder.Entity<CampoDetalladoUnesco>(entity =>
        {
            entity.HasKey(e => e.IdCampoDetalladoUnesco).HasName("PRIMARY");
            entity.ToTable("campo_detallado_unesco");
            entity.Property(e => e.IdCampoDetalladoUnesco).HasColumnType("int(11)").HasColumnName("idCampoDetalladoUnesco");
            entity.Property(e => e.NombreDetallado).HasMaxLength(100).HasColumnName("nombreDetallado");
            entity.Property(e => e.CodigoDetallado).HasMaxLength(10).HasColumnName("codigoDetallado");
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasColumnName("activo");
            entity.Ignore(e => e.IdCampospecificoUnescoNavigation);
            entity.Ignore(e => e.TitulosProfesores);
        });

        modelBuilder.Entity<CampoEspecificoUnesco>(entity =>
        {
            entity.HasKey(e => e.IdCampospecificoUnesco).HasName("PRIMARY");
            entity.ToTable("campo_especifico_unesco");
            entity.Property(e => e.IdCampospecificoUnesco).HasColumnType("int(11)").HasColumnName("idCampospecificoUnesco");
            entity.Property(e => e.NombreEspecifico).HasMaxLength(100).HasColumnName("nombreEspecifico");
            entity.Property(e => e.CodigoEspecifico).HasMaxLength(10).HasColumnName("codigoEspecifico");
            entity.Ignore(e => e.IdCampoAmplioUnescoNavigation);
            entity.Ignore(e => e.CampoDetalladoUnescos);
        });

        modelBuilder.Entity<CampoAmplioUnesco>(entity =>
        {
            entity.HasKey(e => e.IdCampoAmplioUnesco).HasName("PRIMARY");
            entity.ToTable("campo_amplio_unesco");
            entity.Property(e => e.IdCampoAmplioUnesco).HasColumnType("int(11)").HasColumnName("idCampoAmplioUnesco");
            entity.Property(e => e.Nombre).HasMaxLength(100).HasColumnName("nombre");
            entity.Property(e => e.CodigoAmplio).HasMaxLength(10).HasColumnName("codigoAmplio");
            entity.Ignore(e => e.CampoEspecificoUnescos);
        });

        modelBuilder.Entity<Etnia>(entity =>
        {
            entity.HasKey(e => e.IdEtnia).HasName("PRIMARY");
            entity.ToTable("etnias");
            entity.Property(e => e.IdEtnia).HasColumnType("int(11)").HasColumnName("idEtnia");
            entity.Property(e => e.Etnia1).HasMaxLength(80).HasColumnName("etnia");
            entity.Ignore(e => e.Profesores);
        });

        modelBuilder.Entity<Discapacidade>(entity =>
        {
            entity.HasKey(e => e.IdDiscapacidad).HasName("PRIMARY");
            entity.ToTable("discapacidades");
            entity.Property(e => e.IdDiscapacidad).HasColumnType("int(11)").HasColumnName("idDiscapacidad");
            entity.Property(e => e.Discapacidad).HasMaxLength(150).HasColumnName("discapacidad");
            entity.Ignore(e => e.Profesores);
        });

        modelBuilder.Entity<InstitucionesInstituto>(entity =>
        {
            entity.HasKey(e => e.IdInstitucionesInstituto).HasName("PRIMARY");
            entity.ToTable("instituciones_instituto");
            entity.Property(e => e.IdInstitucionesInstituto).HasColumnType("int(11)").HasColumnName("idInstitucionesInstituto");
            entity.Property(e => e.Nombre).HasMaxLength(255).HasColumnName("nombre");
            entity.Property(e => e.Ruc).HasMaxLength(15).HasColumnName("ruc");
            entity.Property(e => e.Representante).HasMaxLength(90).HasColumnName("representante");
            entity.Property(e => e.CedulaRepresentante).HasMaxLength(14).HasColumnName("cedula_representante");
            entity.Property(e => e.Ubicado).HasMaxLength(255).HasColumnName("ubicado");
        });

        modelBuilder.Entity<HorasAcademica>(entity =>
        {
            entity.HasKey(e => e.IdHorasAcademicas).HasName("PRIMARY");
            entity.ToTable("horas_academicas");
            entity.Property(e => e.IdHorasAcademicas).HasColumnType("int(11)").HasColumnName("idHorasAcademicas");
            entity.Property(e => e.IdDedicacion).HasColumnType("int(11)").HasColumnName("idDedicacion");
            entity.Ignore(e => e.IdDedicacionNavigation);
        });

        modelBuilder.Entity<ProfesoresCarrerasPeriodo>(entity =>
        {
            entity.HasKey(e => e.IdProfesoresCarrerasPeriodos).HasName("PRIMARY");
            entity.ToTable("profesores_carreras_periodos");
            entity.Property(e => e.IdProfesoresCarrerasPeriodos).HasColumnType("int(11)").HasColumnName("idProfesoresCarrerasPeriodos");
            entity.Property(e => e.IdPeriodo).HasMaxLength(7).HasColumnName("idPeriodo");
            entity.Property(e => e.IdProfesor).HasMaxLength(14).HasColumnName("idProfesor");
            entity.Property(e => e.IdCarrera).HasColumnType("int(11)").HasColumnName("idCarrera");
            entity.Ignore(e => e.IdCarreraNavigation);
            entity.Ignore(e => e.IdPeriodoNavigation);
            entity.Ignore(e => e.IdProfesorNavigation);
        });

        modelBuilder.Entity<AlumnosCarrera>(entity =>
        {
            entity.HasKey(e => new { e.IdAlumno, e.IdCarrera })
                .HasName("PRIMARY")
                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
            entity.ToTable("alumnos_carreras");
            
            entity.Property(e => e.IdAlumno).HasColumnName("idAlumno");
            entity.Property(e => e.IdCarrera).HasColumnName("idCarrera");
            entity.Property(e => e.Convalidacion).HasColumnName("convalidacion");
            entity.Property(e => e.CarreraConvalidada).HasColumnName("carrera_convalidada");
            entity.Property(e => e.InstitucionConvalidada).HasColumnName("institucion_convalidada");
            entity.Property(e => e.CreditosConvalidados).HasColumnName("creditos_convalidados");
            entity.Property(e => e.Pasantias).HasColumnName("pasantias");
            entity.Property(e => e.NotaPasantia).HasColumnName("nota_pasantia");
            entity.Property(e => e.CreditosPasantia).HasColumnName("creditos_pasantia");
            entity.Property(e => e.TrabajoGrado).HasColumnName("trabajo_grado");
            entity.Property(e => e.NotaDocumento).HasColumnName("nota_documento");
            entity.Property(e => e.NotaDefensa).HasColumnName("nota_defensa");
            entity.Property(e => e.NotaTesis).HasColumnName("nota_tesis");
            entity.Property(e => e.CreditosTitulo).HasColumnName("creditos_titulo");
        });

        modelBuilder.Entity<Parametro>(entity =>
        {
            entity.HasNoKey();
            entity.ToTable("parametros");
            entity.Property(e => e.NombreInstitucion).HasMaxLength(150).HasColumnName("nombreInstitucion");
            entity.Property(e => e.NombreRector).HasMaxLength(200).HasColumnName("nombreRector");
            entity.Property(e => e.ArchivoFirma).HasMaxLength(150).HasColumnName("archivoFirma");
            entity.Property(e => e.ArchivoSello).HasMaxLength(150).HasColumnName("archivoSello");
            entity.Property(e => e.CodigoInstitucion).HasMaxLength(10).HasColumnName("codigo_institucion");
        });

        // ============================================================
        // TABLAS Diitra (inv_) - V3 Core Schema
        // ============================================================

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
            entity.Property(e => e.IdCoordinador).HasColumnName("idCoordinador");
            entity.Property(e => e.ObjetivoGeneral).HasColumnName("objetivoGeneral").HasColumnType("text");
            entity.Property(e => e.Mision).HasColumnName("mision").HasColumnType("text");
            entity.Property(e => e.Vision).HasColumnName("vision").HasColumnType("text");
            entity.Property(e => e.ResolucionAprobacion).HasColumnName("resolucionAprobacion").HasMaxLength(100);
            entity.Property(e => e.FechaCreacion).HasColumnName("fechaCreacion");
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.IdCoordinadorNavigation).WithMany()
                .HasForeignKey(d => d.IdCoordinador).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_grupo_coordinador");

            entity.HasMany(d => d.IdLineas).WithMany(p => p.IdGrupos)
                .UsingEntity<Dictionary<string, object>>(
                    "inv_grupos_lineas",
                    r => r.HasOne<InvLineaInvestigacion>().WithMany().HasForeignKey("idLinea").OnDelete(DeleteBehavior.Cascade),
                    l => l.HasOne<InvGrupoInvestigacion>().WithMany().HasForeignKey("idGrupo").OnDelete(DeleteBehavior.Cascade),
                    j =>
                    {
                        j.HasKey("idGrupo", "idLinea");
                        j.ToTable("inv_grupos_lineas");
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
            entity.Property(e => e.Anio).HasColumnName("anio");
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text");
            entity.Property(e => e.PresupuestoTotal).HasColumnName("presupuestoTotal").HasPrecision(12, 2);
            entity.Property(e => e.MontoMaximoProyecto).HasColumnName("montoMaximoProyecto").HasPrecision(12, 2);
            entity.Property(e => e.UrlBases).HasColumnName("urlBases").HasMaxLength(512);
            entity.Property(e => e.RequisitosMinimos).HasColumnName("requisitosMinimos").HasColumnType("text");
            entity.Property(e => e.IdTipoConvocatoria).HasColumnName("idTipoConvocatoria");
            entity.Property(e => e.IdAgendaZonal).HasColumnName("idAgendaZonal");
            entity.Property(e => e.IdRubrica).HasColumnName("idRubrica");
            entity.Property(e => e.PuntajeMinimoAprobacion).HasColumnName("puntajeMinimoAprobacion").HasPrecision(5, 2).HasDefaultValueSql("'70.00'");
            entity.Property(e => e.FinanciamientoExt).HasColumnName("financiamientoExt").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
            entity.Property(e => e.MetaProduccion).HasColumnName("metaProduccion").HasMaxLength(255);
            entity.Property(e => e.Estado).HasColumnName("estado").HasColumnType("enum('Borrador','Abierta','Cerrada','Anulada')").HasDefaultValueSql("'Borrador'");

            entity.HasOne(d => d.IdPeriodoNavigation).WithMany().HasForeignKey(d => d.IdPeriodo).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_conv_periodo");
            entity.HasOne(d => d.IdRubricaNavigation).WithMany(p => p.Convocatorias).HasForeignKey(d => d.IdRubrica).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_conv_rubrica");

            entity.HasMany(d => d.Lineas).WithMany(p => p.Convocatorias)
                .UsingEntity<Dictionary<string, object>>(
                    "inv_convocatorias_lineas",
                    r => r.HasOne<InvLineaInvestigacion>().WithMany().HasForeignKey("idLinea").OnDelete(DeleteBehavior.Cascade),
                    l => l.HasOne<InvConvocatoria>().WithMany().HasForeignKey("idConvocatoria").OnDelete(DeleteBehavior.Cascade),
                    j =>
                    {
                        j.HasKey("idConvocatoria", "idLinea");
                        j.ToTable("inv_convocatorias_lineas");
                    });
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
            entity.Property(e => e.DescripcionProyecto).HasColumnName("descripcionProyecto").HasColumnType("text");
            entity.Property(e => e.Antecedentes).HasColumnName("antecedentes").HasColumnType("text");
            entity.Property(e => e.Justificacion).HasColumnName("justificacion").HasColumnType("text");
            entity.Property(e => e.MarcoTeorico).HasColumnName("marcoTeorico").HasColumnType("text");
            entity.Property(e => e.Metodologia).HasColumnName("metodologia").HasColumnType("text");
            entity.Property(e => e.MetodoEvaluacion).HasColumnName("metodoEvaluacion").HasColumnType("text");
            entity.Property(e => e.IdSublinea).HasColumnName("idSublinea");
            entity.Property(e => e.IdPrograma).HasColumnName("idPrograma");
            entity.Property(e => e.IdGrupo).HasColumnName("idGrupo");
            entity.Property(e => e.TieneGrupo).HasColumnName("tieneGrupo").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
            entity.Property(e => e.IdTipo).HasColumnName("idTipo");
            entity.Property(e => e.FechaPresentacion).HasColumnName("fechaPresentacion");
            entity.Property(e => e.FechaInicio).HasColumnName("fechaInicio");
            entity.Property(e => e.FechaFin).HasColumnName("fechaFin");
            entity.Property(e => e.TiempoEjecucion).HasColumnName("tiempoEjecucion").HasMaxLength(100);
            entity.Property(e => e.Estado).HasColumnName("estado").HasColumnType("enum('Borrador','Enviado','En Revisión','Aprobado','En Ejecución','Finalizado','Rechazado','Anulado')").HasDefaultValueSql("'Borrador'");
            entity.Property(e => e.PuntajeEvaluacion).HasColumnName("puntajeEvaluacion").HasPrecision(5, 2);
            entity.Property(e => e.ValorEjecucion).HasColumnName("valorEjecucion").HasPrecision(12, 2).HasDefaultValueSql("'0.00'");
            entity.Property(e => e.IdDspaceHandle).HasColumnName("idDspaceHandle").HasMaxLength(255);
            entity.Property(e => e.MetadataCacesJson).HasColumnName("metadataCacesJson").HasColumnType("json");
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaModificacion).HasColumnName("fechaModificacion").HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();

            entity.Property(e => e.IdObjetivoPnd).HasColumnName("idObjetivoPnd");
            entity.HasOne(d => d.IdObjetivoPndNavigation).WithMany(p => p.InvProyectos).HasForeignKey(d => d.IdObjetivoPnd).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_proy_pnd_obj");
            entity.HasOne(d => d.IdConvocatoriaNavigation).WithMany(p => p.Proyectos).HasForeignKey(d => d.IdConvocatoria).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_proy_conv");
            entity.HasOne(d => d.IdSublineaNavigation).WithMany(p => p.InvProyectos).HasForeignKey(d => d.IdSublinea).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_proy_sublinea");
            entity.HasOne(d => d.IdProgramaNavigation).WithMany(p => p.InvProyectos).HasForeignKey(d => d.IdPrograma).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_proy_programa");
            entity.HasOne(d => d.IdGrupoNavigation).WithMany(p => p.InvProyectos).HasForeignKey(d => d.IdGrupo).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_proy_grupo");
            entity.HasOne(d => d.IdTipoNavigation).WithMany(p => p.InvProyectos).HasForeignKey(d => d.IdTipo).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_proy_tipo");
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

        modelBuilder.Entity<InvProyectoProfesor>(entity =>
        {
            entity.HasKey(e => e.IdProyectoProfesor).HasName("PRIMARY");
            entity.ToTable("inv_proyectos_profesores");
            entity.Property(e => e.IdProyectoProfesor).HasColumnName("idProyectoProfesor");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
            entity.Property(e => e.EsDirector).HasColumnName("esDirector").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
            entity.Property(e => e.Rol).HasColumnName("rol").HasMaxLength(100);
            entity.Property(e => e.NivelAcademico).HasColumnName("nivelAcademico").HasMaxLength(150);
            entity.Property(e => e.Telefono).HasColumnName("telefono").HasMaxLength(20);
            entity.Property(e => e.HorasSemanales).HasColumnName("horasSemanales").HasPrecision(4, 1);

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProyectosProfesores).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pp_proyecto");
            entity.HasOne(d => d.IdUsuarioNavigation).WithMany().HasForeignKey(d => d.IdUsuario).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_pp_usuario");
        });

        modelBuilder.Entity<InvProyectoAlumno>(entity =>
        {
            entity.HasKey(e => e.IdProyectoAlumno).HasName("PRIMARY");
            entity.ToTable("inv_proyectos_alumnos");
            entity.Property(e => e.IdProyectoAlumno).HasColumnName("idProyectoAlumno");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
            entity.Property(e => e.Rol).HasColumnName("rol").HasMaxLength(100);
            entity.Property(e => e.NivelAcademico).HasColumnName("nivelAcademico").HasMaxLength(150);
            entity.Property(e => e.Telefono).HasColumnName("telefono").HasMaxLength(20);

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProyectosAlumnos).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pa_proyecto");
            entity.HasOne(d => d.IdUsuarioNavigation).WithMany().HasForeignKey(d => d.IdUsuario).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_pa_usuario");
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
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasMaxLength(150).IsRequired();
            entity.Property(e => e.Cantidad).HasColumnName("cantidad").HasDefaultValueSql("'1'");
            entity.Property(e => e.EsPatente).HasColumnName("esPatente").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
            entity.Property(e => e.NumeroRegistro).HasColumnName("numeroRegistro").HasMaxLength(100);
            entity.Property(e => e.FechaExpiracion).HasColumnName("fechaExpiracion");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProductos).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_prod_proyecto");
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
            entity.Property(e => e.ColorHex).HasColumnName("colorHex").HasMaxLength(7).HasDefaultValueSql("'#3498db'");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvCronogramas).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_cron_proyecto");
            entity.HasOne(d => d.IdObjetivoNavigation).WithMany(p => p.InvCronogramas).HasForeignKey(d => d.IdObjetivo).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_cron_objetivo");
            entity.HasOne(d => d.IdActividadPadreNavigation).WithMany(p => p.InverseIdActividadPadreNavigation).HasForeignKey(d => d.IdActividadPadre).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_cron_padre");
        });

        modelBuilder.Entity<InvCronogramaSemana>(entity =>
        {
            entity.HasKey(e => e.IdSemana).HasName("PRIMARY");
            entity.ToTable("inv_cronograma_semanas");
            entity.Property(e => e.IdSemana).HasColumnName("idSemana");
            entity.Property(e => e.IdActividad).HasColumnName("idActividad");
            entity.Property(e => e.Mes).HasColumnName("mes").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Semana).HasColumnName("semana").HasColumnType("tinyint(1)").IsRequired();
            entity.Property(e => e.Completada).HasColumnName("completada").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);

            entity.HasOne(d => d.IdActividadNavigation).WithMany(p => p.InvCronogramaSemanas).HasForeignKey(d => d.IdActividad).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_sem_actividad");
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
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasColumnType("enum('Imagen','Documento','Factura','Asistencia','Otros')").HasDefaultValueSql("'Imagen'");
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasMaxLength(255);
            entity.Property(e => e.RutaArchivo).HasColumnName("rutaArchivo").HasMaxLength(512).IsRequired();
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.IdInformeNavigation).WithMany(p => p.InvEvidencias).HasForeignKey(d => d.IdInforme).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_ev_informe");
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
            entity.Property(e => e.IdRevisor).HasColumnName("idRevisor");
            entity.Property(e => e.FechaAsignacion).HasColumnName("fechaAsignacion").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaLimite).HasColumnName("fechaLimite");
            entity.Property(e => e.Estado).HasColumnName("estado").HasMaxLength(50).HasDefaultValueSql("'Pendiente'");
            entity.Property(e => e.EsExterno).HasColumnName("esExterno").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
            entity.Property(e => e.EsDobleCiego).HasColumnName("esDobleCiego").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
            entity.Property(e => e.PuntajeTotal).HasColumnName("puntajeTotal").HasPrecision(5, 2);
            entity.Property(e => e.ObservacionesGral).HasColumnName("observacionesGral").HasColumnType("text");

            entity.HasOne(d => d.Proyecto).WithMany().HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_rev_proyecto");
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

        // ============================================================
        // MÓDULO: IDENTIDAD CENTRALIZADA (SIGAFI CORE)
        // ============================================================

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("usuarios");

            entity.HasKey(e => e.IdUsuario);
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario").ValueGeneratedOnAdd();

            entity.Property(e => e.IdSigafi).HasMaxLength(20).HasColumnName("idSigafi");
            entity.Property(e => e.TablaSigafi).HasColumnType("enum('alumno','profesor','otros')").HasColumnName("tablaSigafi");
            entity.Property(e => e.Nombre).HasMaxLength(200).HasColumnName("nombre");
            entity.Property(e => e.Contrasenia).HasMaxLength(250).IsRequired().HasColumnName("contrasenia");
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasColumnName("activo").HasDefaultValueSql("'1'").HasSentinel(true);
            entity.Property(e => e.Administrador).HasColumnType("tinyint(4)").HasColumnName("administrador").HasDefaultValueSql("'0'").HasSentinel(false);
            
            // Nuevos campos de email y validación
            entity.Property(e => e.EmailInstitucional).HasMaxLength(100).HasColumnName("emailInstitucional");
            entity.Property(e => e.EmailValidado).HasColumnType("tinyint(4)").HasColumnName("emailValidado").HasDefaultValueSql("'0'").HasSentinel(false);
            entity.Property(e => e.HashEmailToken).HasMaxLength(255).HasColumnName("hashEmailToken");
            entity.Property(e => e.FechaEmailValidacion).HasColumnName("fechaEmailValidacion");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.IdRol);
            entity.ToTable("rbac_rol");
            entity.Property(e => e.IdRol).HasColumnName("idRol");
            entity.Property(e => e.Nombre).HasMaxLength(255).IsRequired().HasColumnName("Nombre");
            entity.Property(e => e.CodigoRol).HasMaxLength(25).HasColumnName("codigo_rol").IsRequired();
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => e.IdUsuarioRol);
            entity.ToTable("rbac_usuario_rol");
            entity.Property(e => e.IdUsuarioRol).HasColumnName("idUsuarioRol");
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
            entity.Property(e => e.IdRol).HasColumnName("idRol");
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");
            entity.Property(e => e.FechaCreacion).HasColumnName("fecha_creacion");
            entity.Property(e => e.FechaModificacion).HasColumnName("fecha_modificacion");

            entity.HasOne(d => d.User).WithMany(p => p.UserRoles)
                .HasPrincipalKey(u => u.IdUsuario)
                .HasForeignKey(d => d.IdUsuario).HasConstraintName("fk_ur_usuario");
            entity.HasOne(d => d.Role).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.IdRol).HasConstraintName("fk_ur_rol");
        });

        modelBuilder.Entity<SystemEntity>(entity =>
        {
            entity.HasKey(e => e.IdSistema);
            entity.ToTable("rbac_sistema");
            entity.Property(e => e.IdSistema).HasColumnName("idSistema");
            entity.Property(e => e.Codigo).HasMaxLength(20).IsRequired().HasColumnName("codigo");
            entity.Property(e => e.Detalle).HasMaxLength(50).IsRequired().HasColumnName("detalle");
        });

        modelBuilder.Entity<IdentityModule>(entity =>
        {
            entity.HasKey(e => e.IdModulos);
            entity.ToTable("rbac_modulos");
            entity.Property(e => e.IdModulos).HasColumnName("idModulos");
            entity.Property(e => e.IdSistema).HasColumnName("id_sistema");
            // Nullable en la BD ('YES') — NO usar IsRequired()
            entity.Property(e => e.Nombre).HasMaxLength(255).HasColumnName("Nombre");
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");

            entity.HasOne(d => d.Sistema).WithMany(p => p.Modulos)
                .HasForeignKey(d => d.IdSistema).HasConstraintName("fk_mod_sistema");
        });

        modelBuilder.Entity<IdentityOperation>(entity =>
        {
            entity.HasKey(e => e.IdOperaciones);
            entity.ToTable("rbac_operaciones");
            entity.Property(e => e.IdOperaciones).HasColumnName("idOperaciones");
            // Nullable en la BD ('YES') — NO usar IsRequired()
            entity.Property(e => e.NombreOperacion).HasMaxLength(100).HasColumnName("NombreOperacion");
        });

        modelBuilder.Entity<ModuleOperation>(entity =>
        {
            entity.HasKey(e => e.IdModulosOperaciones);
            entity.ToTable("rbac_modulos_operaciones");
            entity.Property(e => e.IdModulosOperaciones).HasColumnName("idModulosOperaciones");
            entity.Property(e => e.IdModulos).HasColumnName("idModulos");
            entity.Property(e => e.IdOperaciones).HasColumnName("idOperaciones");
            // La BD usa DATE no DATETIME
            entity.Property(e => e.FechaCreacion).HasColumnName("fecha_creacion").HasColumnType("date");
            entity.Property(e => e.FechaModificacion).HasColumnName("fecha_modificacion").HasColumnType("date");
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");

            entity.HasOne(d => d.Module).WithMany(p => p.ModuloOperations)
                .HasForeignKey(d => d.IdModulos).HasConstraintName("fk_mo_mod");
            entity.HasOne(d => d.Operation).WithMany(p => p.ModuloOperations)
                .HasForeignKey(d => d.IdOperaciones).HasConstraintName("fk_mo_oper");
        });

        modelBuilder.Entity<RoleModuleOperation>(entity =>
        {
            entity.HasKey(e => e.IdRolModuloOperacion);
            entity.ToTable("rbac_rol_modulo_operacion");
            entity.Property(e => e.IdRolModuloOperacion).HasColumnName("idRolModuloOperacion");
            entity.Property(e => e.IdModulosOperaciones).HasColumnName("idModulosOperaciones");
            entity.Property(e => e.IdRol).HasColumnName("idRol");
            // La BD usa DATE no DATETIME
            entity.Property(e => e.FechaAsignacion).HasColumnName("fecha_asignacion").HasColumnType("date");
            entity.Property(e => e.FechaModificacion).HasColumnName("fecha_modificacion").HasColumnType("date");
            entity.Property(e => e.FechaDesactivacion).HasColumnName("fecha_desactivacion").HasColumnType("date");
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");
            // NOT NULL en la BD — IsRequired correcto
            entity.Property(e => e.UsuarioAsigno).HasMaxLength(150).HasColumnName("usuario_asigno").IsRequired();
            // NULL en la BD
            entity.Property(e => e.UsuarioDesactivo).HasMaxLength(150).HasColumnName("usuario_desactivo");

            entity.HasOne(d => d.ModuleOperation).WithMany(p => p.RoleModuleOperations)
                .HasForeignKey(d => d.IdModulosOperaciones).HasConstraintName("fk_rmo_mo");
            entity.HasOne(d => d.Role).WithMany(p => p.RoleModuleOperations)
                .HasForeignKey(d => d.IdRol).HasConstraintName("fk_rmo_rol");
        });

        
        modelBuilder.Entity<InvNotificacion>(entity =>
        {
            entity.HasKey(e => e.IdNotificacion).HasName("PRIMARY");
            entity.ToTable("inv_notificaciones");
            entity.Property(e => e.IdNotificacion).HasColumnName("idNotificacion");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique().HasDatabaseName("uq_notif_uuid");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.Destinatario).HasColumnName("destinatario");
            entity.Property(e => e.TipoDestinatario).HasColumnName("tipoDestinatario").HasColumnType("enum('Usuario','Profesor','Alumno')").HasDefaultValueSql("'Usuario'");
            entity.Property(e => e.Categoria).HasColumnName("categoria").HasMaxLength(50).HasDefaultValueSql("'SISTEMA'");
            entity.Property(e => e.Prioridad).HasColumnName("prioridad").HasMaxLength(20).HasDefaultValueSql("'NORMAL'");
            entity.Property(e => e.Titulo).HasColumnName("titulo").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Mensaje).HasColumnName("mensaje").HasColumnType("text");
            entity.Property(e => e.UrlAccion).HasColumnName("urlAccion").HasMaxLength(255);
            entity.Property(e => e.Leido).HasColumnName("leido").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
            entity.Property(e => e.FechaEnvio).HasColumnName("fechaEnvio").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaLectura).HasColumnName("fechaLectura");
            entity.Property(e => e.Version).HasColumnName("version").HasDefaultValueSql("'1'");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany().HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_notif_proyecto");
            entity.HasOne(d => d.DestinatarioNavigation).WithMany().HasForeignKey(d => d.Destinatario).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_notif_usuario");
        });

        modelBuilder.Entity<AccessToken>(entity =>
        {
            entity.HasKey(e => e.IdToken).HasName("PRIMARY");
            entity.ToTable("inv_tokens_acceso");
            entity.Property(e => e.IdToken).HasColumnName("idToken");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique().HasDatabaseName("uq_tokens_uuid");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.Token).HasColumnName("token").HasMaxLength(255).IsRequired();
            entity.HasIndex(e => e.Token).IsUnique();
            entity.Property(e => e.IdReferencia).HasColumnName("idReferencia");
            entity.Property(e => e.TipoReferencia).HasColumnName("tipoReferencia").HasMaxLength(50).HasDefaultValueSql("'Externo'");
            entity.Property(e => e.Scopes).HasColumnName("scopes").HasMaxLength(255);
            entity.Property(e => e.MaxUsos).HasColumnName("maxUsos").HasDefaultValueSql("'1'");
            entity.Property(e => e.UsosActuales).HasColumnName("usosActuales").HasDefaultValueSql("'0'");
            entity.Property(e => e.IpOrigen).HasColumnName("ipOrigen").HasMaxLength(50);
            entity.Property(e => e.Activo).HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaExpiracion).HasColumnName("fechaExpiracion");
            entity.Property(e => e.Version).HasColumnName("version").HasDefaultValueSql("'1'");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany().HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_token_proyecto");
        });

        modelBuilder.Entity<InvUsuarioMetadata>(entity =>
        {
            entity.HasKey(e => e.IdMetadata).HasName("PRIMARY");
            entity.ToTable("inv_usuarios_metadata");
            entity.Property(e => e.IdMetadata).HasColumnName("idMetadata");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique().HasDatabaseName("uq_usermeta_uuid");
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
            entity.Property(e => e.OrcidId).HasColumnName("orcidId").HasMaxLength(20);
            // Perfil investigador CACES/SENESCYT
            entity.Property(e => e.ScopusId).HasColumnName("scopusId").HasMaxLength(30);
            entity.Property(e => e.GoogleScholarUrl).HasColumnName("googleScholarUrl").HasMaxLength(255);
            entity.Property(e => e.ResearchGateUrl).HasColumnName("researchGateUrl").HasMaxLength(255);
            entity.Property(e => e.Especialidad).HasColumnName("especialidad").HasColumnType("text");
            entity.Property(e => e.GradoAcademicoMaximo).HasColumnName("gradoAcademicoMaximo").HasMaxLength(100);
            entity.Property(e => e.RutaFirmaP12).HasColumnName("rutaFirmaP12").HasMaxLength(255);
            entity.Property(e => e.RutaFirmaImagen).HasColumnName("rutaFirmaImagen").HasMaxLength(255);
            entity.Property(e => e.FirmaHabilitada).HasColumnName("firmaHabilitada").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
            entity.Property(e => e.Configuracion).HasColumnName("configuracion").HasColumnType("json");
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaUltimoAcceso).HasColumnName("fechaUltimoAcceso");
            entity.Property(e => e.Version).HasColumnName("version").HasDefaultValueSql("'1'");

            entity.HasOne(d => d.User).WithOne()
                .HasPrincipalKey<User>(u => u.IdUsuario)
                .HasForeignKey<InvUsuarioMetadata>(d => d.IdUsuario)
                .HasConstraintName("fk_usermeta_usuario");
        });

        modelBuilder.Entity<InvAuditAdmin>(entity =>
        {
            entity.HasKey(e => e.IdAudit).HasName("PRIMARY");
            entity.ToTable("inv_audit_admin");
            entity.Property(e => e.IdAudit).HasColumnName("idAudit");
            entity.Property(e => e.IdUsuarioAdmin).HasColumnName("idUsuarioAdmin");
            entity.Property(e => e.IdUsuarioAfectado).HasColumnName("idUsuarioAfectado");
            entity.Property(e => e.Accion).HasColumnName("accion").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Detalle).HasColumnName("detalle").HasColumnType("text");
            entity.Property(e => e.IpOrigen).HasColumnName("ipOrigen").HasMaxLength(45);
            entity.Property(e => e.Fecha).HasColumnName("fecha").HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.UserAdmin).WithMany()
                .HasForeignKey(d => d.IdUsuarioAdmin).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_audit_admin");
            entity.HasOne(d => d.UserAfectado).WithMany()
                .HasForeignKey(d => d.IdUsuarioAfectado).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_audit_afectado");
        });

        // ============================================================
        // DIITRA Document Engine Tables
        // ============================================================
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
        });

        // --- DIITRA CoWork Tables ---
        modelBuilder.Entity<InvCoworkDocumento>(entity =>
        {
            entity.HasKey(e => e.IdDocumento);
            entity.ToTable("inv_cowork_documentos");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.Property(e => e.EntidadTipo).HasColumnName("entidadTipo").HasMaxLength(50).IsRequired();
            entity.Property(e => e.EntidadUuid).HasColumnName("entidadUuid").HasMaxLength(36).IsRequired();
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

        modelBuilder.Entity<InvConvocatoriaHito>(entity =>
        {
            entity.HasKey(e => e.IdHito).HasName("PRIMARY");
            entity.ToTable("inv_convocatorias_hitos");
            entity.Property(e => e.IdHito).HasColumnName("idHito");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.IdConvocatoria).HasColumnName("idConvocatoria");
            entity.Property(e => e.NombreHito).HasColumnName("nombreHito").HasMaxLength(150).IsRequired();
            entity.Property(e => e.FechaHito).HasColumnName("fechaHito");
            entity.Property(e => e.EsCritico).HasColumnName("esCritico").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'").HasSentinel(false);
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasMaxLength(255);

            entity.HasOne(d => d.IdConvocatoriaNavigation).WithMany(p => p.Hitos).HasForeignKey(d => d.IdConvocatoria).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_hito_conv");
        });

        modelBuilder.Entity<InvConvocatoriaDocumentoReq>(entity =>
        {
            entity.HasKey(e => e.IdDocReq).HasName("PRIMARY");
            entity.ToTable("inv_convocatorias_documentos_req");
            entity.Property(e => e.IdDocReq).HasColumnName("idDocReq");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.IdConvocatoria).HasColumnName("idConvocatoria");
            entity.Property(e => e.NombreDocumento).HasColumnName("nombreDocumento").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text");
            entity.Property(e => e.EsObligatorio).HasColumnName("esObligatorio").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'").HasSentinel(true);
            entity.Property(e => e.FormatoAceptado).HasColumnName("formatoAceptado").HasMaxLength(50).HasDefaultValueSql("'PDF'");

            entity.HasOne(d => d.IdConvocatoriaNavigation).WithMany(p => p.DocumentosReq).HasForeignKey(d => d.IdConvocatoria).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_docreq_conv");
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
            entity.Property(e => e.IdDocReq).HasColumnName("idDocReq");
            entity.Property(e => e.NombreArchivo).HasColumnName("nombreArchivo").HasMaxLength(255).IsRequired();
            entity.Property(e => e.RutaArchivo).HasColumnName("rutaArchivo").HasMaxLength(512).IsRequired();
            entity.Property(e => e.FechaSubida).HasColumnName("fechaSubida").HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.DocumentosAdjuntos).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_docadj_proyecto");
            entity.HasOne(d => d.IdDocReqNavigation).WithMany(p => p.InvProyectoDocumentosAdjuntos).HasForeignKey(d => d.IdDocReq).OnDelete(DeleteBehavior.SetNull).HasConstraintName("fk_docadj_req");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}






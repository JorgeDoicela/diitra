using Microsoft.EntityFrameworkCore;
using diitra_domain.Identity.Entities;

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

    // --- Sistema y Seguridad ---
    public virtual DbSet<InvNotificacion>       InvNotificaciones      { get; set; }
    public virtual DbSet<AccessToken>           InvTokensAcceso        { get; set; }
    public virtual DbSet<InvUsuarioMetadata>    InvUsuariosMetadata    { get; set; }

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
    public virtual DbSet<ProfesoresDedicacion>     ProfesoresDedicacion     { get; set; } // profesores_dedicacion
    public virtual DbSet<Dedicacion>               Dedicaciones             { get; set; } // dedicacion
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
            entity.Property(e => e.IdProfesor).HasMaxLength(14).HasColumnName("idProfesor");
            entity.Property(e => e.PrimerNombre).HasMaxLength(60).HasColumnName("primerNombre");
            entity.Property(e => e.SegundoNombre).HasMaxLength(60).HasColumnName("segundoNombre");
            entity.Property(e => e.PrimerApellido).HasMaxLength(60).HasColumnName("primerApellido");
            entity.Property(e => e.SegundoApellido).HasMaxLength(60).HasColumnName("segundoApellido");
            entity.Property(e => e.Email).HasMaxLength(100).HasColumnName("email");
            entity.Property(e => e.EmailInstitucional).HasMaxLength(255).HasColumnName("emailInstitucional");
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasColumnName("activo");
            entity.Property(e => e.Clave).HasMaxLength(20).HasColumnName("clave");
            entity.Property(e => e.Titulo).HasMaxLength(200).HasColumnName("titulo");
            entity.Property(e => e.Abreviatura).HasMaxLength(5).HasColumnName("abreviatura");
            
            // Mapeos exactos según DESCRIBE
            entity.Property(e => e.AbreviaturaPost).HasMaxLength(5).HasColumnName("abreviatura_post");
            entity.Property(e => e.FechaIngreso).HasColumnName("fecha_ingreso");
            entity.Property(e => e.FechaNacimiento).HasColumnName("fecha_nacimiento");
            entity.Property(e => e.FechaRetiro).HasColumnName("fecha_retiro");
            entity.Property(e => e.TipoSangre).HasMaxLength(5).HasColumnName("tipoSangre");

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
            entity.Property(e => e.IdAlumno).HasMaxLength(14).HasColumnName("idAlumno");
            entity.Property(e => e.PrimerNombre).HasMaxLength(30).HasColumnName("primerNombre");
            entity.Property(e => e.SegundoNombre).HasMaxLength(30).HasColumnName("segundoNombre");
            entity.Property(e => e.ApellidoPaterno).HasMaxLength(30).HasColumnName("apellidoPaterno");
            entity.Property(e => e.ApellidoMaterno).HasMaxLength(30).HasColumnName("apellidoMaterno");
            entity.Property(e => e.Email).HasMaxLength(40).HasColumnName("email");
            entity.Property(e => e.EmailInstitucional).HasMaxLength(100).HasColumnName("email_institucional");
            entity.Property(e => e.UserAlumno).HasMaxLength(20).HasColumnName("user_alumno");
            entity.Property(e => e.Password).HasMaxLength(20).HasColumnName("password");
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
            entity.Property(e => e.Activo).HasColumnName("activo");
            entity.Property(e => e.EsInstituto).HasColumnType("tinyint(4)").HasColumnName("esInstituto");
            entity.Property(e => e.Periodoactivoinstituto).HasColumnType("tinyint(4)").HasColumnName("periodoactivoinstituto");
            entity.Property(e => e.PeriodoPlanificacion).HasColumnType("tinyint(4)").HasColumnName("periodoPlanificacion");
        });

        modelBuilder.Entity<Carrera>(entity =>
        {
            entity.HasKey(e => e.IdCarrera).HasName("PRIMARY");
            entity.ToTable("carreras");
            entity.Property(e => e.IdCarrera).HasColumnType("int(11)").HasColumnName("idCarrera");
            entity.Property(e => e.Carrera1).HasMaxLength(100).HasColumnName("Carrera");
            entity.Property(e => e.Activa).HasColumnName("activa");
            entity.Property(e => e.CodigoCases).HasMaxLength(20).HasColumnName("codigo_cases");
            entity.Ignore(e => e.Espacios);
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
            entity.Property(e => e.IdMatricula).HasColumnType("int(11)").HasColumnName("idMatricula");
            entity.Property(e => e.IdAlumno).HasMaxLength(14).HasColumnName("idAlumno");
            entity.Property(e => e.IdPeriodo).HasMaxLength(7).IsFixedLength().HasColumnName("idPeriodo");
            entity.Property(e => e.Retirado).HasColumnName("retirado");
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
            entity.Property(e => e.IdAlumno).HasMaxLength(14).HasColumnName("idAlumno");
            entity.Property(e => e.IdCarrera).HasColumnType("int(11)").HasColumnName("idCarrera");
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
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");
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
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");
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
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");
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
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");

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
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");

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
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");
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
            entity.Property(e => e.FinanciamientoExt).HasColumnName("financiamientoExt").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'");
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
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");
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
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
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
            entity.Property(e => e.TieneGrupo).HasColumnName("tieneGrupo").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'");
            entity.Property(e => e.IdTipo).HasColumnName("idTipo");
            entity.Property(e => e.FechaPresentacion).HasColumnName("fechaPresentacion");
            entity.Property(e => e.FechaInicio).HasColumnName("fechaInicio");
            entity.Property(e => e.FechaFin).HasColumnName("fechaFin");
            entity.Property(e => e.TiempoEjecucion).HasColumnName("tiempoEjecucion").HasMaxLength(100);
            entity.Property(e => e.Estado).HasColumnName("estado").HasColumnType("enum('Borrador','Enviado','En Revisión','Aprobado','En Ejecución','Finalizado','Rechazado','Anulado')").HasDefaultValueSql("'Borrador'");
            entity.Property(e => e.PuntajeEvaluacion).HasColumnName("puntajeEvaluacion").HasPrecision(5, 2);
            entity.Property(e => e.ValorEjecucion).HasColumnName("valorEjecucion").HasPrecision(12, 2).HasDefaultValueSql("'0.00'");
            entity.Property(e => e.Activo).HasColumnName("activo").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaModificacion).HasColumnName("fechaModificacion").HasDefaultValueSql("CURRENT_TIMESTAMP").ValueGeneratedOnAddOrUpdate();

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
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
            entity.Property(e => e.EstadoAnterior).HasColumnName("estadoAnterior").HasMaxLength(50).IsRequired();
            entity.Property(e => e.EstadoNuevo).HasColumnName("estadoNuevo").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Observacion).HasColumnName("observacion").HasColumnType("text");
            entity.Property(e => e.FechaTransicion).HasColumnName("fechaTransicion").HasDefaultValueSql("CURRENT_TIMESTAMP");

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
            entity.Property(e => e.IdProfesor).HasColumnName("idProfesor").HasMaxLength(14).IsRequired();
            entity.Property(e => e.EsDirector).HasColumnName("esDirector").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'");
            entity.Property(e => e.Rol).HasColumnName("rol").HasMaxLength(100);
            entity.Property(e => e.NivelAcademico).HasColumnName("nivelAcademico").HasMaxLength(150);
            entity.Property(e => e.Telefono).HasColumnName("telefono").HasMaxLength(20);
            entity.Property(e => e.HorasSemanales).HasColumnName("horasSemanales").HasPrecision(4, 1);

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProyectosProfesores).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pp_proyecto");
            entity.HasOne(d => d.IdProfesorNavigation).WithMany().HasForeignKey(d => d.IdProfesor).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_pp_profesor");
        });

        modelBuilder.Entity<InvProyectoAlumno>(entity =>
        {
            entity.HasKey(e => e.IdProyectoAlumno).HasName("PRIMARY");
            entity.ToTable("inv_proyectos_alumnos");
            entity.Property(e => e.IdProyectoAlumno).HasColumnName("idProyectoAlumno");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.IdAlumno).HasColumnName("idAlumno").HasMaxLength(14).IsRequired();
            entity.Property(e => e.Rol).HasColumnName("rol").HasMaxLength(100);
            entity.Property(e => e.NivelAcademico).HasColumnName("nivelAcademico").HasMaxLength(150);
            entity.Property(e => e.Telefono).HasColumnName("telefono").HasMaxLength(20);

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvProyectosAlumnos).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pa_proyecto");
            entity.HasOne(d => d.IdAlumnoNavigation).WithMany().HasForeignKey(d => d.IdAlumno).OnDelete(DeleteBehavior.Restrict).HasConstraintName("fk_pa_alumno");
        });

        modelBuilder.Entity<InvObjetivoProyecto>(entity =>
        {
            entity.HasKey(e => e.IdObjetivo).HasName("PRIMARY");
            entity.ToTable("inv_objetivos_proyecto");
            entity.Property(e => e.IdObjetivo).HasColumnName("idObjetivo");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.EsGeneral).HasColumnName("esGeneral").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'");
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
            entity.Property(e => e.Cantidad).HasColumnName("cantidad").HasPrecision(10, 2).HasDefaultValueSql("'1'");
            entity.Property(e => e.ValorUnitario).HasColumnName("valorUnitario").HasPrecision(12, 2).IsRequired();
            entity.Property(e => e.ValorTotal).HasColumnName("valorTotal").HasPrecision(12, 2).ValueGeneratedOnAddOrUpdate();

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.InvPresupuestoItems).HasForeignKey(d => d.IdProyecto).OnDelete(DeleteBehavior.Cascade).HasConstraintName("fk_pres_proyecto");
        });

        modelBuilder.Entity<InvFinanciamiento>(entity =>
        {
            entity.HasKey(e => e.IdFinanciamiento).HasName("PRIMARY");
            entity.ToTable("inv_financiamientos");
            entity.Property(e => e.IdFinanciamiento).HasColumnName("idFinanciamiento");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto");
            entity.Property(e => e.EsIstpet).HasColumnName("esIstpet").HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");
            entity.Property(e => e.NombreEmpresa).HasColumnName("nombreEmpresa").HasMaxLength(255);
            entity.Property(e => e.OtrasFuentes).HasColumnName("otrasFuentes").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'");
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
            entity.Property(e => e.EsPatente).HasColumnName("esPatente").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'");
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
            entity.Property(e => e.Completada).HasColumnName("completada").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'");

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
            entity.Property(e => e.EsFirmadoDigital).HasColumnName("esFirmadoDigital").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'");
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

        // ============================================================
        // MÓDULO: IDENTIDAD CENTRALIZADA (SIGAFI CORE)
        // ============================================================

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("usuarios");

            // LLAVE PRIMARIA: idUsuario (INT AUTO_INCREMENT)
            entity.HasKey(e => e.IdUsuario);
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario").ValueGeneratedOnAdd();

            // MAPEO: La propiedad Usuario en C# (login) apunta a la columna idSigafi en la BD (donde está la cédula)
            entity.Property(e => e.Usuario).HasMaxLength(50).HasColumnName("idSigafi");
            
            entity.Property(e => e.Nombre).HasMaxLength(200).HasColumnName("nombre");
            entity.Property(e => e.Contrasenia).HasMaxLength(250).IsRequired().HasColumnName("contrasenia");
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasColumnName("activo").HasDefaultValueSql("'1'");
            entity.Property(e => e.Administrador).HasColumnType("tinyint(4)").HasColumnName("administrador").HasDefaultValueSql("'0'");
            entity.Property(e => e.TablaSigafi).HasColumnType("enum('alumno','profesor','otros')").HasColumnName("tablaSigafi");
            
            // Ignoramos IdSigafi en el mapeo porque ya usamos la propiedad Usuario para la misma columna
            entity.Ignore(e => e.IdSigafi);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.IdRol);
            entity.ToTable("rol");
            entity.Property(e => e.IdRol).HasColumnName("idRol");
            entity.Property(e => e.Nombre).HasMaxLength(255).IsRequired();
            entity.Property(e => e.CodigoRol).HasMaxLength(25).HasColumnName("codigo_rol").IsRequired();
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => e.IdUsuarioRol);
            entity.ToTable("usuario_rol");
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
            entity.ToTable("sistema");
            entity.Property(e => e.IdSistema).HasColumnName("idSistema");
            entity.Property(e => e.Detalle).HasMaxLength(50).IsRequired().HasColumnName("detalle");
        });

        modelBuilder.Entity<IdentityModule>(entity =>
        {
            entity.HasKey(e => e.IdModulos);
            entity.ToTable("modulos");
            entity.Property(e => e.IdModulos).HasColumnName("idModulos");
            entity.Property(e => e.IdSistema).HasColumnName("id_sistema");
            entity.Property(e => e.Nombre).HasMaxLength(255).IsRequired().HasColumnName("Nombre");
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");

            entity.HasOne(d => d.Sistema).WithMany(p => p.Modulos)
                .HasForeignKey(d => d.IdSistema).HasConstraintName("fk_mod_sistema");
        });

        modelBuilder.Entity<IdentityOperation>(entity =>
        {
            entity.HasKey(e => e.IdOperaciones);
            entity.ToTable("operaciones");
            entity.Property(e => e.IdOperaciones).HasColumnName("idOperaciones");
            entity.Property(e => e.NombreOperacion).HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<ModuleOperation>(entity =>
        {
            entity.HasKey(e => e.IdModulosOperaciones);
            entity.ToTable("modulos_operaciones");
            entity.Property(e => e.IdModulosOperaciones).HasColumnName("idModulosOperaciones");
            entity.Property(e => e.IdModulos).HasColumnName("idModulos");
            entity.Property(e => e.IdOperaciones).HasColumnName("idOperaciones");
            entity.Property(e => e.FechaCreacion).HasColumnName("fecha_creacion");
            entity.Property(e => e.FechaModificacion).HasColumnName("fecha_modificacion");
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");

            entity.HasOne(d => d.Module).WithMany(p => p.ModuloOperations)
                .HasForeignKey(d => d.IdModulos).HasConstraintName("fk_mo_mod");
            entity.HasOne(d => d.Operation).WithMany(p => p.ModuloOperations)
                .HasForeignKey(d => d.IdOperaciones).HasConstraintName("fk_mo_oper");
        });

        modelBuilder.Entity<RoleModuleOperation>(entity =>
        {
            entity.HasKey(e => e.IdRolModuloOperacion);
            entity.ToTable("rol_modulo_operacion");
            entity.Property(e => e.IdRolModuloOperacion).HasColumnName("idRolModuloOperacion");
            entity.Property(e => e.IdModulosOperaciones).HasColumnName("idModulosOperaciones");
            entity.Property(e => e.IdRol).HasColumnName("idRol");
            entity.Property(e => e.FechaAsignacion).HasColumnName("fecha_asignacion");
            entity.Property(e => e.FechaModificacion).HasColumnName("fecha_modificacion");
            entity.Property(e => e.FechaDesactivacion).HasColumnName("fecha_desactivacion");
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");
            entity.Property(e => e.UsuarioAsigno).HasMaxLength(150).HasColumnName("usuario_asigno");
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
            entity.Property(e => e.Leido).HasColumnName("leido").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'");
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
            entity.Property(e => e.Activo).HasColumnType("tinyint(1)").HasDefaultValueSql("'1'");
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
            entity.Property(e => e.Especialidad).HasColumnName("especialidad").HasColumnType("text");
            entity.Property(e => e.GradoAcademicoMaximo).HasColumnName("gradoAcademicoMaximo").HasMaxLength(100);
            entity.Property(e => e.RutaFirmaP12).HasColumnName("rutaFirmaP12").HasMaxLength(255);
            entity.Property(e => e.FirmaHabilitada).HasColumnName("firmaHabilitada").HasColumnType("tinyint(1)").HasDefaultValueSql("'0'");
            entity.Property(e => e.Configuracion).HasColumnName("configuracion").HasColumnType("json");
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaUltimoAcceso).HasColumnName("fechaUltimoAcceso");
            entity.Property(e => e.Version).HasColumnName("version").HasDefaultValueSql("'1'");

            entity.HasOne(d => d.User).WithOne()
                .HasPrincipalKey<User>(u => u.IdUsuario)
                .HasForeignKey<InvUsuarioMetadata>(d => d.IdUsuario)
                .HasConstraintName("fk_usermeta_usuario");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}






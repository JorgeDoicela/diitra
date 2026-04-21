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
    // TABLAS NUEVAS Diitra (inv_)
    // Estas son las tuyas, las puedes modificar libremente
    // ============================================================
    public virtual DbSet<InvConvocatoria>     InvConvocatorias    { get; set; }
    public virtual DbSet<InvProyecto>         InvProyectos        { get; set; }
    public virtual DbSet<InvProyectoProfesor> InvProyectosProfesores { get; set; }
    public virtual DbSet<InvProyectoAlumno>   InvProyectosAlumnos { get; set; }
    public virtual DbSet<InvProyectoHistorial>InvProyectosHistorial { get; set; }
    public virtual DbSet<InvNotificacion>     InvNotificaciones   { get; set; }
    public virtual DbSet<InvRevision>         InvRevisiones       { get; set; }
    public virtual DbSet<InvRubrica>          InvRubricas         { get; set; }
    public virtual DbSet<InvRevisionDetalle>  InvRevisionesDetalle { get; set; }
    public virtual DbSet<InvCronogramaTarea>  InvCronograma       { get; set; }
    public virtual DbSet<InvInformeAvance>    InvInformesAvance   { get; set; }
    public virtual DbSet<InvEvidencia>        InvEvidencias       { get; set; }
    public virtual DbSet<InvPresupuestoItem>  InvPresupuestoItems { get; set; }
    public virtual DbSet<InvGasto>            InvGastos           { get; set; }
    public virtual DbSet<InvProducto>         InvProductos        { get; set; }
    public virtual DbSet<InvTransferencia>    InvTransferencias   { get; set; }
    public virtual DbSet<ExternalReviewer>   ExternalReviewers   { get; set; }
    public virtual DbSet<InvestigationInstitute> InvestigationInstitutes { get; set; }
    public virtual DbSet<InvUsuarioMetadata> InvUsuariosMetadata { get; set; }

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
    public virtual DbSet<ModuleOperation>     ModuleOperations      { get; set; }   // modulos_operacion
    public virtual DbSet<RoleModuleOperation> RoleModuleOperations  { get; set; }   // rol_modulo_operacion
    public virtual DbSet<AccessToken>         AccessTokens          { get; set; }   // inv_tokens_acceso

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
        // TABLAS Diitra (inv_) - misma configuración que SigafiEsContext
        // ============================================================
                modelBuilder.Entity<InvLineaInvestigacion>(entity =>
        {
            entity.HasKey(e => e.IdLinea).HasName("PRIMARY");
            entity.ToTable("inv_lineas_investigacion");
            entity.Property(e => e.IdLinea).HasColumnType("int(11)").HasColumnName("idLinea");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.CodigoLinea).HasColumnName("codigoLinea").HasMaxLength(50).IsRequired();
            entity.HasIndex(e => e.CodigoLinea).IsUnique();
            entity.Property(e => e.NombreLinea).HasMaxLength(300).HasColumnName("nombreLinea");
            entity.Property(e => e.Descripcion).HasColumnType("text").HasColumnName("descripcion");
            entity.Property(e => e.ResolucionAprobacion).HasMaxLength(100).HasColumnName("resolucionAprobacion");
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaModificacion).HasColumnName("fechaModificacion").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasDefaultValueSql("'1'").HasColumnName("activo");
        });
        modelBuilder.Entity<InvConvocatoria>(entity =>
        {
            entity.HasKey(e => e.IdConvocatoria).HasName("PRIMARY");
            entity.ToTable("inv_convocatorias").HasCharSet("utf8mb4");
            entity.Property(e => e.IdConvocatoria).HasColumnName("idConvocatoria").HasColumnType("int(11)");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.CodigoConvocatoria).HasColumnName("codigoConvocatoria").HasMaxLength(50).IsRequired();
            entity.HasIndex(e => e.CodigoConvocatoria).IsUnique();
            entity.Property(e => e.Titulo).HasMaxLength(200).HasColumnName("titulo");
            entity.Property(e => e.IdPeriodo).HasMaxLength(7).IsFixedLength().HasColumnName("idPeriodo");
            entity.Property(e => e.Estado).HasColumnType("enum('borrador','abierta','en_revision','cerrada')").HasColumnName("estado");
            entity.Property(e => e.PresupuestoTotal).HasPrecision(10, 2).HasColumnName("presupuestoTotal");
            entity.Property(e => e.UsuarioCreo).HasMaxLength(20).HasColumnName("usuarioCreo");
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaModificacion).HasColumnName("fechaModificacion").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasColumnName("activo");
            entity.HasOne(d => d.IdPeriodoNavigation).WithMany()
                .HasForeignKey(d => d.IdPeriodo).HasConstraintName("fk_inv_conv_periodos");
        });

        modelBuilder.Entity<InvProyecto>(entity =>
        {
            entity.HasKey(e => e.IdProyecto).HasName("PRIMARY");
            entity.ToTable("inv_proyectos").HasCharSet("utf8mb4");
            entity.Property(e => e.IdProyecto).HasColumnName("idProyecto").HasColumnType("int(11)");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.IdConvocatoria).HasColumnName("idConvocatoria").HasColumnType("int(11)");
            entity.Property(e => e.CodigoInstitucional).HasMaxLength(30).HasColumnName("codigoInstitucional");
            entity.Property(e => e.Titulo).HasMaxLength(400).HasColumnName("titulo");
            entity.Property(e => e.IdProfesorDirector).HasMaxLength(14).HasColumnName("idProfesorDirector");
            entity.Property(e => e.Estado).HasColumnType("enum('borrador','enviado','en_revision','aprobado','en_ejecucion','finalizado','rechazado')").HasColumnName("estado");
            entity.Property(e => e.PresupuestoSolicitado).HasPrecision(10, 2).HasColumnName("presupuestoSolicitado");
            entity.Property(e => e.PresupuestoAprobado).HasPrecision(10, 2).HasColumnName("presupuestoAprobado");
            entity.Property(e => e.PuntajeEvaluacion).HasPrecision(5, 2).HasColumnName("puntajeEvaluacion");
            entity.Property(e => e.EsAnonimizado).HasColumnType("tinyint(4)").HasColumnName("esAnonimizado");
            entity.Property(e => e.FechaRegistro).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaModificacion).HasColumnName("fechaModificacion").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasColumnName("activo");
            entity.HasOne(d => d.IdConvocatoriaNavigation).WithMany(p => p.Proyectos)
                .HasForeignKey(d => d.IdConvocatoria).HasConstraintName("fk_inv_proy_conv");
            entity.HasOne(d => d.IdProfesorDirectorNavigation).WithMany()
                .HasForeignKey(d => d.IdProfesorDirector).HasConstraintName("fk_inv_proy_director");
            entity.HasOne(d => d.IdCampoDetalladoUnescoNavigation).WithMany()
                .HasForeignKey(d => d.IdCampoDetalladoUnesco).HasConstraintName("fk_inv_proy_unesco");
            entity.HasOne(d => d.IdEspacioNavigation).WithMany()
                .HasForeignKey(d => d.IdEspacio).HasConstraintName("fk_inv_proy_espacio");
        });

        modelBuilder.Entity<InvProyectoProfesor>(entity =>
        {
            entity.HasKey(e => e.IdProyectoProfesor).HasName("PRIMARY");
            entity.ToTable("inv_proyectos_profesores").HasCharSet("utf8mb4");
            entity.HasIndex(e => new { e.IdProyecto, e.IdProfesor }).IsUnique().HasDatabaseName("uq_proyecto_profesor");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.IdProfesor).HasMaxLength(14).HasColumnName("idProfesor");
            entity.Property(e => e.Rol).HasColumnType("enum('director','coinvestigador','colaborador')").HasColumnName("rol");
            entity.Property(e => e.HorasSemanales).HasPrecision(5, 2).HasColumnName("horasSemanales");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.Profesores)
                .HasForeignKey(d => d.IdProyecto).HasConstraintName("fk_inv_pp_proy");
            entity.HasOne(d => d.IdProfesorNavigation).WithMany()
                .HasForeignKey(d => d.IdProfesor).HasConstraintName("fk_inv_pp_prof");
        });

        modelBuilder.Entity<InvProyectoAlumno>(entity =>
        {
            entity.HasKey(e => e.IdProyectoAlumno).HasName("PRIMARY");
            entity.ToTable("inv_proyectos_alumnos").HasCharSet("utf8mb4");
            entity.HasIndex(e => new { e.IdProyecto, e.IdAlumno }).IsUnique().HasDatabaseName("uq_proyecto_alumno");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.IdAlumno).HasMaxLength(14).HasColumnName("idAlumno");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.Alumnos)
                .HasForeignKey(d => d.IdProyecto).HasConstraintName("fk_inv_pa_proy");
            entity.HasOne(d => d.IdAlumnoNavigation).WithMany()
                .HasForeignKey(d => d.IdAlumno).HasConstraintName("fk_inv_pa_alum");
        });

        modelBuilder.Entity<InvProyectoHistorial>(entity =>
        {
            entity.HasKey(e => e.IdHistorial).HasName("PRIMARY");
            entity.ToTable("inv_proyectos_historial").HasCharSet("utf8mb4");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.EstadoNuevo).HasMaxLength(50).HasColumnName("estadoNuevo");
            entity.Property(e => e.UsuarioCambio).HasMaxLength(20).HasColumnName("usuarioCambio");
            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.Historial)
                .HasForeignKey(d => d.IdProyecto).HasConstraintName("fk_inv_hist_proy");
        });

        modelBuilder.Entity<InvNotificacion>(entity =>
        {
            entity.HasKey(e => e.IdNotificacion).HasName("PRIMARY");
            entity.ToTable("inv_notificaciones").HasCharSet("utf8mb4");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.Destinatario).HasMaxLength(14).HasColumnName("destinatario");
            entity.Property(e => e.Titulo).HasMaxLength(200).HasColumnName("titulo");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
        });

        modelBuilder.Entity<InvRevision>(entity =>
        {
            entity.HasKey(e => e.IdRevision).HasName("PRIMARY");
            entity.ToTable("inv_revisiones").HasCharSet("utf8mb4");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.IdProfesorRevisor).HasMaxLength(14).HasColumnName("idProfesorRevisor");
            entity.Property(e => e.IdRevisorExterno).HasColumnName("idRevisorExterno");
            entity.Property(e => e.Estado).HasColumnType("enum('pendiente','en_proceso','finalizado','rechazado')").HasColumnName("estado");
            entity.Property(e => e.PuntajeTotal).HasPrecision(5, 2).HasColumnName("puntajeTotal");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            
            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.Revisiones)
                .HasForeignKey(d => d.IdProyecto).HasConstraintName("fk_inv_rev_proyecto");
            
            entity.HasOne(d => d.IdProfesorRevisorNavigation).WithMany()
                .HasForeignKey(d => d.IdProfesorRevisor).HasConstraintName("fk_inv_rev_profesor");

            entity.HasOne(d => d.IdRevisorExternoNavigation).WithMany()
                .HasForeignKey(d => d.IdRevisorExterno).HasConstraintName("fk_inv_rev_ext");
        });

        modelBuilder.Entity<ExternalReviewer>(entity =>
        {
            entity.HasKey(e => e.IdRevisorExterno);
            entity.ToTable("inv_revisores_externos");
            entity.Property(e => e.IdRevisorExterno).HasColumnName("idRevisorExterno");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.IdInstitucion).HasColumnName("idInstitucion");
            entity.Property(e => e.Nombre).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Apellido).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();

            entity.HasOne(d => d.Institute)
                .WithMany(p => p.ExternalReviewers)
                .HasForeignKey(d => d.IdInstitucion)
                .HasConstraintName("fk_inv_ext_inst");
        });

        modelBuilder.Entity<InvestigationInstitute>(entity =>
        {
            entity.HasKey(e => e.IdInstitucion);
            entity.ToTable("inv_institutos");
            entity.Property(e => e.IdInstitucion).HasColumnName("idInstitucion");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.Property(e => e.IdInstitucion).HasColumnName("idInstitucion");
            entity.Property(e => e.Nombre).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Siglas).HasMaxLength(20);
            entity.Property(e => e.Ruc).HasMaxLength(20);
            entity.Property(e => e.Tipo).HasColumnType("enum('Publica', 'Privada', 'Internacional', 'Organismo')").HasDefaultValue("Publica");
            entity.Property(e => e.Pais).HasMaxLength(100);
            entity.Property(e => e.Ciudad).HasMaxLength(100);
            entity.Property(e => e.SitioWeb).HasMaxLength(250);
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)");
        });

        modelBuilder.Entity<InvRubrica>(entity =>
        {
            entity.HasKey(e => e.IdRubrica).HasName("PRIMARY");
            entity.ToTable("inv_rubricas").HasCharSet("utf8mb4");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.Criterio).HasMaxLength(200).HasColumnName("criterio");
            entity.Property(e => e.PuntajeMax).HasPrecision(5, 2).HasColumnName("puntajeMax");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
        });

        modelBuilder.Entity<InvRevisionDetalle>(entity =>
        {
            entity.HasKey(e => e.IdDetalleRevision).HasName("PRIMARY");
            entity.ToTable("inv_revisiones_detalle").HasCharSet("utf8mb4");
            entity.HasIndex(e => new { e.IdRevision, e.IdRubrica }).IsUnique().HasDatabaseName("uq_revision_rubrica");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.Puntaje).HasPrecision(5, 2).HasColumnName("puntaje");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.HasOne(d => d.IdRevisionNavigation).WithMany(p => p.Detalles)
                .HasForeignKey(d => d.IdRevision).HasConstraintName("fk_inv_rd_rev");
            entity.HasOne(d => d.IdRubricaNavigation).WithMany(p => p.Detalles)
                .HasForeignKey(d => d.IdRubrica).HasConstraintName("fk_inv_rd_rub");
        });

        modelBuilder.Entity<InvCronogramaTarea>(entity =>
        {
            entity.HasKey(e => e.IdTarea).HasName("PRIMARY");
            entity.ToTable("inv_cronograma").HasCharSet("utf8mb4");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.NombreTarea).HasMaxLength(300).HasColumnName("nombreTarea");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.Cronograma)
                .HasForeignKey(d => d.IdProyecto).HasConstraintName("fk_inv_cron_proyecto");
        });

        modelBuilder.Entity<InvInformeAvance>(entity =>
        {
            entity.HasKey(e => e.IdInforme).HasName("PRIMARY");
            entity.ToTable("inv_informes_avance").HasCharSet("utf8mb4");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.IdProfesor).HasMaxLength(14).HasColumnName("idProfesor");
            entity.Property(e => e.Titulo).HasMaxLength(200).HasColumnName("titulo");
            entity.Property(e => e.Estado).HasColumnType("enum('borrador','enviado','revisado','aprobado')").HasColumnName("estado");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.Informes)
                .HasForeignKey(d => d.IdProyecto).HasConstraintName("fk_inv_ia_proyecto");
            entity.HasOne(d => d.IdProfesorNavigation).WithMany()
                .HasForeignKey(d => d.IdProfesor).HasConstraintName("fk_inv_ia_profesor");
        });

        modelBuilder.Entity<InvEvidencia>(entity =>
        {
            entity.HasKey(e => e.IdEvidencia).HasName("PRIMARY");
            entity.ToTable("inv_evidencias").HasCharSet("utf8mb4");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.NombreArchivo).HasMaxLength(300).HasColumnName("nombreArchivo");
            entity.Property(e => e.RutaArchivo).HasMaxLength(500).HasColumnName("rutaArchivo");
            entity.Property(e => e.TipoEvidencia).HasColumnType("enum('foto','factura','bitacora','otro')").HasColumnName("tipoEvidencia");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.HasOne(d => d.IdInformeNavigation).WithMany(p => p.Evidencias)
                .HasForeignKey(d => d.IdInforme).HasConstraintName("fk_inv_ev_inf");
        });

        modelBuilder.Entity<InvPresupuestoItem>(entity =>
        {
            entity.HasKey(e => e.IdItem).HasName("PRIMARY");
            entity.ToTable("inv_presupuesto_items").HasCharSet("utf8mb4");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.Categoria).HasColumnType("enum('materiales','equipos','servicios','viajes','publicacion','otro')").HasColumnName("categoria");
            entity.Property(e => e.Cantidad).HasPrecision(10, 2).HasColumnName("cantidad");
            entity.Property(e => e.ValorUnitario).HasPrecision(10, 2).HasColumnName("valorUnitario");
            entity.Property(e => e.ValorTotal).HasPrecision(10, 2).HasColumnName("valorTotal");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.PresupuestoItems)
                .HasForeignKey(d => d.IdProyecto).HasConstraintName("fk_inv_pi_proy");
        });

        modelBuilder.Entity<InvGasto>(entity =>
        {
            entity.HasKey(e => e.IdGasto).HasName("PRIMARY");
            entity.ToTable("inv_gastos").HasCharSet("utf8mb4");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.Monto).HasPrecision(10, 2).HasColumnName("monto");
            entity.Property(e => e.RegistradoPor).HasMaxLength(14).HasColumnName("registradoPor");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.Gastos)
                .HasForeignKey(d => d.IdProyecto).HasConstraintName("fk_inv_ga_proyecto");
            entity.HasOne(d => d.IdItemNavigation).WithMany(p => p.Gastos)
                .HasForeignKey(d => d.IdItem).HasConstraintName("fk_inv_ga_item");
            entity.HasOne(d => d.RegistradoPorNavigation).WithMany()
                .HasForeignKey(d => d.RegistradoPor).HasConstraintName("fk_inv_ga_registro");
        });

        modelBuilder.Entity<InvProducto>(entity =>
        {
            entity.HasKey(e => e.IdProducto).HasName("PRIMARY");
            entity.ToTable("inv_productos").HasCharSet("utf8mb4");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.Titulo).HasMaxLength(500).HasColumnName("titulo");
            entity.Property(e => e.IssnIsbn).HasMaxLength(50).HasColumnName("issn_isbn");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.Productos)
                .HasForeignKey(d => d.IdProyecto).HasConstraintName("fk_inv_prod_proy");
        });

        modelBuilder.Entity<InvTransferencia>(entity =>
        {
            entity.HasKey(e => e.IdTransferencia).HasName("PRIMARY");
            entity.ToTable("inv_transferencias").HasCharSet("utf8mb4");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.EmpresaBeneficiaria).HasMaxLength(300).HasColumnName("empresaBeneficiaria");
            entity.Property(e => e.ValorConvenio).HasPrecision(10, 2).HasColumnName("valorConvenio");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.Transferencias)
                .HasForeignKey(d => d.IdProyecto).HasConstraintName("fk_inv_trans_proy");
        });

        // ============================================================
        // MÓDULO: IDENTIDAD CENTRALIZADA (SIGAFI CORE)
        // ============================================================

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("usuarios");

            // LLAVE COMPUESTA: idUsuario + usuario (Alineación exacta con ERD v2.0)
            entity.HasKey(e => new { e.IdUsuario, e.Usuario });

            // LLAVE ALTERNA: Fundamental para que las FKs a idUsuario funcionen en EF Core
            entity.HasAlternateKey(e => e.IdUsuario);

            entity.HasIndex(e => e.IdSigafi, "idSigafi_UNIQUE").IsUnique();
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario").ValueGeneratedOnAdd();
            entity.Property(e => e.Usuario).HasMaxLength(50).HasColumnName("usuario");
            entity.Property(e => e.Nombre).HasMaxLength(200).IsRequired().HasColumnName("nombre");
            entity.Property(e => e.Contrasenia).HasMaxLength(250).IsRequired().HasColumnName("contrasenia");
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)").HasColumnName("activo");
            entity.Property(e => e.Administrador).HasColumnType("tinyint(4)").HasColumnName("administrador");
            entity.Property(e => e.TipoUsuario).HasColumnType("enum('alumno','profesor','otros')").HasColumnName("tipoUsuario");
            entity.Property(e => e.IdSigafi).HasMaxLength(14).HasColumnName("idSigafi");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.IdRol);
            entity.ToTable("roles");
            entity.Property(e => e.IdRol).HasColumnName("idRol");
            entity.Property(e => e.Nombre).HasMaxLength(255).IsRequired();
            entity.Property(e => e.CodigoRol).HasMaxLength(50).HasColumnName("codigo_rol").IsRequired();
            entity.Property(e => e.EsActivo).HasColumnType("tinyint(4)").HasColumnName("esActivo");
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => e.IdUsuarioRol);
            entity.ToTable("usuarios_roles");
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
            entity.ToTable("sistemas");
            entity.Property(e => e.IdSistema).HasColumnName("idSistema");
            entity.Property(e => e.Detalle).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<IdentityModule>(entity =>
        {
            entity.HasKey(e => e.IdModulos);
            entity.ToTable("modulos");
            entity.Property(e => e.IdModulos).HasColumnName("idModulos");
            entity.Property(e => e.IdSistema).HasColumnName("id_sistema");
            entity.Property(e => e.Nombre).HasMaxLength(255).IsRequired();
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
            entity.ToTable("roles_modulos_operaciones");
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

        modelBuilder.Entity<AccessToken>(entity =>
        {
            entity.HasKey(e => e.IdToken);
            entity.ToTable("inv_tokens_acceso");
            entity.Property(e => e.IdToken).HasColumnName("idToken");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.Token).HasMaxLength(256).IsRequired();
            entity.Property(e => e.IdReferencia).HasMaxLength(20).IsRequired();
            entity.Property(e => e.TipoReferencia).HasColumnType("enum('profesor', 'externo')").IsRequired();
            entity.Property(e => e.FechaCreacion).HasColumnName("fechaRegistro").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.FechaExpiracion).IsRequired();
            entity.Property(e => e.Usado).HasColumnType("tinyint(4)");
            entity.Property(e => e.Scopes).HasMaxLength(200);
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            entity.Property(e => e.Activo).HasColumnType("tinyint(4)");
        });
        
        modelBuilder.Entity<InvUsuarioMetadata>(entity =>
        {
            entity.HasKey(e => e.IdMetadata).HasName("PRIMARY");
            entity.ToTable("inv_usuarios_metadata");
            entity.Property(e => e.IdMetadata).HasColumnName("idMetadata");
            entity.Property(e => e.Uuid).HasColumnName("uuid").HasMaxLength(36).IsRequired();
            entity.HasIndex(e => e.Uuid).IsUnique();
            entity.Property(e => e.IdUsuario).HasColumnName("idUsuario");
            entity.Property(e => e.Version).HasColumnName("version").IsConcurrencyToken();
            
            entity.HasOne(d => d.User).WithOne(u => u.InvUsuarioMetadata)
                .HasPrincipalKey<User>(u => u.IdUsuario)
                .HasForeignKey<InvUsuarioMetadata>(d => d.IdUsuario)
                .HasConstraintName("fk_inv_meta_usuario");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}






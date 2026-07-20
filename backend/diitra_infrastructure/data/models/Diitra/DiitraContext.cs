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
    public virtual DbSet<InvProyectoParticipante> InvProyectoParticipantes { get; set; }
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
    public virtual DbSet<InvCronograma>         InvCronogramas         { get; set; }
    public virtual DbSet<InvBibliografiaProyecto> InvBibliografiasProyecto { get; set; }
    public virtual DbSet<InvInformeAvance>      InvInformesAvance      { get; set; }
    public virtual DbSet<InvEvidencia>          InvEvidencias          { get; set; }
    public virtual DbSet<InvGasto>              InvGastos              { get; set; }
    public virtual DbSet<InvTransferencia>      InvTransferencias      { get; set; }
    public virtual DbSet<InvTrazabilidadProyecto> InvTrazabilidadProyectos { get; set; }
    public virtual DbSet<InvConfigWorkflow> InvConfigWorkflows { get; set; }
    public virtual DbSet<InvDocumentoSeccionMetadata> InvDocumentosSeccionesMetadata { get; set; }
    public virtual DbSet<InvCollaborationComment> InvCollaborationComments { get; set; }
    public virtual DbSet<InvRevisionesPares>      InvRevisionesPares      { get; set; }
    public virtual DbSet<InvEvaluacionesDetalle>  InvEvaluacionesDetalle  { get; set; }
    public virtual DbSet<InvPndObjetivo>               InvPndObjetivos              { get; set; }
    public virtual DbSet<InvProyectoMml>               InvProyectosMml               { get; set; }
    public virtual DbSet<InvProyectoDocumentoAdjunto>  InvProyectosDocumentosAdjuntos { get; set; }

    // --- Sistema y Seguridad ---
    public virtual DbSet<InvNotificacion>       InvNotificaciones      { get; set; }
    public virtual DbSet<InvEmailTemplate>     InvEmailTemplates      { get; set; }
    public virtual DbSet<InvEmailHistorial>    InvEmailHistorials     { get; set; }
    public virtual DbSet<AccessToken>           InvTokensAcceso        { get; set; }
    public virtual DbSet<InvUsuarioMetadata>    InvUsuariosMetadata    { get; set; }
    public virtual DbSet<InvLopdpConsentimiento> InvLopdpConsentimientos { get; set; }
    public virtual DbSet<InvLopdpAuditoriaDatos> InvLopdpAuditoriaDatos  { get; set; }
    public virtual DbSet<InvAuditAdmin>       InvAuditAdmin          { get; set; }
    public virtual DbSet<InvDispositivoToken> InvDispositivosTokens   { get; set; }
    public virtual DbSet<InvMagicLink>        InvMagicLinks          { get; set; }
    public virtual DbSet<InvConfigGeneral>    InvConfigsGenerales    { get; set; }
    public virtual DbSet<InvBackupLog>        InvBackupLogs          { get; set; }

    public virtual DbSet<InvCatTipoProducto>   InvCatTipoProductos    { get; set; }
    public virtual DbSet<InvCatTipoEvidencia>  InvCatTipoEvidencias   { get; set; }
    public virtual DbSet<InvEntidadExterna>    InvEntidadesExternas   { get; set; }
    public virtual DbSet<InvConfigIndicador>   InvConfigIndicadores   { get; set; }
    public virtual DbSet<InvRubricaCriterio>   InvRubricaCriterios    { get; set; }
    public virtual DbSet<InvProyectoExtension> InvProyectoExtensions { get; set; }

    // --- Módulo Calendario ---
    public virtual DbSet<InvCalendarioEventoNormativo>  InvCalendarioEventosNormativos  { get; set; }
    public virtual DbSet<InvIcalToken>                  InvIcalTokens                   { get; set; }
    public virtual DbSet<InvCalendarioAlertaEnviada>    InvCalendarioAlertasEnviadas    { get; set; }

    // --- DIITRA Document Engine (Persistence & Audit) ---
    public virtual DbSet<Diitra.Domain.Common.Documents.DocumentTemplate> DocumentTemplates { get; set; }
    public virtual DbSet<Diitra.Domain.Common.Documents.DocumentInstance> DocumentInstances { get; set; }
    public virtual DbSet<Diitra.Domain.Common.Documents.DocumentAuditEntry> DocumentAuditEntries { get; set; }

    // --- DIITRA Firma (Módulo de Firma Digital Institucional) ---
    public virtual DbSet<InvDocumentoFirma>       InvDocumentoFirmas       { get; set; }
    public virtual DbSet<InvUserSignaturePerfil>  InvUserSignaturePerfiles { get; set; }
    public virtual DbSet<CargoInstituto>          CargosInstituto          { get; set; }

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
        optionsBuilder.ConfigureWarnings(warnings => 
            warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.PossibleIncorrectRequiredNavigationWithQueryFilterInteractionWarning));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InvProyecto>().HasQueryFilter(p => p.Eliminado != true);
        modelBuilder.Entity<InvConvocatoria>().HasQueryFilter(c => c.Eliminado != true);
        modelBuilder.Entity<InvGrupoInvestigacion>().HasQueryFilter(g => g.Eliminado != true);

        // Modularización de Fluent API mediante clases parciales
        OnModelCreatingSigafi(modelBuilder);
        OnModelCreatingIdentity(modelBuilder);
        OnModelCreatingDiitra(modelBuilder);

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingSigafi(ModelBuilder modelBuilder);
    partial void OnModelCreatingIdentity(ModelBuilder modelBuilder);
    partial void OnModelCreatingDiitra(ModelBuilder modelBuilder);
    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}

namespace diitra_domain.Identity.Enums;

public static class Permissions
{
    // Módulo de Investigación y Proyectos
    public const string CrearProyecto = "PROYECTOS:CREAR";
    public const string PostularProyecto = "PROYECTOS:POSTULAR";
    public const string LiderarEquipo = "PROYECTOS:EDITAR"; // Reutilizamos operaciones base
    public const string GestionarPresupuesto = "PROYECTOS:GESTIONAR";
    public const string DescargarCertificados = "PROYECTOS:REPORTES";
    public const string RegistrarBitacora = "PROYECTOS:EDITAR";
    
    // Módulo de Seguimiento
    public const string SubirInformeAvance = "PROYECTOS:EDITAR";
    public const string RegistrarProducto = "PROYECTOS:EDITAR";
    
    // Gestión Departamental (Director / Admin)
    public const string CrearConvocatoria = "CONVOCATORIAS:CREAR";
    public const string DecidirProyecto = "PROYECTOS:APROBAR";
    public const string AsignarRevisores = "PROYECTOS:ASIGNAR";
    public const string SupervisarGlobal = "CONFIGURACION:VER";
    public const string FirmarDigitalmente = "PROYECTOS:APROBAR";
    public const string GenerarReporteCaces = "CONFIGURACION:REPORTES";
    
    // Evaluación por Pares (Revisores)
    public const string AccederAnonimo = "PROYECTOS:VER";
    public const string CompletarRubrica = "PROYECTOS:EDITAR";
    public const string EmitirDictamen = "PROYECTOS:APROBAR";
    
    // Administración y TI
    public const string GestionarUsuarios = "USUARIOS:VER";
    public const string ConfigurarPeriodos = "CONFIGURACION:EDITAR";
    public const string GestionarRespaldos = "CONFIGURACION:EDITAR";
}

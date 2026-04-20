namespace diitra_domain.Identity.Enums;

public static class Permissions
{
    // Módulo de Investigación y Proyectos
    public const string CrearProyecto = "PROYECTO_CREAR";
    public const string PostularProyecto = "PROYECTO_POSTULAR";
    public const string LiderarEquipo = "PROYECTO_LIDERAR";
    public const string GestionarPresupuesto = "PRESUPUESTO_GESTIONAR";
    public const string DescargarCertificados = "CERTIFICADOS_DESCARGAR";
    public const string RegistrarBitacora = "BITACORA_REGISTRAR";
    
    // Módulo de Seguimiento
    public const string SubirInformeAvance = "INFORME_SUBIR";
    public const string RegistrarProducto = "PRODUCTO_REGISTRAR";
    
    // Gestión Departamental (Director)
    public const string CrearConvocatoria = "CONVOCATORIA_CREAR";
    public const string DecidirProyecto = "PROYECTO_DECIDIR"; // Aprobar/Rechazar
    public const string AsignarRevisores = "REVISOR_ASIGNAR";
    public const string SupervisarGlobal = "PRESUPUESTO_GLOBAL";
    public const string FirmarDigitalmente = "FIRMA_ELECTRONICA";
    public const string GenerarReporteCaces = "REPORTE_CACES";
    
    // Evaluación por Pares (Revisores)
    public const string AccederAnonimo = "EVALUACION_ACCEDER_ANONIMO";
    public const string CompletarRubrica = "RUBRICA_COMPLETAR";
    public const string EmitirDictamen = "EVALUACION_DICTAMEN";
    
    // Administración y TI
    public const string GestionarUsuarios = "SISTEMA_USUARIOS";
    public const string ConfigurarPeriodos = "SISTEMA_PERIODOS";
    public const string GestionarRespaldos = "SISTEMA_BACKUP";
}

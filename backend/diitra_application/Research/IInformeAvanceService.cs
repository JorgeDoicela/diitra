using System.Collections.Generic;
using System.Threading.Tasks;
using diitra_application.Research.Dtos;

namespace diitra_application.Research;

/// <summary>
/// Gestiona el ciclo de vida completo de los Informes de Avance de proyectos de investigación.
/// Incluye creación por parte del Director de Proyecto, validación/observación por el
/// Departamento de Investigación y firma digital electrónica.
/// </summary>
public interface IInformeAvanceService
{
    /// <summary>Obtiene un informe por su ID.</summary>
    Task<InformeAvanceDto?> GetByIdAsync(int id);

    /// <summary>Obtiene todos los informes de un proyecto ordenados por número.</summary>
    Task<IEnumerable<InformeAvanceDto>> GetByProjectAsync(int projectId);

    /// <summary>
    /// Crea un nuevo informe de avance para el proyecto indicado.
    /// El número de informe se asigna automáticamente (correlativo dentro del proyecto).
    /// </summary>
    Task<InformeAvanceDto> CreateAsync(CreateInformeAvanceDto dto, int directorId);

    /// <summary>
    /// Aprueba el informe. Solo el Director de Investigación puede ejecutar esta acción.
    /// Cambia el estado de "Pendiente" a "Aprobado".
    /// </summary>
    Task<InformeAvanceDto?> AprobarAsync(int id, int directorInvestigacionId);

    /// <summary>
    /// Observa el informe, solicitando correcciones. Cambia el estado a "Observado".
    /// </summary>
    Task<InformeAvanceDto?> ObservarAsync(int id, string observacion, int directorInvestigacionId);

    /// <summary>
    /// Aplica firma digital avanzada (PAdES) al informe usando el certificado PKCS#12 proporcionado.
    /// Calcula y persiste el hash de la firma para trazabilidad.
    /// </summary>
    Task<bool> FirmarDigitalmenteAsync(int id, byte[] certificateData, string password);
}

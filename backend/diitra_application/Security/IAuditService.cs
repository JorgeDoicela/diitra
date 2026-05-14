using System.Threading.Tasks;

namespace diitra_application.Security
{
    public interface IAuditService
    {
        /// <summary>
        /// Registra una acción administrativa o de usuario en el log de auditoría.
        /// </summary>
        /// <param name="affectedUserId">ID del usuario afectado por la acción (opcional).</param>
        /// <param name="action">Código de la acción (ej: LOGIN, ASIGNAR_ROL).</param>
        /// <param name="details">Descripción detallada de lo sucedido.</param>
        /// <param name="modulo">Módulo donde ocurre la acción (ej: SEGURIDAD, PROYECTOS).</param>
        /// <param name="before">Estado anterior (JSON opcional).</param>
        /// <param name="after">Estado nuevo (JSON opcional).</param>
        Task LogActionAsync(int? affectedUserId, string action, string details, string? modulo = null, string? before = null, string? after = null);
    }
}

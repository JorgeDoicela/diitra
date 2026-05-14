using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    /// <summary>
    /// CONTROLADOR DE COORDINACIÓN (Team Pulse)
    /// Maneja el estado inicial de la colaboración antes de entrar al flujo SignalR.
    /// </summary>
    [ApiController]
    [Route("api/collaboration")]
    public class CollaborationController : ControllerBase
    {
        private readonly DiitraContext _db;

        public CollaborationController(DiitraContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Obtiene el pulso actual del documento (comentarios y estados de sección).
        /// </summary>
        [HttpGet("{instanceUuid}/pulse")]
        public async Task<IActionResult> GetPulse(string instanceUuid)
        {
            var comments = await _db.InvCollaborationComments
                .Where(c => c.DocumentoUuid == instanceUuid)
                .OrderByDescending(c => c.CreadoEn)
                .Take(50)
                .ToListAsync();

            var statuses = await _db.InvDocumentosSeccionesMetadata
                .Where(s => s.DocumentoUuid == instanceUuid)
                .Select(s => new { s.SeccionNombre, s.Estado })
                .ToListAsync();

            // Convertir estados a diccionario para fácil consumo en frontend
            var statusesDict = statuses.ToDictionary(s => s.SeccionNombre, s => s.Estado);

            return Ok(new { 
                comments, 
                statuses = statusesDict 
            });
        }
    }
}

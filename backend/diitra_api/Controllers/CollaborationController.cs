using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using diitra_infrastructure.data.models;
using diitra_infrastructure.data.models.Cowork;
using System.Collections.Generic;

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
            try 
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

                // Evitar errores de claves duplicadas si por alguna razón la BD tiene inconsistencias
                var statusesDict = statuses
                    .GroupBy(s => s.SeccionNombre)
                    .ToDictionary(g => g.Key, g => g.First().Estado);

                return Ok(new { 
                    comments = comments, 
                    statuses = statusesDict 
                });
            }
            catch (System.Exception ex)
            {
                // Loguear el error para que sea visible en la consola del backend
                System.Console.WriteLine($"[DIITRA ERROR] Error en GetPulse para {instanceUuid}: {ex.Message}");
                return StatusCode(500, new { message = "Error interno al cargar el pulso de colaboración", detail = ex.Message });
            }
        }
    }
}

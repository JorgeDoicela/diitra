using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;
using Diitra.Application.Research;

namespace Diitra.Infrastructure.Research
{
    public class WorkflowEngineService : IWorkflowEngineService
    {
        private readonly DiitraContext _context;

        public WorkflowEngineService(DiitraContext context)
        {
            _context = context;
        }

        public async Task<bool> TransicionarEstadoAsync(string proyectoUuid, string nuevoEstado, int idUsuario, string observacion)
        {
            var proyecto = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == proyectoUuid);
            if (proyecto == null) return false;

            string estadoAnterior = proyecto.Estado;

            // 1. Validación Dinámica vía Base de Datos (Configurable)
            var esValida = await _context.InvConfigWorkflows
                .AnyAsync(w => w.Activo && 
                               w.EstadoOrigen == estadoAnterior && 
                               w.EstadoDestino == nuevoEstado &&
                               (w.IdTipoProyecto == null || w.IdTipoProyecto == proyecto.IdTipo));

            if (!esValida)
            {
                throw new InvalidOperationException($"La transición {estadoAnterior} -> {nuevoEstado} no está permitida por la normativa vigente para este tipo de proyecto.");
            }

            // 2. Ejecutar Transición
            proyecto.Estado = nuevoEstado;
            proyecto.FechaModificacion = DateTime.Now;

            // 3. Registrar Trazabilidad Inmutable (Audit Trail para CACES)
            var ultimaTransicion = await _context.InvTrazabilidadProyectos
                .Where(t => t.IdProyecto == proyecto.IdProyecto)
                .OrderByDescending(t => t.FechaTransicion)
                .FirstOrDefaultAsync();

            var trazabilidad = new InvTrazabilidadProyecto
            {
                Uuid = Guid.NewGuid().ToString(),
                IdProyecto = proyecto.IdProyecto,
                IdUsuario = idUsuario,
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = nuevoEstado,
                Observacion = observacion,
                FechaTransicion = DateTime.Now,
                HashAnterior = ultimaTransicion?.HashActual
            };

            // Calcular el hash de esta entrada (Sello de Integridad)
            string dataToHash = $"{trazabilidad.Uuid}|{trazabilidad.IdProyecto}|{trazabilidad.EstadoNuevo}|{trazabilidad.HashAnterior}|{trazabilidad.FechaTransicion}";
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(dataToHash));
                trazabilidad.HashActual = Convert.ToHexString(bytes).ToLower();
            }

            _context.InvTrazabilidadProyectos.Add(trazabilidad);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<System.Collections.Generic.IEnumerable<object>> GetTrazabilidadAsync(string proyectoUuid)
        {
            return await _context.InvTrazabilidadProyectos
                .Where(t => t.IdProyectoNavigation.Uuid == proyectoUuid)
                .OrderByDescending(t => t.FechaTransicion)
                .Select(t => new {
                    t.EstadoNuevo,
                    t.FechaTransicion,
                    t.HashActual,
                    t.Observacion
                })
                .ToListAsync();
        }
    }
}

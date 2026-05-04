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

            // 1. Reglas estrictas de la Máquina de Estados (State Machine)
            if (!EsTransicionValida(estadoAnterior, nuevoEstado))
            {
                throw new InvalidOperationException($"Transición inválida de estado: {estadoAnterior} -> {nuevoEstado}");
            }

            // 2. Ejecutar Transición
            proyecto.Estado = nuevoEstado;
            proyecto.FechaModificacion = DateTime.Now;

            // 3. Registrar Trazabilidad Inmutable (Audit Trail para CACES)
            var trazabilidad = new InvTrazabilidadProyecto
            {
                Uuid = Guid.NewGuid().ToString(),
                IdProyecto = proyecto.IdProyecto,
                IdUsuario = idUsuario,
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = nuevoEstado,
                Observacion = observacion,
                FechaTransicion = DateTime.Now
            };

            _context.InvTrazabilidadProyectos.Add(trazabilidad);
            await _context.SaveChangesAsync();

            return true;
        }

        private bool EsTransicionValida(string actual, string nuevo)
        {
            // Reglas de negocio CACES
            return (actual, nuevo) switch
            {
                ("Borrador", "Enviado") => true,
                ("Enviado", "En Revisión") => true,
                ("En Revisión", "Corregir") => true,
                ("Corregir", "En Revisión") => true,
                ("En Revisión", "Aprobado") => true,
                ("En Revisión", "Rechazado") => true,
                ("Aprobado", "En Ejecución") => true,
                ("En Ejecución", "Finalizado") => true,
                _ => false
            };
        }
    }
}

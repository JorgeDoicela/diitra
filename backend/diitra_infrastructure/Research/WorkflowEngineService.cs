using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;
using Diitra.Application.Research;
using diitra_application.Security;
using diitra_application.Common.Notifications;

namespace Diitra.Infrastructure.Research
{
    public class WorkflowEngineService : IWorkflowEngineService
    {
        private readonly DiitraContext _context;
        private readonly IAuditService _auditService;
        private readonly INotificationService _notificationService;

        public WorkflowEngineService(DiitraContext context, IAuditService auditService, INotificationService notificationService)
        {
            _context = context;
            _auditService = auditService;
            _notificationService = notificationService;
        }

        public async Task<bool> TransicionarEstadoAsync(string proyectoUuid, string nuevoEstado, int idUsuario, string observacion)
        {
            var proyecto = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == proyectoUuid);
            if (proyecto == null) return false;

            string estadoAnterior = proyecto.Estado;

            var beforeState = new
            {
                Titulo = proyecto.Titulo,
                CodigoInstitucional = proyecto.CodigoInstitucional,
                Estado = proyecto.Estado,
                FechaModificacion = proyecto.FechaModificacion
            };
            string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

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

            // 1.1 Validación de Reglas de Convocatoria (CACES & SENESCYT Compliance)
            if (nuevoEstado == "Enviado" && proyecto.IdConvocatoria.HasValue)
            {
                var convocatoria = await _context.InvConvocatorias
                    .Include(c => c.Lineas)
                    .FirstOrDefaultAsync(c => c.IdConvocatoria == proyecto.IdConvocatoria.Value);

                if (convocatoria != null)
                {
                    // A. Validación de Fechas de Cierre
                    var hoy = DateOnly.FromDateTime(DateTime.Today);
                    if (hoy > convocatoria.FechaCierre)
                    {
                        throw new InvalidOperationException($"No es posible enviar la postulación. La convocatoria '{convocatoria.Titulo}' cerró el {convocatoria.FechaCierre:dd/MM/yyyy}.");
                    }
                    if (hoy < convocatoria.FechaApertura)
                    {
                        throw new InvalidOperationException($"No es posible enviar la postulación. La convocatoria '{convocatoria.Titulo}' abre el {convocatoria.FechaApertura:dd/MM/yyyy}.");
                    }

                    // B. Validación de Presupuesto Máximo
                    var totalPresupuesto = await _context.InvPresupuestoItems
                        .Where(i => i.IdProyecto == proyecto.IdProyecto)
                        .SumAsync(i => (decimal?)(i.ValorUnitario * i.Cantidad)) ?? 0;

                    var topeProyectoEfectivo = convocatoria.MontoMaximoProyecto ?? convocatoria.PresupuestoTotal;
                    if (topeProyectoEfectivo.HasValue && topeProyectoEfectivo.Value > 0 && totalPresupuesto > topeProyectoEfectivo.Value)
                    {
                        throw new InvalidOperationException($"El presupuesto total del proyecto (${totalPresupuesto:N2}) excede el tope por proyecto permitido para esta convocatoria (${topeProyectoEfectivo.Value:N2}).");
                    }

                    // C. Validación de al menos un Investigador
                    var totalInvestigadores = await _context.InvProyectosProfesores.CountAsync(p => p.IdProyecto == proyecto.IdProyecto)
                                            + await _context.InvProyectosAlumnos.CountAsync(a => a.IdProyecto == proyecto.IdProyecto);
                    if (totalInvestigadores == 0)
                    {
                        throw new InvalidOperationException("No es posible enviar la propuesta. Debe registrar al menos un investigador en el equipo humano.");
                    }
                }
            }

            // 1.2 Validación de Carga Horaria para Docentes (CACES Compliance)
            if (nuevoEstado == "Enviado")
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var currentPeriod = await _context.Periodos
                    .Where(p => p.EsInstituto == 1)
                    .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                    .ThenByDescending(p => p.Activo == true)
                    .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                    .ThenByDescending(p => p.FechaInicial)
                    .FirstOrDefaultAsync();

                if (currentPeriod == null)
                {
                    throw new InvalidOperationException("No se ha configurado un período académico activo en el sistema.");
                }

                var researchSubcatId = await _context.SubcategoriasActividades
                    .Where(s => s.Subcategoria == "INVESTIGACION")
                    .Select(s => s.IdSubcategoria)
                    .FirstOrDefaultAsync();
                if (researchSubcatId == 0) researchSubcatId = 7; // Fallback seguro

                var activeProfs = await _context.InvProyectosProfesores
                    .Include(pp => pp.IdUsuarioNavigation)
                    .Where(pp => pp.IdProyecto == proyecto.IdProyecto && pp.Activo != false)
                    .ToListAsync();

                foreach (var prof in activeProfs)
                {
                    var persona = prof.IdUsuarioNavigation;
                    if (persona == null || persona.TablaSigafi == "alumno") continue;

                    decimal proposedHours = prof.HorasSemanales ?? 0;
                    
                    // NOTA DE NOMENCLATURA & SISTEMA: Se aplica Trim() en los IDs de profesores para evitar desajustes por espacios en la persistencia.
                    var availableHours = await _context.ProfesoresActividades
                        .Where(pa => pa.IdProfesor.Trim() == persona.IdSigafi.Trim() && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == currentPeriod.IdPeriodo)
                        .Select(pa => pa.HorasSemana)
                        .FirstOrDefaultAsync() ?? 0;

                    var otherProjectsHours = await _context.InvProyectosProfesores
                        .Where(pp => pp.IdUsuario == persona.IdUsuario && 
                                     pp.IdProyecto != proyecto.IdProyecto && 
                                     pp.Activo != false && 
                                     pp.IdProyectoNavigation.Activo != false &&
                                     (pp.IdProyectoNavigation.Estado == "Enviado" || 
                                      pp.IdProyectoNavigation.Estado == "En Revisión" || 
                                      pp.IdProyectoNavigation.Estado == "Aprobado" || 
                                      pp.IdProyectoNavigation.Estado == "En Ejecución"))
                        .SumAsync(pp => (decimal?)pp.HorasSemanales ?? 0);

                    var totalProposedHours = otherProjectsHours + proposedHours;
                    if (totalProposedHours > availableHours)
                    {
                        throw new InvalidOperationException($"El docente {persona.Nombre} (C.I. {persona.IdSigafi}) excede el límite de carga horaria de investigación para el período académico activo. Horas disponibles en distributivo: {availableHours}h. Horas asignadas en otros proyectos: {otherProjectsHours}h. Horas propuestas en este proyecto: {proposedHours}h. Total: {totalProposedHours}h.");
                    }
                }
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

            var afterState = new
            {
                Titulo = proyecto.Titulo,
                CodigoInstitucional = proyecto.CodigoInstitucional,
                Estado = proyecto.Estado,
                FechaModificacion = proyecto.FechaModificacion
            };
            string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

            await _auditService.LogActionAsync(idUsuario, "TRANSICIONAR_PROYECTO", $"Proyecto \"{proyecto.Titulo}\" transicionó de {estadoAnterior} a {nuevoEstado}", "PROYECTOS", beforeJson, afterJson);

            // Notify admins/directors when a project is submitted
            if (nuevoEstado == "Enviado")
            {
                try
                {
                    await _notificationService.NotifyByRoleCodesAsync(
                        "Proyecto Postulado",
                        $"El proyecto '{proyecto.Titulo}' ha sido postulado y requiere revisión.",
                        new[] { "DIITRA_ADMIN" },
                        $"/arbitraje/proyecto/{proyecto.Uuid}"
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DIITRA] Error al notificar postulación de proyecto: {ex.Message}");
                }
            }

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
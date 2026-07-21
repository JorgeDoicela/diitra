using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;
using Diitra.Application.Research;
using diitra_application.Security;
using diitra_application.Common.Notifications;
using Microsoft.Extensions.DependencyInjection;

namespace Diitra.Infrastructure.Research
{
    public class WorkflowEngineService : IWorkflowEngineService
    {
        private readonly DiitraContext _context;
        private readonly IAuditService _auditService;
        private readonly INotificationService _notificationService;
        private readonly IServiceScopeFactory _scopeFactory;

        public WorkflowEngineService(DiitraContext context, IAuditService auditService, INotificationService notificationService, IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _auditService = auditService;
            _notificationService = notificationService;
            _scopeFactory = scopeFactory;
        }

        public async Task<bool> TransicionarEstadoAsync(string proyectoUuid, string nuevoEstado, int idUsuario, string observacion)
        {
            var proyecto = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == proyectoUuid);
            if (proyecto == null) return false;

            string estadoAnterior = proyecto.Estado;

            // 0. Validación de Casos Extremos de Reversión (Undo Timeout & Concurrencia de Datos)
            if (!string.IsNullOrEmpty(observacion) && observacion.StartsWith("Reversión (Undo)"))
            {
                var ultimaTransicionReciente = await _context.InvTrazabilidadProyectos
                    .Where(t => t.IdProyecto == proyecto.IdProyecto)
                    .OrderByDescending(t => t.FechaTransicion)
                    .FirstOrDefaultAsync();

                if (ultimaTransicionReciente != null)
                {
                    var fechaTrans = ultimaTransicionReciente.FechaTransicion;
                    if (fechaTrans.HasValue)
                    {
                        var diferencia = DateTime.Now - fechaTrans.Value;
                        if (diferencia.TotalSeconds > 20) // Margen de seguridad de 20 segundos para la sincronización de red
                        {
                            throw new InvalidOperationException("El tiempo límite para deshacer la última acción ha expirado. El docente podría haber iniciado modificaciones.");
                        }
                    }
                }
            }

            var beforeState = new
            {
                Titulo = proyecto.Titulo,
                CodigoInstitucional = proyecto.CodigoInstitucional,
                Estado = proyecto.Estado,
                FechaModificacion = proyecto.FechaModificacion
            };
            string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

            // 1. Validación Dinámica vía Base de Datos (Configurable)
            bool esValida = false;
            if (!string.IsNullOrEmpty(observacion) && observacion.StartsWith("Reversión (Undo)"))
            {
                esValida = true;
            }
            else if (estadoAnterior == "Prepropuesta" || nuevoEstado == "Prepropuesta" || nuevoEstado == "Prepropuesta Rechazada" || estadoAnterior == "Prepropuesta Rechazada")
            {
                esValida = (estadoAnterior == "Prepropuesta" && nuevoEstado == "Borrador") ||
                           (estadoAnterior == "Prepropuesta" && nuevoEstado == "Prepropuesta Rechazada") ||
                           (estadoAnterior == "Borrador" && nuevoEstado == "Prepropuesta") ||
                           (estadoAnterior == "Prepropuesta Rechazada" && nuevoEstado == "Prepropuesta");
            }
            else
            {
                esValida = await _context.InvConfigWorkflows
                    .AnyAsync(w => w.Activo && 
                                   w.EstadoOrigen == estadoAnterior && 
                                   w.EstadoDestino == nuevoEstado &&
                                   (w.IdTipoProyecto == null || w.IdTipoProyecto == proyecto.IdTipo));
            }

            if (!esValida)
            {
                throw new InvalidOperationException($"La transición {estadoAnterior} -> {nuevoEstado} no está permitida por la normativa vigente para este tipo de proyecto.");
            }

            // 1.05 Validaciones de Prepropuesta (Idea de Investigación)
            if (estadoAnterior == "Prepropuesta" && nuevoEstado == "Borrador")
            {
                if (string.IsNullOrWhiteSpace(proyecto.Titulo))
                {
                    throw new InvalidOperationException("No se puede aprobar la prepropuesta porque el título del proyecto está vacío.");
                }

                string desc = "";
                if (!string.IsNullOrEmpty(proyecto.MetadataCacesJson))
                {
                    try
                    {
                        using var doc = System.Text.Json.JsonDocument.Parse(proyecto.MetadataCacesJson);
                        if (doc.RootElement.TryGetProperty("descripcionProyecto", out var el) || doc.RootElement.TryGetProperty("DescripcionProyecto", out el))
                        {
                            desc = el.GetString() ?? "";
                        }
                    }
                    catch { }
                }

                if (string.IsNullOrWhiteSpace(desc))
                {
                    throw new InvalidOperationException("No se puede aprobar la prepropuesta porque la descripción/justificación del proyecto está vacía.");
                }
            }

            if (nuevoEstado == "Prepropuesta Rechazada")
            {
                if (string.IsNullOrWhiteSpace(observacion) || observacion.Trim().Length < 10)
                {
                    throw new InvalidOperationException("Debe ingresar una observación detallada de al menos 10 caracteres para justificar la devolución al docente.");
                }
            }

            // 1.1 Validación de Reglas de Convocatoria (CACES & SENESCYT Compliance)
            if (nuevoEstado == "Enviado" && proyecto.IdConvocatoria.HasValue)
            {
                var convocatoria = await _context.InvConvocatorias
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

                    // B. Validación de Presupuesto Máximo (Simplificada: Sin tope de convocatoria en BD)

                    // C. Validación de al menos un Investigador
                    var totalInvestigadores = await _context.InvProyectoParticipantes.CountAsync(p => p.IdProyecto == proyecto.IdProyecto && p.Activo != false);
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
                if (researchSubcatId == 0) researchSubcatId = 7;

                // ⚙️ CACES-READY: Estados activos leídos desde BD, no hardcodeados
                var estadosConCargaHoraria = await _context.InvConfigWorkflows
                    .Where(w => w.Activo && w.ContabilizaCargaHoraria)
                    .Select(w => w.EstadoDestino)
                    .Distinct()
                    .ToListAsync();

                if (estadosConCargaHoraria == null || !estadosConCargaHoraria.Any())
                {
                    estadosConCargaHoraria = new List<string> { "Enviado", "En Revisión", "Aprobado", "En Ejecución" };
                }

                var activeProfs = await _context.InvProyectoParticipantes
                    .Include(pp => pp.IdUsuarioNavigation)
                    .Where(pp => pp.IdProyecto == proyecto.IdProyecto && pp.Activo != false && pp.TipoParticipante == "Docente")
                    .ToListAsync();
 
                foreach (var prof in activeProfs)
                {
                    var persona = prof.IdUsuarioNavigation;
                    if (persona == null || persona.TablaSigafi == "alumno") continue;
 
                    decimal proposedHours = prof.HorasSemanales ?? 0;
                    
                    // NOTA DE NOMENCLATURA & SISTEMA: Se normaliza con Trim() en memoria antes de la consulta SQL para evitar Table Scan en MariaDB.
                    var sigafiIdNormalizado = (persona.IdSigafi ?? "").Trim();
                    var availableHours = await _context.ProfesoresActividades
                        .Where(pa => pa.IdProfesor == sigafiIdNormalizado && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == currentPeriod.IdPeriodo)
                        .Select(pa => pa.HorasSemana)
                        .FirstOrDefaultAsync() ?? 0;
 
                    var otherProjectsHours = await _context.InvProyectoParticipantes
                        .Where(pp => pp.TipoParticipante == "Docente" &&
                                     pp.IdUsuario == persona.IdUsuario && 
                                     pp.IdProyecto != proyecto.IdProyecto && 
                                     pp.Activo != false && 
                                     pp.IdProyectoNavigation!.Activo != false &&
                                     estadosConCargaHoraria.Contains(pp.IdProyectoNavigation.Estado))
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
                    var participants = await _context.InvProyectoParticipantes
                        .Where(pp => pp.IdProyecto == proyecto.IdProyecto && pp.Activo != false)
                        .Select(pp => $"{pp.IdUsuarioNavigation!.Nombre} ({(pp.TipoParticipante == "Alumno" ? "Estudiante" : (pp.Rol ?? (pp.EsDirector == true ? "Director" : "Docente")))})")
                        .ToListAsync();
                    string participantes = participants.Count > 0 ? string.Join(", ", participants) : "un docente";
 
                    await _notificationService.NotifyByRoleCodesAsync(
                        "Proyecto Postulado",
                        $"El proyecto '{proyecto.Titulo}' (Autores: {participantes}) ha sido postulado y requiere revisión.",
                        new[] { "DIITRA_ADMIN" },
                        $"/arbitraje/proyecto/{proyecto.Uuid}"
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DIITRA] Error al notificar postulación de proyecto: {ex.Message}");
                }
            }
            else if (nuevoEstado == "Prepropuesta")
            {
                try
                {
                    var participants = await _context.InvProyectoParticipantes
                        .Where(pp => pp.IdProyecto == proyecto.IdProyecto && pp.Activo != false)
                        .Select(pp => $"{pp.IdUsuarioNavigation!.Nombre} ({(pp.TipoParticipante == "Alumno" ? "Estudiante" : (pp.Rol ?? (pp.EsDirector == true ? "Director" : "Docente")))})")
                        .ToListAsync();
                    string participantes = participants.Count > 0 ? string.Join(", ", participants) : "un docente";
 
                    var docInstance = await _context.DocumentInstances
                        .FirstOrDefaultAsync(di => di.EntityUuid == proyecto.Uuid && di.TemplateCode == "PROTOCOLO_INVESTIGACION");
                    string actionUrl = docInstance != null 
                        ? $"/investigacion/workspace/protocolo-investigacion/{docInstance.Uuid}"
                        : $"/investigacion";
 
                    await _notificationService.NotifyByRoleCodesAsync(
                        "Prepropuesta Registrada",
                        $"La prepropuesta del proyecto '{proyecto.Titulo}' (Autores: {participantes}) ha sido registrada/reenviada y está pendiente de aprobación de idea.",
                        new[] { "DIITRA_ADMIN" },
                        actionUrl
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DIITRA] Error al notificar prepropuesta: {ex.Message}");
                }
            }
            else if (estadoAnterior == "Prepropuesta" && nuevoEstado == "Borrador")
            {
                try
                {
                    var participantUserIds = await _context.InvProyectoParticipantes
                        .Where(pp => pp.IdProyecto == proyecto.IdProyecto && pp.Activo != false)
                        .Select(pp => pp.IdUsuario)
                        .Distinct()
                        .ToListAsync();
 
                    var docInstance = await _context.DocumentInstances
                        .FirstOrDefaultAsync(di => di.EntityUuid == proyecto.Uuid && di.TemplateCode == "PROTOCOLO_INVESTIGACION");
                    string actionUrl = docInstance != null 
                        ? $"/investigacion/mis-proyectos/workspace/protocolo-investigacion/{docInstance.Uuid}"
                        : $"/investigacion/mis-proyectos";
 
                    foreach (var userId in participantUserIds)
                    {
                        await _notificationService.NotifyUserAsync(
                            userId,
                            "Prepropuesta Aprobada",
                            $"Su prepropuesta '{proyecto.Titulo}' ha sido APROBADA. Ya puede iniciar la formulación completa del proyecto.",
                            "INVESTIGACION",
                            actionUrl
                        );
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DIITRA] Error al notificar aprobación de prepropuesta: {ex.Message}");
                }
            }
            else if (estadoAnterior == "Prepropuesta" && nuevoEstado == "Prepropuesta Rechazada")
            {
                try
                {
                    var participantUserIds = await _context.InvProyectoParticipantes
                        .Where(pp => pp.IdProyecto == proyecto.IdProyecto && pp.Activo != false)
                        .Select(pp => pp.IdUsuario)
                        .Distinct()
                        .ToListAsync();
 
                    var docInstance = await _context.DocumentInstances
                        .FirstOrDefaultAsync(di => di.EntityUuid == proyecto.Uuid && di.TemplateCode == "PROTOCOLO_INVESTIGACION");
                    string actionUrl = docInstance != null 
                        ? $"/investigacion/mis-proyectos/workspace/protocolo-investigacion/{docInstance.Uuid}"
                        : $"/investigacion/mis-proyectos";
 
                    foreach (var userId in participantUserIds)
                    {
                        await _notificationService.NotifyUserAsync(
                            userId,
                            "Prepropuesta Devuelta",
                            $"Su prepropuesta '{proyecto.Titulo}' ha sido devuelta con observaciones: {observacion}",
                            "INVESTIGACION",
                            actionUrl
                        );
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DIITRA] Error al notificar devolución de prepropuesta: {ex.Message}");
                }
            }
            else if (estadoAnterior == "Enviado" && nuevoEstado == "En Revisión")
            {
                try
                {
                    var participantUserIds = await _context.InvProyectoParticipantes
                        .Where(pp => pp.IdProyecto == proyecto.IdProyecto && pp.Activo != false)
                        .Select(pp => pp.IdUsuario)
                        .Distinct()
                        .ToListAsync();
 
                    var docInstance = await _context.DocumentInstances
                        .FirstOrDefaultAsync(di => di.EntityUuid == proyecto.Uuid && di.TemplateCode == "PROTOCOLO_INVESTIGACION");
                    string actionUrl = docInstance != null 
                        ? $"/investigacion/mis-proyectos/workspace/protocolo-investigacion/{docInstance.Uuid}"
                        : $"/investigacion/mis-proyectos";
 
                    foreach (var userId in participantUserIds)
                    {
                        await _notificationService.NotifyUserAsync(
                            userId,
                            "Revisión Técnica Aprobada",
                            $"La revisión técnica inicial del proyecto '{proyecto.Titulo}' ha sido Aprobada. Ha avanzado a la fase de Evaluación por Pares.",
                            "INVESTIGACION",
                            actionUrl
                        );
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DIITRA] Error al notificar aprobación técnica: {ex.Message}");
                }
            }
            else if (estadoAnterior == "Enviado" && nuevoEstado == "En Corrección")
            {
                try
                {
                    var participantUserIds = await _context.InvProyectoParticipantes
                        .Where(pp => pp.IdProyecto == proyecto.IdProyecto && pp.Activo != false)
                        .Select(pp => pp.IdUsuario)
                        .Distinct()
                        .ToListAsync();
 
                    string obsResumen = string.IsNullOrEmpty(observacion) 
                        ? "Sin observaciones detalladas." 
                        : (observacion.Length > 150 ? observacion.Substring(0, 147) + "..." : observacion);
 
                    var docInstance = await _context.DocumentInstances
                        .FirstOrDefaultAsync(di => di.EntityUuid == proyecto.Uuid && di.TemplateCode == "PROTOCOLO_INVESTIGACION");
                    string actionUrl = docInstance != null 
                        ? $"/investigacion/mis-proyectos/workspace/protocolo-investigacion/{docInstance.Uuid}"
                        : $"/investigacion/mis-proyectos";
 
                    foreach (var userId in participantUserIds)
                    {
                        await _notificationService.NotifyUserAsync(
                            userId,
                            "Revisión Técnica Devuelta",
                            $"Su propuesta de proyecto '{proyecto.Titulo}' ha sido devuelta para correcciones. Observación: {obsResumen}",
                            "INVESTIGACION",
                            actionUrl
                        );
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DIITRA] Error al notificar devolución técnica: {ex.Message}");
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
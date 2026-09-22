using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research
{
    public class ProjectScheduleService : IProjectScheduleService
    {
        private readonly DiitraContext _context;
        private readonly IProjectOrchestrator _projectOrchestrator;
        private readonly ILogger<ProjectScheduleService> _logger;

        public ProjectScheduleService(
            DiitraContext context,
            IProjectOrchestrator projectOrchestrator,
            ILogger<ProjectScheduleService> logger)
        {
            _context = context;
            _projectOrchestrator = projectOrchestrator;
            _logger = logger;
        }

        public async Task<ExpenseOperationResult<CronogramaResumenDto>> GetCronogramaResumenAsync(string projectUuid, ClaimsPrincipal user)
        {
            var project = await _context.InvProyectos
                .AsNoTracking()
                .Include(p => p.InvCronogramas)
                .Include(p => p.InvObjetivosProyecto)
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (project == null)
            {
                return new ExpenseOperationResult<CronogramaResumenDto>
                {
                    Success = false,
                    StatusCode = 404,
                    Message = "Proyecto no encontrado."
                };
            }

            var userIdRef = user.FindFirstValue(ClaimTypes.NameIdentifier);
            bool puedeEditar = await CanUserEditProjectAsync(projectUuid, userIdRef, user);

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var specificObjetivos = project.InvObjetivosProyecto
                .Where(o => !o.EsGeneral)
                .OrderBy(o => o.Orden)
                .ToList();

            var actividadesDto = project.InvCronogramas
                .OrderBy(c => c.NumeroActividad)
                .ThenBy(c => c.IdActividad)
                .Select(c =>
                {
                    string estado = "PENDIENTE";
                    if (c.Progreso >= 100)
                    {
                        estado = "COMPLETADA";
                    }
                    else if (c.FechaFinPrevista.HasValue && c.FechaFinPrevista.Value < today)
                    {
                        estado = "ATRASADA";
                    }
                    else if (c.Progreso > 0 || (c.FechaInicioPrevista.HasValue && c.FechaInicioPrevista.Value <= today))
                    {
                        estado = "EN_CURSO";
                    }

                    var obj = specificObjetivos.FirstOrDefault(o => o.IdObjetivo == c.IdObjetivo);
                    string? objetivoDesc = obj != null 
                        ? $"Objetivo {specificObjetivos.IndexOf(obj) + 1}: {obj.Descripcion}"
                        : null;

                    var semanas = ProjectHelper.GetSemanasCalculadas(
                        project.FechaInicio, 
                        project.FechaFin, 
                        c.FechaInicioPrevista, 
                        c.FechaFinPrevista);

                    return new ActividadCronogramaItemDto
                    {
                        IdActividad = c.IdActividad,
                        Uuid = c.Uuid.ToString(),
                        IdProyecto = c.IdProyecto,
                        IdObjetivo = c.IdObjetivo,
                        ObjetivoDescripcion = objetivoDesc,
                        NumeroActividad = c.NumeroActividad,
                        Descripcion = c.Descripcion,
                        RecursosNecesarios = c.RecursosNecesarios,
                        Responsable = c.Responsable,
                        Entregable = c.Entregable,
                        FechaInicioPrevista = c.FechaInicioPrevista?.ToString("yyyy-MM-dd"),
                        FechaFinPrevista = c.FechaFinPrevista?.ToString("yyyy-MM-dd"),
                        Progreso = c.Progreso,
                        Ponderacion = c.Ponderacion,
                        EsEntregableCaces = c.EsEntregableCaces,
                        ColorHex = string.IsNullOrWhiteSpace(c.ColorHex) ? "#0070f3" : c.ColorHex,
                        Estado = estado,
                        Semanas = semanas
                    };
                }).ToList();

            int total = actividadesDto.Count;
            int completadas = actividadesDto.Count(a => a.Estado == "COMPLETADA");
            int enCurso = actividadesDto.Count(a => a.Estado == "EN_CURSO");
            int atrasadas = actividadesDto.Count(a => a.Estado == "ATRASADA");

            decimal totalPonderacion = actividadesDto.Sum(a => a.Ponderacion);
            decimal pctAvanceGlobal = 0;

            if (total > 0)
            {
                if (totalPonderacion > 0)
                {
                    pctAvanceGlobal = Math.Round(
                        actividadesDto.Sum(a => (a.Progreso * a.Ponderacion) / totalPonderacion), 
                        2);
                }
                else
                {
                    pctAvanceGlobal = Math.Round(actividadesDto.Average(a => a.Progreso), 2);
                }
            }

            string semaforo = "VERDE";
            if (atrasadas > 2) semaforo = "ROJO";
            else if (atrasadas > 0) semaforo = "AMARILLO";

            var resumen = new CronogramaResumenDto
            {
                TotalActividades = total,
                ActividadesCompletadas = completadas,
                ActividadesEnCurso = enCurso,
                ActividadesAtrasadas = atrasadas,
                PorcentajeAvanceGlobal = pctAvanceGlobal,
                SemaforoPlazos = semaforo,
                HitosCacesTotales = actividadesDto.Count(a => a.EsEntregableCaces),
                HitosCacesCumplidos = actividadesDto.Count(a => a.EsEntregableCaces && a.Progreso >= 100),
                PuedeEditar = puedeEditar,
                EstadoProyecto = project.Estado,
                Actividades = actividadesDto
            };

            return new ExpenseOperationResult<CronogramaResumenDto>
            {
                Success = true,
                StatusCode = 200,
                Data = resumen
            };
        }

        public async Task<ExpenseOperationResult<ActividadCronogramaItemDto>> ActualizarProgresoActividadAsync(
            string projectUuid,
            int actividadId,
            ActualizarProgresoActividadRequest request,
            ClaimsPrincipal user)
        {
            var userIdRef = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!await CanUserEditProjectAsync(projectUuid, userIdRef, user))
            {
                return new ExpenseOperationResult<ActividadCronogramaItemDto>
                {
                    Success = false,
                    StatusCode = 403,
                    Message = "No tiene permisos para actualizar actividades en este proyecto."
                };
            }

            var project = await _context.InvProyectos
                .Include(p => p.InvCronogramas)
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (project == null)
            {
                return new ExpenseOperationResult<ActividadCronogramaItemDto>
                {
                    Success = false,
                    StatusCode = 404,
                    Message = "Proyecto no encontrado."
                };
            }

            var actividad = project.InvCronogramas.FirstOrDefault(c => c.IdActividad == actividadId);
            if (actividad == null)
            {
                return new ExpenseOperationResult<ActividadCronogramaItemDto>
                {
                    Success = false,
                    StatusCode = 404,
                    Message = "Actividad no encontrada en este proyecto."
                };
            }

            actividad.Progreso = Math.Clamp(request.Progreso, 0, 100);
            if (!string.IsNullOrWhiteSpace(request.Entregable))
            {
                actividad.Entregable = request.Entregable.Trim();
            }

            await _context.SaveChangesAsync();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            string estado = "PENDIENTE";
            if (actividad.Progreso >= 100) estado = "COMPLETADA";
            else if (actividad.FechaFinPrevista.HasValue && actividad.FechaFinPrevista.Value < today) estado = "ATRASADA";
            else if (actividad.Progreso > 0 || (actividad.FechaInicioPrevista.HasValue && actividad.FechaInicioPrevista.Value <= today)) estado = "EN_CURSO";

            var dto = new ActividadCronogramaItemDto
            {
                IdActividad = actividad.IdActividad,
                Uuid = actividad.Uuid.ToString(),
                IdProyecto = actividad.IdProyecto,
                IdObjetivo = actividad.IdObjetivo,
                NumeroActividad = actividad.NumeroActividad,
                Descripcion = actividad.Descripcion,
                RecursosNecesarios = actividad.RecursosNecesarios,
                Responsable = actividad.Responsable,
                Entregable = actividad.Entregable,
                FechaInicioPrevista = actividad.FechaInicioPrevista?.ToString("yyyy-MM-dd"),
                FechaFinPrevista = actividad.FechaFinPrevista?.ToString("yyyy-MM-dd"),
                Progreso = actividad.Progreso,
                Ponderacion = actividad.Ponderacion,
                EsEntregableCaces = actividad.EsEntregableCaces,
                ColorHex = string.IsNullOrWhiteSpace(actividad.ColorHex) ? "#0070f3" : actividad.ColorHex,
                Estado = estado,
                Semanas = ProjectHelper.GetSemanasCalculadas(project.FechaInicio, project.FechaFin, actividad.FechaInicioPrevista, actividad.FechaFinPrevista)
            };

            return new ExpenseOperationResult<ActividadCronogramaItemDto>
            {
                Success = true,
                StatusCode = 200,
                Data = dto
            };
        }

        public async Task<ExpenseOperationResult<ActividadCronogramaItemDto>> GuardarActividadAsync(
            string projectUuid,
            GuardarActividadRequest request,
            ClaimsPrincipal user)
        {
            var userIdRef = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!await CanUserEditProjectAsync(projectUuid, userIdRef, user))
            {
                return new ExpenseOperationResult<ActividadCronogramaItemDto>
                {
                    Success = false,
                    StatusCode = 403,
                    Message = "No tiene permisos para gestionar actividades en este proyecto."
                };
            }

            var project = await _context.InvProyectos
                .Include(p => p.InvCronogramas)
                .Include(p => p.InvObjetivosProyecto)
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (project == null)
            {
                return new ExpenseOperationResult<ActividadCronogramaItemDto>
                {
                    Success = false,
                    StatusCode = 404,
                    Message = "Proyecto no encontrado."
                };
            }

            if (string.IsNullOrWhiteSpace(request.Descripcion))
            {
                return new ExpenseOperationResult<ActividadCronogramaItemDto>
                {
                    Success = false,
                    StatusCode = 400,
                    Message = "La descripción de la actividad es requerida."
                };
            }

            int idObjetivo = request.IdObjetivo ?? 0;
            if (idObjetivo <= 0)
            {
                var primerObj = project.InvObjetivosProyecto.FirstOrDefault(o => !o.EsGeneral);
                if (primerObj != null) idObjetivo = primerObj.IdObjetivo;
            }

            InvCronograma? actividad = null;

            if (request.IdActividad.HasValue && request.IdActividad.Value > 0)
            {
                actividad = project.InvCronogramas.FirstOrDefault(c => c.IdActividad == request.IdActividad.Value);
                if (actividad == null)
                {
                    return new ExpenseOperationResult<ActividadCronogramaItemDto>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Actividad a modificar no encontrada."
                    };
                }
            }
            else
            {
                int maxNumero = project.InvCronogramas.Any() ? project.InvCronogramas.Max(c => c.NumeroActividad) : 0;
                actividad = new InvCronograma
                {
                    Uuid = Guid.NewGuid(),
                    IdProyecto = project.IdProyecto,
                    NumeroActividad = request.NumeroActividad > 0 ? request.NumeroActividad : maxNumero + 1
                };
                _context.InvCronogramas.Add(actividad);
            }

            actividad.IdObjetivo = idObjetivo;
            actividad.Descripcion = request.Descripcion.Trim();
            actividad.RecursosNecesarios = request.RecursosNecesarios?.Trim();
            actividad.Responsable = request.Responsable?.Trim();
            actividad.Entregable = request.Entregable?.Trim();
            actividad.EsEntregableCaces = request.EsEntregableCaces;
            if (request.Ponderacion.HasValue) actividad.Ponderacion = request.Ponderacion.Value;
            if (request.Progreso.HasValue) actividad.Progreso = Math.Clamp(request.Progreso.Value, 0, 100);
            if (!string.IsNullOrWhiteSpace(request.ColorHex)) actividad.ColorHex = request.ColorHex.Trim();

            actividad.FechaInicioPrevista = ProjectHelper.ParseDateOnly(request.FechaInicioPrevista);
            actividad.FechaFinPrevista = ProjectHelper.ParseDateOnly(request.FechaFinPrevista);

            await _context.SaveChangesAsync();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            string estado = "PENDIENTE";
            if (actividad.Progreso >= 100) estado = "COMPLETADA";
            else if (actividad.FechaFinPrevista.HasValue && actividad.FechaFinPrevista.Value < today) estado = "ATRASADA";
            else if (actividad.Progreso > 0 || (actividad.FechaInicioPrevista.HasValue && actividad.FechaInicioPrevista.Value <= today)) estado = "EN_CURSO";

            var dto = new ActividadCronogramaItemDto
            {
                IdActividad = actividad.IdActividad,
                Uuid = actividad.Uuid.ToString(),
                IdProyecto = actividad.IdProyecto,
                IdObjetivo = actividad.IdObjetivo,
                NumeroActividad = actividad.NumeroActividad,
                Descripcion = actividad.Descripcion,
                RecursosNecesarios = actividad.RecursosNecesarios,
                Responsable = actividad.Responsable,
                Entregable = actividad.Entregable,
                FechaInicioPrevista = actividad.FechaInicioPrevista?.ToString("yyyy-MM-dd"),
                FechaFinPrevista = actividad.FechaFinPrevista?.ToString("yyyy-MM-dd"),
                Progreso = actividad.Progreso,
                Ponderacion = actividad.Ponderacion,
                EsEntregableCaces = actividad.EsEntregableCaces,
                ColorHex = actividad.ColorHex,
                Estado = estado,
                Semanas = ProjectHelper.GetSemanasCalculadas(project.FechaInicio, project.FechaFin, actividad.FechaInicioPrevista, actividad.FechaFinPrevista)
            };

            return new ExpenseOperationResult<ActividadCronogramaItemDto>
            {
                Success = true,
                StatusCode = 200,
                Data = dto
            };
        }

        public async Task<ExpenseOperationResult<bool>> EliminarActividadAsync(string projectUuid, int actividadId, ClaimsPrincipal user)
        {
            var userIdRef = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!await CanUserEditProjectAsync(projectUuid, userIdRef, user))
            {
                return new ExpenseOperationResult<bool>
                {
                    Success = false,
                    StatusCode = 403,
                    Message = "No tiene permisos para eliminar actividades en este proyecto."
                };
            }

            var project = await _context.InvProyectos
                .Include(p => p.InvCronogramas)
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (project == null)
            {
                return new ExpenseOperationResult<bool>
                {
                    Success = false,
                    StatusCode = 404,
                    Message = "Proyecto no encontrado."
                };
            }

            var actividad = project.InvCronogramas.FirstOrDefault(c => c.IdActividad == actividadId);
            if (actividad == null)
            {
                return new ExpenseOperationResult<bool>
                {
                    Success = false,
                    StatusCode = 404,
                    Message = "Actividad no encontrada."
                };
            }

            _context.InvCronogramas.Remove(actividad);
            await _context.SaveChangesAsync();

            return new ExpenseOperationResult<bool>
            {
                Success = true,
                StatusCode = 200,
                Data = true
            };
        }

        private async Task<bool> IsSuperAdminAsync(ClaimsPrincipal user, string? userIdRef)
        {
            if (user?.Identity == null || !user.Identity.IsAuthenticated) return false;

            var roles = user.FindAll(ClaimTypes.Role)
                .Select(c => c.Value)
                .Union(user.FindAll("roles").Select(c => c.Value))
                .Union(user.FindAll("role").Select(c => c.Value))
                .Distinct()
                .ToList();

            if (roles.Contains("DIITRA_SUPER_ADMIN") ||
                user.FindFirst("es_super_admin")?.Value == "true" ||
                user.FindFirst("es_superadmin")?.Value == "true")
            {
                return true;
            }

            if (!string.IsNullOrEmpty(userIdRef))
            {
                return await _projectOrchestrator.IsSystemAdminAsync(userIdRef);
            }

            return false;
        }

        private async Task<bool> CanUserEditProjectAsync(string uuid, string? userIdRef, ClaimsPrincipal user)
        {
            if (await IsSuperAdminAsync(user, userIdRef)) return true;
            if (string.IsNullOrEmpty(userIdRef)) return false;

            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == uuid);
            if (project != null && (project.Estado == "Borrador" || project.Estado == "En Corrección" ||
                                    project.Estado == "Prepropuesta" || project.Estado == "Prepropuesta Rechazada" ||
                                    project.Estado == "En Ejecución"))
            {
                return await _projectOrchestrator.IsProjectDirectorAsync(uuid, userIdRef) || 
                       await IsProjectMemberAsync(project.IdProyecto, userIdRef);
            }

            return false;
        }

        private async Task<bool> IsProjectMemberAsync(int idProyecto, string userIdRef)
        {
            if (int.TryParse(userIdRef, out int idUserInt))
            {
                return await _context.InvProyectoParticipantes
                    .AnyAsync(p => p.IdProyecto == idProyecto && p.IdUsuario == idUserInt);
            }
            return false;
        }
    }
}

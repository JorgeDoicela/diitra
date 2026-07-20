using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MediatR;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_application.Research.Groups.Commands.CreateGroup;
using diitra_application.Security;
using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research
{
    public class GroupsWorkflowService : IGroupsWorkflowService
    {
        private readonly DiitraContext _context;
        private readonly IAuditService _auditService;
        private readonly IAuthService _authService;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<GroupsWorkflowService> _logger;
        private readonly IMediator _mediator;

        public GroupsWorkflowService(
            DiitraContext context,
            IAuditService auditService,
            IAuthService authService,
            IServiceScopeFactory scopeFactory,
            ILogger<GroupsWorkflowService> logger,
            IMediator mediator)
        {
            _context = context;
            _auditService = auditService;
            _authService = authService;
            _scopeFactory = scopeFactory;
            _logger = logger;
            _mediator = mediator;
        }

        private void DispatchNotificationsInBackground(Func<IServiceProvider, Task> work)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    await work(scope.ServiceProvider);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al enviar notificaciones en segundo plano");
                }
            });
        }

        public async Task<GroupDto> CreateAsync(CreateGroupDto dto, string? solicitanteNombre = null)
        {
            return await _mediator.Send(new CreateGroupCommand(dto, solicitanteNombre));
        }

        public async Task<GroupDto> UpdateAsync(string uuid, CreateGroupDto dto, string? solicitanteNombre = null)
        {
            var group = await _context.InvGruposInvestigacion
                .Include(g => g.IdLineas)
                .FirstOrDefaultAsync(g => g.Uuid == uuid);

            if (group == null) throw new Exception("Grupo no encontrado");

            var beforeState = new
            {
                Nombre = group.Nombre,
                Siglas = group.Siglas,
                TipoGrupo = group.TipoGrupo,
                IdDominio = group.IdDominio,
                IdCoordinador = group.IdCoordinador,
                ObjetivoGeneral = group.ObjetivoGeneral,
                Mision = group.Mision,
                Vision = group.Vision,
                ResolucionAprobacion = group.ResolucionAprobacion,
                FechaCreacion = group.FechaCreacion,
                Activo = group.Activo,
                Estado = group.Estado
            };
            string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

            int? coordinatorId = dto.IdCoordinador;
            if (!string.IsNullOrEmpty(dto.IdProfesorCoordinador))
            {
                var user = await _authService.GetOrProvisionUserByCedulaAsync(dto.IdProfesorCoordinador);
                coordinatorId = user?.IdUsuario;
            }

            group.Nombre = dto.Nombre;
            group.Siglas = dto.Siglas;
            group.TipoGrupo = dto.TipoGrupo;
            group.IdDominio = dto.IdDominio;
            group.IdCoordinador = coordinatorId;
            group.ObjetivoGeneral = dto.ObjetivoGeneral;
            group.Mision = dto.Mision;
            group.Vision = dto.Vision;
            group.FechaCreacion = dto.FechaCreacion;
            group.CategoriaConsolidacion = dto.CategoriaConsolidacion ?? "En Formación";
            group.LinkWhatsapp = dto.LinkWhatsapp;
            group.TelefonoCoordinador = dto.TelefonoCoordinador;
            group.FotoUrl = dto.FotoUrl;

            if (!string.IsNullOrEmpty(dto.Estado))
            {
                group.Estado = dto.Estado;
                if (dto.Estado == "Pendiente")
                {
                    group.Activo = false;
                    group.ResolucionAprobacion = null;
                }
                else
                {
                    group.Activo = true;
                    group.ResolucionAprobacion = dto.ResolucionAprobacion;
                }
            }
            else
            {
                group.ResolucionAprobacion = dto.ResolucionAprobacion;
            }

            group.IdLineas.Clear();
            if (dto.LineasIds.Any())
            {
                var lineas = await _context.InvLineasInvestigacion.Where(l => dto.LineasIds.Contains(l.IdLinea)).ToListAsync();
                foreach (var linea in lineas) group.IdLineas.Add(linea);
            }

            var currentGroupWithCarreras = await _context.InvGruposInvestigacion.Include(g => g.IdCarreras).FirstOrDefaultAsync(g => g.IdGrupo == group.IdGrupo);
            currentGroupWithCarreras?.IdCarreras.Clear();
            var uniqueCarreraIds = new HashSet<int>(dto.CarrerasIds);

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentPeriod = await _context.Periodos
                .Where(p => p.EsInstituto == 1)
                .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                .ThenByDescending(p => p.Activo == true)
                .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                .ThenByDescending(p => p.FechaInicial)
                .FirstOrDefaultAsync();

            if (currentPeriod != null)
            {
                var teacherCedulas = new List<string>();
                if (!string.IsNullOrEmpty(dto.IdProfesorCoordinador))
                {
                    teacherCedulas.Add(dto.IdProfesorCoordinador.Trim());
                }
                if (dto.Miembros != null && dto.Miembros.Any())
                {
                    foreach (var memberDto in dto.Miembros)
                    {
                        if (!string.IsNullOrEmpty(memberDto.Cedula))
                        {
                            teacherCedulas.Add(memberDto.Cedula.Trim());
                        }
                    }
                }

                var activeMemberCedulas = await _context.InvGruposMiembros
                    .Where(m => m.IdGrupo == group.IdGrupo && m.Activo == true && m.IdUsuarioNavigation != null && m.IdUsuarioNavigation.IdSigafi != null)
                    .Select(m => m.IdUsuarioNavigation!.IdSigafi!.Trim())
                    .ToListAsync();

                teacherCedulas.AddRange(activeMemberCedulas);
                teacherCedulas = teacherCedulas.Distinct().ToList();

                if (teacherCedulas.Any())
                {
                    var profCareers = await _context.ProfesoresCarrerasPeriodos
                        .Where(pc => teacherCedulas.Contains(pc.IdProfesor.Trim()) && pc.IdPeriodo == currentPeriod.IdPeriodo && pc.EsActivo == 1 && pc.IdCarrera != null)
                        .Select(pc => pc.IdCarrera!.Value)
                        .ToListAsync();
                    foreach (var idCarrera in profCareers)
                    {
                        uniqueCarreraIds.Add(idCarrera);
                    }

                    var matriculas = await _context.Matriculas
                        .Where(m => teacherCedulas.Contains(m.IdAlumno.Trim()) && m.IdPeriodo == currentPeriod.IdPeriodo && m.Valida == 1)
                        .ToListAsync();
                    var studentNiveles = matriculas.Select(m => (int?)m.IdNivel).ToList();
                    var studentsDirectNiveles = await _context.Alumnos
                        .Where(s => teacherCedulas.Contains(s.IdAlumno.Trim()) && s.IdNivel != null)
                        .Select(s => s.IdNivel!.Value)
                        .ToListAsync();
                    var allStudentNiveles = studentNiveles
                        .Where(n => n.HasValue)
                        .Select(n => n!.Value)
                        .Concat(studentsDirectNiveles)
                        .Distinct()
                        .ToList();
                    if (allStudentNiveles.Any())
                    {
                        var studentCareersFromCursos = await _context.Cursos
                            .Where(c => allStudentNiveles.Contains(c.IdNivel))
                            .Select(c => c.IdCarrera)
                            .Distinct()
                            .ToListAsync();
                        foreach (var idCarrera in studentCareersFromCursos)
                        {
                            uniqueCarreraIds.Add(idCarrera);
                        }
                    }
                }
            }

            if (uniqueCarreraIds.Any())
            {
                var carreras = await _context.Carreras.Where(c => uniqueCarreraIds.Contains(c.IdCarrera)).ToListAsync();
                foreach (var carrera in carreras) currentGroupWithCarreras?.IdCarreras.Add(carrera);
            }

            await _context.SaveChangesAsync();

            var afterState = new
            {
                Nombre = group.Nombre,
                Siglas = group.Siglas,
                TipoGrupo = group.TipoGrupo,
                IdDominio = group.IdDominio,
                IdCoordinador = group.IdCoordinador,
                ObjetivoGeneral = group.ObjetivoGeneral,
                Mision = group.Mision,
                Vision = group.Vision,
                ResolucionAprobacion = group.ResolucionAprobacion,
                FechaCreacion = group.FechaCreacion,
                Activo = group.Activo,
                Estado = group.Estado
            };
            string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

            await _auditService.LogActionAsync(null, "EDITAR_GRUPO", $"Edición del grupo {group.Nombre}", "INVESTIGACION", beforeJson, afterJson);

            if (dto.Estado == "Pendiente")
            {
                try
                {
                    string? coordinadorNombre = null;
                    if (group.IdCoordinador.HasValue)
                    {
                        var coordinador = await _context.Users.FindAsync(group.IdCoordinador.Value);
                        coordinadorNombre = coordinador?.Nombre;
                    }

                    var remitente = solicitanteNombre ?? coordinadorNombre ?? "No identificado";
                    var notifTitle = "Propuesta de Grupo Actualizada";
                    var notifBody = $"{remitente} ha modificado el grupo \"{group.Nombre}\" y requiere revisión nuevamente.";
                    var notifUrl = $"/grupos?open={group.Uuid}";
                    var notifExtra = new Dictionary<string, string>
                    {
                        { "Nombre del Grupo", group.Nombre },
                        { "Siglas", group.Siglas ?? "N/A" },
                        { "Tipo", group.TipoGrupo },
                        { "Coordinador Propuesto", coordinadorNombre ?? "No asignado" },
                        { "Solicitante", remitente },
                        { "Objetivo General", group.ObjetivoGeneral ?? "No especificado" },
                        { "Estado", group.Estado ?? "Pendiente" }
                    };

                    DispatchNotificationsInBackground(sp =>
                        sp.GetRequiredService<INotificationService>()
                            .NotifyByRoleCodesAsync(notifTitle, notifBody, new[] { "DIITRA_ADMIN" }, notifUrl, notifExtra));
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al enviar notificaciones de actualización de grupo {Uuid}", group.Uuid);
                }
            }

            var resultDto = GroupsHelper.MapToDto(_context, group);
            resultDto.LineasIds = group.IdLineas.Select(l => l.IdLinea).ToList();
            resultDto.CarrerasIds = currentGroupWithCarreras?.IdCarreras.Select(c => c.IdCarrera).ToList() ?? new List<int>();
            return resultDto;
        }

        public async Task<bool> DeactivateAsync(string uuid)
        {
            var group = await _context.InvGruposInvestigacion.FirstOrDefaultAsync(g => g.Uuid == uuid);
            if (group == null) return false;

            var beforeState = new
            {
                Nombre = group.Nombre,
                Siglas = group.Siglas,
                TipoGrupo = group.TipoGrupo,
                Activo = group.Activo,
                Estado = group.Estado
            };
            string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

            group.Activo = false;
            await _context.SaveChangesAsync();

            var afterState = new
            {
                Nombre = group.Nombre,
                Siglas = group.Siglas,
                TipoGrupo = group.TipoGrupo,
                Activo = group.Activo,
                Estado = group.Estado
            };
            string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

            await _auditService.LogActionAsync(null, "DESACTIVAR_GRUPO", $"Desactivación del grupo {group.Nombre}", "INVESTIGACION", beforeJson, afterJson);

            return true;
        }

        public async Task<bool> AddMemberAsync(string groupUuid, GroupMemberDto memberDto)
        {
            var group = await _context.InvGruposInvestigacion
                .Include(g => g.IdCarreras)
                .FirstOrDefaultAsync(g => g.Uuid == groupUuid);
            if (group == null) return false;

            int userId = memberDto.IdUsuario;
            if (!string.IsNullOrEmpty(memberDto.Cedula))
            {
                var user = await _authService.GetOrProvisionUserByCedulaAsync(memberDto.Cedula);
                if (user == null) return false;
                userId = user.IdUsuario;
            }

            if (userId == 0) return false;

            var existingMember = await _context.InvGruposMiembros
                .FirstOrDefaultAsync(m => m.IdGrupo == group.IdGrupo && m.IdUsuario == userId && m.Activo == true);

            if (existingMember != null)
            {
                return true;
            }

            var member = new InvGrupoMiembro
            {
                IdGrupo = group.IdGrupo,
                IdUsuario = userId,
                Rol = memberDto.Rol,
                Activo = true,
                FechaInicio = memberDto.FechaInicio ?? DateOnly.FromDateTime(DateTime.Now),
                TelefonoContacto = memberDto.TelefonoContacto
            };

            _context.InvGruposMiembros.Add(member);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(memberDto.Cedula))
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var currentPeriod = await _context.Periodos
                    .Where(p => p.EsInstituto == 1)
                    .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                    .ThenByDescending(p => p.Activo == true)
                    .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                    .ThenByDescending(p => p.FechaInicial)
                    .FirstOrDefaultAsync();

                if (currentPeriod != null)
                {
                    var profCareers = await _context.ProfesoresCarrerasPeriodos
                        .Where(pc => pc.IdProfesor.Trim() == memberDto.Cedula.Trim() && pc.IdPeriodo == currentPeriod.IdPeriodo && pc.EsActivo == 1 && pc.IdCarrera != null)
                        .Select(pc => pc.IdCarrera!.Value)
                        .ToListAsync();

                    var studentCareers = new List<int>();
                    var matriculas = await _context.Matriculas
                        .Where(m => m.IdAlumno.Trim() == memberDto.Cedula.Trim() && m.IdPeriodo == currentPeriod.IdPeriodo && m.Valida == 1)
                        .ToListAsync();
                    var studentNiveles = matriculas.Select(m => (int?)m.IdNivel).ToList();
                    var studentsDirectNiveles = await _context.Alumnos
                        .Where(s => s.IdAlumno.Trim() == memberDto.Cedula.Trim() && s.IdNivel != null)
                        .Select(s => s.IdNivel!.Value)
                        .ToListAsync();
                    var allStudentNiveles = studentNiveles
                        .Where(n => n.HasValue)
                        .Select(n => n!.Value)
                        .Concat(studentsDirectNiveles)
                        .Distinct()
                        .ToList();
                    if (allStudentNiveles.Any())
                    {
                        studentCareers = await _context.Cursos
                            .Where(c => allStudentNiveles.Contains(c.IdNivel))
                            .Select(c => c.IdCarrera)
                            .Distinct()
                            .ToListAsync();
                    }

                    var mergedCareers = profCareers.Concat(studentCareers).Distinct().ToList();

                    if (mergedCareers.Any())
                    {
                        var newCarreras = await _context.Carreras
                            .Where(c => mergedCareers.Contains(c.IdCarrera) && !group.IdCarreras.Any(gc => gc.IdCarrera == c.IdCarrera))
                            .ToListAsync();
                        foreach (var carrera in newCarreras)
                        {
                            group.IdCarreras.Add(carrera);
                        }
                        await _context.SaveChangesAsync();
                    }
                }
            }

            var afterState = new
            {
                Grupo = group.Nombre,
                IdUsuario = userId,
                Rol = memberDto.Rol,
                FechaInicio = memberDto.FechaInicio?.ToString() ?? DateOnly.FromDateTime(DateTime.Now).ToString(),
                Activo = true
            };
            string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

            await _auditService.LogActionAsync(userId, "AGREGAR_MIEMBRO_GRUPO", $"Miembro agregado al grupo {group.Nombre}", "INVESTIGACION", null, afterJson);

            return true;
        }

        public async Task<bool> RemoveMemberAsync(int memberId, string? reason)
        {
            var member = await _context.InvGruposMiembros
                .Include(m => m.IdGrupoNavigation)
                .FirstOrDefaultAsync(m => m.IdGrupoMiembro == memberId);
            if (member == null) return false;

            var beforeState = new
            {
                Grupo = member.IdGrupoNavigation?.Nombre ?? "Desconocido",
                IdUsuario = member.IdUsuario,
                Rol = member.Rol,
                Activo = member.Activo,
                FechaInicio = member.FechaInicio?.ToString(),
                FechaFin = member.FechaFin?.ToString()
            };
            string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

            member.Activo = false;
            member.FechaFin = DateOnly.FromDateTime(DateTime.Now);
            member.MotivoSalida = reason;
            await _context.SaveChangesAsync();

            var group = await _context.InvGruposInvestigacion
                .Include(g => g.IdCarreras)
                .FirstOrDefaultAsync(g => g.IdGrupo == member.IdGrupo);

            if (group != null)
            {
                group.IdCarreras.Clear();
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var currentPeriod = await _context.Periodos
                    .Where(p => p.EsInstituto == 1)
                    .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                    .ThenByDescending(p => p.Activo == true)
                    .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                    .ThenByDescending(p => p.FechaInicial)
                    .FirstOrDefaultAsync();

                var teacherCedulas = new List<string>();
                if (group.IdCoordinadorNavigation != null && !string.IsNullOrEmpty(group.IdCoordinadorNavigation.IdSigafi))
                {
                    teacherCedulas.Add(group.IdCoordinadorNavigation.IdSigafi.Trim());
                }
                else
                {
                    var coordUser = await _context.Users.FirstOrDefaultAsync(u => u.IdUsuario == group.IdCoordinador);
                    if (coordUser != null && !string.IsNullOrEmpty(coordUser.IdSigafi))
                    {
                        teacherCedulas.Add(coordUser.IdSigafi.Trim());
                    }
                }

                var activeMemberCedulas = await _context.InvGruposMiembros
                    .Where(m => m.IdGrupo == group.IdGrupo && m.Activo == true && m.IdUsuarioNavigation != null && m.IdUsuarioNavigation.IdSigafi != null)
                    .Select(m => m.IdUsuarioNavigation!.IdSigafi!.Trim())
                    .ToListAsync();

                teacherCedulas.AddRange(activeMemberCedulas);
                teacherCedulas = teacherCedulas.Distinct().ToList();

                var uniqueCarreraIds = new HashSet<int>();
                if (currentPeriod != null && teacherCedulas.Any())
                {
                    var profCareers = await _context.ProfesoresCarrerasPeriodos
                        .Where(pc => teacherCedulas.Contains(pc.IdProfesor.Trim()) && pc.IdPeriodo == currentPeriod.IdPeriodo && pc.EsActivo == 1 && pc.IdCarrera != null)
                        .Select(pc => pc.IdCarrera!.Value)
                        .ToListAsync();
                    foreach (var idCarrera in profCareers)
                    {
                        uniqueCarreraIds.Add(idCarrera);
                    }

                    var matriculas = await _context.Matriculas
                        .Where(m => teacherCedulas.Contains(m.IdAlumno.Trim()) && m.IdPeriodo == currentPeriod.IdPeriodo && m.Valida == 1)
                        .ToListAsync();
                    var studentNiveles = matriculas.Select(m => (int?)m.IdNivel).ToList();
                    var studentsDirectNiveles = await _context.Alumnos
                        .Where(s => teacherCedulas.Contains(s.IdAlumno.Trim()) && s.IdNivel != null)
                        .Select(s => s.IdNivel!.Value)
                        .ToListAsync();
                    var allStudentNiveles = studentNiveles
                        .Where(n => n.HasValue)
                        .Select(n => n!.Value)
                        .Concat(studentsDirectNiveles)
                        .Distinct()
                        .ToList();
                    if (allStudentNiveles.Any())
                    {
                        var studentCareersFromCursos = await _context.Cursos
                            .Where(c => allStudentNiveles.Contains(c.IdNivel))
                            .Select(c => c.IdCarrera)
                            .Distinct()
                            .ToListAsync();
                        foreach (var idCarrera in studentCareersFromCursos)
                        {
                            uniqueCarreraIds.Add(idCarrera);
                        }
                    }
                }

                if (uniqueCarreraIds.Any())
                {
                    var carreras = await _context.Carreras.Where(c => uniqueCarreraIds.Contains(c.IdCarrera)).ToListAsync();
                    foreach (var carrera in carreras)
                    {
                        group.IdCarreras.Add(carrera);
                    }
                }
                await _context.SaveChangesAsync();
            }

            var afterState = new
            {
                Grupo = member.IdGrupoNavigation?.Nombre ?? "Desconocido",
                IdUsuario = member.IdUsuario,
                Rol = member.Rol,
                Activo = member.Activo,
                FechaFin = member.FechaFin?.ToString(),
                MotivoSalida = reason
            };
            string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

            await _auditService.LogActionAsync(member.IdUsuario, "REMOVER_MIEMBRO_GRUPO", $"Miembro removido del grupo {member.IdGrupoNavigation?.Nombre ?? "Desconocido"}", "INVESTIGACION", beforeJson, afterJson);

            return true;
        }

        public async Task<bool> DeleteAsync(string uuid, string? userIdRef = null)
        {
            var group = await _context.InvGruposInvestigacion.FirstOrDefaultAsync(g => g.Uuid == uuid);
            if (group == null) return false;

            var beforeState = new
            {
                group.Uuid,
                group.Nombre,
                group.Estado,
                group.Activo
            };
            string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

            var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userIdRef);
            int? internalUserId = internalUser?.IdUsuario;

            group.Eliminado = true;
            group.FechaEliminacion = DateTime.UtcNow;
            group.EliminadoPorUsuarioId = internalUserId;

            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(internalUserId, "ELIMINAR_GRUPO_TEMPORAL", $"Grupo enviado a la papelera: {group.Nombre}", "INVESTIGACION", beforeJson, null);

            return true;
        }

        public async Task<bool> RestoreAsync(string uuid, string? userIdRef = null)
        {
            var group = await _context.InvGruposInvestigacion
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(g => g.Uuid == uuid);
            if (group == null) return false;

            var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userIdRef);
            int? internalUserId = internalUser?.IdUsuario;

            group.Eliminado = false;
            group.FechaEliminacion = null;
            group.EliminadoPorUsuarioId = null;

            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(internalUserId, "RESTAURAR_GRUPO", $"Grupo restaurado de la papelera: {group.Nombre}", "INVESTIGACION", null, null);

            return true;
        }

        public async Task<bool> PurgeAsync(string uuid, string? userIdRef = null)
        {
            var group = await _context.InvGruposInvestigacion
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(g => g.Uuid == uuid);
            if (group == null) return false;

            var beforeState = new
            {
                group.Uuid,
                group.Nombre,
                group.Estado,
                group.Activo
            };
            string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

            var internalUser = await _context.Users.FirstOrDefaultAsync(u => u.IdSigafi == userIdRef);
            int? internalUserId = internalUser?.IdUsuario;

            _context.InvGruposInvestigacion.Remove(group);
            await _context.SaveChangesAsync();

            await _auditService.LogActionAsync(internalUserId, "ELIMINAR_GRUPO", $"Eliminación física del grupo: {group.Nombre}", "INVESTIGACION", beforeJson, null);

            return true;
        }

        public async Task<bool> ReviewGroupAsync(string uuid, bool aprobado, string? resolucion)
        {
            var group = await _context.InvGruposInvestigacion
                .Include(g => g.InvGruposMiembros)
                .FirstOrDefaultAsync(g => g.Uuid == uuid);
            if (group == null) return false;

            var beforeState = new
            {
                Nombre = group.Nombre,
                Siglas = group.Siglas,
                TipoGrupo = group.TipoGrupo,
                IdDominio = group.IdDominio,
                IdCoordinador = group.IdCoordinador,
                ObjetivoGeneral = group.ObjetivoGeneral,
                Mision = group.Mision,
                Vision = group.Vision,
                ResolucionAprobacion = group.ResolucionAprobacion,
                FechaCreacion = group.FechaCreacion,
                Activo = group.Activo,
                Estado = group.Estado
            };
            string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

            if (aprobado)
            {
                group.Estado = "Aprobado";
                group.Activo = true;
                group.ResolucionAprobacion = resolucion;

                var afterState = new
                {
                    Nombre = group.Nombre,
                    Siglas = group.Siglas,
                    TipoGrupo = group.TipoGrupo,
                    IdDominio = group.IdDominio,
                    IdCoordinador = group.IdCoordinador,
                    ObjetivoGeneral = group.ObjetivoGeneral,
                    Mision = group.Mision,
                    Vision = group.Vision,
                    ResolucionAprobacion = group.ResolucionAprobacion,
                    FechaCreacion = group.FechaCreacion,
                    Activo = group.Activo,
                    Estado = group.Estado
                };
                string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

                await _auditService.LogActionAsync(null, "APROBAR_GRUPO", $"Aprobación del grupo {group.Nombre} con resolución {resolucion}", "INVESTIGACION", beforeJson, afterJson);
            }
            else
            {
                group.Estado = "Rechazado";
                group.Activo = false;
                group.ResolucionAprobacion = null;

                var afterState = new
                {
                    Nombre = group.Nombre,
                    Siglas = group.Siglas,
                    TipoGrupo = group.TipoGrupo,
                    IdDominio = group.IdDominio,
                    IdCoordinador = group.IdCoordinador,
                    ObjetivoGeneral = group.ObjetivoGeneral,
                    Mision = group.Mision,
                    Vision = group.Vision,
                    ResolucionAprobacion = group.ResolucionAprobacion,
                    FechaCreacion = group.FechaCreacion,
                    Activo = group.Activo,
                    Estado = group.Estado
                };
                string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

                await _auditService.LogActionAsync(null, "RECHAZAR_GRUPO", $"Rechazo del grupo {group.Nombre}", "INVESTIGACION", beforeJson, afterJson);
            }

            await _context.SaveChangesAsync();

            var title = aprobado ? "Propuesta de Grupo Aprobada" : "Propuesta de Grupo Rechazada";
            var body = aprobado
                ? $"La propuesta del grupo \"{group.Nombre}\" ({group.Siglas}) ha sido APROBADA formalmente bajo la resolución {resolucion}."
                : $"La propuesta del grupo \"{group.Nombre}\" ({group.Siglas}) ha sido RECHAZADA. Revise el Buzón de Retroalimentación para ver los motivos y audios explicativos.";

            var membersToNotify = new List<int>();
            if (group.IdCoordinador.HasValue)
            {
                membersToNotify.Add(group.IdCoordinador.Value);
            }

            foreach (var member in group.InvGruposMiembros.Where(m => m.Activo == true))
            {
                if (!membersToNotify.Contains(member.IdUsuario))
                {
                    membersToNotify.Add(member.IdUsuario);
                }
            }

            if (membersToNotify.Count > 0)
            {
                var groupUuid = group.Uuid;
                var groupNombre = group.Nombre;
                var groupEstado = group.Estado;
                var memberIds = membersToNotify.ToList();

                DispatchNotificationsInBackground(async sp =>
                {
                    var notificationService = sp.GetRequiredService<INotificationService>();
                    foreach (var userId in memberIds)
                    {
                        try
                        {
                            await notificationService.NotifyUserAsync(
                                userId,
                                title,
                                body,
                                "INVESTIGACION",
                                $"/grupos?open={groupUuid}",
                                new Dictionary<string, string>
                                {
                                    { "GrupoUuid", groupUuid },
                                    { "Nombre del Grupo", groupNombre },
                                    { "Estado", groupEstado }
                                });
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error al notificar al integrante {UserId} del grupo {GroupUuid}", userId, groupUuid);
                        }
                    }
                });
            }

            return true;
        }

        public async Task<bool> StartReviewAsync(string uuid)
        {
            var group = await _context.InvGruposInvestigacion.FirstOrDefaultAsync(g => g.Uuid == uuid);
            if (group == null) return false;

            if (group.Estado != "En Evaluación")
            {
                var beforeState = new { Estado = group.Estado };
                string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

                group.Estado = "En Evaluación";
                await _context.SaveChangesAsync();

                var afterState = new { Estado = group.Estado };
                string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

                await _auditService.LogActionAsync(null, "INICIAR_EVALUACION_GRUPO", $"Inicio de evaluación para el grupo {group.Nombre}", "INVESTIGACION", beforeJson, afterJson);
            }

            return true;
        }

        public async Task<bool> CancelReviewAsync(string uuid)
        {
            var group = await _context.InvGruposInvestigacion.FirstOrDefaultAsync(g => g.Uuid == uuid);
            if (group == null) return false;

            if (group.Estado == "En Evaluación")
            {
                var beforeState = new { Estado = group.Estado };
                string beforeJson = System.Text.Json.JsonSerializer.Serialize(beforeState);

                group.Estado = "Pendiente";
                await _context.SaveChangesAsync();

                var afterState = new { Estado = group.Estado };
                string afterJson = System.Text.Json.JsonSerializer.Serialize(afterState);

                await _auditService.LogActionAsync(null, "CANCELAR_EVALUACION_GRUPO", $"Cancelación de evaluación para el grupo {group.Nombre}", "INVESTIGACION", beforeJson, afterJson);
            }

            return true;
        }
    }
}

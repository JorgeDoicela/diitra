using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MediatR;
using diitra_application.Research.Dtos;
using diitra_application.Research.Groups.Commands.CreateGroup;
using diitra_application.Security;
using diitra_application.Common.Notifications;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research.Groups.Commands.CreateGroup
{
    public class CreateGroupCommandHandler : IRequestHandler<CreateGroupCommand, GroupDto>
    {
        private readonly DiitraContext _context;
        private readonly IAuditService _auditService;
        private readonly IAuthService _authService;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<CreateGroupCommandHandler> _logger;

        public CreateGroupCommandHandler(
            DiitraContext context,
            IAuditService auditService,
            IAuthService authService,
            IServiceScopeFactory scopeFactory,
            ILogger<CreateGroupCommandHandler> logger)
        {
            _context = context;
            _auditService = auditService;
            _authService = authService;
            _scopeFactory = scopeFactory;
            _logger = logger;
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

        public async Task<GroupDto> Handle(CreateGroupCommand request, CancellationToken cancellationToken)
        {
            var dto = request.Dto;
            var solicitanteNombre = request.SolicitanteNombre;

            int? coordinatorId = dto.IdCoordinador;
            
            if (!string.IsNullOrEmpty(dto.IdProfesorCoordinador))
            {
                var user = await _authService.GetOrProvisionUserByCedulaAsync(dto.IdProfesorCoordinador);
                coordinatorId = user?.IdUsuario;
            }

            var group = new InvGrupoInvestigacion
            {
                Uuid = Guid.NewGuid().ToString(),
                Nombre = dto.Nombre,
                Siglas = dto.Siglas,
                TipoGrupo = dto.TipoGrupo,
                IdDominio = dto.IdDominio,
                IdCoordinador = coordinatorId,
                ObjetivoGeneral = dto.ObjetivoGeneral,
                Mision = dto.Mision,
                Vision = dto.Vision,
                ResolucionAprobacion = dto.ResolucionAprobacion,
                FechaCreacion = dto.FechaCreacion,
                CategoriaConsolidacion = dto.CategoriaConsolidacion ?? "En Formación",
                Activo = dto.Estado == "Pendiente" ? false : true,
                Estado = dto.Estado ?? "Aprobado",
                LinkWhatsapp = dto.LinkWhatsapp,
                TelefonoCoordinador = dto.TelefonoCoordinador,
                FotoUrl = dto.FotoUrl
            };

            if (dto.LineasIds.Any())
            {
                var lineas = await _context.InvLineasInvestigacion
                    .Where(l => dto.LineasIds.Contains(l.IdLinea))
                    .ToListAsync(cancellationToken);
                foreach (var linea in lineas) group.IdLineas.Add(linea);
            }

            var uniqueCarreraIds = new HashSet<int>(dto.CarrerasIds);

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentPeriod = await _context.Periodos
                .Where(p => p.EsInstituto == 1)
                .OrderByDescending(p => p.Periodoactivoinstituto == 1)
                .ThenByDescending(p => p.Activo == true)
                .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
                .ThenByDescending(p => p.FechaInicial)
                .FirstOrDefaultAsync(cancellationToken);

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

                if (teacherCedulas.Any())
                {
                    var profCareers = await _context.ProfesoresCarrerasPeriodos
                        .Where(pc => teacherCedulas.Contains(pc.IdProfesor.Trim()) && pc.IdPeriodo == currentPeriod.IdPeriodo && pc.EsActivo == 1 && pc.IdCarrera != null)
                        .Select(pc => pc.IdCarrera!.Value)
                        .ToListAsync(cancellationToken);
                    foreach (var idCarrera in profCareers)
                    {
                        uniqueCarreraIds.Add(idCarrera);
                    }

                    var matriculas = await _context.Matriculas
                        .Where(m => teacherCedulas.Contains(m.IdAlumno.Trim()) && m.IdPeriodo == currentPeriod.IdPeriodo && m.Valida == 1)
                        .ToListAsync(cancellationToken);
                    var studentNiveles = matriculas.Select(m => (int?)m.IdNivel).ToList();
                    var studentsDirectNiveles = await _context.Alumnos
                        .Where(s => teacherCedulas.Contains(s.IdAlumno.Trim()) && s.IdNivel != null)
                        .Select(s => s.IdNivel!.Value)
                        .ToListAsync(cancellationToken);
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
                            .ToListAsync(cancellationToken);
                        foreach (var idCarrera in studentCareersFromCursos)
                        {
                            uniqueCarreraIds.Add(idCarrera);
                        }
                    }
                }
            }

            if (uniqueCarreraIds.Any())
            {
                var carreras = await _context.Carreras
                    .Where(c => uniqueCarreraIds.Contains(c.IdCarrera))
                    .ToListAsync(cancellationToken);
                foreach (var carrera in carreras) group.IdCarreras.Add(carrera);
            }

            _context.InvGruposInvestigacion.Add(group);
            await _context.SaveChangesAsync(cancellationToken);

            if (dto.Miembros != null && dto.Miembros.Any())
            {
                foreach (var memberDto in dto.Miembros)
                {
                    int userId = memberDto.IdUsuario;
                    if (!string.IsNullOrEmpty(memberDto.Cedula))
                    {
                        var user = await _authService.GetOrProvisionUserByCedulaAsync(memberDto.Cedula);
                        if (user != null) userId = user.IdUsuario;
                    }

                    if (userId != 0)
                    {
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
                    }
                }
                await _context.SaveChangesAsync(cancellationToken);
            }

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

            await _auditService.LogActionAsync(null, "CREAR_GRUPO", $"Creación del grupo {group.Nombre}", "INVESTIGACION", null, afterJson);

            if (group.Estado == "Pendiente")
            {
                try
                {
                    string? coordinadorNombre = null;
                    if (group.IdCoordinador.HasValue)
                    {
                        var coordinador = await _context.Users.FindAsync(new object?[] { group.IdCoordinador.Value }, cancellationToken: cancellationToken);
                        coordinadorNombre = coordinador?.Nombre;
                    }

                    var remitente = solicitanteNombre ?? coordinadorNombre ?? "No identificado";
                    var notifTitle = "Nueva Propuesta de Grupo de Investigación";
                    var notifBody = $"{remitente} ha enviado la solicitud de creación del grupo \"{group.Nombre}\" para su revisión.";
                    var notifUrl = $"/grupos?open={group.Uuid}";
                    var notifExtra = new Dictionary<string, string>
                    {
                        { "Nombre del Grupo", group.Nombre },
                        { "Siglas", group.Siglas ?? "N/A" },
                        { "Tipo", group.TipoGrupo },
                        { "Coordinador Propuesto", coordinadorNombre ?? "No asignado" },
                        { "Solicitante", remitente },
                        { "Objetivo General", group.ObjetivoGeneral ?? "No especificado" },
                        { "Misión", group.Mision ?? "No especificada" },
                        { "Visión", group.Vision ?? "No especificada" },
                        { "Estado", group.Estado },
                        { "Fecha de Creación", group.FechaCreacion?.ToString("dd/MM/yyyy") ?? DateTime.UtcNow.ToString("dd/MM/yyyy") }
                    };

                    DispatchNotificationsInBackground(sp =>
                        sp.GetRequiredService<INotificationService>()
                            .NotifyByRoleCodesAsync(notifTitle, notifBody, new[] { "DIITRA_ADMIN" }, notifUrl, notifExtra));
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al enviar notificaciones de propuesta de grupo {Uuid}", group.Uuid);
                }
            }

            var resultDto = GroupsHelper.MapToDto(_context, group);
            resultDto.LineasIds = group.IdLineas.Select(l => l.IdLinea).ToList();
            resultDto.CarrerasIds = group.IdCarreras.Select(c => c.IdCarrera).ToList();
            return resultDto;
        }
    }
}

using diitra_application.Common.Notifications;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Research;

public class GroupsService : IGroupsService
{
    private readonly DiitraContext _context;
    private readonly diitra_application.Security.IAuditService _auditService;
    private readonly diitra_application.Security.IAuthService _authService;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<GroupsService> _logger;

    public GroupsService(
        DiitraContext context, 
        diitra_application.Security.IAuditService auditService,
        diitra_application.Security.IAuthService authService,
        IServiceScopeFactory scopeFactory,
        ILogger<GroupsService> logger)
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

    public async Task<IEnumerable<GroupDto>> GetAllAsync(string? search = null, string? userSigafiId = null, bool isAdmin = false, string? memberCedula = null)
    {
        var query = _context.InvGruposInvestigacion
            .Include(g => g.IdCoordinadorNavigation)
            .Include(g => g.InvGruposMiembros)
                .ThenInclude(m => m.IdUsuarioNavigation)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(g => g.Nombre.Contains(search) || g.Siglas!.Contains(search));
        }

        if (!isAdmin && !string.IsNullOrEmpty(userSigafiId))
        {
            var userSigafiTrim = userSigafiId.Trim();
            query = query.Where(g => g.Estado == "Aprobado" 
                || (g.IdCoordinadorNavigation != null && g.IdCoordinadorNavigation.IdSigafi == userSigafiTrim)
                || g.InvGruposMiembros.Any(m => m.IdUsuarioNavigation != null && m.IdUsuarioNavigation.IdSigafi == userSigafiTrim && m.Activo != false));
        }

        if (!string.IsNullOrEmpty(memberCedula))
        {
            var memberCedulaTrim = memberCedula.Trim();
            query = query.Where(g => 
                (g.IdCoordinadorNavigation != null && g.IdCoordinadorNavigation.IdSigafi == memberCedulaTrim)
                || g.InvGruposMiembros.Any(m => m.IdUsuarioNavigation != null && m.IdUsuarioNavigation.IdSigafi == memberCedulaTrim && m.Activo != false));
        }

        var groups = await query.ToListAsync();

        return groups.Select(g => MapToDto(g)).ToList();
    }

    public async Task<GroupDto?> GetByUuidAsync(string uuid)
    {
        var group = await _context.InvGruposInvestigacion
            .Include(g => g.IdCoordinadorNavigation)
            .Include(g => g.IdLineas)
            .Include(g => g.IdCarreras)
            .Include(g => g.InvGruposMiembros)
                .ThenInclude(m => m.IdUsuarioNavigation)
            .FirstOrDefaultAsync(g => g.Uuid == uuid);

        if (group == null) return null;

        var dto = MapToDto(group);
        dto.LineasIds = group.IdLineas.Select(l => l.IdLinea).ToList();
        dto.CarrerasIds = group.IdCarreras.Select(c => c.IdCarrera).ToList();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentPeriod = await _context.Periodos
            .Where(p => p.EsInstituto == 1)
            .OrderByDescending(p => p.Periodoactivoinstituto == 1)
            .ThenByDescending(p => p.Activo == true)
            .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today)
            .ThenByDescending(p => p.FechaInicial)
            .FirstOrDefaultAsync();
        var periodId = currentPeriod?.IdPeriodo;

        var memberCedulas = group.InvGruposMiembros
            .Select(m => m.IdUsuarioNavigation?.IdSigafi?.Trim())
            .Where(c => !string.IsNullOrEmpty(c))
            .Cast<string>()
            .ToList();

        var teacherCareers = new List<ProfesoresCarrerasPeriodo>();
        if (memberCedulas.Any() && !string.IsNullOrEmpty(periodId))
        {
            teacherCareers = await _context.ProfesoresCarrerasPeriodos
                .Include(pc => pc.IdCarreraNavigation)
                .Where(pc => memberCedulas.Contains(pc.IdProfesor.Trim()) && pc.IdPeriodo == periodId && pc.EsActivo == 1)
                .ToListAsync();
        }

        var studentCareers = new List<AlumnosCarrera>();
        if (memberCedulas.Any())
        {
            studentCareers = await _context.AlumnosCarreras
                .Where(ac => memberCedulas.Contains(ac.IdAlumno.Trim()))
                .ToListAsync();
        }
        var allCarreras = await _context.Carreras.ToListAsync();

        if (group.IdCoordinadorNavigation != null && !string.IsNullOrEmpty(group.IdCoordinadorNavigation.IdSigafi) && !string.IsNullOrEmpty(periodId))
        {
            var coordCedula = group.IdCoordinadorNavigation.IdSigafi.Trim();
            var coordCareers = await _context.ProfesoresCarrerasPeriodos
                .Include(pc => pc.IdCarreraNavigation)
                .Where(pc => pc.IdProfesor.Trim() == coordCedula && pc.IdPeriodo == periodId && pc.EsActivo == 1 && pc.IdCarreraNavigation != null)
                .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                .Distinct()
                .ToListAsync();
            if (coordCareers.Any())
            {
                dto.CarreraCoordinador = string.Join(", ", coordCareers);
            }
        }

        dto.Miembros = group.InvGruposMiembros.Select(m =>
        {
            var cedula = m.IdUsuarioNavigation?.IdSigafi?.Trim();
            string? carreraNom = null;

            if (!string.IsNullOrEmpty(cedula))
            {
                var tCareers = teacherCareers
                    .Where(pc => pc.IdProfesor.Trim() == cedula && pc.IdCarreraNavigation != null)
                    .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                    .Distinct()
                    .ToList();
                if (tCareers.Any())
                {
                    carreraNom = string.Join(", ", tCareers);
                }
                else
                {
                    var sCareerIds = studentCareers
                        .Where(ac => ac.IdAlumno.Trim() == cedula)
                        .Select(ac => ac.IdCarrera)
                        .ToList();
                    var sCareers = allCarreras
                        .Where(c => sCareerIds.Contains(c.IdCarrera) && !string.IsNullOrEmpty(c.Carrera1))
                        .Select(c => c.Carrera1!)
                        .ToList();
                    if (sCareers.Any())
                    {
                        carreraNom = string.Join(", ", sCareers);
                    }
                }
            }

            return new GroupMemberDto
            {
                IdGrupoMiembro = m.IdGrupoMiembro,
                IdUsuario = m.IdUsuario,
                NombreCompleto = m.IdUsuarioNavigation?.Nombre ?? "Desconocido",
                Cedula = cedula,
                Rol = m.Rol,
                Activo = m.Activo ?? false,
                FechaInicio = m.FechaInicio,
                FechaFin = m.FechaFin,
                Carrera = carreraNom
            };
        }).ToList();

        var projects = await _context.InvProyectos
            .Include(p => p.InvProyectosProfesores)
                .ThenInclude(pp => pp.IdUsuarioNavigation)
            .Include(p => p.InvProyectosAlumnos)
                .ThenInclude(pa => pa.IdUsuarioNavigation)
            .Where(p => p.IdGrupo == group.IdGrupo && p.Activo == true)
            .ToListAsync();

        dto.Proyectos = projects.Select(p =>
        {
            string? directorName = null;
            var directorProf = p.InvProyectosProfesores.FirstOrDefault(pp => pp.EsDirector == true);
            if (directorProf != null)
            {
                directorName = directorProf.IdUsuarioNavigation?.Nombre;
            }
            else
            {
                var firstProf = p.InvProyectosProfesores.FirstOrDefault();
                if (firstProf != null)
                {
                    directorName = firstProf.IdUsuarioNavigation?.Nombre;
                }
                else
                {
                    var firstStud = p.InvProyectosAlumnos.FirstOrDefault();
                    if (firstStud != null)
                    {
                        directorName = firstStud.IdUsuarioNavigation?.Nombre;
                    }
                }
            }

            return new GroupAssociatedProjectDto
            {
                Uuid = p.Uuid,
                Titulo = p.Titulo,
                Estado = p.Estado,
                CodigoInstitucional = p.CodigoInstitucional,
                DirectorNombre = directorName ?? "No asignado"
            };
        }).ToList();

        return dto;
    }

    public async Task<GroupDto> CreateAsync(CreateGroupDto dto, string? solicitanteNombre = null)
    {
        int? coordinatorId = dto.IdCoordinador;
        
        // JIT Provisioning if selected by sigafi ID
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
            Estado = dto.Estado ?? "Aprobado"
        };

        if (dto.LineasIds.Any())
        {
            var lineas = await _context.InvLineasInvestigacion
                .Where(l => dto.LineasIds.Contains(l.IdLinea))
                .ToListAsync();
            foreach (var linea in lineas) group.IdLineas.Add(linea);
        }

        var uniqueCarreraIds = new HashSet<int>(dto.CarrerasIds);

        // Auto-link careers based on selected teachers (coordinator & members) for active period
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

                var studentCareers = await _context.AlumnosCarreras
                    .Where(ac => teacherCedulas.Contains(ac.IdAlumno.Trim()))
                    .Select(ac => ac.IdCarrera)
                    .ToListAsync();
                foreach (var idCarrera in studentCareers)
                {
                    uniqueCarreraIds.Add(idCarrera);
                }
            }
        }

        if (uniqueCarreraIds.Any())
        {
            var carreras = await _context.Carreras
                .Where(c => uniqueCarreraIds.Contains(c.IdCarrera))
                .ToListAsync();
            foreach (var carrera in carreras) group.IdCarreras.Add(carrera);
        }

        _context.InvGruposInvestigacion.Add(group);
        await _context.SaveChangesAsync();

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
                        FechaInicio = memberDto.FechaInicio ?? DateOnly.FromDateTime(DateTime.Now)
                    };
                    _context.InvGruposMiembros.Add(member);
                }
            }
            await _context.SaveChangesAsync();
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
                    var coordinador = await _context.Users.FindAsync(group.IdCoordinador.Value);
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

        var resultDto = MapToDto(group);
        resultDto.LineasIds = group.IdLineas.Select(l => l.IdLinea).ToList();
        resultDto.CarrerasIds = group.IdCarreras.Select(c => c.IdCarrera).ToList();
        return resultDto;
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
            CategoriaConsolidacion = group.CategoriaConsolidacion,
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

        // Actualizar líneas (M:N)
        group.IdLineas.Clear();
        if (dto.LineasIds.Any())
        {
            var lineas = await _context.InvLineasInvestigacion.Where(l => dto.LineasIds.Contains(l.IdLinea)).ToListAsync();
            foreach (var linea in lineas) group.IdLineas.Add(linea);
        }

        // Actualizar carreras (M:N)
        var currentGroupWithCarreras = await _context.InvGruposInvestigacion.Include(g => g.IdCarreras).FirstOrDefaultAsync(g => g.IdGrupo == group.IdGrupo);
        currentGroupWithCarreras?.IdCarreras.Clear();
        var uniqueCarreraIds = new HashSet<int>(dto.CarrerasIds);

        // Auto-link careers based on selected teachers (coordinator & members) for active period
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

                var studentCareers = await _context.AlumnosCarreras
                    .Where(ac => teacherCedulas.Contains(ac.IdAlumno.Trim()))
                    .Select(ac => ac.IdCarrera)
                    .ToListAsync();
                foreach (var idCarrera in studentCareers)
                {
                    uniqueCarreraIds.Add(idCarrera);
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

        var resultDto = MapToDto(group);
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
            FechaInicio = memberDto.FechaInicio ?? DateOnly.FromDateTime(DateTime.Now)
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

                var studentCareers = await _context.AlumnosCarreras
                    .Where(ac => ac.IdAlumno.Trim() == memberDto.Cedula.Trim())
                    .Select(ac => ac.IdCarrera)
                    .ToListAsync();

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

    private GroupDto MapToDto(InvGrupoInvestigacion g)
    {
        return new GroupDto
        {
            IdGrupo = g.IdGrupo,
            Uuid = g.Uuid,
            Nombre = g.Nombre,
            Siglas = g.Siglas,
            TipoGrupo = g.TipoGrupo,
            IdDominio = g.IdDominio,
            IdCoordinador = g.IdCoordinador,
            IdProfesorCoordinador = g.IdCoordinadorNavigation?.IdSigafi,
            NombreCoordinador = g.IdCoordinadorNavigation?.Nombre,
            ObjetivoGeneral = g.ObjetivoGeneral,
            Mision = g.Mision,
            Vision = g.Vision,
            ResolucionAprobacion = g.ResolucionAprobacion,
            FechaCreacion = g.FechaCreacion,
            CategoriaConsolidacion = g.CategoriaConsolidacion,
            Activo = g.Activo ?? false,
            Estado = g.Estado
        };
    }
}

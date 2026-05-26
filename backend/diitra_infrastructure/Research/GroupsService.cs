using diitra_application.Common.Notifications;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Research;

public class GroupsService : IGroupsService
{
    private readonly DiitraContext _context;
    private readonly diitra_application.Security.IAuditService _auditService;
    private readonly diitra_application.Security.IAuthService _authService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<GroupsService> _logger;

    public GroupsService(
        DiitraContext context, 
        diitra_application.Security.IAuditService auditService,
        diitra_application.Security.IAuthService authService,
        INotificationService notificationService,
        ILogger<GroupsService> logger)
    {
        _context = context;
        _auditService = auditService;
        _authService = authService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<IEnumerable<GroupDto>> GetAllAsync(string? search = null)
    {
        var query = _context.InvGruposInvestigacion
            .Include(g => g.IdCoordinadorNavigation)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(g => g.Nombre.Contains(search) || g.Siglas!.Contains(search));
        }

        var groups = await query.ToListAsync();

        return groups.Select(g => MapToDto(g)).ToList();
    }

    public async Task<GroupDto?> GetByUuidAsync(string uuid)
    {
        var group = await _context.InvGruposInvestigacion
            .Include(g => g.IdCoordinadorNavigation)
            .Include(g => g.IdLineas)
            .Include(g => g.InvGruposMiembros)
                .ThenInclude(m => m.IdUsuarioNavigation)
            .FirstOrDefaultAsync(g => g.Uuid == uuid);

        if (group == null) return null;

        var dto = MapToDto(group);
        dto.LineasIds = group.IdLineas.Select(l => l.IdLinea).ToList();
        dto.Miembros = group.InvGruposMiembros.Select(m => new GroupMemberDto
        {
            IdGrupoMiembro = m.IdGrupoMiembro,
            IdUsuario = m.IdUsuario,
            NombreCompleto = m.IdUsuarioNavigation?.Nombre ?? "Desconocido",
            Cedula = m.IdUsuarioNavigation?.IdSigafi,
            Rol = m.Rol,
            Activo = m.Activo ?? false,
            FechaInicio = m.FechaInicio,
            FechaFin = m.FechaFin
        }).ToList();

        return dto;
    }

    public async Task<GroupDto> CreateAsync(CreateGroupDto dto)
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

        if (dto.CarrerasIds.Any())
        {
            var carreras = await _context.Carreras
                .Where(c => dto.CarrerasIds.Contains(c.IdCarrera))
                .ToListAsync();
            foreach (var carrera in carreras) group.IdCarreras.Add(carrera);
        }

        _context.InvGruposInvestigacion.Add(group);
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

                await _notificationService.NotifyByRoleCodesAsync(
                    "Nueva Propuesta de Grupo de Investigación",
                    $"Se ha recibido una nueva propuesta de grupo: {group.Nombre}. El coordinador {coordinadorNombre ?? "No asignado"} ha enviado la solicitud para su revisión.",
                    new[] { "DIITRA_ADMIN", "ADMIN_SISTEMA", "DIRECTOR_INV" },
                    "/admin/groups",
                    new Dictionary<string, string>
                    {
                        { "Nombre del Grupo", group.Nombre },
                        { "Siglas", group.Siglas ?? "N/A" },
                        { "Tipo", group.TipoGrupo },
                        { "Coordinador", coordinadorNombre ?? "No asignado" },
                        { "Objetivo General", group.ObjetivoGeneral ?? "No especificado" },
                        { "Misión", group.Mision ?? "No especificada" },
                        { "Visión", group.Vision ?? "No especificada" },
                        { "Estado", group.Estado },
                        { "Fecha de Creación", group.FechaCreacion?.ToString("dd/MM/yyyy") ?? DateTime.UtcNow.ToString("dd/MM/yyyy") }
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar notificaciones de propuesta de grupo {Uuid}", group.Uuid);
            }
        }

        return MapToDto(group);
    }

    public async Task<GroupDto> UpdateAsync(string uuid, CreateGroupDto dto)
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
        if (dto.CarrerasIds.Any())
        {
            var carreras = await _context.Carreras.Where(c => dto.CarrerasIds.Contains(c.IdCarrera)).ToListAsync();
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

                await _notificationService.NotifyByRoleCodesAsync(
                    "Propuesta de Grupo Actualizada",
                    $"El grupo \"{group.Nombre}\" ha sido modificado y requiere revisión nuevamente.",
                    new[] { "DIITRA_ADMIN", "ADMIN_SISTEMA", "DIRECTOR_INV" },
                    "/admin/groups",
                    new Dictionary<string, string>
                    {
                        { "Nombre del Grupo", group.Nombre },
                        { "Siglas", group.Siglas ?? "N/A" },
                        { "Tipo", group.TipoGrupo },
                        { "Coordinador", coordinadorNombre ?? "No asignado" },
                        { "Objetivo General", group.ObjetivoGeneral ?? "No especificado" },
                        { "Estado", group.Estado ?? "Pendiente" }
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar notificaciones de actualización de grupo {Uuid}", group.Uuid);
            }
        }

        return MapToDto(group);
    }

    public async Task<bool> DeactivateAsync(string uuid)
    {
        var group = await _context.InvGruposInvestigacion.FirstOrDefaultAsync(g => g.Uuid == uuid);
        if (group == null) return false;

        group.Activo = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AddMemberAsync(string groupUuid, GroupMemberDto memberDto)
    {
        var group = await _context.InvGruposInvestigacion.FirstOrDefaultAsync(g => g.Uuid == groupUuid);
        if (group == null) return false;

        int userId = memberDto.IdUsuario;
        if (!string.IsNullOrEmpty(memberDto.Cedula))
        {
            var user = await _authService.GetOrProvisionUserByCedulaAsync(memberDto.Cedula);
            if (user == null) return false;
            userId = user.IdUsuario;
        }

        if (userId == 0) return false;

        // Evitar duplicados activos
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
        return true;
    }

    public async Task<bool> RemoveMemberAsync(int memberId, string? reason)
    {
        var member = await _context.InvGruposMiembros.FindAsync(memberId);
        if (member == null) return false;

        member.Activo = false;
        member.FechaFin = DateOnly.FromDateTime(DateTime.Now);
        member.MotivoSalida = reason;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReviewGroupAsync(string uuid, bool aprobado, string? resolucion)
    {
        var group = await _context.InvGruposInvestigacion.FirstOrDefaultAsync(g => g.Uuid == uuid);
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
            Activo = g.Activo ?? false,
            Estado = g.Estado
        };
    }
}

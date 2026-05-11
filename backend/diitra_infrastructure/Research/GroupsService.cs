using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace diitra_infrastructure.Research;

public class GroupsService : IGroupsService
{
    private readonly DiitraContext _context;

    public GroupsService(DiitraContext context)
    {
        _context = context;
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
                .ThenInclude(m => m.IdProfesorNavigation)
            .Include(g => g.InvGruposMiembros)
                .ThenInclude(m => m.IdAlumnoNavigation)
            .FirstOrDefaultAsync(g => g.Uuid == uuid);

        if (group == null) return null;

        var dto = MapToDto(group);
        dto.LineasIds = group.IdLineas.Select(l => l.IdLinea).ToList();
        dto.Miembros = group.InvGruposMiembros.Select(m => new GroupMemberDto
        {
            IdGrupoMiembro = m.IdGrupoMiembro,
            IdProfesor = m.IdProfesor,
            IdAlumno = m.IdAlumno,
            NombreCompleto = m.IdProfesorNavigation != null 
                ? $"{m.IdProfesorNavigation.PrimerApellido} {m.IdProfesorNavigation.PrimerNombre}"
                : (m.IdAlumnoNavigation != null ? $"{m.IdAlumnoNavigation.ApellidoPaterno} {m.IdAlumnoNavigation.PrimerNombre}" : "Desconocido"),
            Rol = m.Rol,
            Activo = m.Activo ?? false,
            FechaInicio = m.FechaInicio,
            FechaFin = m.FechaFin
        }).ToList();

        return dto;
    }

    public async Task<GroupDto> CreateAsync(CreateGroupDto dto)
    {
        var group = new InvGrupoInvestigacion
        {
            Uuid = Guid.NewGuid().ToString(),
            Nombre = dto.Nombre,
            Siglas = dto.Siglas,
            IdCoordinador = dto.IdCoordinador,
            ObjetivoGeneral = dto.ObjetivoGeneral,
            Mision = dto.Mision,
            Vision = dto.Vision,
            ResolucionAprobacion = dto.ResolucionAprobacion,
            FechaCreacion = dto.FechaCreacion,
            Activo = true
        };

        if (dto.LineasIds.Any())
        {
            var lineas = await _context.InvLineasInvestigacion
                .Where(l => dto.LineasIds.Contains(l.IdLinea))
                .ToListAsync();
            foreach (var linea in lineas)
            {
                group.IdLineas.Add(linea);
            }
        }

        _context.InvGruposInvestigacion.Add(group);
        await _context.SaveChangesAsync();

        return MapToDto(group);
    }

    public async Task<GroupDto> UpdateAsync(string uuid, CreateGroupDto dto)
    {
        var group = await _context.InvGruposInvestigacion
            .Include(g => g.IdLineas)
            .FirstOrDefaultAsync(g => g.Uuid == uuid);

        if (group == null) throw new Exception("Grupo no encontrado");

        group.Nombre = dto.Nombre;
        group.Siglas = dto.Siglas;
        group.IdCoordinador = dto.IdCoordinador;
        group.ObjetivoGeneral = dto.ObjetivoGeneral;
        group.Mision = dto.Mision;
        group.Vision = dto.Vision;
        group.ResolucionAprobacion = dto.ResolucionAprobacion;
        group.FechaCreacion = dto.FechaCreacion;

        // Actualizar líneas (M:N)
        group.IdLineas.Clear();
        if (dto.LineasIds.Any())
        {
            var lineas = await _context.InvLineasInvestigacion
                .Where(l => dto.LineasIds.Contains(l.IdLinea))
                .ToListAsync();
            foreach (var linea in lineas)
            {
                group.IdLineas.Add(linea);
            }
        }

        await _context.SaveChangesAsync();
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

        var member = new InvGrupoMiembro
        {
            IdGrupo = group.IdGrupo,
            IdProfesor = memberDto.IdProfesor,
            IdAlumno = memberDto.IdAlumno,
            Rol = memberDto.Rol,
            Activo = true,
            FechaInicio = memberDto.FechaInicio ?? DateOnly.FromDateTime(DateTime.Now)
        };

        _context.InvGruposMiembros.Add(member);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveMemberAsync(int memberId)
    {
        var member = await _context.InvGruposMiembros.FindAsync(memberId);
        if (member == null) return false;

        member.Activo = false;
        member.FechaFin = DateOnly.FromDateTime(DateTime.Now);
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
            IdCoordinador = g.IdCoordinador,
            NombreCoordinador = g.IdCoordinadorNavigation != null 
                ? $"{g.IdCoordinadorNavigation.PrimerApellido} {g.IdCoordinadorNavigation.PrimerNombre}"
                : null,
            ObjetivoGeneral = g.ObjetivoGeneral,
            Mision = g.Mision,
            Vision = g.Vision,
            ResolucionAprobacion = g.ResolucionAprobacion,
            FechaCreacion = g.FechaCreacion,
            Activo = g.Activo ?? false
        };
    }
}

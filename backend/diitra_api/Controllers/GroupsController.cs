using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Ajustar roles según sea necesario
public partial class GroupsController : ControllerBase
{
    private readonly IGroupsService _groupsService;
    private readonly DiitraContext _context;

    public GroupsController(IGroupsService groupsService, DiitraContext context)
    {
        _groupsService = groupsService;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
    {
        var userSigafiId = GetCurrentUserReference();
        var isAdmin = IsAdminUser();
        var groups = await _groupsService.GetAllAsync(search, userSigafiId, isAdmin);
        return Ok(groups);
    }

    [HttpGet("{uuid}")]
    public async Task<IActionResult> GetByUuid(string uuid)
    {
        var group = await _groupsService.GetByUuidAsync(uuid);
        if (group == null) return NotFound();
        return Ok(group);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGroupDto dto)
    {
        try 
        {
            var solicitanteNombre = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("nombre")?.Value;

            var isAdmin = User.IsInRole("DIITRA_ADMIN");
            if (!isAdmin)
            {
                dto.Estado = "Pendiente";
                if (string.IsNullOrEmpty(dto.IdProfesorCoordinador))
                {
                    dto.IdProfesorCoordinador = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                }
            }
            
            var group = await _groupsService.CreateAsync(dto, solicitanteNombre);
            return CreatedAtAction(nameof(GetByUuid), new { uuid = group.Uuid }, group);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }

    [HttpPut("{uuid}")]
    public async Task<IActionResult> Update(string uuid, [FromBody] CreateGroupDto dto)
    {
        try
        {
            var existingGroup = await _groupsService.GetByUuidAsync(uuid);
            if (existingGroup == null) return NotFound();

            if (!await CanManageGroupAsync(uuid))
            {
                return StatusCode(403, new { message = "No tienes permisos para modificar este grupo de investigación." });
            }

            var solicitanteNombre = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("nombre")?.Value;

            var isAdmin = User.IsInRole("DIITRA_ADMIN");
            if (!isAdmin)
            {
                if (existingGroup.Estado == "Pendiente")
                {
                    return BadRequest(new { message = "No se puede editar un grupo de investigación mientras se encuentra en estado PENDIENTE de revisión." });
                }
                dto.Estado = "Pendiente";
                if (string.IsNullOrEmpty(dto.IdProfesorCoordinador))
                {
                    dto.IdProfesorCoordinador = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                }
            }

            var group = await _groupsService.UpdateAsync(uuid, dto, solicitanteNombre);
            return Ok(group);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{uuid}")]
    public async Task<IActionResult> Deactivate(string uuid)
    {
        if (!await CanManageGroupAsync(uuid))
        {
            return StatusCode(403, new { message = "No tienes permisos para desactivar este grupo de investigación." });
        }

        var result = await _groupsService.DeactivateAsync(uuid);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPost("{uuid}/members")]
    public async Task<IActionResult> AddMember(string uuid, [FromBody] GroupMemberDto memberDto)
    {
        if (!await CanManageGroupAsync(uuid))
        {
            return StatusCode(403, new { message = "No tienes permisos para gestionar integrantes de este grupo." });
        }

        var result = await _groupsService.AddMemberAsync(uuid, memberDto);
        if (!result) return NotFound();
        return Ok();
    }

    [HttpDelete("members/{memberId}")]
    public async Task<IActionResult> RemoveMember(int memberId, [FromQuery] string? reason = null)
    {
        var groupUuid = await _context.InvGruposMiembros
            .Where(m => m.IdGrupoMiembro == memberId)
            .Select(m => m.IdGrupoNavigation.Uuid)
            .FirstOrDefaultAsync();

        if (string.IsNullOrEmpty(groupUuid))
        {
            return NotFound();
        }

        if (!await CanManageGroupAsync(groupUuid))
        {
            return StatusCode(403, new { message = "No tienes permisos para gestionar integrantes de este grupo." });
        }

        var result = await _groupsService.RemoveMemberAsync(memberId, reason);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPatch("{uuid}/review")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> ReviewGroup(string uuid, [FromBody] ReviewGroupRequest request)
    {
        try
        {
            var result = await _groupsService.ReviewGroupAsync(uuid, request.Aprobado, request.GetResolucion());
            if (!result) return NotFound(new { message = "Grupo no encontrado" });
            return Ok(new { message = "Grupo revisado exitosamente" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public class ReviewGroupRequest
{
    public bool Aprobado { get; set; }
    public string? Resolucion { get; set; }
    public string? ResolucionAprobacion { get; set; }

    public string? GetResolucion() =>
        !string.IsNullOrWhiteSpace(Resolucion)
            ? Resolucion
            : ResolucionAprobacion;
}

public partial class GroupsController
{
    private bool IsAdminUser() =>
        User.IsInRole("DIITRA_ADMIN");

    private string? GetCurrentUserReference() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    private async Task<bool> CanManageGroupAsync(string groupUuid)
    {
        if (IsAdminUser()) return true;

        var userRef = GetCurrentUserReference();
        if (string.IsNullOrEmpty(userRef)) return false;

        var group = await _groupsService.GetByUuidAsync(groupUuid);
        if (group == null) return false;

        return string.Equals(group.IdProfesorCoordinador?.Trim(), userRef.Trim(), StringComparison.OrdinalIgnoreCase);
    }
}


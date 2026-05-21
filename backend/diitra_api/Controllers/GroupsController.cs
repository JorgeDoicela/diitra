using diitra_application.Research;
using diitra_application.Research.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Ajustar roles según sea necesario
public class GroupsController : ControllerBase
{
    private readonly IGroupsService _groupsService;

    public GroupsController(IGroupsService groupsService)
    {
        _groupsService = groupsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
    {
        var groups = await _groupsService.GetAllAsync(search);
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
            var isAdmin = User.IsInRole("DIITRA_ADMIN") || User.IsInRole("ADMIN_SISTEMA") || User.IsInRole("DIRECTOR_INV");
            if (!isAdmin)
            {
                dto.Estado = "Pendiente";
                if (string.IsNullOrEmpty(dto.IdProfesorCoordinador))
                {
                    dto.IdProfesorCoordinador = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                }
            }
            
            var group = await _groupsService.CreateAsync(dto);
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

            var isAdmin = User.IsInRole("DIITRA_ADMIN") || User.IsInRole("ADMIN_SISTEMA") || User.IsInRole("DIRECTOR_INV");
            if (!isAdmin)
            {
                dto.Estado = "Pendiente";
                if (string.IsNullOrEmpty(dto.IdProfesorCoordinador))
                {
                    dto.IdProfesorCoordinador = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                }
            }

            var group = await _groupsService.UpdateAsync(uuid, dto);
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
        var result = await _groupsService.DeactivateAsync(uuid);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPost("{uuid}/members")]
    public async Task<IActionResult> AddMember(string uuid, [FromBody] GroupMemberDto memberDto)
    {
        var result = await _groupsService.AddMemberAsync(uuid, memberDto);
        if (!result) return NotFound();
        return Ok();
    }

    [HttpDelete("members/{memberId}")]
    public async Task<IActionResult> RemoveMember(int memberId)
    {
        var result = await _groupsService.RemoveMemberAsync(memberId);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPatch("{uuid}/review")]
    [Authorize(Roles = "DIITRA_ADMIN,ADMIN_SISTEMA,DIRECTOR_INV")]
    public async Task<IActionResult> ReviewGroup(string uuid, [FromBody] ReviewGroupRequest request)
    {
        try
        {
            var result = await _groupsService.ReviewGroupAsync(uuid, request.Aprobado, request.Resolucion);
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
}


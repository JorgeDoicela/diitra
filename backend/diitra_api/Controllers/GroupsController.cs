using diitra_application.Research;
using diitra_application.Research.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
    // [Authorize(Roles = "ADMIN_SISTEMA,DIRECTOR_INV")]
    public async Task<IActionResult> Create([FromBody] CreateGroupDto dto)
    {
        var group = await _groupsService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetByUuid), new { uuid = group.Uuid }, group);
    }

    [HttpPut("{uuid}")]
    public async Task<IActionResult> Update(string uuid, [FromBody] CreateGroupDto dto)
    {
        try
        {
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
}

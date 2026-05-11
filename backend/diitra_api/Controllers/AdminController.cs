using Microsoft.AspNetCore.Mvc;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using diitra_domain.Identity.Enums;
using Microsoft.AspNetCore.Authorization;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN_SIST")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] string type = "DOCENTE")
    {
        var users = await _adminService.GetUsersAsync(search, type);
        return Ok(users);
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _adminService.GetAvailableRolesAsync();
        return Ok(roles);
    }

    [HttpGet("metadata/{uuid}")]
    public async Task<IActionResult> GetMetadata(string uuid)
    {
        var meta = await _adminService.GetUserMetadataAsync(uuid);
        if (meta == null) return NotFound();
        return Ok(meta);
    }

    [HttpPut("metadata/{uuid}")]
    public async Task<IActionResult> UpdateMetadata(string uuid, [FromBody] UserMetadataDto dto)
    {
        var admin = User.Identity?.Name;
        var result = await _adminService.UpdateUserMetadataAsync(uuid, dto, admin);
        if (!result) return NotFound();
        return Ok(new { message = "Metadata actualizada" });
    }

    [HttpPost("roles/assign")]
    public async Task<IActionResult> AssignRole([FromBody] RoleActionRequest request)
    {
        var admin = User.Identity?.Name;
        var roleIdentifier = !string.IsNullOrEmpty(request.RoleCode) ? request.RoleCode : request.RoleName;
        
        if (string.IsNullOrEmpty(request.IdUsuario) || string.IsNullOrEmpty(roleIdentifier))
        {
            return BadRequest(new { message = "Datos incompletos" });
        }

        var result = await _adminService.AssignRoleAsync(request.IdUsuario, roleIdentifier, request.UserType, admin);
        if (result) return Ok(new { message = "Rol asignado correctamente" });
        
        return BadRequest(new { message = "Error al asignar rol" });
    }

    [HttpPost("roles/revoke")]
    public async Task<IActionResult> RevokeRole([FromBody] RoleActionRequest request)
    {
        var admin = User.Identity?.Name;
        var roleIdentifier = !string.IsNullOrEmpty(request.RoleCode) ? request.RoleCode : request.RoleName;

        if (string.IsNullOrEmpty(request.IdUsuario) || string.IsNullOrEmpty(roleIdentifier))
        {
            return BadRequest(new { message = "Datos incompletos" });
        }

        var result = await _adminService.RevokeRoleAsync(request.IdUsuario, roleIdentifier, request.UserType, admin);
        if (result) return Ok(new { message = "Rol revocado correctamente" });
        
        return BadRequest(new { message = "Error al revocar rol" });
    }

    [HttpPost("external")]
    public async Task<IActionResult> RegisterExternal([FromBody] ExternalUserDto dto)
    {
        var admin = User.Identity?.Name;
        var result = await _adminService.RegisterExternalUserAsync(dto, admin);
        if (result) return Ok(new { message = "Evaluador externo registrado" });
        return BadRequest(new { message = "El usuario ya existe o hubo un error" });
    }

    [HttpGet("audit")]
    public async Task<IActionResult> GetAuditLogs()
    {
        var logs = await _adminService.GetRecentAuditLogsAsync();
        return Ok(logs);
    }
}

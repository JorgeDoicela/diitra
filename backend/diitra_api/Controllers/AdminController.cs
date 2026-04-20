using Microsoft.AspNetCore.Mvc;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador del Sistema")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? search)
    {
        var users = await _adminService.GetProfessorsAsync(search);
        return Ok(users);
    }

    [HttpPost("roles/assign")]
    public async Task<IActionResult> AssignRole([FromBody] RoleActionRequest request)
    {
        if (string.IsNullOrEmpty(request.IdProfesor) || string.IsNullOrEmpty(request.RoleName))
        {
            return BadRequest(new { message = "Datos incompletos" });
        }

        var result = await _adminService.AssignRoleAsync(request.IdProfesor, request.RoleName);
        if (result) return Ok(new { message = "Rol asignado correctamente" });
        
        return BadRequest(new { message = "Error al asignar rol" });
    }

    [HttpPost("roles/revoke")]
    public async Task<IActionResult> RevokeRole([FromBody] RoleActionRequest request)
    {
        if (string.IsNullOrEmpty(request.IdProfesor) || string.IsNullOrEmpty(request.RoleName))
        {
            return BadRequest(new { message = "Datos incompletos" });
        }

        var result = await _adminService.RevokeRoleAsync(request.IdProfesor, request.RoleName);
        if (result) return Ok(new { message = "Rol revocado correctamente" });
        
        return BadRequest(new { message = "Error al revocar rol" });
    }
}

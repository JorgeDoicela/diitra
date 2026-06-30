using Microsoft.AspNetCore.Mvc;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using diitra_domain.Identity.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "DIITRA_ADMIN")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly diitra_api.Services.BackupBackgroundService _backupService;
    private readonly diitra_infrastructure.data.models.DiitraContext _context;

    public AdminController(
        IAdminService adminService,
        diitra_api.Services.BackupBackgroundService backupService,
        diitra_infrastructure.data.models.DiitraContext context)
    {
        _adminService = adminService;
        _backupService = backupService;
        _context = context;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search, 
        [FromQuery] string type = "DOCENTE",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? carrera = null)
    {
        var users = await _adminService.GetUsersAsync(search, type, page, pageSize, carrera);
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
        var result = await _adminService.UpdateUserMetadataAsync(uuid, dto);
        if (!result) return NotFound();
        return Ok(new { message = "Metadata actualizada" });
    }

    [HttpPost("roles/assign")]
    public async Task<IActionResult> AssignRole([FromBody] RoleActionRequest request)
    {
        var roleIdentifier = !string.IsNullOrEmpty(request.RoleCode) ? request.RoleCode : request.RoleName;

        if (string.IsNullOrEmpty(request.IdUsuario) || string.IsNullOrEmpty(roleIdentifier))
        {
            return BadRequest(new { message = "Datos incompletos" });
        }

        var result = await _adminService.AssignRoleAsync(request.IdUsuario, roleIdentifier, request.UserType);
        if (result) return Ok(new { message = "Rol asignado correctamente" });

        return BadRequest(new { message = "Error al asignar rol" });
    }

    [HttpPost("roles/revoke")]
    public async Task<IActionResult> RevokeRole([FromBody] RoleActionRequest request)
    {
        var roleIdentifier = !string.IsNullOrEmpty(request.RoleCode) ? request.RoleCode : request.RoleName;

        if (string.IsNullOrEmpty(request.IdUsuario) || string.IsNullOrEmpty(roleIdentifier))
        {
            return BadRequest(new { message = "Datos incompletos" });
        }

        var result = await _adminService.RevokeRoleAsync(request.IdUsuario, roleIdentifier, request.UserType);
        if (result) return Ok(new { message = "Rol revocado correctamente" });

        return BadRequest(new { message = "Error al revocar rol" });
    }

    [HttpPost("external")]
    public async Task<IActionResult> RegisterExternal([FromBody] ExternalUserDto dto)
    {
        try
        {
            var result = await _adminService.RegisterExternalUserAsync(dto);
            if (result) return Ok(new { message = "Evaluador externo registrado" });
            return BadRequest(new { message = "No se pudo registrar el evaluador." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("audit")]
    public async Task<IActionResult> GetAuditLogs()
    {
        var logs = await _adminService.GetRecentAuditLogsAsync();
        return Ok(logs);
    }

    [HttpGet("audit/advanced")]
    public async Task<IActionResult> GetAuditLogsAdvanced(
        [FromQuery] DateTime? from, 
        [FromQuery] DateTime? to, 
        [FromQuery] string? action, 
        [FromQuery] string? modulo, 
        [FromQuery] string? search, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        var logs = await _adminService.GetAuditLogsPagedAsync(from, to, action, modulo, search, page, pageSize);
        return Ok(logs);
    }

    /// <summary>
    /// Lista el historial de copias de seguridad del sistema (Solo administradores).
    /// </summary>
    [HttpGet("backups")]
    public async Task<IActionResult> GetBackupLogs()
    {
        var logs = await _context.InvBackupLogs
            .OrderByDescending(l => l.FechaBackup)
            .Select(l => new 
            {
                l.IdBackup,
                l.Uuid,
                l.FechaBackup,
                l.Tipo,
                l.Destino,
                l.NombreArchivo,
                l.TamanioBytes,
                l.Estado,
                l.HashVerificacion,
                l.ErrorMensaje
            })
            .ToListAsync();
        return Ok(logs);
    }

    /// <summary>
    /// Desencadena manualmente una copia de seguridad local (Base de datos + Archivos).
    /// </summary>
    [HttpPost("backups/trigger")]
    public async Task<IActionResult> TriggerBackup()
    {
        try
        {
            // Ejecutar el respaldo de forma asíncrona en segundo plano para no bloquear la respuesta HTTP
            _ = Task.Run(async () => 
            {
                await _backupService.RunBackupAndRetentionAsync(CancellationToken.None);
            });

            return Ok(new { message = "Proceso de copia de seguridad iniciado en segundo plano." });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { error = "No se pudo iniciar el respaldo.", detalles = ex.Message });
        }
    }
}

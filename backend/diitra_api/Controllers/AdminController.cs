using Microsoft.AspNetCore.Mvc;
using diitra_application.Security;
using diitra_application.Security.DTOs;
using diitra_domain.Identity.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly diitra_api.Services.BackupBackgroundService _backupService;
    private readonly diitra_infrastructure.data.models.DiitraContext _context;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;

    public AdminController(
        IAdminService adminService,
        diitra_api.Services.BackupBackgroundService backupService,
        diitra_infrastructure.data.models.DiitraContext context,
        Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        _adminService = adminService;
        _backupService = backupService;
        _context = context;
        _configuration = configuration;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search, 
        [FromQuery] string type = "DOCENTE",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? carrera = null,
        [FromQuery] bool soloConHoras = false,
        [FromQuery] string estadoEstudiante = "ACTIVO",
        [FromQuery] string origenEstudiante = "INSTITUTO",
        [FromQuery] string? departamento = null,
        [FromQuery] string? nivel = null)
    {
        var users = await _adminService.GetUsersAsync(search, type, page, pageSize, carrera, soloConHoras, estadoEstudiante, origenEstudiante, departamento, nivel);
        return Ok(users);
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _adminService.GetAvailableRolesAsync();
        return Ok(roles);
    }

    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments()
    {
        var departments = await _adminService.GetDepartmentsAsync();
        return Ok(departments);
    }

    [HttpGet("metadata/{uuid}")]
    public async Task<IActionResult> GetMetadata(string uuid)
    {
        var meta = await _adminService.GetUserMetadataAsync(uuid);
        if (meta == null) return NotFound();
        return Ok(meta);
    }

    [HttpPut("metadata/{uuid}")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> UpdateMetadata(string uuid, [FromBody] UserMetadataDto dto)
    {
        try
        {
            var result = await _adminService.UpdateUserMetadataAsync(uuid, dto);
            if (!result) return NotFound();
            return Ok(new { message = "Perfil actualizado con éxito." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("roles/assign")]
    [Authorize(Roles = "DIITRA_ADMIN")]
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
    [Authorize(Roles = "DIITRA_ADMIN")]
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
    [Authorize(Roles = "DIITRA_ADMIN")]
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
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> GetAuditLogs()
    {
        var logs = await _adminService.GetRecentAuditLogsAsync();
        return Ok(logs);
    }

    [HttpGet("audit/advanced")]
    [Authorize(Roles = "DIITRA_ADMIN")]
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
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> GetBackupLogs()
    {
        var destFolder = _configuration["BackupSettings:DestinationFolder"] ?? "backups";
        var rootDir = System.IO.Directory.GetCurrentDirectory();
        var destAbsPath = System.IO.Path.GetFullPath(System.IO.Path.Combine(rootDir, destFolder));

        var logs = await _context.InvBackupLogs
            .OrderByDescending(l => l.FechaBackup)
            .ToListAsync();

        var result = logs.Select(l => new 
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
            l.ErrorMensaje,
            isFilePresent = !string.IsNullOrEmpty(l.NombreArchivo) && System.IO.File.Exists(System.IO.Path.Combine(destAbsPath, l.NombreArchivo))
        });

        return Ok(result);
    }

    /// <summary>
    /// Desencadena manualmente una copia de seguridad local (Base de datos + Archivos).
    /// </summary>
    [HttpPost("backups/trigger")]
    [Authorize(Roles = "DIITRA_ADMIN")]
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

    /// <summary>
    /// Descarga un archivo de copia de seguridad por su UUID de auditoría (Solo administradores).
    /// </summary>
    [HttpGet("backups/download/{uuid}")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> DownloadBackup(System.Guid uuid)
    {
        try
        {
            var log = await _context.InvBackupLogs.FirstOrDefaultAsync(l => l.Uuid == uuid);
            if (log == null || string.IsNullOrEmpty(log.NombreArchivo))
            {
                return NotFound(new { message = "Registro de copia de seguridad no encontrado." });
            }

            var destFolder = _configuration["BackupSettings:DestinationFolder"] ?? "backups";
            var rootDir = System.IO.Directory.GetCurrentDirectory();
            var destAbsPath = System.IO.Path.GetFullPath(System.IO.Path.Combine(rootDir, destFolder));
            var filePath = System.IO.Path.Combine(destAbsPath, log.NombreArchivo);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "El archivo físico de respaldo ya no existe o fue depurado por la política de retención (30 días)." });
            }

            var contentType = log.NombreArchivo.EndsWith(".zip", System.StringComparison.OrdinalIgnoreCase) 
                ? "application/zip" 
                : "application/sql";

            var bytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(bytes, contentType, log.NombreArchivo);
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { message = "Error al procesar la descarga del archivo de respaldo.", detalles = ex.Message });
        }
    }

    /// <summary>
    /// Obtiene información física del volumen de almacenamiento del servidor (Disco).
    /// </summary>
    [HttpGet("backups/disk-info")]
    public IActionResult GetDiskInfo()
    {
        try
        {
            var destFolder = _configuration["BackupSettings:DestinationFolder"] ?? "backups";
            var rootDir = System.IO.Directory.GetCurrentDirectory();
            var destAbsPath = System.IO.Path.GetFullPath(System.IO.Path.Combine(rootDir, destFolder));

            var driveRoot = System.IO.Path.GetPathRoot(destAbsPath) ?? "C:\\";
            var drive = new System.IO.DriveInfo(driveRoot);

            long totalSpace = drive.TotalSize;
            long freeSpace = drive.AvailableFreeSpace;
            long usedSpace = totalSpace - freeSpace;
            double usedPercentage = totalSpace > 0 ? System.Math.Round((double)usedSpace / totalSpace * 100, 1) : 0;

            return Ok(new
            {
                driveName = drive.Name,
                driveFormat = drive.DriveFormat,
                totalSizeBytes = totalSpace,
                freeSizeBytes = freeSpace,
                usedSizeBytes = usedSpace,
                usedPercentage = usedPercentage
            });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { message = "Error al consultar la información del disco del servidor.", detalles = ex.Message });
        }
    }

    /// <summary>
    /// Re-verifica en vivo la integridad del hash SHA-256 de un archivo de respaldo.
    /// </summary>
    [HttpPost("backups/verify/{uuid}")]
    public async Task<IActionResult> VerifyBackupIntegrity(System.Guid uuid)
    {
        try
        {
            var log = await _context.InvBackupLogs.FirstOrDefaultAsync(l => l.Uuid == uuid);
            if (log == null || string.IsNullOrEmpty(log.NombreArchivo))
            {
                return NotFound(new { success = false, message = "Registro de respaldo no encontrado." });
            }

            var destFolder = _configuration["BackupSettings:DestinationFolder"] ?? "backups";
            var rootDir = System.IO.Directory.GetCurrentDirectory();
            var destAbsPath = System.IO.Path.GetFullPath(System.IO.Path.Combine(rootDir, destFolder));
            var filePath = System.IO.Path.Combine(destAbsPath, log.NombreArchivo);

            if (!System.IO.File.Exists(filePath))
            {
                return Ok(new { 
                    success = false, 
                    isMatch = false, 
                    message = "El archivo físico ya no existe en el disco del servidor." 
                });
            }

            using var sha256 = System.Security.Cryptography.SHA256.Create();
            using var stream = System.IO.File.OpenRead(filePath);
            var hashBytes = await sha256.ComputeHashAsync(stream);
            var currentHash = System.BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
            
            var recordedHash = log.HashVerificacion?.ToLowerInvariant();
            bool isMatch = !string.IsNullOrEmpty(recordedHash) && recordedHash == currentHash;

            return Ok(new {
                success = true,
                isMatch = isMatch,
                currentHash = currentHash,
                recordedHash = recordedHash,
                message = isMatch 
                    ? "Integridad del archivo confirmada. El checksum SHA-256 coincide con el registro original." 
                    : "¡Advertencia! El hash SHA-256 difiere del registro grabado al momento de la creación."
            });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Error al verificar la integridad del archivo.", detalles = ex.Message });
        }
    }

    /// <summary>
    /// Elimina de forma permanente el archivo físico de un respaldo y actualiza su estado.
    /// </summary>
    [HttpDelete("backups/{uuid}")]
    public async Task<IActionResult> PurgeBackupFile(System.Guid uuid)
    {
        try
        {
            var log = await _context.InvBackupLogs.FirstOrDefaultAsync(l => l.Uuid == uuid);
            if (log == null)
            {
                return NotFound(new { success = false, message = "Registro de respaldo no encontrado." });
            }

            var destFolder = _configuration["BackupSettings:DestinationFolder"] ?? "backups";
            var rootDir = System.IO.Directory.GetCurrentDirectory();
            var destAbsPath = System.IO.Path.GetFullPath(System.IO.Path.Combine(rootDir, destFolder));
            var filePath = System.IO.Path.Combine(destAbsPath, log.NombreArchivo);

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            _context.InvBackupLogs.Remove(log);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "El registro y el archivo físico de respaldo han sido eliminados de forma permanente de la base de datos y del disco." });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Error al eliminar el respaldo.", detalles = ex.Message });
        }
    }
}

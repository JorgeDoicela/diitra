using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Diitra.Application.Research;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using diitra_infrastructure.data.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace diitra_api.Controllers;

/// <summary>
/// Gestión de Informes de Avance de proyectos de investigación.
/// Flujo: Director de Proyecto crea el informe → Director de Investigación lo aprueba u observa → Firma digital opcional.
/// </summary>
[ApiController]
[Route("api/informes-avance")]
[Authorize]
public class InformesAvanceController : ControllerBase
{
    private readonly IInformeAvanceService _service;
    private readonly DiitraContext _context;
    private readonly IProjectOrchestrator _projectOrchestrator;

    public InformesAvanceController(
        IInformeAvanceService service,
        DiitraContext context,
        IProjectOrchestrator projectOrchestrator)
    {
        _service = service;
        _context = context;
        _projectOrchestrator = projectOrchestrator;
    }

    /// <summary>Obtiene un informe por su ID.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var informe = await _service.GetByIdAsync(id);
        return informe == null ? NotFound() : Ok(informe);
    }

    /// <summary>
    /// Obtiene todos los informes de avance de un proyecto específico por ID numérico.
    /// </summary>
    [HttpGet("proyecto/{projectId:int}")]
    public async Task<IActionResult> GetByProject(int projectId)
    {
        var informes = await _service.GetByProjectAsync(projectId);
        return Ok(informes);
    }

    /// <summary>
    /// Obtiene todos los informes de avance de un proyecto específico por UUID.
    /// Permite que el frontend use el UUID del proyecto (que está en la URL del workspace)
    /// sin necesidad de conocer el ID numérico interno.
    /// </summary>
    [HttpGet("proyecto/uuid/{uuid}")]
    public async Task<IActionResult> GetByProjectUuid(string uuid)
    {
        var canonicalUuid = await _projectOrchestrator.ResolveCanonicalUuidAsync(uuid);
        if (canonicalUuid == null)
            return NotFound(new { message = $"No se encontró un proyecto con identificador '{uuid}'." });

        var project = await _context.InvProyectos
            .Where(p => p.Uuid == canonicalUuid)
            .Select(p => new { p.IdProyecto })
            .FirstOrDefaultAsync();

        if (project == null)
            return NotFound(new { message = $"No se encontró un proyecto con UUID '{canonicalUuid}'." });

        var informes = await _service.GetByProjectAsync(project.IdProyecto);
        return Ok(informes);
    }

    /// <summary>
    /// Crea un nuevo informe de avance. El número se asigna automáticamente.
    /// Solo disponible para proyectos en estado 'En Ejecución'.
    /// Si IdProyecto es 0 pero se proporciona ProjectUuid, se resuelve el ID numérico internamente.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInformeAvanceDto dto)
    {
        var userIdClaim = User.FindFirstValue("id_usuario");
        if (!int.TryParse(userIdClaim, out int userId))
            return Unauthorized(new { message = "No se pudo identificar al usuario autenticado." });

        var userUuidRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userUuidRef)) return Unauthorized();

        // Resolver IdProyecto y ProjectUuid para verificación de permisos
        string? projectUuid = dto.ProjectUuid;
        if (string.IsNullOrEmpty(projectUuid) && dto.IdProyecto != 0)
        {
            var p = await _context.InvProyectos.FindAsync(dto.IdProyecto);
            if (p != null) projectUuid = p.Uuid;
        }

        if (!string.IsNullOrEmpty(projectUuid))
        {
            var isSystemAdmin = await _projectOrchestrator.IsSystemAdminAsync(userUuidRef);
            var isProjectDirector = await _projectOrchestrator.IsProjectDirectorAsync(projectUuid, userUuidRef);

            if (!isSystemAdmin && !isProjectDirector)
            {
                return Forbid("Solo el Director del Proyecto o el Administrador del Sistema pueden registrar informes de avance.");
            }
        }

        // Resolver IdProyecto desde UUID cuando el frontend solo tiene el UUID
        if (dto.IdProyecto == 0 && !string.IsNullOrEmpty(dto.ProjectUuid))
        {
            var canonicalUuid = await _projectOrchestrator.ResolveCanonicalUuidAsync(dto.ProjectUuid);
            if (canonicalUuid == null)
                return NotFound(new { message = $"No se encontró un proyecto con identificador '{dto.ProjectUuid}'." });

            var project = await _context.InvProyectos
                .Where(p => p.Uuid == canonicalUuid)
                .Select(p => new { p.IdProyecto })
                .FirstOrDefaultAsync();

            if (project == null)
                return NotFound(new { message = $"No se encontró un proyecto con UUID '{canonicalUuid}'." });

            dto.IdProyecto = project.IdProyecto;
        }

        if (dto.IdProyecto == 0)
            return BadRequest(new { message = "Se requiere IdProyecto o ProjectUuid." });

        try
        {
            var informe = await _service.CreateAsync(dto, userId);
            return CreatedAtAction(nameof(GetById), new { id = informe.IdInforme }, informe);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Aprueba un informe de avance. Solo el Director de Investigación puede ejecutar esta acción.
    /// Cambia el estado de 'Pendiente'/'Observado' a 'Aprobado'.
    /// </summary>
    [HttpPost("{id:int}/aprobar")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> Aprobar(int id)
    {
        var userIdClaim = User.FindFirstValue("id_usuario");
        if (!int.TryParse(userIdClaim, out int userId))
            return Unauthorized(new { message = "No se pudo identificar al usuario autenticado." });

        try
        {
            var informe = await _service.AprobarAsync(id, userId);
            return informe == null
                ? NotFound(new { message = $"Informe {id} no encontrado." })
                : Ok(informe);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Observa un informe, marcándolo para revisión con el motivo indicado.
    /// Solo disponible cuando el informe está en estado 'Pendiente'.
    /// </summary>
    [HttpPost("{id:int}/observar")]
    [Authorize(Roles = "DIITRA_ADMIN")]
    public async Task<IActionResult> Observar(int id, [FromBody] ObservarInformeAvanceDto dto)
    {
        var userIdClaim = User.FindFirstValue("id_usuario");
        if (!int.TryParse(userIdClaim, out int userId))
            return Unauthorized(new { message = "No se pudo identificar al usuario autenticado." });

        try
        {
            var informe = await _service.ObservarAsync(id, dto.Observacion, userId);
            return informe == null
                ? NotFound(new { message = $"Informe {id} no encontrado." })
                : Ok(informe);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Aplica firma digital avanzada (PAdES) al informe usando el certificado PKCS#12 proporcionado.
    /// Calcula y persiste el hash criptográfico para cadena de custodia CACES.
    /// </summary>
    [HttpPost("{id:int}/firmar")]
    public async Task<IActionResult> FirmarDigitalmente(int id, [FromBody] FirmarInformeAvanceDto dto)
    {
        var userUuidRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userUuidRef)) return Unauthorized();

        var informe = await _context.InvInformesAvance
            .Include(i => i.IdProyectoNavigation)
            .FirstOrDefaultAsync(i => i.IdInforme == id);

        if (informe == null) return NotFound(new { message = $"Informe {id} no encontrado." });

        var isSystemAdmin = await _projectOrchestrator.IsSystemAdminAsync(userUuidRef);
        var isDirectorInv = User.IsInRole("DIITRA_ADMIN");
        var isProjectDirector = informe.IdProyectoNavigation != null && await _projectOrchestrator.IsProjectDirectorAsync(informe.IdProyectoNavigation.Uuid, userUuidRef);

        if (!isSystemAdmin && !isDirectorInv && !isProjectDirector)
        {
            return Forbid("No tienes permisos para firmar digitalmente este informe.");
        }

        try
        {
            byte[] certBytes = Convert.FromBase64String(dto.CertificadoBase64);
            bool ok = await _service.FirmarDigitalmenteAsync(id, certBytes, dto.PasswordCertificado);
            return ok
                ? Ok(new { success = true, message = "Informe firmado digitalmente con éxito." })
                : NotFound(new { message = $"Informe {id} no encontrado." });
        }
        catch (FormatException)
        {
            return BadRequest(new { message = "El certificado no está en formato Base64 válido." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

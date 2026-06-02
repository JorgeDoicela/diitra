using System;
using System.Security.Claims;
using System.Threading.Tasks;
using diitra_application.Research;
using diitra_application.Research.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

    public InformesAvanceController(IInformeAvanceService service)
    {
        _service = service;
    }

    /// <summary>Obtiene un informe por su ID.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var informe = await _service.GetByIdAsync(id);
        return informe == null ? NotFound() : Ok(informe);
    }

    /// <summary>
    /// Obtiene todos los informes de avance de un proyecto específico, ordenados por número de informe.
    /// </summary>
    [HttpGet("proyecto/{projectId:int}")]
    public async Task<IActionResult> GetByProject(int projectId)
    {
        var informes = await _service.GetByProjectAsync(projectId);
        return Ok(informes);
    }

    /// <summary>
    /// Crea un nuevo informe de avance. El número se asigna automáticamente.
    /// Solo disponible para proyectos en estado 'En Ejecución'.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInformeAvanceDto dto)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out int userId))
            return Unauthorized(new { message = "No se pudo identificar al usuario autenticado." });

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
    public async Task<IActionResult> Aprobar(int id)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
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
    public async Task<IActionResult> Observar(int id, [FromBody] ObservarInformeAvanceDto dto)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
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

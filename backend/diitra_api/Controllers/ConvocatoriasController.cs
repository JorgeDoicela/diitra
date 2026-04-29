using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using diitra_application.Research;
using diitra_application.Research.Dtos;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConvocatoriasController : ControllerBase
{
    private readonly IConvocatoriaService _convocatoriaService;

    public ConvocatoriasController(IConvocatoriaService convocatoriaService)
    {
        _convocatoriaService = convocatoriaService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _convocatoriaService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{uuid}")]
    public async Task<IActionResult> GetByUuid(string uuid)
    {
        var result = await _convocatoriaService.GetByUuidAsync(uuid);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("periodos")]
    public async Task<IActionResult> GetPeriods()
    {
        var result = await _convocatoriaService.GetActivePeriodsAsync();
        return Ok(result);
    }

    [HttpGet("catalogos/tipos")]
    public async Task<IActionResult> GetCatalogosTipos()
    {
        var result = await _convocatoriaService.GetCatalogosTiposAsync();
        return Ok(result);
    }

    [HttpGet("catalogos/agendas")]
    public async Task<IActionResult> GetCatalogosAgendas()
    {
        var result = await _convocatoriaService.GetCatalogosAgendasAsync();
        return Ok(result);
    }

    [HttpPost]
    // [Authorize(Roles = "ADMIN_SISTEMA,DIRECTOR_INV")] 
    public async Task<IActionResult> Create([FromBody] CreateConvocatoriaDto dto)
    {
        var uuid = await _convocatoriaService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetByUuid), new { uuid }, new { uuid });
    }

    [HttpPut("{uuid}")]
    public async Task<IActionResult> Update(string uuid, [FromBody] CreateConvocatoriaDto dto)
    {
        var result = await _convocatoriaService.UpdateAsync(uuid, dto);
        if (!result) return NotFound();
        return Ok(new { message = "Convocatoria actualizada" });
    }

    [HttpPatch("{uuid}/status")]
    public async Task<IActionResult> ChangeStatus(string uuid, [FromQuery] string status)
    {
        var result = await _convocatoriaService.ChangeStatusAsync(uuid, status);
        if (!result) return NotFound();
        return Ok(new { message = $"Estado actualizado a {status}" });
    }

    [HttpDelete("{uuid}")]
    public async Task<IActionResult> Delete(string uuid)
    {
        var result = await _convocatoriaService.DeleteAsync(uuid);
        if (!result) return NotFound();
        return Ok(new { message = "Convocatoria eliminada" });
    }
}

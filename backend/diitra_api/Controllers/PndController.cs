using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PndController : ControllerBase
{
    private readonly DiitraContext _context;

    public PndController(DiitraContext context)
    {
        _context = context;
    }

    [HttpGet("objetivos")]
    public async Task<IActionResult> GetObjetivos()
    {
        var objetivos = await _context.InvPndObjetivos
            .Where(o => o.Activo == true)
            .OrderBy(o => o.Codigo)
            .Select(o => new {
                o.IdObjetivoPnd,
                o.Uuid,
                o.Codigo,
                o.Nombre,
                o.Descripcion
            })
            .ToListAsync();
        
        return Ok(objetivos);
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/catalogs")]
    public class CatalogsController : ControllerBase
    {
        private readonly DiitraContext _context;

        public CatalogsController(DiitraContext context)
        {
            _context = context;
        }

        [HttpGet("tipo-producto")]
        public async Task<IActionResult> GetTiposProducto()
        {
            var data = await _context.InvCatTipoProductos
                .Where(t => t.Activo == true)
                .OrderBy(t => t.Nombre)
                .ToListAsync();
            return Ok(data);
        }

        [HttpGet("tipo-evidencia")]
        public async Task<IActionResult> GetTiposEvidencia()
        {
            var data = await _context.InvCatTipoEvidencias
                .Where(t => t.Activo == true)
                .OrderBy(t => t.Nombre)
                .ToListAsync();
            return Ok(data);
        }

        [HttpGet("entidades-externas")]
        public async Task<IActionResult> GetEntidadesExternas()
        {
            var data = await _context.InvEntidadesExternas
                .Where(e => e.Activo == true)
                .OrderBy(e => e.RazonSocial)
                .ToListAsync();
            return Ok(data);
        }

        [HttpGet("config-indicadores")]
        public async Task<IActionResult> GetConfigIndicadores()
        {
            var data = await _context.InvConfigIndicadores
                .Where(i => i.Activo == true)
                .OrderBy(i => i.CodigoIndicador)
                .ToListAsync();
            return Ok(data);
        }
    }
}

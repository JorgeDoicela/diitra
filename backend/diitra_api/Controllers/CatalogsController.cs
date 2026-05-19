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
                .OrderByDescending(t => t.Activo)
                .ThenBy(t => t.Nombre)
                .ToListAsync();
            return Ok(data);
        }

        [HttpPost("tipo-producto")]
        public async Task<IActionResult> CreateTipoProducto([FromBody] InvCatTipoProducto model)
        {
            if (string.IsNullOrEmpty(model.Nombre)) return BadRequest("Nombre requerido");
            if (string.IsNullOrEmpty(model.Categoria)) return BadRequest("Categoría requerida");
            model.Uuid = System.Guid.NewGuid().ToString();
            model.Activo = true;
            _context.InvCatTipoProductos.Add(model);
            await _context.SaveChangesAsync();
            return Created($"/api/catalogs/tipo-producto/{model.Uuid}", model);
        }

        [HttpPut("tipo-producto/{uuid}")]
        public async Task<IActionResult> UpdateTipoProducto(string uuid, [FromBody] InvCatTipoProducto model)
        {
            var existing = await _context.InvCatTipoProductos.FirstOrDefaultAsync(t => t.Uuid == uuid);
            if (existing == null) return NotFound();

            existing.Nombre = model.Nombre;
            existing.Categoria = model.Categoria;
            existing.RequiereRegistro = model.RequiereRegistro;
            existing.Activo = model.Activo;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("tipo-producto/{uuid}")]
        public async Task<IActionResult> ToggleTipoProducto(string uuid)
        {
            var existing = await _context.InvCatTipoProductos.FirstOrDefaultAsync(t => t.Uuid == uuid);
            if (existing == null) return NotFound();

            existing.Activo = !(existing.Activo ?? true);
            await _context.SaveChangesAsync();
            return Ok(existing);
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
                .OrderByDescending(i => i.Activo)
                .ThenBy(i => i.CodigoIndicador)
                .ToListAsync();
            return Ok(data);
        }

        [HttpPost("config-indicadores")]
        public async Task<IActionResult> CreateConfigIndicador([FromBody] InvConfigIndicador model)
        {
            if (string.IsNullOrEmpty(model.CodigoIndicador)) return BadRequest("Código de indicador requerido");
            if (string.IsNullOrEmpty(model.NombreIndicador)) return BadRequest("Nombre de indicador requerido");
            model.Activo = true;
            _context.InvConfigIndicadores.Add(model);
            await _context.SaveChangesAsync();
            return Created($"/api/catalogs/config-indicadores/{model.IdConfig}", model);
        }

        [HttpPut("config-indicadores/{id}")]
        public async Task<IActionResult> UpdateConfigIndicador(int id, [FromBody] InvConfigIndicador model)
        {
            var existing = await _context.InvConfigIndicadores.FirstOrDefaultAsync(i => i.IdConfig == id);
            if (existing == null) return NotFound();

            existing.CodigoIndicador = model.CodigoIndicador;
            existing.NombreIndicador = model.NombreIndicador;
            existing.Descripcion = model.Descripcion;
            existing.TipoDato = model.TipoDato;
            existing.ValorReferencia = model.ValorReferencia;
            existing.AñoNormativa = model.AñoNormativa;
            existing.Activo = model.Activo;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("config-indicadores/{id}")]
        public async Task<IActionResult> ToggleConfigIndicador(int id)
        {
            var existing = await _context.InvConfigIndicadores.FirstOrDefaultAsync(i => i.IdConfig == id);
            if (existing == null) return NotFound();

            existing.Activo = !(existing.Activo ?? true);
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpGet("dominios")]
        public async Task<IActionResult> GetDominios()
        {
            var data = await _context.InvDominios
                .OrderByDescending(d => d.Activo)
                .ThenBy(d => d.Nombre)
                .ToListAsync();
            return Ok(data);
        }

        [HttpPost("dominios")]
        public async Task<IActionResult> CreateDominio([FromBody] InvDominio model)
        {
            if (string.IsNullOrEmpty(model.Nombre)) return BadRequest("Nombre requerido");
            model.Uuid = System.Guid.NewGuid().ToString();
            model.FechaRegistro = DateTime.Now;
            model.Activo = true;
            _context.InvDominios.Add(model);
            await _context.SaveChangesAsync();
            return Created($"/api/catalogs/dominios/{model.Uuid}", model);
        }

        [HttpPut("dominios/{uuid}")]
        public async Task<IActionResult> UpdateDominio(string uuid, [FromBody] InvDominio model)
        {
            var existing = await _context.InvDominios.FirstOrDefaultAsync(d => d.Uuid == uuid);
            if (existing == null) return NotFound();

            existing.Nombre = model.Nombre;
            existing.Activo = model.Activo;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("dominios/{uuid}")]
        public async Task<IActionResult> ToggleDominio(string uuid)
        {
            var existing = await _context.InvDominios.FirstOrDefaultAsync(d => d.Uuid == uuid);
            if (existing == null) return NotFound();

            existing.Activo = !(existing.Activo ?? true);
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpGet("carreras")]
        public async Task<IActionResult> GetCarreras()
        {
            var data = await _context.Carreras
                .OrderBy(c => c.Carrera1)
                .ToListAsync();
            return Ok(data);
        }

        // --- CRUD Líneas de Investigación ---
        [HttpGet("lineas-investigacion")]
        public async Task<IActionResult> GetLineasInvestigacion()
        {
            var data = await _context.InvLineasInvestigacion
                .OrderBy(l => l.NombreLinea)
                .ToListAsync();
            return Ok(data);
        }

        [HttpPost("lineas-investigacion")]
        public async Task<IActionResult> CreateLineaInvestigacion([FromBody] InvLineaInvestigacion model)
        {
            if (string.IsNullOrEmpty(model.NombreLinea)) return BadRequest("Nombre de línea requerido");
            model.Uuid = System.Guid.NewGuid().ToString();
            model.FechaRegistro = DateTime.Now;
            model.Activo = true;
            if (string.IsNullOrEmpty(model.CodigoLinea))
            {
                model.CodigoLinea = "LIN-" + System.Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
            }

            _context.InvLineasInvestigacion.Add(model);
            await _context.SaveChangesAsync();
            return Created($"/api/catalogs/lineas-investigacion/{model.Uuid}", model);
        }

        [HttpPut("lineas-investigacion/{uuid}")]
        public async Task<IActionResult> UpdateLineaInvestigacion(string uuid, [FromBody] InvLineaInvestigacion model)
        {
            var existing = await _context.InvLineasInvestigacion.FirstOrDefaultAsync(l => l.Uuid == uuid);
            if (existing == null) return NotFound();

            existing.NombreLinea = model.NombreLinea;
            existing.CodigoLinea = model.CodigoLinea;
            existing.Descripcion = model.Descripcion;
            existing.Activo = model.Activo;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("lineas-investigacion/{uuid}")]
        public async Task<IActionResult> ToggleLineaInvestigacion(string uuid)
        {
            var existing = await _context.InvLineasInvestigacion.FirstOrDefaultAsync(l => l.Uuid == uuid);
            if (existing == null) return NotFound();

            existing.Activo = !(existing.Activo ?? true);
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // --- CRUD Periodos Académicos ---
        [HttpGet("periodos")]
        public async Task<IActionResult> GetPeriodos()
        {
            var data = await _context.Periodos
                .OrderByDescending(p => p.IdPeriodo)
                .ToListAsync();
            return Ok(data);
        }

        [HttpPost("periodos")]
        public async Task<IActionResult> CreatePeriodo([FromBody] Periodo model)
        {
            if (string.IsNullOrEmpty(model.IdPeriodo)) return BadRequest("Id de período requerido (ej. 2026-A)");
            if (string.IsNullOrEmpty(model.Detalle)) return BadRequest("Detalle requerido");

            model.Activo = true;
            model.Cerrado = false;
            
            _context.Periodos.Add(model);
            await _context.SaveChangesAsync();
            return Created($"/api/catalogs/periodos/{model.IdPeriodo}", model);
        }

        [HttpPut("periodos/{id}")]
        public async Task<IActionResult> UpdatePeriodo(string id, [FromBody] Periodo model)
        {
            var existing = await _context.Periodos.FirstOrDefaultAsync(p => p.IdPeriodo == id);
            if (existing == null) return NotFound();

            existing.Detalle = model.Detalle;
            existing.FechaInicial = model.FechaInicial;
            existing.FechaFinal = model.FechaFinal;
            existing.Activo = model.Activo;
            existing.Cerrado = model.Cerrado;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("periodos/{id}")]
        public async Task<IActionResult> TogglePeriodo(string id)
        {
            var existing = await _context.Periodos.FirstOrDefaultAsync(p => p.IdPeriodo == id);
            if (existing == null) return NotFound();

            existing.Activo = !(existing.Activo ?? true);
            await _context.SaveChangesAsync();
            return Ok(existing);
        }
    }
}

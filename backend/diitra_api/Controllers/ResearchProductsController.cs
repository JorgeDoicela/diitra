using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ResearchProductsController : ControllerBase
    {
        private readonly DiitraContext _context;

        public ResearchProductsController(DiitraContext context)
        {
            _context = context;
        }

        [HttpGet("project/{projectUuid}")]
        public async Task<IActionResult> GetByProject(string projectUuid)
        {
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == projectUuid);
            if (project == null) return NotFound(new { error = "Proyecto no encontrado" });

            var products = await _context.InvProductos
                .Include(p => p.IdTipoProductoNavigation)
                .Where(p => p.IdProyecto == project.IdProyecto)
                .Select(p => new
                {
                    p.IdProducto,
                    p.IdProyecto,
                    p.IdTipoProducto,
                    p.Titulo,
                    p.Cantidad,
                    p.UrlProducto,
                    p.EsPropiedadIntelectual,
                    p.NumeroRegistro,
                    p.FechaRegistroSenadi,
                    TipoProductoNombre = p.IdTipoProductoNavigation != null ? p.IdTipoProductoNavigation.Nombre : "Otro",
                    p.MetadataJson
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == dto.ProjectUuid);
            if (project == null) return NotFound(new { error = "Proyecto no encontrado" });

            var product = new InvProducto
            {
                IdProyecto = project.IdProyecto,
                IdTipoProducto = dto.IdTipoProducto,
                Titulo = dto.Titulo,
                Cantidad = dto.Cantidad <= 0 ? 1 : dto.Cantidad,
                UrlProducto = dto.UrlProducto,
                EsPropiedadIntelectual = dto.EsPropiedadIntelectual,
                NumeroRegistro = dto.NumeroRegistro,
                FechaRegistroSenadi = dto.FechaRegistroSenadi,
                MetadataJson = dto.MetadataJson
            };

            _context.InvProductos.Add(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Producto registrado con éxito", id = product.IdProducto });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto dto)
        {
            var product = await _context.InvProductos.FindAsync(id);
            if (product == null) return NotFound();

            product.IdTipoProducto = dto.IdTipoProducto;
            product.Titulo = dto.Titulo;
            product.Cantidad = dto.Cantidad <= 0 ? 1 : dto.Cantidad;
            product.UrlProducto = dto.UrlProducto;
            product.EsPropiedadIntelectual = dto.EsPropiedadIntelectual;
            product.NumeroRegistro = dto.NumeroRegistro;
            product.FechaRegistroSenadi = dto.FechaRegistroSenadi;
            product.MetadataJson = dto.MetadataJson;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Producto actualizado con éxito" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _context.InvProductos.FindAsync(id);
            if (product == null) return NotFound();

            _context.InvProductos.Remove(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Producto eliminado con éxito" });
        }
    }

    public class ProductCreateDto
    {
        public string ProjectUuid { get; set; } = string.Empty;
        public int IdTipoProducto { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public int Cantidad { get; set; } = 1;
        public string? UrlProducto { get; set; }
        public bool? EsPropiedadIntelectual { get; set; }
        public string? NumeroRegistro { get; set; }
        public DateOnly? FechaRegistroSenadi { get; set; }
        public string? MetadataJson { get; set; }
    }

    public class ProductUpdateDto
    {
        public int IdTipoProducto { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public int Cantidad { get; set; } = 1;
        public string? UrlProducto { get; set; }
        public bool? EsPropiedadIntelectual { get; set; }
        public string? NumeroRegistro { get; set; }
        public DateOnly? FechaRegistroSenadi { get; set; }
        public string? MetadataJson { get; set; }
    }
}

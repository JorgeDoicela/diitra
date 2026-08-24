using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;
using System.Threading.Tasks;
using System.Linq;
using System;
using System.Security.Claims;
using Diitra.Application.Research;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ResearchProductsController : ControllerBase
    {
        private readonly DiitraContext _context;
        private readonly IProjectOrchestrator _projectOrchestrator;

        public ResearchProductsController(DiitraContext context, IProjectOrchestrator projectOrchestrator)
        {
            _context = context;
            _projectOrchestrator = projectOrchestrator;
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
                    p.Uuid,
                    p.IdProyecto,
                    p.IdTipoProducto,
                    p.Titulo,
                    p.Cantidad,
                    p.UrlProducto,
                    p.EsPropiedadIntelectual,
                    p.TipoPropiedadIntelectual,
                    p.NumeroRegistro,
                    p.FechaRegistroSenadi,
                    p.EstadoSenadi,
                    p.TrlActual,
                    p.UrlCertificadoSenadi,
                    TipoProductoNombre = p.IdTipoProductoNavigation != null ? p.IdTipoProductoNavigation.Nombre : "Otro",
                    CategoriaProducto = p.IdTipoProductoNavigation != null ? p.IdTipoProductoNavigation.Categoria : "Académico",
                    p.MetadataJson
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpGet("catalogo-innovacion")]
        public async Task<IActionResult> GetCatalogoInnovacion([FromQuery] string? tipo = null, [FromQuery] byte? minTrl = null)
        {
            var query = _context.InvProductos
                .Include(p => p.IdTipoProductoNavigation)
                .Include(p => p.IdProyectoNavigation)
                .Include(p => p.InvTransferencias)
                .AsNoTracking();

            if (!string.IsNullOrEmpty(tipo))
            {
                query = query.Where(p => p.TipoPropiedadIntelectual == tipo || (p.IdTipoProductoNavigation != null && p.IdTipoProductoNavigation.Categoria == tipo));
            }

            if (minTrl.HasValue)
            {
                query = query.Where(p => p.TrlActual >= minTrl.Value);
            }

            var items = await query
                .OrderByDescending(p => p.TrlActual)
                .Select(p => new
                {
                    p.IdProducto,
                    p.Uuid,
                    p.Titulo,
                    p.Cantidad,
                    p.UrlProducto,
                    p.EsPropiedadIntelectual,
                    p.TipoPropiedadIntelectual,
                    p.NumeroRegistro,
                    p.FechaRegistroSenadi,
                    p.EstadoSenadi,
                    p.TrlActual,
                    p.UrlCertificadoSenadi,
                    TipoProductoNombre = p.IdTipoProductoNavigation != null ? p.IdTipoProductoNavigation.Nombre : "Otro",
                    CategoriaProducto = p.IdTipoProductoNavigation != null ? p.IdTipoProductoNavigation.Categoria : "Académico",
                    ProyectoTitulo = p.IdProyectoNavigation.Titulo,
                    ProyectoUuid = p.IdProyectoNavigation.Uuid,
                    TotalTransferencias = p.InvTransferencias.Count,
                    p.MetadataJson
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpGet("asset/{assetUuid}")]
        public async Task<IActionResult> GetAssetDetail(string assetUuid)
        {
            var product = await _context.InvProductos
                .Include(p => p.IdTipoProductoNavigation)
                .Include(p => p.IdProyectoNavigation)
                    .ThenInclude(proj => proj!.InvProyectoParticipantes)
                        .ThenInclude(part => part.IdUsuarioNavigation)
                .Include(p => p.IdProyectoNavigation)
                    .ThenInclude(proj => proj!.IdSublineaNavigation)
                        .ThenInclude(sub => sub!.IdLineaNavigation)
                .Include(p => p.IdProyectoNavigation)
                    .ThenInclude(proj => proj!.IdGrupoNavigation)
                .Include(p => p.InvTransferencias)
                .FirstOrDefaultAsync(p => p.Uuid == assetUuid);

            if (product == null)
            {
                return NotFound(new { error = "Activo tecnológico no encontrado" });
            }

            var director = product.IdProyectoNavigation?.InvProyectoParticipantes
                .FirstOrDefault(part => part.EsDirector == true || part.Rol == "Director de Proyecto");

            var directorNombre = director?.IdUsuarioNavigation != null
                ? (director.IdUsuarioNavigation.Nombre ?? "Director de Proyecto").Trim()
                : "No asignado";

            var response = new
            {
                product.IdProducto,
                product.Uuid,
                product.Titulo,
                product.Cantidad,
                product.UrlProducto,
                product.EsPropiedadIntelectual,
                product.TipoPropiedadIntelectual,
                product.NumeroRegistro,
                product.FechaRegistroSenadi,
                product.EstadoSenadi,
                product.TrlActual,
                product.UrlCertificadoSenadi,
                TipoProductoNombre = product.IdTipoProductoNavigation?.Nombre ?? "Activo Tecnológico",
                CategoriaProducto = product.IdTipoProductoNavigation?.Categoria ?? "Innovación",
                ProyectoId = product.IdProyectoNavigation?.IdProyecto,
                ProyectoUuid = product.IdProyectoNavigation?.Uuid,
                ProyectoTitulo = product.IdProyectoNavigation?.Titulo ?? "Sin proyecto asociado",
                ProyectoCodigo = product.IdProyectoNavigation?.CodigoInstitucional ?? "",
                ProyectoEstado = product.IdProyectoNavigation?.Estado ?? "Borrador",
                DirectorNombre = directorNombre,
                LineaInvestigacion = product.IdProyectoNavigation?.IdSublineaNavigation?.IdLineaNavigation?.NombreLinea ?? "Línea Institucional",
                GrupoInvestigacion = product.IdProyectoNavigation?.IdGrupoNavigation?.Nombre ?? "Grupo de Investigación",
                Transferencias = product.InvTransferencias.Select(t => new
                {
                    t.IdTransferencia,
                    t.Uuid,
                    t.EntidadReceptora,
                    t.RucEntidad,
                    t.NumeroConvenio,
                    t.FechaConvenio,
                    t.Modalidad,
                    t.ValorMonetario,
                    t.BeneficiariosDirectos,
                    t.UrlActaFirmada,
                    t.Descripcion
                }).ToList(),
                product.MetadataJson
            };

            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            if (dto == null) return BadRequest("Datos nulos");
            if (!await CanCurrentUserModifyProjectAsync(dto.ProjectUuid))
            {
                return StatusCode(403, new { message = "No tienes permisos para agregar productos a este proyecto de investigación." });
            }

            var project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == dto.ProjectUuid);
            if (project == null) return NotFound(new { error = "Proyecto no encontrado" });

            var product = new InvProducto
            {
                Uuid = Guid.NewGuid().ToString(),
                IdProyecto = project.IdProyecto,
                IdTipoProducto = dto.IdTipoProducto,
                Titulo = dto.Titulo,
                Cantidad = dto.Cantidad <= 0 ? 1 : dto.Cantidad,
                UrlProducto = dto.UrlProducto,
                EsPropiedadIntelectual = dto.EsPropiedadIntelectual,
                TipoPropiedadIntelectual = dto.TipoPropiedadIntelectual,
                NumeroRegistro = dto.NumeroRegistro,
                FechaRegistroSenadi = dto.FechaRegistroSenadi,
                EstadoSenadi = dto.EstadoSenadi ?? (dto.EsPropiedadIntelectual == true ? "Solicitado" : "NoAplica"),
                TrlActual = dto.TrlActual ?? 4,
                UrlCertificadoSenadi = dto.UrlCertificadoSenadi,
                MetadataJson = dto.MetadataJson
            };

            _context.InvProductos.Add(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Producto registrado con éxito", id = product.IdProducto, uuid = product.Uuid });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto dto)
        {
            var product = await _context.InvProductos.FindAsync(id);
            if (product == null) return NotFound();

            var project = await _context.InvProyectos.FindAsync(product.IdProyecto);
            if (project == null) return NotFound(new { error = "Proyecto asociado no encontrado" });

            if (!await CanCurrentUserModifyProjectAsync(project.Uuid))
            {
                return StatusCode(403, new { message = "No tienes permisos para modificar productos de este proyecto de investigación." });
            }

            product.IdTipoProducto = dto.IdTipoProducto;
            product.Titulo = dto.Titulo;
            product.Cantidad = dto.Cantidad <= 0 ? 1 : dto.Cantidad;
            product.UrlProducto = dto.UrlProducto;
            product.EsPropiedadIntelectual = dto.EsPropiedadIntelectual;
            product.TipoPropiedadIntelectual = dto.TipoPropiedadIntelectual;
            product.NumeroRegistro = dto.NumeroRegistro;
            product.FechaRegistroSenadi = dto.FechaRegistroSenadi;
            if (!string.IsNullOrEmpty(dto.EstadoSenadi)) product.EstadoSenadi = dto.EstadoSenadi;
            if (dto.TrlActual.HasValue) product.TrlActual = dto.TrlActual.Value;
            product.UrlCertificadoSenadi = dto.UrlCertificadoSenadi;
            product.MetadataJson = dto.MetadataJson;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Producto actualizado con éxito" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _context.InvProductos.FindAsync(id);
            if (product == null) return NotFound();

            var project = await _context.InvProyectos.FindAsync(product.IdProyecto);
            if (project == null) return NotFound(new { error = "Proyecto asociado no encontrado" });

            if (!await CanCurrentUserModifyProjectAsync(project.Uuid))
            {
                return StatusCode(403, new { message = "No tienes permisos para eliminar productos de este proyecto de investigación." });
            }

            _context.InvProductos.Remove(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Producto eliminado con éxito" });
        }

        private async Task<bool> CanCurrentUserModifyProjectAsync(string uuid)
        {
            var userIdRef = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdRef)) return false;

            var isAdmin = User.FindFirst("es_admin")?.Value == "true" ||
                          User.IsInRole("DIITRA_ADMIN");

            if (isAdmin) return true;

            return await _projectOrchestrator.UserCanModifyProjectAsync(uuid, userIdRef);
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
        public string? TipoPropiedadIntelectual { get; set; }
        public string? NumeroRegistro { get; set; }
        public DateOnly? FechaRegistroSenadi { get; set; }
        public string? EstadoSenadi { get; set; }
        public byte? TrlActual { get; set; }
        public string? UrlCertificadoSenadi { get; set; }
        public string? MetadataJson { get; set; }
    }

    public class ProductUpdateDto
    {
        public int IdTipoProducto { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public int Cantidad { get; set; } = 1;
        public string? UrlProducto { get; set; }
        public bool? EsPropiedadIntelectual { get; set; }
        public string? TipoPropiedadIntelectual { get; set; }
        public string? NumeroRegistro { get; set; }
        public DateOnly? FechaRegistroSenadi { get; set; }
        public string? EstadoSenadi { get; set; }
        public byte? TrlActual { get; set; }
        public string? UrlCertificadoSenadi { get; set; }
        public string? MetadataJson { get; set; }
    }
}

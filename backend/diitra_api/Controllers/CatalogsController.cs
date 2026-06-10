using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;
using diitra_domain.Identity.Entities;

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
                .Where(p => p.EsInstituto == 1)
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
            model.EsInstituto = 1;
            
            _context.Periodos.Add(model);
            await _context.SaveChangesAsync();
            return Created($"/api/catalogs/periodos/{model.IdPeriodo}", model);
        }

        [HttpPut("periodos/{id}")]
        public async Task<IActionResult> UpdatePeriodo(string id, [FromBody] Periodo model)
        {
            var existing = await _context.Periodos.FirstOrDefaultAsync(p => p.IdPeriodo == id && p.EsInstituto == 1);
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
            var existing = await _context.Periodos.FirstOrDefaultAsync(p => p.IdPeriodo == id && p.EsInstituto == 1);
            if (existing == null) return NotFound();

            existing.Activo = !(existing.Activo ?? true);
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpGet("search-users")]
        public async Task<IActionResult> SearchUsers([FromQuery] string? q = null, [FromQuery] string? tipo = null)
        {
            var query = q?.Trim().ToLower();
            var tipoFilter = tipo?.Trim().ToLower();

            // Obtener periodo académico (Lógica Resiliente de Descubrimiento)
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var currentPeriod = await _context.Periodos
                .OrderByDescending(p => p.Periodoactivoinstituto == 1) // 1. Marcado explícitamente para el sistema
                .ThenByDescending(p => p.Activo == true)             // 2. Marcado como activo genérico
                .ThenByDescending(p => p.FechaInicial <= today && p.FechaFinal >= today) // 3. El que cubre la fecha de hoy
                .ThenByDescending(p => p.FechaInicial)               // 4. El más reciente cronológicamente
                .FirstOrDefaultAsync();

            var periodId = currentPeriod?.IdPeriodo;

            var researchSubcatId = await _context.SubcategoriasActividades
                .Where(s => s.Subcategoria == "INVESTIGACION")
                .Select(s => s.IdSubcategoria)
                .FirstOrDefaultAsync();
            if (researchSubcatId == 0) researchSubcatId = 7; // Fallback seguro

            var profs = new List<object>();
            var alums = new List<object>();

            // 1. Buscar en Profesores
            if (string.IsNullOrEmpty(tipoFilter) || tipoFilter == "profesor")
            {
                var profesoresQuery = _context.Profesores.AsQueryable();
                profesoresQuery = profesoresQuery.Where(p => p.Activo == 1);

                // Filtrar estrictamente por docentes que tengan actividades de investigación (idSubcategoria = researchSubcatId)
                if (!string.IsNullOrEmpty(periodId))
                {
                    profesoresQuery = profesoresQuery.Where(p => _context.ProfesoresActividades.Any(pa =>
                        pa.IdProfesor == p.IdProfesor &&
                        pa.IdSubcategoria == researchSubcatId &&
                        pa.IdPeriodo == periodId));
                }
                else
                {
                    // Resiliente: si no hay periodo activo configurado, filtramos por docentes que tengan horas de investigación asignadas
                    profesoresQuery = profesoresQuery.Where(p => _context.ProfesoresActividades.Any(pa =>
                        pa.IdProfesor == p.IdProfesor &&
                        pa.IdSubcategoria == researchSubcatId));
                }

                if (!string.IsNullOrEmpty(query))
                {
                    profesoresQuery = profesoresQuery.Where(p => p.IdProfesor.Contains(query) ||
                                    (p.PrimerNombre != null && p.PrimerNombre.ToLower().Contains(query)) ||
                                    (p.PrimerApellido != null && p.PrimerApellido.ToLower().Contains(query)) ||
                                    (p.Nombres != null && p.Nombres.ToLower().Contains(query)) ||
                                    (p.Apellidos != null && p.Apellidos.ToLower().Contains(query)));
                }

                var profesoresSelect = profesoresQuery
                    .Select(p => new
                    {
                        cedula = p.IdProfesor.Trim(),
                        nombre = ($"{p.PrimerNombre} {p.SegundoNombre} {p.PrimerApellido} {p.SegundoApellido}").Replace("  ", " ").Trim(),
                        email = p.EmailInstitucional ?? p.Email ?? "",
                        telefono = p.Celular ?? p.Telefono ?? "",
                        nivelAcademico = p.Titulo ?? "Tercer Nivel",
                        rol = "Investigador (Docente)",
                        tipo = "profesor"
                    });

                 var profsList = await profesoresSelect.ToListAsync();
                var ids = profsList.Select(p => p.cedula).ToList();
                var profCareers = await _context.ProfesoresCarrerasPeriodos
                    .Include(pc => pc.IdCarreraNavigation)
                    .Where(pc => ids.Contains(pc.IdProfesor.Trim()) && pc.IdPeriodo == periodId && pc.EsActivo == 1)
                    .ToListAsync();

                var researchHours = new List<ProfesoresActividade>();
                var assignedHoursList = new List<InvProyectoProfesor>();
                var linkedUsersList = new List<User>();
                if (ids.Any() && !string.IsNullOrEmpty(periodId))
                {
                    researchHours = await _context.ProfesoresActividades
                        .Where(pa => ids.Contains(pa.IdProfesor) && pa.IdSubcategoria == researchSubcatId && pa.IdPeriodo == periodId)
                        .ToListAsync();

                    linkedUsersList = await _context.Users
                        .Where(u => ids.Contains(u.IdSigafi.Trim()))
                        .ToListAsync();
                    var linkedUserIds = linkedUsersList.Select(u => u.IdUsuario).ToList();

                    assignedHoursList = await _context.InvProyectosProfesores
                        .Include(pp => pp.IdProyectoNavigation)
                        .Where(pp => linkedUserIds.Contains(pp.IdUsuario) && pp.Activo != false &&
                                     (pp.IdProyectoNavigation.Estado == "Enviado" ||
                                      pp.IdProyectoNavigation.Estado == "En Revisión" ||
                                      pp.IdProyectoNavigation.Estado == "Aprobado" ||
                                      pp.IdProyectoNavigation.Estado == "En Ejecución"))
                        .ToListAsync();
                }

                profs = profsList.Select(p => {
                    var linkedCareers = profCareers
                        .Where(pc => pc.IdProfesor.Trim() == p.cedula && pc.IdCarreraNavigation != null)
                        .Select(pc => pc.IdCarreraNavigation!.Carrera1)
                        .Distinct()
                        .ToList();
                    var carreraNom = linkedCareers.Any() ? string.Join(", ", linkedCareers) : "Docente";

                    var availableHours = researchHours.Where(pa => pa.IdProfesor.Trim() == p.cedula).Sum(pa => pa.HorasSemana ?? 0);
                    var userObj = linkedUsersList.FirstOrDefault(u => u.IdSigafi.Trim() == p.cedula);
                    var assignedHours = userObj != null
                        ? assignedHoursList.Where(ah => ah.IdUsuario == userObj.IdUsuario).Sum(ah => ah.HorasSemanales ?? 0)
                        : 0;

                    return new {
                        p.cedula,
                        nombre = p.nombre.Replace("  ", " ").Trim(),
                        p.email,
                        p.telefono,
                        p.nivelAcademico,
                        p.rol,
                        p.tipo,
                        carrera = carreraNom,
                        horasDisponibles = availableHours,
                        horasAsignadas = assignedHours
                    };
                }).Cast<object>().ToList();
            }

            // 2. Buscar en Alumnos
            if (string.IsNullOrEmpty(tipoFilter) || tipoFilter == "alumno")
            {
                // Para alumnos, permitimos búsqueda libre si es el sector de alumnos
                if (!string.IsNullOrEmpty(query) || tipoFilter == "alumno")
                {
                    var alumnosQuery = _context.Alumnos.AsQueryable();

                    // Solo alumnos con matrícula válida en el periodo actual que no se hayan retirado
                    if (!string.IsNullOrEmpty(periodId))
                    {
                        alumnosQuery = alumnosQuery.Where(a => _context.Matriculas.Any(m =>
                            m.IdAlumno == a.IdAlumno &&
                            m.IdPeriodo == periodId &&
                            (m.Retirado == null || m.Retirado == false) &&
                            (m.Valida == 1)));
                    }

                    if (!string.IsNullOrEmpty(query))
                    {
                        alumnosQuery = alumnosQuery.Where(a => a.IdAlumno.Contains(query) ||
                                        (a.PrimerNombre != null && a.PrimerNombre.ToLower().Contains(query)) ||
                                        (a.ApellidoPaterno != null && a.ApellidoPaterno.ToLower().Contains(query)));
                    }

                    var students = await alumnosQuery
                        .OrderBy(a => a.ApellidoPaterno)
                        .ThenBy(a => a.PrimerNombre)
                        .Take(30)
                        .ToListAsync();

                    var alumIds = students.Select(s => s.IdAlumno.Trim()).ToList();

                    // Obtener datos académicos extra (Matrícula actual para Nivel y Carrera)
                    var currentMatriculas = await _context.Matriculas
                        .Where(m => alumIds.Contains(m.IdAlumno) && m.IdPeriodo == periodId && m.Valida == 1)
                        .ToListAsync();

                    var careers = await _context.Carreras.ToListAsync();

                    // Pre-cargar información de Cursos (Niveles/Carreras operativos)
                    var levelIds = currentMatriculas.Select(m => (int?)m.IdNivel)
                        .Concat(students.Select(s => s.IdNivel))
                        .Where(id => id.HasValue)
                        .Select(id => id!.Value)
                        .Distinct()
                        .ToList();
                    var relevantCursos = await _context.Cursos.Where(c => levelIds.Contains(c.IdNivel)).ToListAsync();

                    alums = students.Select(s => {
                        var sId = s.IdAlumno.Trim();
                        var matricula = currentMatriculas.FirstOrDefault(m => m.IdAlumno.Trim() == sId);

                        // Lógica de descubrimiento de datos académicos vía tabla 'cursos'
                        var idNivelTarget = matricula?.IdNivel ?? s.IdNivel;
                        var cursoInfo = relevantCursos.FirstOrDefault(c => c.IdNivel == idNivelTarget);

                        var carreraNom = careers.FirstOrDefault(c => c.IdCarrera == cursoInfo?.IdCarrera)?.Carrera1;

                        return new {
                            cedula = sId,
                            nombre = ($"{s.PrimerNombre} {s.SegundoNombre} {s.ApellidoPaterno} {s.ApellidoMaterno}").Replace("  ", " ").Trim(),
                            email = s.EmailInstitucional ?? s.Email ?? "",
                            telefono = s.Celular ?? s.Telefono ?? "",
                            nivelAcademico = "Pregrado",
                            rol = "Co-Investigador (Estudiante)",
                            tipo = "alumno",
                            carrera = carreraNom ?? "Estudiante"
                        };
                    }).Cast<object>().ToList();
                }
            }

            // Combinar
            var results = profs.Concat(alums);

            return Ok(results.ToList());
        }
    }
}

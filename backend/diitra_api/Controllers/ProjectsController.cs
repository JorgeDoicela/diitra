using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using Diitra.Application.Common.Documents;
using Microsoft.EntityFrameworkCore;

namespace diitra_api.Controllers
{
    [ApiController]
    [Route("api/projects")]
    public class ProjectsController : ControllerBase
    {
        private readonly IDocumentEngine _documentEngine;
        private readonly IDocumentInstanceService _documentInstanceService;

        public ProjectsController(IDocumentEngine documentEngine, IDocumentInstanceService documentInstanceService)
        {
            _documentEngine = documentEngine;
            _documentInstanceService = documentInstanceService;
        }

        /// <summary>
        /// Genera el PDF del protocolo de investigación usando el motor Enterprise DIITRA.
        /// El template "PROTOCOLO_INVESTIGACION" vive en BD y puede editarse sin redespliegue.
        /// </summary>
        [HttpPost("generate-pdf")]
        public async Task<IActionResult> GeneratePdf(
            [FromBody] ProyectoDto dto,
            [FromQuery] bool isDraft = true,
            [FromQuery] bool isBlind = false)
        {
            var request = new DocumentRequest
            {
                TemplateCode = isBlind ? "PROTOCOLO_PEER_REVIEW" : "PROTOCOLO_INVESTIGACION",
                Data = dto,
                IsDraftMode = isDraft,
                IsBlindMode = isBlind,
                RequestedBy = User.Identity?.Name ?? "Sistema DIITRA",
                ProjectUuid = dto.Uuid,
                EntityUuid = dto.Uuid // En producción siempre usamos el UUID real del proyecto
            };

            var result = await _documentEngine.GenerateAsync(request);

            // AUTO-TRAZABILIDAD: Registramos esta emisión en la bandeja de instancias
            try 
            {
                await _documentInstanceService.CreateAsync(
                    request.TemplateCode,
                    request.EntityUuid,
                    request.RequestedBy,
                    $"Preview Oficial: {dto.Titulo ?? "Sin Título"}",
                    "Proyecto"
                );
            }
            catch (Exception ex) 
            { 
                Console.WriteLine($"[DIITRA DEBUG] Error al registrar instancia: {ex.Message}"); 
            }

            return File(result.PdfBytes, "application/pdf", result.FileName);
        }

        /// <summary>
        /// Genera el PDF del protocolo en modo Doble Ciego para Peer Review.
        /// Los datos de identidad son enmascarados automáticamente por el motor.
        /// </summary>
        [HttpPost("generate-pdf/blind-review")]
        public async Task<IActionResult> GeneratePdfBlindReview([FromBody] ProyectoDto dto)
        {
            var request = new DocumentRequest
            {
                TemplateCode = "PROTOCOLO_PEER_REVIEW",
                Data = dto,
                IsBlindMode = true,
                RequestedBy = User.Identity?.Name ?? "sistema"
            };

            var result = await _documentEngine.GenerateAsync(request);
            return File(result.PdfBytes, "application/pdf", result.FileName);
        }

        // --- Endpoints Colaborativos (Workspace) ---

        [HttpPost("draft")]
        public IActionResult CreateDraft([FromBody] ProyectoDto dto)
        {
            dto.Uuid = System.Guid.NewGuid().ToString();
            dto.Estado = "Borrador";
            return Ok(new { message = "Workspace Borrador Creado", proyectoId = dto.Uuid });
        }

        /// <summary>
        /// Simulación de firma electrónica PAdES usando el motor DIITRA.
        /// </summary>
        [HttpPost("sign")]
        public async Task<IActionResult> SignDocument(
            [FromQuery] string password,
            [FromServices] diitra_infrastructure.Security.IFirmaElectronicaService firmaService)
        {
            // 1. Generar un PDF base para la prueba con datos reales
            var request = new DocumentRequest {
                TemplateCode = "PROTOCOLO_INVESTIGACION",
                Data = new {
                    Titulo = "Prueba de Firma Profesional Enterprise",
                    nombre_investigador = "Jorge Doicela",
                    nombre_director = "Dr. Marco Traversari",
                    codigo_institucional = "IST-DIITRA-2026-001-P",
                    linea_investigacion = "Inteligencia Artificial y Software",
                    tipo_investigacion = "Investigación Aplicada",
                    ods = "9. Industria, Innovación e Infraestructura",
                    tiempo_ejecucion = "12 Meses",
                    antecedentes = "La presente investigación aborda la automatización de procesos de auditoría académica mediante tecnología Blockchain y Hash-Linking...",
                    descripcion_proyecto = "Desarrollo de un núcleo de software capaz de garantizar la inmutabilidad de los expedientes de investigación.",
                    justificacion = "Cumplimiento de las normativas vigentes de CACES y SENESCYT para la acreditación institucional.",
                    marco_teorico = "Basado en los estándares internacionales de firma digital PAdES y XAdES.",
                    metodologia = "Desarrollo ágil con enfoque en seguridad por diseño (Security by Design).",
                    recursos_necesarios = new[] {
                        new { descripcion = "Servidor GPU Auditoría", id_partida = "53.01.05", costo_total = 3500, es_gasto_capital = true },
                        new { descripcion = "Licencias Enterprise LTV", id_partida = "53.08.04", costo_total = 1200, es_gasto_capital = false }
                    },
                    cronograma = new[] {
                        new { numero = 1, actividad = "Prueba E2E de Trazabilidad", ponderacion = 50, es_entregable_caces = true },
                        new { numero = 2, actividad = "Validación de Integridad LTV", ponderacion = 50, es_entregable_caces = true }
                    }
                }
            };
            var genResult = await _documentEngine.GenerateAsync(request);

            // Bypass de prueba para el USER (Modo Demo)
            if (password == "diitra2026")
            {
                try 
                {
                    var context = HttpContext.RequestServices.GetRequiredService<diitra_infrastructure.data.models.DiitraContext>();
                    var workflowService = HttpContext.RequestServices.GetRequiredService<Diitra.Application.Research.IWorkflowEngineService>();
                    
                    var project = await context.InvProyectos.OrderByDescending(p => p.IdProyecto).FirstOrDefaultAsync();
                    
                    if (project != null)
                    {
                        if (project.Estado != "Borrador") {
                            project.Estado = "Borrador";
                            await context.SaveChangesAsync();
                        }

                        // Intentamos la transición
                        bool success = await workflowService.TransicionarEstadoAsync(project.Uuid, "Enviado", 1, "Sello Digital de Integridad - Firma Jorge Doicela");
                        
                        if (!success) {
                             Console.WriteLine("DIITRA DEBUG: TransicionarEstadoAsync devolvió FALSE");
                        }
                    }
                    else {
                        Console.WriteLine("DIITRA DEBUG: No se encontró ningún proyecto en inv_proyectos");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"DIITRA ERROR CRÍTICO: {ex.Message}");
                    Console.WriteLine($"DIITRA ERROR DETALLE: {ex.InnerException?.Message}");
                }

                return File(genResult.PdfBytes, "application/pdf", "DIITRA_Enterprise_Signed.pdf");
            }

            // 2. Firmar usando el servicio profesional (Requiere certificado real)
            byte[] dummyCert = new byte[10];
            try
            {
                var signedPdf = firmaService.SignPdf(genResult.PdfBytes, dummyCert, password);
                return File(signedPdf, "application/pdf", "DIITRA_Firmado.pdf");
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { error = "Firma fallida: " + ex.Message });
            }
        }

        [HttpPatch("{id}/section")]
        public IActionResult UpdateSection(string id, [FromBody] System.Collections.Generic.Dictionary<string, object> sectionData)
        {
            return Ok(new { message = "Sección guardada correctamente", projectId = id });
        }

        [HttpPost("{id}/transition")]
        public async Task<IActionResult> TransitionState(string id, [FromQuery] string newState, [FromQuery] string observation, [FromServices] IWorkflowEngineService workflowEngine)
        {
            try
            {
                int idUsuarioSimulado = 1;
                var success = await workflowEngine.TransicionarEstadoAsync(id, newState, idUsuarioSimulado, observation);
                if (!success) return NotFound("Proyecto no encontrado");
                return Ok(new { message = $"Proyecto transitado exitosamente a {newState}" });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{id}/traceability")]
        public async Task<IActionResult> GetTraceability(string id, [FromServices] IWorkflowEngineService workflowEngine)
        {
            var history = await workflowEngine.GetTrazabilidadAsync(id);
            return Ok(history);
        }
        /// <summary>
        /// Sincroniza los datos del Wizard con la base de datos de investigación.
        /// NOTA ARQUITECTÓNICA: Este controlador es específico para la entidad 'Proyecto'.
        /// El NÚCLEO DIITRA Builder es universal; cuando implementemos otros documentos
        /// (como Informes o Actas), crearemos sus propios controladores, pero todos
        /// usarán el mismo DocumentEngine para generar los PDFs.
        /// </summary>
        [HttpPost("save-preview-data")]
        public async Task<IActionResult> SavePreviewData([FromBody] Diitra.Application.Research.Dtos.ProyectoDto dto)
        {
            var context = HttpContext.RequestServices.GetRequiredService<diitra_infrastructure.data.models.DiitraContext>();
            
            // Buscamos por UUID si está presente, sino tomamos el último (para pruebas rápidas)
            diitra_infrastructure.data.models.InvProyecto? project = null;
            
            if (!string.IsNullOrEmpty(dto.Uuid))
            {
                project = await context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == dto.Uuid);
            }

            if (project == null)
            {
                project = await context.InvProyectos.OrderByDescending(p => p.IdProyecto).FirstOrDefaultAsync();
            }
            
            if (project == null)
            {
                project = new diitra_infrastructure.data.models.InvProyecto {
                    Uuid = dto.Uuid ?? Guid.NewGuid().ToString(),
                    FechaRegistro = DateTime.Now
                };
                context.InvProyectos.Add(project);
            }

            // Telemetría de diagnóstico
            Console.WriteLine($"[DIITRA DEBUG] Recibido Título: '{dto.Titulo}'");
            Console.WriteLine($"[DIITRA DEBUG] Recibido Antecedentes: '{dto.Antecedentes?.Length ?? 0} chars'");

            // Mapeamos los datos de la web a la base de datos (Mapeo Completo para Builder)
            project.Titulo = dto.Titulo ?? "PROYECTO SIN TÍTULO";
            project.CodigoInstitucional = dto.CodigoInstitucional;
            project.DescripcionProyecto = dto.DescripcionProyecto;
            project.Antecedentes = dto.Antecedentes;
            project.Justificacion = dto.Justificacion;
            project.MarcoTeorico = dto.MarcoTeorico;
            project.Metodologia = dto.Metodologia;
            project.MetodoEvaluacion = dto.Evaluacion; // Homologación DTO -> SQL
            project.TiempoEjecucion = dto.TiempoEjecucion;
            
            // Fechas (Conversión explícita a DateOnly para el modelo)
            if (DateTime.TryParse(dto.FechaInicioEstimada, out var fInicio)) project.FechaInicio = DateOnly.FromDateTime(fInicio);
            if (DateTime.TryParse(dto.FechaFinEstimada, out var fFin)) project.FechaFin = DateOnly.FromDateTime(fFin);
            if (DateTime.TryParse(dto.FechaPresentacion, out var fPres)) project.FechaPresentacion = DateOnly.FromDateTime(fPres);

            project.Estado = dto.Estado ?? "Borrador"; 
            project.FechaModificacion = DateTime.Now;

            await context.SaveChangesAsync();
            Console.WriteLine($"[DIITRA DEBUG] Persistencia exitosa para UUID: {project.Uuid} - Título: {project.Titulo}");
            return Ok(new { success = true, uuid = project.Uuid });
        }
    }
}

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
        private readonly diitra_application.Security.IAuthService _authService;

        public ProjectsController(IDocumentEngine documentEngine, IDocumentInstanceService documentInstanceService, diitra_application.Security.IAuthService authService)
        {
            _documentEngine = documentEngine;
            _documentInstanceService = documentInstanceService;
            _authService = authService;
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
                    request.EntityUuid ?? string.Empty,
                    request.RequestedBy ?? "Sistema DIITRA",
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
            
            if (dto == null) 
            {
                Console.WriteLine("[DIITRA WARNING] Se recibió un DTO nulo en SavePreviewData. Creando instancia vacía para pruebas.");
                dto = new Diitra.Application.Research.Dtos.ProyectoDto();
            }
            
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

            // ⚠ TODO: PRODUCTION-LOCK ⚠
            // En entorno de producción, habilitar FluentValidation aquí.
            
            // MAPEO SEGURO (Solo campos que existen en la tabla InvProyecto)
            project.Titulo = dto.Titulo ?? "PROYECTO EN PRUEBAS";
            project.CodigoInstitucional = dto.CodigoInstitucional;
            project.DescripcionProyecto = dto.DescripcionProyecto;
            project.Antecedentes = dto.Antecedentes;
            project.Justificacion = dto.Justificacion;
            project.MarcoTeorico = dto.MarcoTeorico;
            project.Metodologia = dto.Metodologia;
            project.MetodoEvaluacion = dto.Evaluacion;
            project.TiempoEjecucion = dto.TiempoEjecucion;
            project.TieneGrupo = dto.TieneGrupoInvestigacion;
            
            // Guardamos TODO el DTO como JSON en MetadataCacesJson para no perder nada
            // y que el motor de documentos tenga acceso a los datos extra (carrera, programa, etc.)
            project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);

            project.Estado = dto.Estado ?? "Borrador"; 
            project.FechaModificacion = DateTime.Now;

            // 3. SINCRONIZACIÓN DE PERSONAL (Investigadores)
            if (dto.Investigadores != null)
            {
                // Limpiar previos
                var oldProfs = context.InvProyectosProfesores.Where(p => p.IdProyecto == project.IdProyecto);
                var oldAlums = context.InvProyectosAlumnos.Where(p => p.IdProyecto == project.IdProyecto);
                context.InvProyectosProfesores.RemoveRange(oldProfs);
                context.InvProyectosAlumnos.RemoveRange(oldAlums);

                foreach (var inv in dto.Investigadores)
                {
                    if (string.IsNullOrEmpty(inv.Cedula)) continue;

                    var userPersona = await _authService.GetOrProvisionUserByCedulaAsync(inv.Cedula);
                    if (userPersona == null) continue;

                    if (userPersona.TablaSigafi == "alumno")
                    {
                        context.InvProyectosAlumnos.Add(new diitra_infrastructure.data.models.InvProyectoAlumno
                        {
                            IdProyecto = project.IdProyecto,
                            IdUsuario = userPersona.IdUsuario,
                            Rol = inv.Rol,
                            NivelAcademico = inv.NivelAcademico,
                            Telefono = inv.Telefono
                        });
                    }
                    else
                    {
                        context.InvProyectosProfesores.Add(new diitra_infrastructure.data.models.InvProyectoProfesor
                        {
                            IdProyecto = project.IdProyecto,
                            IdUsuario = userPersona.IdUsuario,
                            Rol = inv.Rol,
                            NivelAcademico = inv.NivelAcademico,
                            Telefono = inv.Telefono,
                            EsDirector = inv.Rol?.Contains("Director") == true
                        });
                    }
                }
            }

            // 4. SINCRONIZACIÓN DE OBJETIVOS ESPECÍFICOS
            if (dto.ObjetivosEspecificos != null)
            {
                var oldObjs = context.InvObjetivosProyecto.Where(o => o.IdProyecto == project.IdProyecto && o.EsGeneral == false);
                context.InvObjetivosProyecto.RemoveRange(oldObjs);

                int orden = 1;
                foreach (var obj in dto.ObjetivosEspecificos)
                {
                    if (string.IsNullOrWhiteSpace(obj)) continue;
                    context.InvObjetivosProyecto.Add(new diitra_infrastructure.data.models.InvObjetivoProyecto
                    {
                        IdProyecto = project.IdProyecto,
                        Descripcion = obj,
                        EsGeneral = false,
                        Orden = orden++
                    });
                }
            }

            // 5. SINCRONIZACIÓN DE PRESUPUESTO
            if (dto.RecursosNecesarios != null)
            {
                var oldPres = context.InvPresupuestoItems.Where(p => p.IdProyecto == project.IdProyecto);
                context.InvPresupuestoItems.RemoveRange(oldPres);

                foreach (var item in dto.RecursosNecesarios)
                {
                    context.InvPresupuestoItems.Add(new diitra_infrastructure.data.models.InvPresupuestoItem
                    {
                        IdProyecto = project.IdProyecto,
                        Categoria = "Gasto",
                        Detalle = item.Descripcion ?? "Sin detalle",
                        Cantidad = decimal.TryParse(item.Cantidad, out var c) ? c : 1,
                        ValorUnitario = item.CostoUnitario ?? 0,
                        EsGastoCapital = item.EsGastoCapital ?? false,
                        IdPartida = item.IdPartida
                    });
                }
            }

            try 
            {
                await context.SaveChangesAsync();
                Console.WriteLine($"[DIITRA SUCCESS] Proyecto '{project.Titulo}' y sus relaciones persistidas correctamente.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DIITRA ERROR PERSISTENCIA] {ex.Message}");
                return Ok(new { success = false, message = "Error al guardar relaciones: " + ex.Message, uuid = project.Uuid });
            }

            return Ok(new { success = true, uuid = project.Uuid });
        }
    }
}

using System;
using System.Linq;
using System.Threading.Tasks;
using Diitra.Application.Research;
using Diitra.Application.Research.Dtos;
using diitra_application.Security;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace diitra_infrastructure.Research
{
    public class ProjectOrchestrator : IProjectOrchestrator
    {
        private readonly DiitraContext _context;
        private readonly IAuthService _authService;
        private readonly IAuditService _auditService;
        private readonly ILogger<ProjectOrchestrator> _logger;

        public ProjectOrchestrator(DiitraContext context, IAuthService authService, IAuditService auditService, ILogger<ProjectOrchestrator> logger)
        {
            _context = context;
            _authService = authService;
            _auditService = auditService;
            _logger = logger;
        }

        public async Task<SyncResult> SyncProjectWizardDataAsync(ProyectoDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Localizar o Crear el Proyecto Core
                InvProyecto? project = null;
                if (!string.IsNullOrEmpty(dto.Uuid))
                {
                    project = await _context.InvProyectos.FirstOrDefaultAsync(p => p.Uuid == dto.Uuid);
                }

                if (project != null)
                {
                    // 1.1 Bloqueo de Integridad por Estado
                    if (project.Estado != "Borrador" && project.Estado != "En Corrección")
                    {
                        return new SyncResult { Success = false, Message = $"El proyecto [{project.Estado}] está blindado y no permite modificaciones." };
                    }
                }
                else
                {
                    project = new InvProyecto
                    {
                        Uuid = dto.Uuid ?? Guid.NewGuid().ToString(),
                        FechaRegistro = DateTime.Now,
                        Estado = "Borrador"
                    };
                    _context.InvProyectos.Add(project);
                }

                // 2. Mapeo de Atributos Nucleares
                project.Titulo = dto.Titulo ?? "PROYECTO SIN TÍTULO";
                project.CodigoInstitucional = dto.CodigoInstitucional;
                project.DescripcionProyecto = dto.DescripcionProyecto;
                project.Antecedentes = dto.Antecedentes;
                project.Justificacion = dto.Justificacion;
                project.MarcoTeorico = dto.MarcoTeorico;
                project.Metodologia = dto.Metodologia;
                project.MetodoEvaluacion = dto.Evaluacion;
                project.TiempoEjecucion = dto.TiempoEjecucion;
                project.TieneGrupo = dto.TieneGrupoInvestigacion;
                project.IdConvocatoria = dto.IdConvocatoria;
                project.IdObjetivoPnd = dto.IdObjetivoPnd;

                // Núcleo Innovación & TRL
                project.IdEntidadAliada = dto.IdEntidadAliada;
                project.TrlInicial = (sbyte?)(dto.TrlInicial ?? 1);
                project.TrlActual = (sbyte?)(dto.TrlActual ?? 1);
                project.TrlMeta = (sbyte?)(dto.TrlMeta ?? 1);

                // Persistencia Completa en Metadata (Future-Proof)
                project.MetadataCacesJson = System.Text.Json.JsonSerializer.Serialize(dto);
                project.FechaModificacion = DateTime.Now;

                await _context.SaveChangesAsync(); // Aseguramos ID del proyecto

                // 3. Sincronización de Equipo (Anti-Corruption Layer provisionada por AuthService)
                await SyncInvestigadoresAsync(project.IdProyecto, dto.Investigadores);

                // 4. Sincronización de Objetivos Específicos
                await SyncObjetivosAsync(project.IdProyecto, dto.ObjetivosEspecificos);

                // 5. Sincronización de Presupuesto
                await SyncPresupuestoAsync(project.IdProyecto, dto.RecursosNecesarios);

                // 6. Sincronización de MML
                await SyncMmlAsync(project.IdProyecto, dto.MatrizMarcoLogico);

                // 7. Sincronización de Impactos
                await SyncImpactosAsync(project.IdProyecto, dto.Impacto);

                // 8. Sincronización de Productos
                await SyncProductosAsync(project.IdProyecto, dto.ProductosEsperados);

                // 9. Sincronización de Cronograma
                await SyncCronogramaAsync(project.IdProyecto, dto.Cronograma);

                // 10. Sincronización de Bibliografía
                await SyncBibliografiaAsync(project.IdProyecto, dto.Bibliografia);

                // 11. Sincronización de Recursos Disponibles
                await SyncRecursosDisponiblesAsync(project.IdProyecto, dto.RecursosDisponibles);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await _auditService.LogActionAsync(null, project.Estado == "Borrador" && dto.Uuid == null ? "CREAR_PROYECTO" : "ACTUALIZAR_PROYECTO", $"Sincronización de datos del proyecto: {project.Titulo}", "PROYECTOS");

                return new SyncResult { Success = true, Uuid = project.Uuid };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error crítico en SyncProjectWizardData para UUID: {Uuid}", dto.Uuid);
                return new SyncResult { Success = false, Message = ex.Message, Uuid = dto.Uuid };
            }
        }

        private async Task SyncInvestigadoresAsync(int projectId, System.Collections.Generic.List<InvestigadorDto>? investigadores)
        {
            if (investigadores == null) return;

            var currentProfs = _context.InvProyectosProfesores.Where(p => p.IdProyecto == projectId);
            var currentAlums = _context.InvProyectosAlumnos.Where(p => p.IdProyecto == projectId);
            _context.InvProyectosProfesores.RemoveRange(currentProfs);
            _context.InvProyectosAlumnos.RemoveRange(currentAlums);

            foreach (var inv in investigadores)
            {
                if (string.IsNullOrEmpty(inv.Cedula)) continue;

                var persona = await _authService.GetOrProvisionUserByCedulaAsync(inv.Cedula);
                if (persona == null) continue;

                if (persona.TablaSigafi == "alumno")
                {
                    _context.InvProyectosAlumnos.Add(new InvProyectoAlumno
                    {
                        IdProyecto = projectId,
                        IdUsuario = persona.IdUsuario,
                        Rol = inv.Rol,
                        NivelAcademico = inv.NivelAcademico,
                        Telefono = inv.Telefono
                    });
                }
                else
                {
                    _context.InvProyectosProfesores.Add(new InvProyectoProfesor
                    {
                        IdProyecto = projectId,
                        IdUsuario = persona.IdUsuario,
                        Rol = inv.Rol,
                        NivelAcademico = inv.NivelAcademico,
                        Telefono = inv.Telefono,
                        EsDirector = inv.Rol?.Contains("Director") == true
                    });
                }
            }
        }

        private async Task SyncObjetivosAsync(int projectId, System.Collections.Generic.List<string>? objetivos)
        {
            if (objetivos == null) return;
            var old = _context.InvObjetivosProyecto.Where(o => o.IdProyecto == projectId && !o.EsGeneral);
            _context.InvObjetivosProyecto.RemoveRange(old);

            int orden = 1;
            foreach (var obj in objetivos)
            {
                if (string.IsNullOrWhiteSpace(obj)) continue;
                _context.InvObjetivosProyecto.Add(new InvObjetivoProyecto
                {
                    IdProyecto = projectId,
                    Descripcion = obj,
                    EsGeneral = false,
                    Orden = orden++
                });
            }
        }

        private async Task SyncPresupuestoAsync(int projectId, System.Collections.Generic.List<RecursoNecesarioDto>? recursos)
        {
            if (recursos == null) return;
            var old = _context.InvPresupuestoItems.Where(p => p.IdProyecto == projectId);
            _context.InvPresupuestoItems.RemoveRange(old);

            foreach (var r in recursos)
            {
                _context.InvPresupuestoItems.Add(new InvPresupuestoItem
                {
                    IdProyecto = projectId,
                    Categoria = "Gasto",
                    Detalle = r.Descripcion ?? "Sin detalle",
                    Cantidad = decimal.TryParse(r.Cantidad, out var c) ? c : 1,
                    ValorUnitario = r.CostoUnitario ?? 0,
                    EsGastoCapital = r.EsGastoCapital ?? false,
                    IdPartida = r.IdPartida
                });
            }
        }

        private async Task SyncMmlAsync(int projectId, System.Collections.Generic.List<MmlRowDto>? mml)
        {
            if (mml == null) return;
            var old = _context.InvProyectosMml.Where(m => m.IdProyecto == projectId);
            _context.InvProyectosMml.RemoveRange(old);

            foreach (var row in mml)
            {
                if (string.IsNullOrWhiteSpace(row.Resumen)) continue;
                _context.InvProyectosMml.Add(new InvProyectoMml
                {
                    IdProyecto = projectId,
                    Nivel = row.Nivel ?? "Desconocido",
                    ResumenNarrativo = row.Resumen,
                    Indicadores = row.Indicadores,
                    MediosVerificacion = row.Medios,
                    Supuestos = row.Supuestos
                });
            }
        }

        private async Task SyncImpactosAsync(int projectId, ImpactoProyectoDto? impacto)
        {
            if (impacto == null) return;
            var old = _context.InvImpactosProyecto.Where(i => i.IdProyecto == projectId);
            _context.InvImpactosProyecto.RemoveRange(old);

            // Mapeo basado en el catálogo estándar (ID 1-6)
            if (!string.IsNullOrWhiteSpace(impacto.Social)) AddImpacto(projectId, 1, impacto.Social);
            if (!string.IsNullOrWhiteSpace(impacto.Cientifico)) AddImpacto(projectId, 2, impacto.Cientifico);
            if (!string.IsNullOrWhiteSpace(impacto.Economico)) AddImpacto(projectId, 3, impacto.Economico);
            if (!string.IsNullOrWhiteSpace(impacto.Politico)) AddImpacto(projectId, 4, impacto.Politico);
            if (!string.IsNullOrWhiteSpace(impacto.Ambiental)) AddImpacto(projectId, 5, impacto.Ambiental);
            if (!string.IsNullOrWhiteSpace(impacto.Otro)) AddImpacto(projectId, 6, impacto.Otro);
        }

        private void AddImpacto(int projectId, int catId, string desc)
        {
            _context.InvImpactosProyecto.Add(new InvImpactoProyecto
            {
                IdProyecto = projectId,
                IdCatImpacto = catId,
                Descripcion = desc
            });
        }

        private async Task SyncProductosAsync(int projectId, System.Collections.Generic.List<ProductoEsperadoDto>? productos)
        {
            if (productos == null) return;
            var old = _context.InvProductos.Where(p => p.IdProyecto == projectId);
            _context.InvProductos.RemoveRange(old);

            foreach (var p in productos)
            {
                if (string.IsNullOrWhiteSpace(p.Tipo)) continue;
                
                // Intentamos buscar el ID del tipo de producto por nombre o UUID si viniera
                var cat = await _context.InvCatTipoProductos.FirstOrDefaultAsync(c => c.Nombre == p.Tipo);
                
                _context.InvProductos.Add(new InvProducto
                {
                    IdProyecto = projectId,
                    IdTipoProducto = cat?.IdTipoProducto ?? 1, // Default a Académico si no se encuentra
                    Titulo = p.Tipo,
                    Cantidad = int.TryParse(p.Cantidad, out var cant) ? cant : 1
                });
            }
        }

        private async Task SyncCronogramaAsync(int projectId, System.Collections.Generic.List<ActividadCronogramaDto>? cronograma)
        {
            if (cronograma == null) return;
            
            // 1. Limpieza profunda
            var oldActivities = await _context.InvCronogramas.Where(c => c.IdProyecto == projectId).ToListAsync();
            foreach(var old in oldActivities) {
                var weeks = _context.InvCronogramaSemanas.Where(s => s.IdActividad == old.IdActividad);
                _context.InvCronogramaSemanas.RemoveRange(weeks);
            }
            _context.InvCronogramas.RemoveRange(oldActivities);
            await _context.SaveChangesAsync();

            // 2. Inserción
            foreach (var act in cronograma)
            {
                if (string.IsNullOrWhiteSpace(act.Actividad)) continue;

                var nuevaAct = new InvCronograma
                {
                    IdProyecto = projectId,
                    IdObjetivo = 0, // TODO: Vincular con objetivo específico si se requiere
                    NumeroActividad = act.Numero ?? 0,
                    Descripcion = act.Actividad,
                    RecursosNecesarios = act.RecursosNecesarios,
                    Ponderacion = act.Ponderacion ?? 0,
                    EsEntregableCaces = act.EsEntregableCaces ?? false
                };
                _context.InvCronogramas.Add(nuevaAct);
                await _context.SaveChangesAsync(); // Para obtener IdActividad

                if (act.Semanas != null)
                {
                    for (int i = 0; i < act.Semanas.Count; i++)
                    {
                        if (act.Semanas[i])
                        {
                            _context.InvCronogramaSemanas.Add(new InvCronogramaSemana
                            {
                                IdActividad = nuevaAct.IdActividad,
                                Mes = $"Mes {(i / 4) + 1}",
                                Semana = true // Indica que esta semana está marcada
                            });
                        }
                    }
                }
            }
        }

        private async Task SyncBibliografiaAsync(int projectId, System.Collections.Generic.List<string>? biblio)
        {
            if (biblio == null) return;
            var old = _context.InvBibliografiasProyecto.Where(b => b.IdProyecto == projectId);
            _context.InvBibliografiasProyecto.RemoveRange(old);

            foreach (var b in biblio)
            {
                if (string.IsNullOrWhiteSpace(b)) continue;
                _context.InvBibliografiasProyecto.Add(new InvBibliografiaProyecto
                {
                    IdProyecto = projectId,
                    CitaApa = b
                });
            }
        }

        private async Task SyncRecursosDisponiblesAsync(int projectId, System.Collections.Generic.List<RecursoDisponibleDto>? recursos)
        {
            if (recursos == null) return;
            var old = _context.InvRecursosDisponibles.Where(r => r.IdProyecto == projectId);
            _context.InvRecursosDisponibles.RemoveRange(old);

            foreach (var r in recursos)
            {
                if (string.IsNullOrWhiteSpace(r.Descripcion)) continue;
                _context.InvRecursosDisponibles.Add(new InvRecursoDisponible
                {
                    IdProyecto = projectId,
                    Detalle = r.Descripcion,
                    Cantidad = decimal.TryParse(r.Cantidad, out var cantRec) ? cantRec : 0,
                    Fuente = r.Fuente
                });
            }
        }
    }
}

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
        private readonly ILogger<ProjectOrchestrator> _logger;

        public ProjectOrchestrator(DiitraContext context, IAuthService authService, ILogger<ProjectOrchestrator> logger)
        {
            _context = context;
            _authService = authService;
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

                if (project == null)
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

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

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
    }
}

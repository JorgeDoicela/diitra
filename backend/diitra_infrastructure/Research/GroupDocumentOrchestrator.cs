using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Diitra.Application.Common.Documents;
using diitra_application.Research;
using diitra_infrastructure.data.models;

namespace diitra_infrastructure.Research
{
    public class GroupDocumentOrchestrator : IGroupDocumentOrchestrator
    {
        private readonly DiitraContext _context;
        private readonly IDocumentEngine _documentEngine;
        private readonly ILogger<GroupDocumentOrchestrator> _logger;

        public GroupDocumentOrchestrator(
            DiitraContext context,
            IDocumentEngine documentEngine,
            ILogger<GroupDocumentOrchestrator> logger)
        {
            _context = context;
            _documentEngine = documentEngine;
            _logger = logger;
        }

        public async Task<object> BuildGroupDocumentDataAsync(string groupUuid, CancellationToken ct = default)
        {
            var group = await _context.InvGruposInvestigacion
                .Include(g => g.IdCoordinadorNavigation)
                .Include(g => g.IdDominioNavigation)
                .Include(g => g.IdLineas)
                .Include(g => g.IdCarreras)
                .Include(g => g.InvGruposMiembros)
                    .ThenInclude(m => m.IdUsuarioNavigation)
                .AsNoTracking()
                .FirstOrDefaultAsync(g => g.Uuid == groupUuid, ct);

            if (group == null)
            {
                throw new KeyNotFoundException($"Grupo de investigación con UUID '{groupUuid}' no encontrado.");
            }

            var lineasNombres = group.IdLineas?.Select(l => l.NombreLinea).Where(n => !string.IsNullOrWhiteSpace(n)).ToList() ?? new List<string>();
            var carrerasNombres = group.IdCarreras?.Select(c => c.Carrera1 ?? c.AliasCarrera ?? "Carrera").Where(n => !string.IsNullOrWhiteSpace(n)).ToList() ?? new List<string>();

            // Separar docentes y estudiantes
            var miembrosDocentes = new List<object>();
            var miembrosEstudiantes = new List<object>();

            foreach (var m in group.InvGruposMiembros)
            {
                var user = m.IdUsuarioNavigation;
                var tablaSigafi = (user?.TablaSigafi ?? "").ToLowerInvariant();
                var isEstudiante = tablaSigafi == "alumno" || (m.Rol != null && m.Rol.ToLowerInvariant().Contains("estudiante"));
                var rol = !string.IsNullOrWhiteSpace(m.Rol) ? m.Rol : (isEstudiante ? "Semillerista" : "Investigador");

                if (isEstudiante)
                {
                    miembrosEstudiantes.Add(new
                    {
                        nombre = user?.Nombre ?? "Estudiante Semillerista",
                        cedula = user?.IdSigafi ?? "—",
                        carrera = carrerasNombres.FirstOrDefault() ?? "No especificada",
                        rol = rol
                    });
                }
                else
                {
                    miembrosDocentes.Add(new
                    {
                        nombre = user?.Nombre ?? "Docente Investigador",
                        cedula = user?.IdSigafi ?? "—",
                        email = user?.EmailInstitucional ?? "—",
                        rol = rol
                    });
                }
            }

            var coordNombre = group.IdCoordinadorNavigation?.Nombre ?? "No asignado";
            var coordCedula = group.IdCoordinadorNavigation?.IdSigafi ?? "—";
            var coordEmail = group.IdCoordinadorNavigation?.EmailInstitucional ?? "—";

            var data = new Dictionary<string, object>
            {
                ["uuid"] = group.Uuid,
                ["nombre_grupo"] = group.Nombre ?? "Grupo de Investigación",
                ["siglas"] = group.Siglas ?? "—",
                ["tipo_grupo"] = group.TipoGrupo ?? "Investigación",
                ["coordinador_nombre"] = coordNombre,
                ["coordinador_cedula"] = coordCedula,
                ["coordinador_email"] = coordEmail,
                ["coordinador_telefono"] = group.TelefonoCoordinador ?? "—",
                ["dominio_nombre"] = group.IdDominioNavigation?.Nombre ?? "No asignado",
                ["lineas_investigacion"] = lineasNombres.Any() ? string.Join(", ", lineasNombres) : "No asignadas",
                ["carreras_vinculadas"] = carrerasNombres.Any() ? string.Join(", ", carrerasNombres) : "No asignadas",
                ["carreras_texto"] = carrerasNombres.Any() ? string.Join(" / ", carrerasNombres) : "INSTITUTO SUPERIOR TECNOLÓGICO MAYOR PEDRO TRAVERSARI",
                ["categoria_consolidacion"] = group.CategoriaConsolidacion ?? "En Formación",
                ["fecha_presentacion"] = group.FechaCreacion.HasValue 
                    ? group.FechaCreacion.Value.ToString("dd/MM/yyyy") 
                    : (group.FechaRegistro.HasValue ? group.FechaRegistro.Value.ToString("dd/MM/yyyy") : DateTime.Now.ToString("dd/MM/yyyy")),
                ["mision"] = group.Mision ?? "Misión del grupo pendiente de registro.",
                ["vision"] = group.Vision ?? "Visión del grupo pendiente de registro.",
                ["objetivo_general"] = group.ObjetivoGeneral ?? "Objetivo general pendiente de registro.",
                ["miembros_docentes"] = miembrosDocentes,
                ["miembros_estudiantes"] = miembrosEstudiantes
            };

            return data;
        }

        public async Task<DocumentResult> GenerateProposalDocumentAsync(
            string groupUuid, 
            string? requestedBy = null, 
            bool isDraft = false, 
            CancellationToken ct = default)
        {
            var data = await BuildGroupDocumentDataAsync(groupUuid, ct);

            var request = new DocumentRequest
            {
                TemplateCode = "PROPUESTA_GRUPO_INVESTIGACION",
                Data = data,
                IsDraftMode = isDraft,
                RequestedBy = requestedBy ?? "Sistema",
                EntityUuid = groupUuid
            };

            _logger.LogInformation("GroupDocumentOrchestrator: Generando documento PROPUESTA_GRUPO_INVESTIGACION para grupo {Uuid} (Draft={IsDraft})", groupUuid, isDraft);

            return await _documentEngine.GenerateAsync(request, ct);
        }
    }
}

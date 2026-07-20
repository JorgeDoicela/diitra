using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace diitra_infrastructure.Research.Subservices
{
    public class ProjectActivitySubservice : IProjectActivitySubservice
    {
        private readonly DiitraContext _context;

        public ProjectActivitySubservice(DiitraContext context)
        {
            _context = context;
        }

        public async Task<List<ProyectoActividadDto>> GetProjectActivityAsync(string projectUuid, int maxItems = 20)
        {
            var project = await _context.InvProyectos
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Uuid == projectUuid);

            if (project == null) return new List<ProyectoActividadDto>();

            var instanceUuids = await _context.DocumentInstances
                .AsNoTracking()
                .Where(di => di.EntityUuid == projectUuid)
                .Select(di => di.Uuid)
                .ToListAsync();

            if (!instanceUuids.Contains(projectUuid))
            {
                instanceUuids.Add(projectUuid);
            }

            var actividades = new List<ProyectoActividadDto>();

            if (instanceUuids.Count > 0)
            {
                var sesiones = new List<diitra_infrastructure.data.models.Cowork.InvCoworkSesion>();
                foreach (var uuid in instanceUuids)
                {
                    var pattern = uuid + "%";
                    var list = await _context.InvCoworkSesiones.AsNoTracking()
                        .Where(s => EF.Functions.Like(s.DocumentoUuid, pattern) &&
                                    (s.SeccionNombre != null || s.Accion != null))
                        .OrderByDescending(s => s.ConectadoEn)
                        .Take(30)
                        .ToListAsync();
                    sesiones.AddRange(list);
                }

                sesiones = sesiones
                    .Where(s => !s.DesconectadoEn.HasValue ||
                                (s.DesconectadoEn.Value - s.ConectadoEn).TotalSeconds >= 5)
                    .OrderByDescending(s => s.ConectadoEn)
                    .Take(10)
                    .ToList();

                foreach (var s in sesiones)
                {
                    if (string.IsNullOrWhiteSpace(s.SeccionNombre) && string.IsNullOrWhiteSpace(s.Accion))
                    {
                        continue;
                    }

                    string seccion;
                    string descripcion;

                    if (!string.IsNullOrWhiteSpace(s.SeccionNombre))
                    {
                        seccion = s.SeccionNombre.Replace("_", " ");
                        descripcion = !string.IsNullOrWhiteSpace(s.Accion)
                            ? $"{s.Accion} '{seccion}'"
                            : "ha entrado a redactar";
                    }
                    else
                    {
                        var parts = s.DocumentoUuid.Split('_');
                        seccion = parts.Length > 1 ? parts[1].Replace("_", " ") : "el documento";
                        var durMin = s.DesconectadoEn.HasValue
                            ? (int)(s.DesconectadoEn.Value - s.ConectadoEn).TotalMinutes
                            : -1;

                        descripcion = durMin >= 0
                            ? $"Editó '{seccion}' durante {durMin} min"
                            : $"Está editando '{seccion}'";
                    }

                    actividades.Add(new ProyectoActividadDto
                    {
                        Tipo = "acceso",
                        NombreUsuario = string.IsNullOrWhiteSpace(s.NombreUsuario) ? "Usuario" : s.NombreUsuario,
                        RolUsuario = s.RolUsuario,
                        Descripcion = descripcion,
                        Fecha = s.ConectadoEn,
                        Icono = "edit"
                    });
                }

                var secciones = await _context.InvDocumentosSeccionesMetadata
                    .AsNoTracking()
                    .Where(m => instanceUuids.Contains(m.DocumentoUuid))
                    .OrderByDescending(m => m.ActualizadoEn)
                    .Take(10)
                    .ToListAsync();

                foreach (var sec in secciones)
                {
                    actividades.Add(new ProyectoActividadDto
                    {
                        Tipo = "seccion",
                        NombreUsuario = sec.UltimoNombreUsuario ?? "Sistema",
                        RolUsuario = "",
                        Descripcion = $"Sección '{sec.SeccionNombre}' marcada como {sec.Estado}",
                        Fecha = sec.ActualizadoEn,
                        Icono = sec.Estado == "Aprobado" ? "check" : sec.Estado == "En Revisión" ? "eye" : "edit"
                    });
                }

                var comentarios = await _context.InvCollaborationComments
                    .AsNoTracking()
                    .Where(c => instanceUuids.Contains(c.DocumentoUuid))
                    .OrderByDescending(c => c.CreadoEn)
                    .Take(10)
                    .ToListAsync();

                foreach (var c in comentarios)
                {
                    string textDesc = c.Contenido;
                    if (textDesc.Trim().StartsWith("{"))
                    {
                        try
                        {
                            using var doc = System.Text.Json.JsonDocument.Parse(textDesc);
                            var root = doc.RootElement;
                            if (root.TryGetProperty("text", out var textProp))
                            {
                                var textVal = textProp.GetString();
                                if (root.TryGetProperty("fieldName", out var fieldProp))
                                {
                                    var fieldVal = fieldProp.GetString();
                                    textDesc = $"Observó '{fieldVal}': {textVal}";
                                }
                                else
                                {
                                    textDesc = textVal ?? c.Contenido;
                                }
                            }
                        }
                        catch {}
                    }

                    actividades.Add(new ProyectoActividadDto
                    {
                        Tipo = "comentario",
                        NombreUsuario = string.IsNullOrWhiteSpace(c.NombreUsuario) ? "Usuario" : c.NombreUsuario,
                        RolUsuario = "",
                        Descripcion = textDesc,
                        Fecha = c.CreadoEn,
                        Icono = "comment"
                    });
                }
            }

            var trazas = await _context.InvTrazabilidadProyectos
                .AsNoTracking()
                .Where(t => t.IdProyecto == project.IdProyecto)
                .OrderByDescending(t => t.FechaTransicion)
                .Take(5)
                .ToListAsync();

            foreach (var t in trazas)
            {
                actividades.Add(new ProyectoActividadDto
                {
                    Tipo = "workflow",
                    NombreUsuario = "Sistema DIITRA",
                    RolUsuario = "",
                    Descripcion = $"Estado: {t.EstadoAnterior} → {t.EstadoNuevo}",
                    Fecha = t.FechaTransicion ?? DateTime.Now,
                    Icono = "workflow"
                });
            }

            return actividades
                .OrderByDescending(a => a.Fecha)
                .Take(maxItems)
                .ToList();
        }
    }
}

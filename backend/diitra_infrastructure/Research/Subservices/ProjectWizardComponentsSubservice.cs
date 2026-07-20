using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Diitra.Application.Research.Dtos;
using diitra_infrastructure.data.models;
using Microsoft.EntityFrameworkCore;

namespace diitra_infrastructure.Research.Subservices
{
    public class ProjectWizardComponentsSubservice : IProjectWizardComponentsSubservice
    {
        private readonly DiitraContext _context;
        private readonly IProjectWizardCoreSubservice _coreSubservice;

        public ProjectWizardComponentsSubservice(
            DiitraContext context,
            IProjectWizardCoreSubservice coreSubservice)
        {
            _context = context;
            _coreSubservice = coreSubservice;
        }

        private List<string> ParseObjetivosHtml(List<string>? objetivos)
        {
            var result = new List<string>();
            if (objetivos == null) return result;

            foreach (var item in objetivos)
            {
                if (string.IsNullOrWhiteSpace(item)) continue;

                if (item.Contains("<li") || item.Contains("<p"))
                {
                    string cleaned = item.Replace("<ul>", "").Replace("</ul>", "").Replace("<ol>", "").Replace("</ol>", "");

                    var matches = System.Text.RegularExpressions.Regex.Matches(cleaned, @"<(li|p)[^>]*>(.*?)<\/\1>", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                    if (matches.Count > 0)
                    {
                        foreach (System.Text.RegularExpressions.Match match in matches)
                        {
                            var text = System.Text.RegularExpressions.Regex.Replace(match.Groups[2].Value, @"<[^>]*>", "").Trim();
                            text = System.Net.WebUtility.HtmlDecode(text);
                            text = System.Text.RegularExpressions.Regex.Replace(text, @"^[a-zA-Z0-9\-\.\)]+\s*[-–—]?\s*", "").Trim();

                            if (!string.IsNullOrWhiteSpace(text))
                            {
                                result.Add(text);
                            }
                        }
                    }
                    else
                    {
                        var cleanText = System.Text.RegularExpressions.Regex.Replace(item, @"<[^>]*>", "").Trim();
                        cleanText = System.Net.WebUtility.HtmlDecode(cleanText);
                        cleanText = System.Text.RegularExpressions.Regex.Replace(cleanText, @"^[a-zA-Z0-9\-\.\)]+\s*[-–—]?\s*", "").Trim();
                        if (!string.IsNullOrWhiteSpace(cleanText))
                        {
                            result.Add(cleanText);
                        }
                    }
                }
                else
                {
                    var text = System.Text.RegularExpressions.Regex.Replace(item, @"^[a-zA-Z0-9\-\.\)]+\s*[-–—]?\s*", "").Trim();
                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        result.Add(text);
                    }
                }
            }

            return result;
        }

        public async Task<List<int>> SyncObjetivosAsync(int projectId, string? objetivoGeneral, List<string>? objetivos)
        {
            var generalOpt = await _context.InvObjetivosProyecto.FirstOrDefaultAsync(o => o.IdProyecto == projectId && o.EsGeneral);

            string descGeneral = !string.IsNullOrWhiteSpace(objetivoGeneral) ? objetivoGeneral : "Objetivo General por definir";
            if (descGeneral.Contains("<"))
            {
                descGeneral = System.Text.RegularExpressions.Regex.Replace(descGeneral, @"<[^>]*>", "").Trim();
                descGeneral = System.Net.WebUtility.HtmlDecode(descGeneral);
            }

            if (generalOpt != null)
            {
                generalOpt.Descripcion = descGeneral;
            }
            else
            {
                generalOpt = new InvObjetivoProyecto
                {
                    IdProyecto = projectId,
                    Descripcion = descGeneral,
                    EsGeneral = true,
                    Orden = 0
                };
                _context.InvObjetivosProyecto.Add(generalOpt);
            }
            await _coreSubservice.SaveChangesWithConcurrencyResolutionAsync();
            int generalId = generalOpt.IdObjetivo;

            var ids = new List<int> { generalId };

            var parsedObjetivos = ParseObjetivosHtml(objetivos);
            if (parsedObjetivos.Count > 0)
            {
                var old = _context.InvObjetivosProyecto.Where(o => o.IdProyecto == projectId && !o.EsGeneral);
                _context.InvObjetivosProyecto.RemoveRange(old);

                int orden = 1;
                foreach (var obj in parsedObjetivos)
                {
                    _context.InvObjetivosProyecto.Add(new InvObjetivoProyecto
                    {
                        IdProyecto = projectId,
                        Descripcion = obj,
                        EsGeneral = false,
                        Orden = orden++
                    });
                }

                await _coreSubservice.SaveChangesWithConcurrencyResolutionAsync();

                var creadosIds = await _context.InvObjetivosProyecto
                    .Where(o => o.IdProyecto == projectId && !o.EsGeneral)
                    .OrderBy(o => o.Orden)
                    .Select(o => o.IdObjetivo)
                    .ToListAsync();

                ids.AddRange(creadosIds);
            }

            return ids;
        }

        public async Task SyncPresupuestoAsync(int projectId, List<RecursoNecesarioDto>? recursos)
        {
            if (recursos == null) return;

            var existing = await _context.InvPresupuestoItems
                .Where(p => p.IdProyecto == projectId)
                .ToListAsync();

            _context.InvPresupuestoItems.RemoveRange(existing);
            await _context.SaveChangesAsync();

            foreach (var r in recursos)
            {
                _context.InvPresupuestoItems.Add(new InvPresupuestoItem
                {
                    IdProyecto = projectId,
                    Categoria = "Gasto",
                    Detalle = r.Descripcion ?? "Sin detalle",
                    Cantidad = decimal.TryParse(r.Cantidad, out var c) ? c : 1,
                    ValorUnitario = r.CostoUnitario,
                    EsGastoCapital = r.EsGastoCapital ?? false,
                    IdPartida = r.IdPartida
                });
            }
        }

        public async Task SyncMmlAsync(int projectId, List<MmlRowDto>? mml)
        {
            if (mml == null) return;

            var existing = await _context.InvProyectosMml
                .Where(m => m.IdProyecto == projectId)
                .ToListAsync();

            var newResumenes = mml
                .Where(r => !string.IsNullOrWhiteSpace(r.Resumen))
                .Select(r => r.Resumen!.Trim())
                .ToHashSet();

            var toDelete = existing
                .Where(e => !newResumenes.Contains(e.ResumenNarrativo.Trim()))
                .ToList();
            _context.InvProyectosMml.RemoveRange(toDelete);

            var existingResumenes = existing
                .Select(e => e.ResumenNarrativo.Trim())
                .ToHashSet();

            foreach (var row in mml)
            {
                if (string.IsNullOrWhiteSpace(row.Resumen)) continue;
                if (existingResumenes.Contains(row.Resumen.Trim())) continue;
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

        public async Task SyncImpactosAsync(int projectId, ImpactoProyectoDto? impacto)
        {
            if (impacto == null) return;

            var existing = await _context.InvImpactosProyecto
                .Where(i => i.IdProyecto == projectId)
                .ToListAsync();

            var newImpactos = new Dictionary<int, string?>
            {
                { 1, impacto.Social },
                { 2, impacto.Cientifico },
                { 3, impacto.Economico },
                { 4, impacto.Politico },
                { 5, impacto.Ambiental },
                { 6, impacto.Otro }
            };

            foreach (var kvp in newImpactos)
            {
                var existingItem = existing.FirstOrDefault(e => e.IdCatImpacto == kvp.Key);
                if (string.IsNullOrWhiteSpace(kvp.Value))
                {
                    if (existingItem != null) _context.InvImpactosProyecto.Remove(existingItem);
                    continue;
                }
                if (existingItem != null)
                    existingItem.Descripcion = kvp.Value;
                else
                    _context.InvImpactosProyecto.Add(new InvImpactoProyecto
                    {
                        IdProyecto = projectId,
                        IdCatImpacto = kvp.Key,
                        Descripcion = kvp.Value
                    });
            }
        }

        public async Task SyncProductosAsync(int projectId, List<ProductoEsperadoDto>? productos)
        {
            if (productos == null) return;

            var existing = await _context.InvProductos
                .Where(p => p.IdProyecto == projectId)
                .ToListAsync();

            var newTitulos = productos
                .Where(p => !string.IsNullOrWhiteSpace(p.Tipo))
                .Select(p => p.Tipo!.Trim())
                .ToHashSet();

            var toDelete = existing.Where(e => !newTitulos.Contains(e.Titulo.Trim())).ToList();
            _context.InvProductos.RemoveRange(toDelete);

            var existingTitulos = existing.Select(e => e.Titulo.Trim()).ToHashSet();

            foreach (var p in productos)
            {
                if (string.IsNullOrWhiteSpace(p.Tipo)) continue;
                if (existingTitulos.Contains(p.Tipo.Trim())) continue;

                var cat = await _context.InvCatTipoProductos.FirstOrDefaultAsync(c => c.Nombre == p.Tipo);
                _context.InvProductos.Add(new InvProducto
                {
                    IdProyecto = projectId,
                    IdTipoProducto = cat?.IdTipoProducto ?? 1,
                    Titulo = p.Tipo,
                    Cantidad = int.TryParse(p.Cantidad, out var cant) ? cant : 1
                });
            }
        }

        public async Task SyncCronogramaAsync(int projectId, List<int> objetivosCreadosIds, List<ActividadCronogramaDto>? cronograma)
        {
            if (cronograma == null) return;

            var oldActivities = await _context.InvCronogramas
                .Where(c => c.IdProyecto == projectId)
                .ToListAsync();

            _context.InvCronogramas.RemoveRange(oldActivities);

            int defaultObjetivoId = objetivosCreadosIds.FirstOrDefault();

            foreach (var act in cronograma)
            {
                if (string.IsNullOrWhiteSpace(act.Actividad)) continue;

                int dbObjetivoId = defaultObjetivoId;
                if (act.IdObjetivo.HasValue && objetivosCreadosIds.Count > 0)
                {
                    int index = act.IdObjetivo.Value;
                    if (index >= 0 && index < objetivosCreadosIds.Count)
                    {
                        dbObjetivoId = objetivosCreadosIds[index];
                    }
                }

                var nuevaAct = new InvCronograma
                {
                    IdProyecto = projectId,
                    IdObjetivo = dbObjetivoId,
                    NumeroActividad = act.Numero,
                    Descripcion = act.Actividad,
                    RecursosNecesarios = act.RecursosNecesarios,
                    Responsable = act.Responsable,
                    Entregable = act.Entregable,
                    Ponderacion = act.Ponderacion,
                    EsEntregableCaces = act.EsEntregableCaces ?? false,
                    FechaInicioPrevista = ProjectHelper.ParseDateOnly(act.FechaInicioPrevista),
                    FechaFinPrevista = ProjectHelper.ParseDateOnly(act.FechaFinPrevista)
                };

                _context.InvCronogramas.Add(nuevaAct);
            }
        }

        public async Task SyncBibliografiaAsync(int projectId, List<string>? biblio)
        {
            if (biblio == null) return;

            var existing = await _context.InvBibliografiasProyecto
                .Where(b => b.IdProyecto == projectId)
                .ToListAsync();

            var newCitas = biblio
                .Where(b => !string.IsNullOrWhiteSpace(b))
                .Select(b => b.Trim())
                .ToHashSet();

            var toDelete = existing.Where(e => !newCitas.Contains(e.CitaApa.Trim())).ToList();
            _context.InvBibliografiasProyecto.RemoveRange(toDelete);

            var existingCitas = existing.Select(e => e.CitaApa.Trim()).ToHashSet();
            foreach (var b in biblio)
            {
                if (string.IsNullOrWhiteSpace(b) || existingCitas.Contains(b.Trim())) continue;
                _context.InvBibliografiasProyecto.Add(new InvBibliografiaProyecto
                {
                    IdProyecto = projectId,
                    CitaApa = b
                });
            }
        }

        public async Task SyncRecursosDisponiblesAsync(int projectId, List<RecursoDisponibleDto>? recursos)
        {
            if (recursos == null) return;

            var existing = await _context.InvRecursosDisponibles
                .Where(r => r.IdProyecto == projectId)
                .ToListAsync();

            var newDetalles = recursos
                .Where(r => !string.IsNullOrWhiteSpace(r.Descripcion))
                .Select(r => r.Descripcion!.Trim())
                .ToHashSet();

            var toDelete = existing.Where(e => !newDetalles.Contains(e.Detalle.Trim())).ToList();
            _context.InvRecursosDisponibles.RemoveRange(toDelete);

            var existingDetalles = existing.Select(e => e.Detalle.Trim()).ToHashSet();
            foreach (var r in recursos)
            {
                if (string.IsNullOrWhiteSpace(r.Descripcion) || existingDetalles.Contains(r.Descripcion.Trim())) continue;
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

using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    /// <summary>
    /// Proveedor dinámico de bloque para la Rúbrica de Evaluación por Pares.
    /// Mapea los criterios definidos en la base de datos (inv_rubrica_criterios) hacia el
    /// formulario interactivo del evaluador y el esquema colaborativo/local de Yjs.
    /// </summary>
    public class RubricTableBlockProvider : IDocumentBlockProvider
    {
        private readonly DiitraContext _context;

        public RubricTableBlockProvider(DiitraContext context)
        {
            _context = context;
        }

        public string BlockType => "rubric_table";
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            // 1. Campos institucionales de la evaluación formal
            schemaDict["DeclaracionSinConflicto"] = true;

            // 2. Criterios dinámicos desde la rúbrica activa
            var rubricaActiva = _context.InvRubricas
                .Include(r => r.InvRubricaCriterios)
                .FirstOrDefault(r => r.Activo == true);

            if (rubricaActiva == null)
            {
                rubricaActiva = _context.InvRubricas
                    .Include(r => r.InvRubricaCriterios)
                    .FirstOrDefault();
            }

            if (rubricaActiva != null)
            {
                foreach (var criterion in rubricaActiva.InvRubricaCriterios)
                {
                    var fieldName = $"Criterio_{criterion.IdCriterio}";
                    schemaDict[fieldName] = 0;
                }
            }

            // 3. Justificaciones y dictamen cualitativo
            schemaDict["ComentariosGenerales"] = "";
            schemaDict["JustificacionRecomendacion"] = "";
            schemaDict["RecomendacionFinal"] = "";
        }

        public async Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            if (!sectionsList.Any(s => s.Id == "evaluacion"))
            {
                var rubricaActiva = await dbContext.InvRubricas
                    .Include(r => r.InvRubricaCriterios)
                    .FirstOrDefaultAsync(r => r.Activo == true, ct);

                if (rubricaActiva == null)
                {
                    rubricaActiva = await dbContext.InvRubricas
                        .Include(r => r.InvRubricaCriterios)
                        .FirstOrDefaultAsync(ct);
                }

                var rubricFields = new List<object>();

                // A. Declaración formal de ausencia de conflicto de interés
                rubricFields.Add(new {
                    name = "DeclaracionSinConflicto",
                    label = "Declaración de Ausencia de Conflicto de Interés (Normativa CACES)",
                    type = "checkbox",
                    collaborative = false,
                    min = (int?)null,
                    max = (int?)null,
                    options = (string[]?)null,
                    placeholder = (string?)null
                });

                // B. Criterios de evaluación dinámicos
                if (rubricaActiva != null)
                {
                    foreach (var criterion in rubricaActiva.InvRubricaCriterios.OrderBy(c => c.Orden ?? 0))
                    {
                        var fieldName = $"Criterio_{criterion.IdCriterio}";
                        rubricFields.Add(new {
                            name = fieldName,
                            label = $"{criterion.Nombre} (0-{(int)criterion.PesoPorcentaje} pts)",
                            type = "number",
                            collaborative = false,
                            min = 0,
                            max = (int)criterion.PesoPorcentaje,
                            options = (string[]?)null,
                            placeholder = (string?)null
                        });
                    }
                }

                // C. Observaciones cualitativas e informes de respaldo
                rubricFields.Add(new { 
                    name = "ComentariosGenerales", 
                    label = "5. Observaciones y Comentarios Fundamentales", 
                    type = "textarea", 
                    collaborative = false, 
                    min = (int?)null, 
                    max = (int?)null, 
                    options = (string[]?)null, 
                    placeholder = "Escriba un informe cualitativo detallado para fundamentar las puntuaciones asignadas..." 
                });

                rubricFields.Add(new { 
                    name = "JustificacionRecomendacion", 
                    label = "6. Fundamentación Técnica de la Recomendación Final", 
                    type = "textarea", 
                    collaborative = false, 
                    min = (int?)null, 
                    max = (int?)null, 
                    options = (string[]?)null, 
                    placeholder = "Argumente técnicamente el motivo de la recomendación dictaminada..." 
                });

                rubricFields.Add(new { 
                    name = "RecomendacionFinal", 
                    label = "7. Recomendación y Dictamen Final de la Comisión", 
                    type = "select", 
                    collaborative = false, 
                    min = (int?)null, 
                    max = (int?)null, 
                    options = new[] { "Aprobado sin modificaciones", "Aprobado con observaciones menores", "Requiere re-estructuración mayor", "Rechazado" }, 
                    placeholder = (string?)null 
                });

                var completionList = new List<string>();
                if (rubricaActiva != null)
                {
                    foreach (var criterion in rubricaActiva.InvRubricaCriterios)
                    {
                        completionList.Add($"Criterio_{criterion.IdCriterio}");
                    }
                }
                completionList.Add("RecomendacionFinal");

                sectionsList.Add(new UiSectionDto {
                    Id = "evaluacion",
                    Label = "Evaluación Técnica",
                    IconName = "CheckSquare",
                    ComponentName = null, // Usa AgnosticSection
                    Config = new {
                        completionFields = completionList.ToArray(),
                        referenceTemplateCode = "PROTOCOLO_INVESTIGACION",
                        fields = rubricFields.ToArray()
                    }
                });
            }
        }
    }
}

using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using Microsoft.EntityFrameworkCore;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class RubricTableBlockProvider : IDocumentBlockProvider
    {
        private readonly DiitraContext _context;

        public RubricTableBlockProvider(DiitraContext context)
        {
            _context = context;
        }

        public string BlockType => "rubric_table";

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            // Consultamos sincrónicamente la rúbrica activa para poblar las claves del esquema inicial de Yjs
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

            schemaDict["ComentariosGenerales"] = "";
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
                if (rubricaActiva != null)
                {
                    foreach (var criterion in rubricaActiva.InvRubricaCriterios.OrderBy(c => c.Orden ?? 0))
                    {
                        var fieldName = $"Criterio_{criterion.IdCriterio}";
                        rubricFields.Add(new {
                            name = fieldName,
                            label = $"{criterion.Nombre} (0-{(int)criterion.PesoPorcentaje})",
                            type = "number",
                            collaborative = false,
                            min = 0,
                            max = (int)criterion.PesoPorcentaje,
                            options = (string[]?)null,
                            placeholder = (string?)null
                        });
                    }
                }

                // Agregar observaciones cualitativas y recomendación final como en la versión clásica
                rubricFields.Add(new { 
                    name = "ComentariosGenerales", 
                    label = "Observaciones y comentarios institucionales", 
                    type = "textarea", 
                    collaborative = false, 
                    min = (int?)null, 
                    max = (int?)null, 
                    options = (string[]?)null, 
                    placeholder = "Escriba un informe cualitativo para fundamentar las puntuaciones..." 
                });

                rubricFields.Add(new { 
                    name = "RecomendacionFinal", 
                    label = "Recomendación Final de Comisión", 
                    type = "select", 
                    collaborative = false, 
                    min = (int?)null, 
                    max = (int?)null, 
                    options = new[] { "Aprobado sin modificaciones", "Aprobado con observaciones menores", "Requiere re-estructuración mayor", "Rechazado" }, 
                    placeholder = (string?)null 
                });

                sectionsList.Add(new UiSectionDto {
                    Id = "evaluacion",
                    Label = "Evaluación Técnica",
                    IconName = "CheckSquare",
                    ComponentName = null, // Usa AgnosticSection
                    Config = new {
                        referenceTemplateCode = "PROTOCOLO_INVESTIGACION",
                        fields = rubricFields.ToArray()
                    }
                });
            }
        }
    }
}

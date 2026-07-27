using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class ProjectTechnicalSectionBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "project_technical_section";

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            schemaDict["Antecedentes"] = "";
            schemaDict["DescripcionProyecto"] = "";
            schemaDict["Justificacion"] = "";
            schemaDict["ObjetivoGeneral"] = "";
            schemaDict["ObjetivosEspecificos"] = "";
            schemaDict["ObjetivosDesarrolloSostenible"] = "";
            schemaDict["Ods"] = "";
            schemaDict["MarcoTeorico"] = "";
            schemaDict["Metodologia"] = "";
            schemaDict["Evaluacion"] = "";
            
            premiumFieldsCount += 8;
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            if (!sectionsList.Any(s => s.Id == "tecnico"))
            {
                Dictionary<string, object>? configDict = null;
                if (block.TryGetProperty("config", out var configProp) && configProp.ValueKind == JsonValueKind.Object)
                {
                    try
                    {
                        configDict = JsonSerializer.Deserialize<Dictionary<string, object>>(configProp.GetRawText());
                    }
                    catch { }
                }

                sectionsList.Add(new UiSectionDto {
                    Id = "tecnico",
                    Label = string.IsNullOrEmpty(title) ? "Plan Técnico" : title,
                    IconName = "FileText",
                    ComponentName = "TechnicalSection",
                    Config = configDict
                });
            }
            return Task.CompletedTask;
        }
    }
}

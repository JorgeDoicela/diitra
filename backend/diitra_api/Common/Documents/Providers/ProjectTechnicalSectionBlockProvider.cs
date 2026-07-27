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
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

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

                if (configDict == null)
                {
                    configDict = new Dictionary<string, object>();
                }

                var completionList = new List<string>();
                bool IsEnabled(string key)
                {
                    if (configDict.TryGetValue(key, out var val))
                    {
                        if (val is JsonElement je && je.ValueKind == JsonValueKind.False) return false;
                        if (val is bool b && !b) return false;
                    }
                    return true;
                }

                if (IsEnabled("showAntecedentes")) completionList.Add("Antecedentes");
                if (IsEnabled("showDescripcionProyecto")) completionList.Add("DescripcionProyecto");
                if (IsEnabled("showJustificacion")) completionList.Add("Justificacion");
                if (IsEnabled("showObjetivoGeneral")) completionList.Add("ObjetivoGeneral");
                if (IsEnabled("showObjetivosEspecificos")) completionList.Add("ObjetivosEspecificos");
                if (IsEnabled("showOds")) completionList.Add("Ods");
                if (IsEnabled("showMarcoTeorico")) completionList.Add("MarcoTeorico");
                if (IsEnabled("showMetodologia")) completionList.Add("Metodologia");
                if (IsEnabled("showEvaluacion")) completionList.Add("Evaluacion");

                configDict["completionFields"] = completionList.ToArray();

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

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
            int addedCount = 0;
            if (block.TryGetProperty("config", out var configProp) &&
                configProp.TryGetProperty("technicalSections", out var sectionsProp) &&
                sectionsProp.ValueKind == JsonValueKind.Array &&
                sectionsProp.GetArrayLength() > 0)
            {
                foreach (var sec in sectionsProp.EnumerateArray())
                {
                    if (sec.TryGetProperty("enabled", out var en) && !en.GetBoolean()) continue;
                    
                    string fieldKey = "";
                    if (sec.TryGetProperty("fieldKey", out var fkProp)) fieldKey = fkProp.GetString() ?? "";
                    if (string.IsNullOrEmpty(fieldKey) && sec.TryGetProperty("id", out var idProp)) fieldKey = idProp.GetString() ?? "";

                    if (!string.IsNullOrEmpty(fieldKey))
                    {
                        schemaDict[fieldKey] = "";
                        addedCount++;
                    }
                }

                // Asegurar compatibilidad para ODS si ObjetivosDesarrolloSostenible está presente
                if (schemaDict.ContainsKey("ObjetivosDesarrolloSostenible") && !schemaDict.ContainsKey("Ods"))
                {
                    schemaDict["Ods"] = "";
                }
            }

            if (addedCount == 0)
            {
                // Fallback a campos prediseñados institucionales (Legacy)
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
                addedCount = 8;
            }

            premiumFieldsCount += addedCount;
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

                if (block.TryGetProperty("config", out var cfg) &&
                    cfg.TryGetProperty("technicalSections", out var sectionsProp) &&
                    sectionsProp.ValueKind == JsonValueKind.Array &&
                    sectionsProp.GetArrayLength() > 0)
                {
                    foreach (var sec in sectionsProp.EnumerateArray())
                    {
                        if (sec.TryGetProperty("enabled", out var en) && !en.GetBoolean()) continue;
                        string fieldKey = "";
                        if (sec.TryGetProperty("fieldKey", out var fkProp)) fieldKey = fkProp.GetString() ?? "";
                        if (string.IsNullOrEmpty(fieldKey) && sec.TryGetProperty("id", out var idProp)) fieldKey = idProp.GetString() ?? "";
                        
                        if (!string.IsNullOrEmpty(fieldKey))
                        {
                            completionList.Add(fieldKey);
                        }
                    }
                }

                if (completionList.Count == 0)
                {
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
                }

                configDict["completionFields"] = completionList.ToArray();

                sectionsList.Add(new UiSectionDto {
                    Id = "tecnico",
                    Label = string.IsNullOrEmpty(title) ? "3. ESPECIFICACIÓN TÉCNICA" : title,
                    IconName = "FileText",
                    ComponentName = "TechnicalSection",
                    Config = configDict
                });
            }
            return Task.CompletedTask;
        }
    }
}

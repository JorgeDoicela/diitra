using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class ImpactsBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "impacts";

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            schemaDict["ProductosEsperados"] = new object[] { };
            schemaDict["Impacto"] = new Dictionary<string, string> { 
                { "social", "" }, 
                { "cientifico", "" }, 
                { "economico", "" }, 
                { "politico", "" }, 
                { "ambiental", "" }, 
                { "otro", "" } 
            };

            if (!listsList.Contains("ProductosEsperados")) listsList.Add("ProductosEsperados");
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            if (!sectionsList.Any(s => s.Id == "impactos"))
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

                if (IsEnabled("showProductosEsperados")) completionList.Add("ProductosEsperados");

                if (IsEnabled("showImpactoSocial") || 
                    IsEnabled("showImpactoCientifico") || 
                    IsEnabled("showImpactoEconomico") || 
                    IsEnabled("showImpactoPolitico") || 
                    IsEnabled("showImpactoAmbiental") || 
                    IsEnabled("showImpactoOtro"))
                {
                    completionList.Add("Impacto");
                }

                if (completionList.Count == 0)
                {
                    completionList.Add("ProductosEsperados");
                }

                configDict["completionFields"] = completionList.ToArray();

                sectionsList.Add(new UiSectionDto {
                    Id = "impactos",
                    Label = string.IsNullOrEmpty(title) ? "Impacto & Productos" : title,
                    IconName = "Target",
                    ComponentName = "ImpactSection",
                    Config = configDict
                });
            }
            return Task.CompletedTask;
        }
    }
}

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
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            schemaDict["ProductosEsperados"] = new object[] { };
            
            var impactoDict = new Dictionary<string, string>();

            // Verificar si el bloque posee categorías de impacto personalizadas en su config
            bool loadedFromConfig = false;
            if (block.TryGetProperty("config", out var configProp) && configProp.ValueKind == JsonValueKind.Object)
            {
                if (configProp.TryGetProperty("impactCategories", out var catsProp) && catsProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var cat in catsProp.EnumerateArray())
                    {
                        if (cat.ValueKind == JsonValueKind.Object && cat.TryGetProperty("key", out var keyProp))
                        {
                            var keyStr = keyProp.GetString();
                            if (!string.IsNullOrWhiteSpace(keyStr))
                            {
                                bool enabled = true;
                                if (cat.TryGetProperty("enabled", out var enabledProp) && enabledProp.ValueKind == JsonValueKind.False)
                                {
                                    enabled = false;
                                }

                                if (enabled)
                                {
                                    impactoDict[keyStr.Trim()] = "";
                                    loadedFromConfig = true;
                                }
                            }
                        }
                    }
                }
            }

            // Fallback institucional por defecto si no hay categorías personalizadas definidas
            if (!loadedFromConfig || impactoDict.Count == 0)
            {
                impactoDict["social"] = "";
                impactoDict["cientifico"] = "";
                impactoDict["economico"] = "";
                impactoDict["politico"] = "";
                impactoDict["ambiental"] = "";
                impactoDict["otro"] = "";
            }

            schemaDict["Impacto"] = impactoDict;

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

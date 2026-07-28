using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class MultiSectionTableBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "multi_section_table";
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            string blockId = "default";
            if (block.TryGetProperty("id", out var idProp) && idProp.ValueKind == JsonValueKind.String)
            {
                blockId = idProp.GetString() ?? "default";
            }

            if (block.TryGetProperty("config", out var configProp) && 
                configProp.TryGetProperty("sections", out var sectionsProp) && 
                sectionsProp.ValueKind == JsonValueKind.Array)
            {
                int idx = 0;
                foreach (var sec in sectionsProp.EnumerateArray())
                {
                    string listKey = $"MultiSec_{blockId}_{idx}";
                    schemaDict[listKey] = new object[] { };
                    if (!listsList.Contains(listKey)) listsList.Add(listKey);

                    if (sec.TryGetProperty("title", out var titleProp) && titleProp.ValueKind == JsonValueKind.String)
                    {
                        string titleSlug = titleProp.GetString()?.Replace(" ", "").Replace("_", "") ?? "";
                        if (!string.IsNullOrEmpty(titleSlug))
                        {
                            string aliasKey = $"MultiSec_{titleSlug}";
                            schemaDict[aliasKey] = new object[] { };
                            if (!listsList.Contains(aliasKey)) listsList.Add(aliasKey);
                        }
                    }
                    idx++;
                }
            }

            // Retrocompatibilidad
            if (!schemaDict.ContainsKey("RecursosDisponibles")) schemaDict["RecursosDisponibles"] = new object[] { };
            if (!schemaDict.ContainsKey("RecursosNecesarios")) schemaDict["RecursosNecesarios"] = new object[] { };
            if (!listsList.Contains("RecursosDisponibles")) listsList.Add("RecursosDisponibles");
            if (!listsList.Contains("RecursosNecesarios")) listsList.Add("RecursosNecesarios");
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            string blockId = "default";
            if (block.TryGetProperty("id", out var idProp) && idProp.ValueKind == JsonValueKind.String)
            {
                blockId = idProp.GetString() ?? "default";
            }

            object? rawConfig = null;
            if (block.TryGetProperty("config", out var configProp) && configProp.ValueKind == JsonValueKind.Object)
            {
                try
                {
                    rawConfig = JsonSerializer.Deserialize<object>(configProp.GetRawText());
                }
                catch { }
            }

            string sectionId = $"multi_section_table_{blockId}";
            if (!sectionsList.Any(s => s.Id == sectionId))
            {
                sectionsList.Add(new UiSectionDto {
                    Id = sectionId,
                    Label = string.IsNullOrEmpty(title) ? "Tabla Multi-Sección" : title,
                    IconName = "Grid",
                    ComponentName = "MultiSectionTableSection",
                    Config = new {
                        blockId = blockId,
                        title = title,
                        config = rawConfig
                    }
                });
            }

            return Task.CompletedTask;
        }
    }
}


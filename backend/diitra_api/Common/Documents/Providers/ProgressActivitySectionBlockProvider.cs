using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class ProgressActivitySectionBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "progress_activity_section";
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            if (!schemaDict.ContainsKey("ActividadesEjecutadas")) schemaDict["ActividadesEjecutadas"] = new object[] { };
            if (!schemaDict.ContainsKey("ActividadesNoPrevistas")) schemaDict["ActividadesNoPrevistas"] = new object[] { };
            if (!schemaDict.ContainsKey("Obstaculos")) schemaDict["Obstaculos"] = new object[] { };

            if (!listsList.Contains("ActividadesEjecutadas")) listsList.Add("ActividadesEjecutadas");
            if (!listsList.Contains("ActividadesNoPrevistas")) listsList.Add("ActividadesNoPrevistas");
            if (!listsList.Contains("Obstaculos")) listsList.Add("Obstaculos");
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
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

            string variant = "ejecutadas";
            if (configDict.TryGetValue("activityVariant", out var vObj) && vObj != null)
            {
                variant = vObj.ToString() ?? "ejecutadas";
            }

            string secId = block.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? $"actividades_{variant}" : $"actividades_{variant}";

            sectionsList.Add(new UiSectionDto {
                Id = secId,
                Label = string.IsNullOrEmpty(title) ? $"Matriz de Actividades ({variant})" : title,
                IconName = "Activity",
                ComponentName = "ProgressReportSection",
                Config = configDict
            });

            return Task.CompletedTask;
        }
    }
}

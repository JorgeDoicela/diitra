using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class ProjectProgressReportBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "project_progress_report";

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            schemaDict["ConclusionesParciales"] = "";
            schemaDict["HitosCompletados"] = new object[] { };
            schemaDict["Evidencias"] = new object[] { };
            schemaDict["PresupuestoEjecutado"] = new object[] { };

            if (!listsList.Contains("HitosCompletados"))
                listsList.Add("HitosCompletados");
            if (!listsList.Contains("Evidencias"))
                listsList.Add("Evidencias");
            if (!listsList.Contains("PresupuestoEjecutado"))
                listsList.Add("PresupuestoEjecutado");
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            if (!sectionsList.Any(s => s.Id == "ejecucion"))
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
                configDict["completionFields"] = new[] { "ConclusionesParciales" };

                sectionsList.Add(new UiSectionDto {
                    Id = "ejecucion",
                    Label = string.IsNullOrEmpty(title) ? "Avance de Ejecución" : title,
                    IconName = "BarChart",
                    ComponentName = "ProgressReportSection",
                    Config = configDict
                });
            }
            return Task.CompletedTask;
        }
    }
}

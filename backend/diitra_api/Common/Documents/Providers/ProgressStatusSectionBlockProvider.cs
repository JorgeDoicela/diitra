using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class ProgressStatusSectionBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "progress_status_section";
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            if (!schemaDict.ContainsKey("EstadoEjecucion")) schemaDict["EstadoEjecucion"] = "EN AVANCE";
            if (!schemaDict.ContainsKey("DescripcionFaseActual")) schemaDict["DescripcionFaseActual"] = "";
            if (!schemaDict.ContainsKey("ObservacionesDirector")) schemaDict["ObservacionesDirector"] = "";
            if (!schemaDict.ContainsKey("ObservacionesCoordinador")) schemaDict["ObservacionesCoordinador"] = "";
            if (!schemaDict.ContainsKey("ConclusionesParciales")) schemaDict["ConclusionesParciales"] = "";
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

            configDict["sectionType"] = "progress_status_section";

            string secId = block.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "estado_ejecucion" : "estado_ejecucion";

            sectionsList.Add(new UiSectionDto {
                Id = secId,
                Label = string.IsNullOrEmpty(title) ? "Estado de Ejecución y Observaciones" : title,
                IconName = "BarChart",
                ComponentName = "ProgressReportSection",
                Config = configDict
            });

            return Task.CompletedTask;
        }
    }
}

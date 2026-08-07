using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class FinalReportHeaderSectionBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "final_report_header_section";
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            schemaDict["Titulo"] = "";
            schemaDict["Programa"] = "";
            schemaDict["GrupoInvestigacionNombre"] = "";
            schemaDict["Dominio"] = "";
            schemaDict["LineaInvestigacion"] = "";
            schemaDict["SublineaInvestigacion"] = "";
            schemaDict["TipoInvestigacion"] = "APLICADA";
            schemaDict["CampoAmplio"] = "";
            schemaDict["CampoEspecifico"] = "";
            schemaDict["CampoDetallado"] = "";
            schemaDict["IdCarrera"] = 0;
            schemaDict["Carrera"] = "";
            schemaDict["Periodo"] = "";
            schemaDict["AlcanceProyecto"] = "INSTITUCIONAL";
            schemaDict["FechaPresentacion"] = "";
            schemaDict["FechaInicio"] = "";
            schemaDict["FechaFinPresentada"] = "";
            schemaDict["FechaFinReal"] = "";
            schemaDict["Investigadores"] = new List<object>();

            if (!listsList.Contains("Investigadores"))
            {
                listsList.Add("Investigadores");
            }
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            if (!sectionsList.Any(s => s.Id == "datos_generales"))
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
                configDict["completionFields"] = new[] { "Titulo", "IdCarrera", "Periodo" };

                sectionsList.Add(new UiSectionDto {
                    Id = "datos_generales_informe_final",
                    Label = string.IsNullOrEmpty(title) ? "1. Datos del Proyecto" : title,
                    IconName = "BookOpen",
                    ComponentName = "FinalReportHeaderSection",
                    Config = configDict
                });
            }
            return Task.CompletedTask;
        }
    }
}

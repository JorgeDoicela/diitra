using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class ProgressHeaderSectionBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "progress_header_section";
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            if (!schemaDict.ContainsKey("NumeroInforme")) schemaDict["NumeroInforme"] = "N° 01";
            if (!schemaDict.ContainsKey("NombreProyecto")) schemaDict["NombreProyecto"] = "";
            if (!schemaDict.ContainsKey("Programa")) schemaDict["Programa"] = "";
            if (!schemaDict.ContainsKey("GrupoInvestigacion")) schemaDict["GrupoInvestigacion"] = "";
            if (!schemaDict.ContainsKey("Dominio")) schemaDict["Dominio"] = "";
            if (!schemaDict.ContainsKey("LineaInvestigacion")) schemaDict["LineaInvestigacion"] = "";
            if (!schemaDict.ContainsKey("SublineaInvestigacion")) schemaDict["SublineaInvestigacion"] = "";
            if (!schemaDict.ContainsKey("CampoAmplio")) schemaDict["CampoAmplio"] = "";
            if (!schemaDict.ContainsKey("CampoEspecifico")) schemaDict["CampoEspecifico"] = "";
            if (!schemaDict.ContainsKey("CampoDetallado")) schemaDict["CampoDetallado"] = "";
            if (!schemaDict.ContainsKey("Carrera")) schemaDict["Carrera"] = "";
            if (!schemaDict.ContainsKey("TipoInvestigacion")) schemaDict["TipoInvestigacion"] = "APLICADA";
            if (!schemaDict.ContainsKey("Periodo")) schemaDict["Periodo"] = "";
            if (!schemaDict.ContainsKey("DirectorProyecto")) schemaDict["DirectorProyecto"] = "";
            if (!schemaDict.ContainsKey("InvestigadoresTexto")) schemaDict["InvestigadoresTexto"] = "";
            if (!schemaDict.ContainsKey("FechaInicio")) schemaDict["FechaInicio"] = "";
            if (!schemaDict.ContainsKey("FechaFin")) schemaDict["FechaFin"] = "";
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

            configDict["sectionType"] = "progress_header_section";

            string secId = block.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "encabezado_avance" : "encabezado_avance";

            sectionsList.Add(new UiSectionDto {
                Id = secId,
                Label = string.IsNullOrEmpty(title) ? "1. Encabezado e Identificación" : title,
                IconName = "FileText",
                ComponentName = "ProgressReportSection",
                Config = configDict
            });

            return Task.CompletedTask;
        }
    }
}

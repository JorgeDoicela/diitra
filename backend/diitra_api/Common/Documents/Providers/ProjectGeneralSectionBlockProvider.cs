using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class ProjectGeneralSectionBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "project_general_section";
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
            schemaDict["IdCarrera"] = 0;
            schemaDict["IdConvocatoria"] = 0;
            schemaDict["Periodo"] = "";
            schemaDict["TiempoEjecucion"] = "";
            schemaDict["Programa"] = "";
            schemaDict["GrupoInvestigacionTipo"] = "NO";
            schemaDict["GrupoInvestigacionNombre"] = "";
            schemaDict["Dominio"] = "";
            schemaDict["LineaInvestigacion"] = "";
            schemaDict["SublineaInvestigacion"] = "";
            schemaDict["TipoInvestigacion"] = "APLICADA";
            schemaDict["CampoAmplio"] = "";
            schemaDict["CampoEspecifico"] = "";
            schemaDict["CampoDetallado"] = "";
            schemaDict["DirectorProyecto"] = "";
            schemaDict["FechaPresentacion"] = "";
            schemaDict["FechaInicio"] = "";
            schemaDict["FechaFin"] = "";

            // Dynamic Custom Fields support (Schema-Driven Engine)
            if (block.TryGetProperty("config", out var configProp) &&
                configProp.TryGetProperty("customFields", out var customFieldsProp) &&
                customFieldsProp.ValueKind == JsonValueKind.Array &&
                customFieldsProp.GetArrayLength() > 0)
            {
                foreach (var field in customFieldsProp.EnumerateArray())
                {
                    string fieldKey = "";
                    if (field.TryGetProperty("fieldKey", out var fkProp)) fieldKey = fkProp.GetString() ?? "";
                    if (string.IsNullOrEmpty(fieldKey) && field.TryGetProperty("id", out var idProp)) fieldKey = idProp.GetString() ?? "";

                    if (!string.IsNullOrEmpty(fieldKey))
                    {
                        string fieldType = "text";
                        if (field.TryGetProperty("fieldType", out var ftProp)) fieldType = ftProp.GetString() ?? "text";

                        if (fieldType == "number")
                        {
                            schemaDict[fieldKey] = 0;
                        }
                        else
                        {
                            schemaDict[fieldKey] = "";
                        }
                        premiumFieldsCount++;
                    }
                }
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
            if (!sectionsList.Any(s => s.Id == "identificacion"))
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

                var completionList = new List<string> { "Titulo", "IdCarrera", "IdConvocatoria", "Periodo" };

                // Include custom fields in completion requirements if defined
                if (block.TryGetProperty("config", out var cfg) &&
                    cfg.TryGetProperty("customFields", out var fieldsProp) &&
                    fieldsProp.ValueKind == JsonValueKind.Array &&
                    fieldsProp.GetArrayLength() > 0)
                {
                    foreach (var field in fieldsProp.EnumerateArray())
                    {
                        string fieldKey = "";
                        if (field.TryGetProperty("fieldKey", out var fkProp)) fieldKey = fkProp.GetString() ?? "";
                        if (!string.IsNullOrEmpty(fieldKey) && !completionList.Contains(fieldKey))
                        {
                            completionList.Add(fieldKey);
                        }
                    }
                }

                configDict["completionFields"] = completionList.ToArray();

                sectionsList.Add(new UiSectionDto {
                    Id = "identificacion",
                    Label = string.IsNullOrEmpty(title) ? "1. IDENTIFICACIÓN DEL PROYECTO" : title,
                    IconName = "BookOpen",
                    ComponentName = "GeneralSection",
                    Config = configDict
                });
            }
            return Task.CompletedTask;
        }
    }
}

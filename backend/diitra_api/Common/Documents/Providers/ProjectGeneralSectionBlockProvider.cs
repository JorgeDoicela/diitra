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
                configDict["completionFields"] = new[] { "Titulo", "IdCarrera", "IdConvocatoria", "Periodo" };

                sectionsList.Add(new UiSectionDto {
                    Id = "identificacion",
                    Label = string.IsNullOrEmpty(title) ? "Identificación del Proyecto" : title,
                    IconName = "BookOpen",
                    ComponentName = "GeneralSection",
                    Config = configDict
                });
            }
            return Task.CompletedTask;
        }
    }
}

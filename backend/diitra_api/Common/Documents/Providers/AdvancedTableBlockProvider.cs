using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class AdvancedTableBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "advanced_table";

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            if (templateCode == "PROTOCOLO_INVESTIGACION")
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
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            if (templateCode == "PROTOCOLO_INVESTIGACION" && !sectionsList.Any(s => s.Id == "identificacion"))
            {
                sectionsList.Add(new UiSectionDto {
                    Id = "identificacion",
                    Label = "Identificación",
                    IconName = "BookOpen",
                    ComponentName = "GeneralSection",
                    Config = null
                });
            }
            return Task.CompletedTask;
        }
    }
}

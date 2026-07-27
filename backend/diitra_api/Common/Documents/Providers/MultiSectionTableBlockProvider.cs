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
            schemaDict["RecursosDisponibles"] = new object[] { };
            schemaDict["RecursosNecesarios"] = new object[] { };
            schemaDict["CostoTotal"] = 0;
            schemaDict["FinanciamientoIstpet"] = false;
            schemaDict["FinanciamientoOtrasFuentes"] = false;
            schemaDict["NombresOtrasFuentes"] = "";

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
            string s1Label = "Sección 1";
            string s2Label = "Sección 2";

            if (block.TryGetProperty("config", out var configProp) && 
                configProp.TryGetProperty("sections", out var sectionsProp) && 
                sectionsProp.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                var secArray = sectionsProp.EnumerateArray().ToList();
                if (secArray.Count > 0)
                {
                    s1Label = secArray[0].TryGetProperty("title", out var t1) ? t1.GetString() ?? "Sección 1" : "Sección 1";
                }
                if (secArray.Count > 1)
                {
                    s2Label = secArray[1].TryGetProperty("title", out var t2) ? t2.GetString() ?? "Sección 2" : "Sección 2";
                }
            }

            if (!sectionsList.Any(s => s.Id == "recursos"))
            {
                sectionsList.Add(new UiSectionDto {
                    Id = "recursos",
                    Label = title,
                    IconName = "DollarSign",
                    ComponentName = "BudgetSection",
                    Config = new {
                        title = title,
                        seccion1Label = s1Label,
                        seccion2Label = s2Label
                    }
                });
            }

            return Task.CompletedTask;
        }
    }
}

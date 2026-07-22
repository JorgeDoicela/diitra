using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class ProjectBudgetSectionBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "project_budget_section";

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

            if (!listsList.Contains("RecursosDisponibles"))
                listsList.Add("RecursosDisponibles");
            if (!listsList.Contains("RecursosNecesarios"))
                listsList.Add("RecursosNecesarios");
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            if (!sectionsList.Any(s => s.Id == "recursos"))
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

                sectionsList.Add(new UiSectionDto {
                    Id = "recursos",
                    Label = string.IsNullOrEmpty(title) ? "Recursos & Financiamiento" : title,
                    IconName = "DollarSign",
                    ComponentName = "BudgetSection",
                    Config = configDict
                });
            }
            return Task.CompletedTask;
        }
    }
}

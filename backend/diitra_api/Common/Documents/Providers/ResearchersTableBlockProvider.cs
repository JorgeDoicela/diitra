using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class ResearchersTableBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "researchers_table";

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            schemaDict["Investigadores"] = new object[] { };
            if (!listsList.Contains("Investigadores")) listsList.Add("Investigadores");
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            if (!sectionsList.Any(s => s.Id == "equipo"))
            {
                sectionsList.Add(new UiSectionDto {
                    Id = "equipo",
                    Label = "Equipo Humano",
                    IconName = "Users",
                    ComponentName = "TeamSection",
                    Config = null
                });
            }
            return Task.CompletedTask;
        }
    }
}

using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    public class GanttBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "gantt";

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            schemaDict["Cronograma"] = new object[] { };
            if (!listsList.Contains("Cronograma")) listsList.Add("Cronograma");
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            if (!sectionsList.Any(s => s.Id == "cronograma"))
            {
                sectionsList.Add(new UiSectionDto {
                    Id = "cronograma",
                    Label = "Cronograma (Gantt)",
                    IconName = "Calendar",
                    ComponentName = "TimelineSection",
                    Config = null
                });
            }
            return Task.CompletedTask;
        }
    }
}

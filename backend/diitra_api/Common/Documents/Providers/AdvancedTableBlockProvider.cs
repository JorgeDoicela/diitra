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
        public BlockBehavior Behavior => BlockBehavior.Configurable;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            var id = block.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
            var varName = id.Replace("block-", "");
            varName = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(varName.ToLower());
            if (System.Text.RegularExpressions.Regex.IsMatch(varName, @"^\d+$"))
            {
                varName = "field_" + varName;
            }

            var defaultRows = new List<Dictionary<string, string>>();
            if (block.TryGetProperty("config", out var configProp))
            {
                if (configProp.TryGetProperty("rows", out var rowsProp) && rowsProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var r in rowsProp.EnumerateArray())
                    {
                        if (r.TryGetProperty("cells", out var cellsProp) && cellsProp.ValueKind == JsonValueKind.Array)
                        {
                            var rowDict = new Dictionary<string, string>();
                            int cellIdx = 0;
                            foreach (var cell in cellsProp.EnumerateArray())
                            {
                                rowDict[cellIdx.ToString()] = cell.ValueKind == JsonValueKind.String ? cell.GetString() ?? "" : "";
                                cellIdx++;
                            }
                            defaultRows.Add(rowDict);
                        }
                    }
                }
            }

            schemaDict[varName] = defaultRows.ToArray();
            if (!listsList.Contains(varName)) listsList.Add(varName);
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            var id = block.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
            var titleText = block.TryGetProperty("title", out var titleProp) ? titleProp.GetString() ?? "Tabla Avanzada" : "Tabla Avanzada";

            var varName = id.Replace("block-", "");
            varName = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(varName.ToLower());
            if (System.Text.RegularExpressions.Regex.IsMatch(varName, @"^\d+$"))
            {
                varName = "field_" + varName;
            }

            var columns = new List<string>();
            var defaultRows = new List<Dictionary<string, string>>();
            bool allowDynamicRows = false;
            string headerStyle = "blue";

            if (block.TryGetProperty("config", out var configProp))
            {
                if (configProp.TryGetProperty("allowDynamicRows", out var adrProp))
                {
                    allowDynamicRows = adrProp.GetBoolean();
                }

                if (configProp.TryGetProperty("headers", out var headersProp) && headersProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var h in headersProp.EnumerateArray())
                    {
                        columns.Add(h.GetString() ?? "");
                    }
                }

                if (configProp.TryGetProperty("headerStyle", out var hsProp) ||
                    configProp.TryGetProperty("header_style", out hsProp) ||
                    configProp.TryGetProperty("HeaderStyle", out hsProp))
                {
                    headerStyle = hsProp.GetString() ?? "blue";
                }

                if (configProp.TryGetProperty("rows", out var rowsProp) && rowsProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var r in rowsProp.EnumerateArray())
                    {
                        if (r.TryGetProperty("cells", out var cellsProp) && cellsProp.ValueKind == JsonValueKind.Array)
                        {
                            var rowDict = new Dictionary<string, string>();
                            int cellIdx = 0;
                            foreach (var cell in cellsProp.EnumerateArray())
                            {
                                rowDict[cellIdx.ToString()] = cell.ValueKind == JsonValueKind.String ? cell.GetString() ?? "" : "";
                                cellIdx++;
                            }
                            defaultRows.Add(rowDict);
                        }
                    }
                }
            }

            sectionsList.Add(new UiSectionDto
            {
                Id = varName,
                Label = titleText,
                IconName = "Table",
                ComponentName = "AgnosticSection",
                Config = new
                {
                    completionFields = new[] { varName },
                    fields = new[]
                    {
                        new
                        {
                            name = varName,
                            label = titleText,
                            type = "table",
                            collaborative = true,
                            config = new
                            {
                                columns = columns.ToArray(),
                                allowDynamicRows = allowDynamicRows,
                                headerStyle = headerStyle,
                                defaultRows = defaultRows.ToArray()
                            }
                        }
                    }
                }
            });

            return Task.CompletedTask;
        }
    }
}

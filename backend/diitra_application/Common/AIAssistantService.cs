namespace diitra_application.Common;

public interface IAIAssistantService
{
    Task<string> AnalyzePertinenceAsync(string title, string summary);
}

public class AIAssistantService : IAIAssistantService
{
    public async Task<string> AnalyzePertinenceAsync(string title, string summary)
    {
        // Prototype logic: Simulate AI analysis
        await Task.Delay(1000); // Simulate network/processing delay

        if (title.ToLower().Contains("tecnología") || summary.ToLower().Contains("innovación"))
        {
            return "ALTA PERTINENCIA: El proyecto se alinea con la Línea de Innovación Tecnológica del IST.";
        }

        return "PERTINENCIA MEDIA: Se recomienda revisar la vinculación con las líneas de investigación institucionales.";
    }
}

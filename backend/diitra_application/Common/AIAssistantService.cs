namespace diitra_application.Common;

public interface IAIAssistantService
{
    Task<string> AnalyzePertinenceAsync(string title, string summary);
}

public class AIAssistantService : IAIAssistantService
{
    public async Task<string> AnalyzePertinenceAsync(string title, string summary)
    {
        // Prototype logic: Simulate AI analysis aligned with IST Research Lines
        await Task.Delay(1500); 

        string[] techKeywords = { "software", "tecnología", "inteligencia", "automatización", "redes", "datos" };
        string[] adminKeywords = { "gestión", "productividad", "procesos", "administrativa", "negocio" };
        
        bool isTech = techKeywords.Any(k => title.ToLower().Contains(k) || summary.ToLower().Contains(k));
        bool isAdmin = adminKeywords.Any(k => title.ToLower().Contains(k) || summary.ToLower().Contains(k));

        if (isTech)
        {
            return "ALTA PERTINENCIA: El proyecto se alinea con la línea de 'Innovación Tecnológica y Desarrollo de Software'. Se sugiere fortalecer la sección de Metodología Ágil.";
        }
        
        if (isAdmin)
        {
            return "ALTA PERTINENCIA: El proyecto se alinea con la línea de 'Gestión Administrativa y Productividad'. Se sugiere detallar el impacto en la matriz productiva local.";
        }

        return "PERTINENCIA MEDIA: El proyecto tiene un enfoque general. Se recomienda vincularlo explícitamente con los Dominios Académicos del IST para facilitar su aprobación por el Comité de Ética.";
    }
}

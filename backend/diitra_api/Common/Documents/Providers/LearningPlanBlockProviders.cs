using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Threading;
using diitra_infrastructure.data.models;

namespace diitra_api.Controllers
{
    /// <summary>
    /// Proveedor de UI y Esquema para Bloques de Ficha y Estudiante del Plan de Aprendizaje
    /// </summary>
    public class LearningPlanHeaderBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "learning_plan_header_section";
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            schemaDict["NombreProyecto"] = "";
            schemaDict["LineaInvestigacion"] = "";
            schemaDict["SublineaInvestigacion"] = "";
            schemaDict["Carrera"] = "";
            schemaDict["DirectorProyecto"] = "";
            schemaDict["NumeroEstudiantes"] = 1;
            schemaDict["FechaAprobacion"] = "";
            schemaDict["FechaTerminacion"] = "";
            schemaDict["PeriodoAcademico"] = "";
            schemaDict["NombreEstudiante"] = "";
            schemaDict["EstudianteActivoId"] = "";
            schemaDict["EstudiantesEvaluaciones"] = new List<object>();

            if (!listsList.Contains("EstudiantesEvaluaciones"))
            {
                listsList.Add("EstudiantesEvaluaciones");
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
            if (!sectionsList.Any(s => s.Id == "plan_aprendizaje"))
            {
                sectionsList.Add(new UiSectionDto
                {
                    Id = "plan_aprendizaje",
                    Label = "Plan de Aprendizaje",
                    IconName = "GraduationCap",
                    ComponentName = "LearningPlanSection"
                });
            }
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Proveedor de UI y Esquema para Bloques de Prerrequisitos (Cognitivos y Procedimentales)
    /// </summary>
    public class LearningPlanPrerequisitesBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "learning_plan_prerequisites_section";
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            if (!schemaDict.ContainsKey("EstudiantesEvaluaciones"))
            {
                schemaDict["EstudiantesEvaluaciones"] = new List<object>();
            }
            if (!listsList.Contains("EstudiantesEvaluaciones"))
            {
                listsList.Add("EstudiantesEvaluaciones");
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
            if (!sectionsList.Any(s => s.Id == "plan_aprendizaje"))
            {
                sectionsList.Add(new UiSectionDto
                {
                    Id = "plan_aprendizaje",
                    Label = "Plan de Aprendizaje",
                    IconName = "GraduationCap",
                    ComponentName = "LearningPlanSection"
                });
            }
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Proveedor de UI y Esquema para Bloques de Matriz de Actividades APE
    /// </summary>
    public class LearningPlanActivitiesBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "learning_plan_activities_section";
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            if (!schemaDict.ContainsKey("EstudiantesEvaluaciones"))
            {
                schemaDict["EstudiantesEvaluaciones"] = new List<object>();
            }
            if (!listsList.Contains("EstudiantesEvaluaciones"))
            {
                listsList.Add("EstudiantesEvaluaciones");
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
            if (!sectionsList.Any(s => s.Id == "plan_aprendizaje"))
            {
                sectionsList.Add(new UiSectionDto
                {
                    Id = "plan_aprendizaje",
                    Label = "Plan de Aprendizaje",
                    IconName = "GraduationCap",
                    ComponentName = "LearningPlanSection"
                });
            }
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Proveedor de UI para Parámetros de Evaluación (Escala Cualitativa)
    /// </summary>
    public class LearningPlanEvalParametersBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "learning_plan_eval_parameters_section";
        public BlockBehavior Behavior => BlockBehavior.StaticLayout;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Proveedor de UI para Tabla Consolidada de Resultados Generales (Admin)
    /// </summary>
    public class LearningPlanEvaluationTableBlockProvider : IDocumentBlockProvider
    {
        public string BlockType => "learning_plan_evaluation_table";
        public BlockBehavior Behavior => BlockBehavior.DataCapture;

        public void PopulateSchema(
            JsonElement block, 
            Dictionary<string, object> schemaDict, 
            List<string> listsList,
            List<object> richTextFields,
            ref int premiumFieldsCount,
            string templateCode)
        {
            schemaDict["EstadoAprobacion"] = "Pendiente";
            schemaDict["DictamenFinal"] = "";
        }

        public Task MapToUiSectionAsync(
            JsonElement block, 
            string title, 
            List<UiSectionDto> sectionsList,
            DiitraContext dbContext,
            string templateCode,
            CancellationToken ct)
        {
            if (!sectionsList.Any(s => s.Id == "plan_aprendizaje"))
            {
                sectionsList.Add(new UiSectionDto
                {
                    Id = "plan_aprendizaje",
                    Label = "Plan de Aprendizaje",
                    IconName = "GraduationCap",
                    ComponentName = "LearningPlanSection"
                });
            }
            return Task.CompletedTask;
        }
    }
}

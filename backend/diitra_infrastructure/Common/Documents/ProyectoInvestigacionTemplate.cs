using Diitra.Domain.Common.Documents;

namespace Diitra.Infrastructure.Common.Documents
{
    /// <summary>
    /// Script de actualización de plantilla: migra el formato oficial del
    /// "Proyecto de Investigación" (SENESCYT/ISTPET) al motor de documentos DIITRA.
    /// 
    /// Ejecutar desde el endpoint POST /api/admin/templates/update-protocolo
    /// o aplicar directamente con SQL si el motor ya está corriendo.
    /// 
    /// Formato de referencia: "Formato Proyecto de Investigación.md"
    /// </summary>
    public static class ProyectoInvestigacionTemplate
    {
        public const string CODE = "PROTOCOLO_INVESTIGACION";

        public static string GetHtml() => @"
<div class=""doc-title"">PROYECTO DE INVESTIGACIÓN</div>
<div class=""doc-subtitle"">{{titulo}}</div>
<div class=""doc-subtitle"">Tecnología Superior en {{carrera}} | Período Académico: {{periodo_convocatoria}}</div>

<!-- ══════════════════════════════════════════════════════════════
     SECCIÓN 1: IDENTIFICACIÓN DEL PROYECTO
     ══════════════════════════════════════════════════════════════ -->
<div class=""section-title"">1. IDENTIFICACIÓN DEL PROYECTO</div>

<table class=""info-table"">
    <tr>
        <td>NOMBRE DEL PROYECTO:</td>
        <td><strong>{{titulo}}</strong></td>
    </tr>
    <tr>
        <td>CÓDIGO INSTITUCIONAL:</td>
        <td>{{default codigo_institucional ""PND-2026-XXX""}}</td>
    </tr>
    <tr>
        <td>PROGRAMA:</td>
        <td>{{default programa ""—""}}</td>
    </tr>
    <tr>
        <td>GRUPO DE INVESTIGACIÓN:</td>
        <td>
            {{#if tiene_grupo_investigacion}}
                SÍ — {{default grupo_investigacion ""Sin nombre""}}</td>
            {{else}}
                NO aplica
            {{/if}}
    </tr>
    <tr>
        <td>DOMINIO:</td>
        <td>{{default dominio ""—""}}</td>
    </tr>
    <tr>
        <td>LÍNEA DE INVESTIGACIÓN:</td>
        <td>{{default linea_investigacion ""—""}}</td>
    </tr>
    <tr>
        <td>SUBLÍNEA DE INVESTIGACIÓN:</td>
        <td>{{default sublinea_investigacion ""—""}}</td>
    </tr>
    <tr>
        <td>TIPO DE INVESTIGACIÓN:</td>
        <td>{{default tipo_investigacion ""—""}}</td>
    </tr>
    <tr>
        <td>CAMPO AMPLIO (UNESCO):</td>
        <td>{{default campo_amplio ""—""}}</td>
    </tr>
    <tr>
        <td>CAMPO ESPECÍFICO:</td>
        <td>{{default campo_especifico ""—""}}</td>
    </tr>
    <tr>
        <td>CAMPO DETALLADO:</td>
        <td>{{default campo_detallado ""—""}}</td>
    </tr>
    <tr>
        <td>CARRERA:</td>
        <td>Tecnología Superior en {{default carrera ""—""}}</td>
    </tr>
    <tr>
        <td>PERÍODO DE CONVOCATORIA:</td>
        <td>{{default periodo_convocatoria ""—""}}</td>
    </tr>
    <tr>
        <td>TIEMPO DE EJECUCIÓN:</td>
        <td>{{default tiempo_ejecucion ""—""}}</td>
    </tr>
    <tr>
        <td>DIRECTOR DEL PROYECTO:</td>
        <td>{{default director_proyecto ""—""}}</td>
    </tr>
</table>

<table class=""data-table"" style=""margin-top: 8px;"">
    <thead>
        <tr>
            <th>FECHA DE PRESENTACIÓN</th>
            <th>FECHA PREVISTA DE INICIO</th>
            <th>FECHA PREVISTA DE FINALIZACIÓN</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>{{default fecha_presentacion ""___/___/______""}}</td>
            <td>{{default fecha_inicio_estimada ""___/___/______""}}</td>
            <td>{{default fecha_fin_estimada ""___/___/______""}}</td>
        </tr>
    </tbody>
</table>


<!-- ══════════════════════════════════════════════════════════════
     SECCIÓN 2: INVESTIGADORES
     ══════════════════════════════════════════════════════════════ -->
<div class=""section-title"">2. INVESTIGADORES</div>

<table class=""data-table"">
    <thead>
        <tr>
            <th>NOMBRE</th>
            <th>N° CÉDULA</th>
            <th>EMAIL</th>
            <th>TELÉFONO</th>
            <th>NIVEL ACADÉMICO</th>
            <th>ROL</th>
        </tr>
    </thead>
    <tbody>
        {{#each investigadores}}
        <tr>
            <td>{{default nombre ""—""}}</td>
            <td>{{default cedula ""—""}}</td>
            <td>{{default email ""—""}}</td>
            <td>{{default telefono ""—""}}</td>
            <td>{{default nivel_academico ""—""}}</td>
            <td>{{default rol ""—""}}</td>
        </tr>
        {{else}}
        <tr>
            <td colspan=""6"" style=""text-align:center; color:#aaa;"">Sin investigadores registrados</td>
        </tr>
        {{/each}}
    </tbody>
</table>


<!-- ══════════════════════════════════════════════════════════════
     SECCIÓN 3: ESPECIFICACIÓN DEL PROYECTO
     ══════════════════════════════════════════════════════════════ -->
<div class=""section-title"">3. ESPECIFICACIÓN DEL PROYECTO</div>

<table class=""info-table"">
    <tr>
        <td style=""width:25%; vertical-align:top;"">ANTECEDENTES ESPECÍFICOS DE LA PROBLEMÁTICA</td>
        <td><div class=""text-field"">{{default antecedentes ""Información no proporcionada""}}</div></td>
    </tr>
    <tr>
        <td style=""vertical-align:top;"">DESCRIPCIÓN DEL PROYECTO</td>
        <td><div class=""text-field"">{{default descripcion_proyecto ""Información no proporcionada""}}</div></td>
    </tr>
    <tr>
        <td style=""vertical-align:top;"">JUSTIFICACIÓN</td>
        <td><div class=""text-field"">{{default justificacion ""Información no proporcionada""}}</div></td>
    </tr>
</table>

<div class=""field-label"" style=""margin-top:14px;"">OBJETIVOS</div>
<table class=""data-table"">
    <thead>
        <tr>
            <th style=""width:40%"">OBJETIVO GENERAL</th>
            <th>OBJETIVOS ESPECÍFICOS</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style=""vertical-align:top;"">{{default objetivo_general ""No definido""}}</td>
            <td>
                <ol style=""margin:0; padding-left:16px;"">
                    {{#each objetivos_especificos}}
                    <li>{{this}}</li>
                    {{else}}
                    <li style=""color:#aaa;"">Sin objetivos específicos registrados</li>
                    {{/each}}
                </ol>
            </td>
        </tr>
    </tbody>
</table>

<table class=""info-table"" style=""margin-top:8px;"">
    <tr>
        <td style=""width:25%; vertical-align:top;"">OBJETIVOS DE DESARROLLO SOSTENIBLE (ODS)</td>
        <td>{{default ods ""No especificado""}}</td>
    </tr>
    <tr>
        <td style=""vertical-align:top;"">MARCO TEÓRICO</td>
        <td><div class=""text-field"">{{default marco_teorico ""Información no proporcionada""}}</div></td>
    </tr>
    <tr>
        <td style=""vertical-align:top;"">METODOLOGÍA</td>
        <td><div class=""text-field"">{{default metodologia ""Información no proporcionada""}}</div></td>
    </tr>
    <tr>
        <td style=""vertical-align:top;"">EVALUACIÓN</td>
        <td><div class=""text-field"">{{default evaluacion ""Información no proporcionada""}}</div></td>
    </tr>
</table>


<!-- ══════════════════════════════════════════════════════════════
     SECCIÓN 4: RECURSOS, COSTO Y FINANCIAMIENTO
     ══════════════════════════════════════════════════════════════ -->
<div class=""section-title"">4. RECURSOS, COSTO Y FINANCIAMIENTO</div>

<div class=""field-label"">RECURSOS DISPONIBLES</div>
<table class=""data-table"">
    <thead>
        <tr>
            <th>DESCRIPCIÓN</th>
            <th>CANTIDAD</th>
            <th>FUENTE</th>
        </tr>
    </thead>
    <tbody>
        {{#each recursos_disponibles}}
        <tr>
            <td>{{default descripcion ""—""}}</td>
            <td>{{default cantidad ""—""}}</td>
            <td>{{default fuente ""—""}}</td>
        </tr>
        {{else}}
        <tr><td colspan=""3"" style=""text-align:center; color:#aaa;"">Sin recursos disponibles registrados</td></tr>
        {{/each}}
    </tbody>
</table>

<div class=""field-label"" style=""margin-top:10px;"">RECURSOS NECESARIOS</div>
<table class=""data-table"">
    <thead>
        <tr>
            <th>DESCRIPCIÓN</th>
            <th>CANTIDAD</th>
            <th>COSTO UNITARIO</th>
            <th>COSTO TOTAL</th>
        </tr>
    </thead>
    <tbody>
        {{#each recursos_necesarios}}
        <tr>
            <td>{{default descripcion ""—""}}</td>
            <td>{{default cantidad ""—""}}</td>
            <td>{{moneda costo_unitario}}</td>
            <td>{{moneda costo_total}}</td>
        </tr>
        {{else}}
        <tr><td colspan=""4"" style=""text-align:center; color:#aaa;"">Sin recursos necesarios registrados</td></tr>
        {{/each}}
        <tr style=""background:#f0f4f8; font-weight:bold;"">
            <td colspan=""3"">COSTO TOTAL DEL PROYECTO</td>
            <td>{{moneda costo_total}}</td>
        </tr>
    </tbody>
</table>

<div class=""field-label"" style=""margin-top:10px;"">FINANCIAMIENTO</div>
<table class=""data-table"">
    <thead>
        <tr>
            <th>ISTPET</th>
            <th>OTRAS FUENTES</th>
            <th>NOMBRE DE LA FUENTE</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>{{#if (eq fuente_financiamiento ""ISTPET"")}}✓{{else}}—{{/if}}</td>
            <td>{{#if (eq fuente_financiamiento ""OTRAS FUENTES"")}}✓{{else}}—{{/if}}</td>
            <td>{{default nombre_otra_fuente ""—""}}</td>
        </tr>
    </tbody>
</table>


<!-- ══════════════════════════════════════════════════════════════
     SECCIÓN 5: PRODUCTOS ESPERADOS
     ══════════════════════════════════════════════════════════════ -->
<div class=""section-title"">5. PRODUCTOS ESPERADOS</div>
<table class=""data-table"">
    <thead>
        <tr>
            <th>TIPO</th>
            <th>CANTIDAD</th>
        </tr>
    </thead>
    <tbody>
        {{#each productos_esperados}}
        <tr>
            <td>{{default tipo ""—""}}</td>
            <td>{{default cantidad ""—""}}</td>
        </tr>
        {{else}}
        <tr><td colspan=""2"" style=""text-align:center; color:#aaa;"">Sin productos esperados registrados</td></tr>
        {{/each}}
    </tbody>
</table>


<!-- ══════════════════════════════════════════════════════════════
     SECCIÓN 6: IMPACTO DEL PROYECTO
     ══════════════════════════════════════════════════════════════ -->
<div class=""section-title"">6. IMPACTO DEL PROYECTO</div>
<table class=""data-table"">
    <thead>
        <tr>
            <th style=""width:20%"">IMPACTO</th>
            <th style=""width:10%"">APLICA</th>
            <th style=""width:12%"">NO APLICA</th>
            <th>DESCRIPCIÓN BREVE</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Social</strong></td>
            <td>{{#if impacto.social}}✓{{/if}}</td>
            <td>{{#unless impacto.social}}✓{{/unless}}</td>
            <td>{{default impacto.social ""—""}}</td>
        </tr>
        <tr>
            <td><strong>Científico</strong></td>
            <td>{{#if impacto.cientifico}}✓{{/if}}</td>
            <td>{{#unless impacto.cientifico}}✓{{/unless}}</td>
            <td>{{default impacto.cientifico ""—""}}</td>
        </tr>
        <tr>
            <td><strong>Económico</strong></td>
            <td>{{#if impacto.economico}}✓{{/if}}</td>
            <td>{{#unless impacto.economico}}✓{{/unless}}</td>
            <td>{{default impacto.economico ""—""}}</td>
        </tr>
        <tr>
            <td><strong>Político</strong></td>
            <td>{{#if impacto.politico}}✓{{/if}}</td>
            <td>{{#unless impacto.politico}}✓{{/unless}}</td>
            <td>{{default impacto.politico ""—""}}</td>
        </tr>
        <tr>
            <td><strong>Ambiental</strong></td>
            <td>{{#if impacto.ambiental}}✓{{/if}}</td>
            <td>{{#unless impacto.ambiental}}✓{{/unless}}</td>
            <td>{{default impacto.ambiental ""—""}}</td>
        </tr>
        <tr>
            <td><strong>Otro</strong></td>
            <td>{{#if impacto.otro}}✓{{/if}}</td>
            <td>{{#unless impacto.otro}}✓{{/unless}}</td>
            <td>{{default impacto.otro ""—""}}</td>
        </tr>
    </tbody>
</table>


<!-- ══════════════════════════════════════════════════════════════
     SECCIÓN 7: CRONOGRAMA DE ACTIVIDADES
     ══════════════════════════════════════════════════════════════ -->
<div class=""section-title"">7. CRONOGRAMA DE ACTIVIDADES (DIAGRAMA DE GANTT)</div>
<p style=""font-size:8pt; color:#888; margin-bottom:6px;"">
    Las semanas marcadas indican el período planificado de ejecución de cada actividad.
</p>
<table class=""data-table"" style=""font-size:7.5pt;"">
    <thead>
        <tr>
            <th rowspan=""2"" style=""width:12%"">OBJETIVO</th>
            <th rowspan=""2"" style=""width:4%"">N°</th>
            <th rowspan=""2"" style=""width:18%"">ACTIVIDAD</th>
            <th rowspan=""2"" style=""width:10%"">RECURSOS</th>
            <th colspan=""4"">MES 1</th>
            <th colspan=""4"">MES 2</th>
            <th colspan=""4"">MES 3</th>
            <th colspan=""4"">MES 4</th>
            <th colspan=""4"">MES 5</th>
            <th colspan=""4"">MES 6</th>
        </tr>
        <tr>
            <th>S1</th><th>S2</th><th>S3</th><th>S4</th>
            <th>S1</th><th>S2</th><th>S3</th><th>S4</th>
            <th>S1</th><th>S2</th><th>S3</th><th>S4</th>
            <th>S1</th><th>S2</th><th>S3</th><th>S4</th>
            <th>S1</th><th>S2</th><th>S3</th><th>S4</th>
            <th>S1</th><th>S2</th><th>S3</th><th>S4</th>
        </tr>
    </thead>
    <tbody>
        {{#each cronograma}}
        <tr>
            <td style=""vertical-align:top; font-size:7pt;"">{{default objetivo """"}}</td>
            <td style=""text-align:center;"">{{numero}}</td>
            <td style=""vertical-align:top;"">{{default actividad """"}}</td>
            <td style=""vertical-align:top; font-size:7pt;"">{{default recursos_necesarios """"}}</td>
            {{#each semanas}}
            <td style=""text-align:center; padding:2px;"">{{#if this}}■{{/if}}</td>
            {{/each}}
        </tr>
        {{else}}
        <tr>
            <td colspan=""28"" style=""text-align:center; color:#aaa;"">Sin cronograma registrado</td>
        </tr>
        {{/each}}
    </tbody>
</table>


<!-- ══════════════════════════════════════════════════════════════
     SECCIÓN 8: BIBLIOGRAFÍA
     ══════════════════════════════════════════════════════════════ -->
<div class=""section-title"">8. BIBLIOGRAFÍA</div>
<p style=""font-size:8pt; color:#666; margin-bottom:6px;"">
    (Normas APA 7ª edición. Mínimo 10, máximo 15 fuentes)
</p>
<ol style=""font-size:9pt; line-height:1.8;"">
    {{#each bibliografia}}
    <li>{{this}}</li>
    {{else}}
    <li style=""color:#aaa;"">Sin bibliografía registrada</li>
    {{/each}}
</ol>


<!-- ══════════════════════════════════════════════════════════════
     SECCIÓN 9: FIRMAS DE RESPONSABILIDAD
     ══════════════════════════════════════════════════════════════ -->
<div class=""section-title"">9. FIRMAS DE RESPONSABILIDAD</div>
<div class=""firmas-row"">
    <div class=""firma-ec-block"">
        <div class=""firma-label"">Elaborado por: Director del Proyecto</div>
        <div class=""firma-name"">{{default nombre_director_firma ""_________________________________""}}</div>
        <div class=""firma-role"">{{default cargo_director_firma ""Docente Investigador""}}</div>
    </div>
    <div class=""firma-ec-block"">
        <div class=""firma-label"">Aprobado por: Coordinador de Carrera</div>
        <div class=""firma-name"">{{default nombre_coordinador_firma ""_________________________________""}}</div>
        <div class=""firma-role"">{{default cargo_coordinador_firma ""Coordinador de Carrera""}}</div>
    </div>
</div>
";

        /// <summary>
        /// Crea un DocumentTemplate con el formato oficial completo.
        /// Se usa para actualizar la plantilla PROTOCOLO_INVESTIGACION en la BD.
        /// </summary>
        public static DocumentTemplate BuildTemplate() =>
            DocumentTemplate.Create(
                code: CODE,
                name: "Protocolo de Proyecto de Investigación",
                htmlContent: GetHtml(),
                category: DocumentCategory.Protocolo,
                description: "Formato oficial SENESCYT/ISTPET para postulación de proyectos de investigación. " +
                             "Incluye las 9 secciones reglamentarias: Identificación, Investigadores, Especificación, " +
                             "Recursos, Productos Esperados, Impacto, Cronograma, Bibliografía y Firmas.",
                requiresLopdp: true,
                supportsBlind: false,
                requiresTraceability: true,
                requiresSignature: false
            );
    }
}

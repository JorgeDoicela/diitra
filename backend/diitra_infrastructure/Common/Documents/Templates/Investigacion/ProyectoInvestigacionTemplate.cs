using Diitra.Domain.Common.Documents;
using Diitra.Infrastructure.Common.Documents.Resources;

namespace Diitra.Infrastructure.Common.Documents.Templates.Investigacion
{
    /// <summary>
    /// Plantilla Institucional: 1. Formato Proyecto de Investigación
    /// Versión de Producción v17.0 - PORTADA INSTITUCIONAL (Imagen de Fondo)
    /// </summary>
    public static class ProyectoInvestigacionTemplate
    {
        public const string CODE = "PROTOCOLO_INVESTIGACION";

        public static string GetHtml() => $@"
<style>
    /* RESET & CORE */
    * {{ box-sizing: border-box; }}
    .page-break {{ page-break-after: always; }}
    
    /* PORTADA (COVER PAGE) FULL BLEED - Breaking out of 1.5cm margins */
    .cover-page {{ 
        font-family: 'Inter', 'Montserrat', Arial, sans-serif;
        position: absolute;
        top: -1cm;
        left: -1.5cm;
        width: 210mm;
        height: 297mm;
        background-image: url('data:image/jpeg;base64,{TemplateImages.PortadaProyectoBase64}');
        background-size: 100% 100%;
        background-repeat: no-repeat;
        color: #1a2b4a;
        z-index: 1000;
    }}
    .page {{ page-break-after: always; position: relative; }}

    .cover-overlay {{
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        padding: 100px 80px;
        display: flex;
        flex-direction: column;
        align-items: flex-end; 
        text-align: right;
    }}

    .main-label {{
        font-size: 26pt;
        font-weight: 800;
        color: #c5a059;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-top: 240px; 
        width: 70%;
    }}
    
    .project-theme {{
        font-size: 18pt;
        font-weight: 900;
        color: #1a2b4a;
        text-transform: uppercase;
        margin: 100px 0;
        line-height: 1.2;
        width: 70%;
        word-wrap: break-word;
    }}
    
    .career-container {{
        margin-top: auto;
        margin-bottom: 120px;
        width: 70%;
    }}

    .career-label {{
        font-size: 14pt;
        font-weight: 800;
        color: #1a2b4a;
        text-transform: uppercase;
    }}
    
    .career-value {{
        font-size: 14pt;
        font-weight: 400;
        color: #1a2b4a;
        text-transform: uppercase;
        margin-top: 8px;
    }}
    
    .period-container {{
        border-top: 2px solid #eee;
        padding-top: 20px;
        width: 70%;
    }}
    
    .period-label {{ font-size: 11pt; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; }}
    .period-value {{ font-size: 11pt; font-weight: 400; text-transform: uppercase; }}

    /* BACKGROUND STATIONARY (Papel Membretado) - Fixed on all pages */
    .stationary-bg {{
        position: fixed;
        top: 0;
        left: 0;
        width: 210mm;
        height: 297mm;
        z-index: -1000;
        background-image: url('data:image/jpeg;base64,{TemplateImages.FondoHojasInvestigacionBase64}');
        background-size: 100% 100%;
        background-repeat: no-repeat;
        opacity: 0.35;
    }}

    /* CUERPO DEL DOCUMENTO (PAGE 2+) */
    .doc-container {{ 
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif; 
        color: #1e2a4a; 
        line-height: 1.4; 
        padding: 100px 40px 40px 40px; 
        background: transparent;
    }}
    .section-title {{ 
        color: #1e2a4a; 
        padding: 10px 0; 
        font-weight: 800; 
        font-size: 11pt; 
        margin: 15px 0 5px 0; 
        text-transform: uppercase; 
    }}
    .info-table, .data-table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9pt; background: #fff; }}
    .info-table td {{ border: 1px solid #1e2a4a; padding: 6px 10px; vertical-align: middle; }}
    .info-table .label {{ font-weight: bold; background: #1e2a4a; width: 35%; text-transform: uppercase; font-size: 8pt; color: #ffffff; }}
    .data-table th {{ background: #1e2a4a; border: 1px solid #1e2a4a; padding: 8px; font-size: 8pt; text-transform: uppercase; color: #ffffff; }}
    .data-table td {{ border: 1px solid #1e2a4a; padding: 8px; background: #ffffff; color: #000; }}
    .firma-box {{ border: 1px solid #1e2a4a; padding: 20px; height: 120px; vertical-align: bottom; background: #fff; }}
</style>

<!-- PÁGINA 1: PORTADA INSTITUCIONAL CON IMAGEN DE FONDO -->
<div class=""page"" style=""height: 270mm;"">
    <div class=""cover-page"">
        <div class=""cover-overlay"">
            <h1 class=""main-label"">PROYECTO DE INVESTIGACIÓN</h1>
            
            <div class=""project-theme"">
                {{{{default titulo 'ESCRIBIR EL TEMA EN MAYÚSCULAS'}}}}
            </div>
            
            <div class=""career-container"">
                <div class=""career-label"">TECNOLOGÍA SUPERIOR EN</div>
                <div class=""career-value"">{{{{default carrera '________________________'}}}}</div>
            </div>
            
            <div class=""period-container"">
                <div class=""period-label"">PERIODO ACADÉMICO</div>
                <div class=""period-value"">{{{{default periodo 'MARZO 2025 – SEPTIEMBRE 2025'}}}}</div>
            </div>
        </div>
    </div>
</div>

<!-- PÁGINA 2+: CONTENIDO DEL PROTOCOLO -->
<div class=""doc-container"">
    <div class=""section-title"">1. IDENTIFICACIÓN DEL PROYECTO</div>
    <table class=""info-table"">
        <tr><td class=""label"">NOMBRE DEL PROYECTO:</td><td><strong>{{{{default titulo '...'}}}}</strong></td></tr>
        <tr><td class=""label"">PROGRAMA:</td><td>{{{{default programa '...'}}}}</td></tr>
        <tr>
            <td class=""label"">GRUPO DE INVESTIGACIÓN:</td>
            <td>
                {{{{#if grupo_investigacion}}}} SI ({{{{grupo_investigacion}}}}) {{{{else}}}} NO {{{{/if}}}}
            </td>
        </tr>
        <tr><td class=""label"">DOMINIO / LÍNEA / SUBLÍNEA:</td><td>{{{{default dominio '...'}}}} / {{{{default linea_investigacion '...'}}}} / {{{{default sublinea_investigacion '...'}}}}</td></tr>
        <tr><td class=""label"">TIPO DE INVESTIGACIÓN:</td><td>{{{{default tipo_investigacion '...'}}}}</td></tr>
        <tr><td class=""label"">CAMPOS (A/E/D):</td><td>{{{{default campo_amplio '...'}}}} / {{{{default campo_especifico '...'}}}} / {{{{default campo_detallado '...'}}}}</td></tr>
        <tr><td class=""label"">DIRECTOR DEL PROYECTO:</td><td><strong>{{{{default nombre_director '...'}}}}</strong></td></tr>
        <tr><td class=""label"">TIEMPO DE EJECUCIÓN:</td><td>{{{{default tiempo_ejecucion '...'}}}}</td></tr>
    </table>

    <div class=""section-title"">2. INVESTIGADORES</div>
    <table class=""data-table"">
        <thead>
            <tr><th>NOMBRE COMPLETO</th><th>CÉDULA</th><th>EMAIL</th><th>TELÉFONO</th><th>NIVEL ACAD.</th><th>ROL</th></tr>
        </thead>
        <tbody>
            {{{{#each investigadores}}}}
            <tr>
                <td>{{{{this.nombre}}}}</td>
                <td>{{{{this.cedula}}}}</td>
                <td>{{{{this.email}}}}</td>
                <td>{{{{this.telefono}}}}</td>
                <td>{{{{this.nivel}}}}</td>
                <td>{{{{this.rol}}}}</td>
            </tr>
            {{{{else}}}}
            <tr><td colspan=""6"" style=""text-align:center; color:#aaa;"">No se registran investigadores adicionales.</td></tr>
            {{{{/each}}}}
        </tbody>
    </table>

    <div class=""section-title"">3. ESPECIFICACIÓN TÉCNICA</div>
    <div style=""font-weight:bold; margin-bottom:5px"">3.1 Antecedentes</div>
    <div style=""border:1px solid #1e2a4a; padding:15px; margin-bottom:15px; text-align:justify; min-height:60px;"">{{{{default antecedentes 'Información no proporcionada.'}}}}</div>
    
    <div style=""font-weight:bold; margin-bottom:5px"">3.2 Descripción del Proyecto</div>
    <div style=""border:1px solid #1e2a4a; padding:15px; margin-bottom:15px; text-align:justify; min-height:60px;"">{{{{default descripcion_proyecto 'Información no proporcionada.'}}}}</div>

    <div style=""font-weight:bold; margin-bottom:5px"">3.3 Justificación</div>
    <div style=""border:1px solid #1e2a4a; padding:15px; margin-bottom:15px; text-align:justify; min-height:60px;"">{{{{default justificacion 'Información no proporcionada.'}}}}</div>

    <table class=""data-table"">
        <tr><th style=""width:40%"">OBJETIVO GENERAL</th><th>OBJETIVOS ESPECÍFICOS</th></tr>
        <tr>
            <td style=""vertical-align:top"">{{{{default objetivo_general 'No definido.'}}}}</td>
            <td style=""vertical-align:top"">
                <ul>
                    {{{{#each objetivos_especificos}}}}
                    <li>{{{{this}}}}</li>
                    {{{{else}}}}
                    <li>...</li>
                    {{{{/each}}}}
                </ul>
            </td>
        </tr>
    </table>

    <div class=""section-title"">4. RECURSOS Y FINANCIAMIENTO</div>
    <div style=""display:flex; gap:15px"">
        <div style=""flex:1"">
            <p style=""font-weight:bold; font-size:9pt;"">4.1 Recursos Disponibles</p>
            <table class=""data-table"">
                <tr><th>DESC.</th><th style=""width:40px"">CANT.</th></tr>
                {{{{#each recursos_disponibles}}}}
                <tr><td>{{{{this.descripcion}}}}</td><td style=""text-align:center"">{{{{this.cantidad}}}}</td></tr>
                {{{{else}}}}
                <tr><td colspan=""2"">&nbsp;</td></tr>
                {{{{/each}}}}
            </table>
        </div>
        <div style=""flex:1"">
            <p style=""font-weight:bold; font-size:9pt;"">4.2 Recursos Necesarios (Gasto)</p>
            <table class=""data-table"">
                <tr><th>RUBRO</th><th>TOTAL</th></tr>
                {{{{#each recursos_necesarios}}}}
                <tr><td>{{{{this.descripcion}}}}</td><td style=""text-align:right"">{{{{moneda this.total}}}}</td></tr>
                {{{{else}}}}
                <tr><td colspan=""2"">&nbsp;</td></tr>
                {{{{/each}}}}
                <tr><td style=""font-weight:bold"">TOTAL PRESUPUESTO</td><td style=""text-align:right; font-weight:bold"">{{{{moneda costo_total}}}}</td></tr>
            </table>
        </div>
    </div>

    <div class=""section-title"">5. PRODUCTOS ESPERADOS</div>
    <table class=""data-table"">
        <tr><th>PRODUCTO / ENTREGABLE</th><th style=""width:80px"">CANTIDAD</th></tr>
        {{{{#each productos}}}}
        <tr><td>{{{{this.tipo}}}}</td><td style=""text-align:center"">{{{{this.cantidad}}}}</td></tr>
        {{{{else}}}}
        <tr><td colspan=""2"">&nbsp;</td></tr>
        {{{{/each}}}}
    </table>

    <div class=""section-title"">6. MATRIZ DE IMPACTO</div>
    <table class=""data-table"">
        <tr><th style=""width:120px"">EJE DE IMPACTO</th><th style=""width:60px"">APLICA</th><th>DESCRIPCIÓN BREVE</th></tr>
        <tr><td>SOCIAL</td><td style=""text-align:center"">{{{{#if impacto_social}}}}X{{{{/if}}}}</td><td>{{{{impacto_social_desc}}}}</td></tr>
        <tr><td>CIENTÍFICO</td><td style=""text-align:center"">{{{{#if impacto_cientifico}}}}X{{{{/if}}}}</td><td>{{{{impacto_cientifico_desc}}}}</td></tr>
        <tr><td>ECONÓMICO</td><td style=""text-align:center"">{{{{#if impacto_economico}}}}X{{{{/if}}}}</td><td>{{{{impacto_economico_desc}}}}</td></tr>
        <tr><td>POLÍTICO</td><td style=""text-align:center"">{{{{#if impacto_politico}}}}X{{{{/if}}}}</td><td>{{{{impacto_politico_desc}}}}</td></tr>
        <tr><td>AMBIENTAL</td><td style=""text-align:center"">{{{{#if impacto_ambiental}}}}X{{{{/if}}}}</td><td>{{{{impacto_ambiental_desc}}}}</td></tr>
    </table>

    <div class=""section-title"">7. CRONOGRAMA DE ACTIVIDADES</div>
    <table class=""data-table"">
        <thead><tr><th>ACTIVIDAD</th><th style=""width:100px"">MES/SEMANA</th><th>RECURSOS</th></tr></thead>
        <tbody>
            {{{{#each cronograma}}}}
            <tr><td>{{{{this.actividad}}}}</td><td style=""text-align:center"">{{{{this.mes}}}}</td><td>{{{{this.recursos}}}}</td></tr>
            {{{{else}}}}
            <tr><td colspan=""3"" style=""text-align:center"">...</td></tr>
            {{{{/each}}}}
        </tbody>
    </table>

    <div class=""section-title"">8. BIBLIOGRAFÍA</div>
    <div style=""font-size:9pt; min-height:80px; border:1px solid #1e2a4a; padding:15px; text-align:justify;"">{{{{default bibliografia 'Sin bibliografía registrada.'}}}}</div>

    <div class=""section-title"">9. FIRMAS DE RESPONSABILIDAD</div>
    <table style=""width:100%; border-collapse:collapse"">
        <tr>
            <td class=""firma-box"" style=""width:48%""><strong>{{{{default nombre_director 'DIRECTOR PROYECTO'}}}}</strong><br/>Firma</td>
            <td style=""width:4%""></td>
            <td class=""firma-box"" style=""width:48%""><strong>{{{{default coordinador 'COORDINADOR CARRERA'}}}}</strong><br/>Firma</td>
        </tr>
    </table>
</div>

<!-- FONDO FIJO PARA TODAS LAS HOJAS (PAPEL MEMBRETADO) -->
<div class=""stationary-bg""></div>";
    }
}

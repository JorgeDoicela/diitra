import type { DocumentBlock } from '../types';
import { BASE_STYLES, renderSection } from './htmlGenerators/generatorStyles';
import { generateCoverHtml } from './htmlGenerators/coverGenerator';
import {
    generateAdvancedTableHtml,
    generateMultiSectionTableHtml,
    generateResearchersTableHtml,
    generateRubricTableHtml,
} from './htmlGenerators/tableGenerator';
import {
    generateProjectGeneralHtml,
    generateProjectTechnicalHtml,
    generateImpactsHtml,
    generateExpectedProductsHtml,
} from './htmlGenerators/sectionsGenerator';
import {
    generateResourcesHtml,
    generateProjectProgressHtml,
    generateProjectApprovalNoticeHtml,
    generateProgressActivityHtml,
    generateProgressStatusHtml,
    generateProgressHeaderHtml,
    generateFinalReportHeaderHtml,
    generateFinalReportWritingHtml,
} from './htmlGenerators/reportsGenerator';
import { generateGanttHtml } from './htmlGenerators/ganttGenerator';
import {
    generateTitleHtml,
    generateRichTextHtml,
    generateTwoColumnHtml,
    generateSignaturesHtml,
    generatePageBreakHtml,
} from './htmlGenerators/miscGenerators';

export { renderSection };

/**
 * FACHADA PRINCIPAL (FACADE PATTERN):
 * Genera el documento HTML completo delegando el renderizado de cada bloque
 * a su estrategia correspondiente.
 */
export const generateHtmlFromBlocks = (blockList: DocumentBlock[], themeConfig?: any): string => {
    let html = `${BASE_STYLES}\n<div class="doc-container">`;

    for (const block of blockList) {
        if (!block.isActive) continue;

        switch (block.type) {
            case 'cover':
                html += generateCoverHtml(block, themeConfig);
                break;
            case 'title':
                html += generateTitleHtml(block);
                break;
            case 'rich_text':
                html += generateRichTextHtml(block);
                break;
            case 'advanced_table':
                html += generateAdvancedTableHtml(block);
                break;
            case 'multi_section_table':
                html += generateMultiSectionTableHtml(block);
                break;
            case 'two_column':
                html += generateTwoColumnHtml(block);
                break;
            case 'page_break':
                html += generatePageBreakHtml();
                break;
            case 'gantt':
                html += generateGanttHtml(block);
                break;
            case 'researchers_table':
                html += generateResearchersTableHtml(block);
                break;
            case 'rubric_table':
                html += generateRubricTableHtml(block);
                break;
            case 'signatures':
                html += generateSignaturesHtml(block);
                break;
            case 'project_general_section':
                html += generateProjectGeneralHtml(block);
                break;
            case 'project_technical_section':
                html += generateProjectTechnicalHtml(block);
                break;
            case 'project_budget_section':
            case 'resources':
                html += generateResourcesHtml(block);
                break;
            case 'project_progress_report':
                html += generateProjectProgressHtml(block);
                break;
            case 'progress_header_section':
                html += generateProgressHeaderHtml(block);
                break;
            case 'progress_activity_section':
                html += generateProgressActivityHtml(block);
                break;
            case 'progress_status_section':
                html += generateProgressStatusHtml(block);
                break;
            case 'expected_products':
                html += generateExpectedProductsHtml(block);
                break;
            case 'impacts':
                html += generateImpactsHtml(block);
                break;
            case 'project_approval_notice':
                html += generateProjectApprovalNoticeHtml(block);
                break;
            case 'arbitration_dictamen_section':
                html += generateArbitrationDictamenHtml(block);
                break;
            case 'final_report_header_section':
                html += generateFinalReportHeaderHtml(block);
                break;
            case 'final_report_writing_section':
                html += generateFinalReportWritingHtml(block);
                break;
            default:
                break;
        }
    }

    html += '\n</div>';
    return html.trim();
};

function generateArbitrationDictamenHtml(block: DocumentBlock): string {
    return `
    <div style="margin: 20px 0; border: 1.5px solid #1e2a4a; padding: 15px; border-radius: 6px;">
        <h2 style="font-size: 11pt; color: #1e2a4a; margin: 0 0 10px 0; text-transform: uppercase;">Acta de Dictamen de Arbitraje Consolidado</h2>
        <p style="font-size: 9pt; color: #64748b;">[Sección renderizada dinámicamente con la matriz de pares evaluadores y dictamen CACES]</p>
    </div>
    `;
}

export const generateFullHtml = generateHtmlFromBlocks;

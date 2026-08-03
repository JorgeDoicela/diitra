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
} from './htmlGenerators/sectionsGenerator';
import {
    generateResourcesHtml,
    generateProjectProgressHtml,
    generateProjectEthicsHtml,
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
            case 'project_ethics_report':
                html += generateProjectEthicsHtml(block);
                break;
            case 'impacts':
                html += generateImpactsHtml(block);
                break;
            default:
                break;
        }
    }

    html += '\n</div>';
    return html.trim();
};

export const generateFullHtml = generateHtmlFromBlocks;

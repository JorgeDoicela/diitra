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
    generateLearningPlanHeaderHtml,
    generateLearningPlanEvalParametersHtml,
    generateLearningPlanPrerequisitesHtml,
    generateLearningPlanActivitiesHtml,
    generateLearningPlanEvaluationHtml,
} from './htmlGenerators/reportsGenerator';
import { generateGanttHtml } from './htmlGenerators/ganttGenerator';
import {
    generateTitleHtml,
    generateRichTextHtml,
    generateTwoColumnHtml,
    generateSignaturesHtml,
    generatePageBreakHtml,
} from './htmlGenerators/miscGenerators';
import {
    generateCertificateHeaderHtml,
    generateCertificateRecipientBadgeHtml,
    generateCertificateBodyHtml,
} from './htmlGenerators/certificateGenerators';

export { renderSection };

/**
 * FACHADA PRINCIPAL (FACADE PATTERN):
 * Genera el documento HTML completo delegando el renderizado de cada bloque
 * a su estrategia correspondiente.
 */
const renderSingleBlockHtml = (block: DocumentBlock, themeConfig?: any, docCode?: string): string => {
    switch (block.type) {
        case 'title':
            return generateTitleHtml(block);
        case 'rich_text':
            return generateRichTextHtml(block);
        case 'advanced_table':
            return generateAdvancedTableHtml(block);
        case 'multi_section_table':
            return generateMultiSectionTableHtml(block);
        case 'two_column':
            return generateTwoColumnHtml(block);
        case 'page_break': {
            let pb = generatePageBreakHtml();
            if (docCode) {
                pb += `\n<div class="doc-normative-code">${docCode}</div>`;
            }
            return pb;
        }
        case 'gantt':
            return generateGanttHtml(block);
        case 'researchers_table':
            return generateResearchersTableHtml(block);
        case 'rubric_table':
            return generateRubricTableHtml(block);
        case 'signatures':
            return generateSignaturesHtml(block);
        case 'project_general_section':
            return generateProjectGeneralHtml(block);
        case 'project_technical_section':
            return generateProjectTechnicalHtml(block);
        case 'project_budget_section':
        case 'resources':
            return generateResourcesHtml(block);
        case 'project_progress_report':
            return generateProjectProgressHtml(block);
        case 'progress_header_section':
            return generateProgressHeaderHtml(block);
        case 'progress_activity_section':
            return generateProgressActivityHtml(block);
        case 'progress_status_section':
            return generateProgressStatusHtml(block);
        case 'expected_products':
            return generateExpectedProductsHtml(block);
        case 'impacts':
            return generateImpactsHtml(block);
        case 'project_approval_notice':
            return generateProjectApprovalNoticeHtml(block);
        case 'arbitration_dictamen_section':
            return generateArbitrationDictamenHtml(block);
        case 'final_report_header_section':
            return generateFinalReportHeaderHtml(block);
        case 'final_report_writing_section':
            return generateFinalReportWritingHtml(block);
        case 'learning_plan_header_section':
            return generateLearningPlanHeaderHtml(block);
        case 'learning_plan_eval_parameters_section':
            return generateLearningPlanEvalParametersHtml(block);
        case 'learning_plan_prerequisites_section':
            return generateLearningPlanPrerequisitesHtml(block);
        case 'learning_plan_activities_section':
            return generateLearningPlanActivitiesHtml(block);
        case 'learning_plan_evaluation_table':
            return generateLearningPlanEvaluationHtml(block);
        case 'certificate_header':
            return generateCertificateHeaderHtml(block, themeConfig);
        case 'certificate_recipient_badge':
            return generateCertificateRecipientBadgeHtml(block);
        case 'certificate_body':
            return generateCertificateBodyHtml(block);
        default:
            return '';
    }
};

export const generateHtmlFromBlocks = (blockList: DocumentBlock[], themeConfig?: any): string => {
    const globalDocOrientation = (themeConfig?.layout?.pageOrientation || themeConfig?.layout?.page_orientation || 'portrait') as 'portrait' | 'landscape';
    const sectionOverrides = (themeConfig?.layout?.sectionOrientations || themeConfig?.layout?.section_orientations || {}) as Record<string, 'portrait' | 'landscape'>;
    const docCode = themeConfig?.brand?.documentCode || themeConfig?.brand?.document_code || '';

    // Agrupación de bloques en páginas lógicas consistente con BlockCanvas
    interface LogicalPage {
        blocks: DocumentBlock[];
        orientation: 'portrait' | 'landscape';
        hasExplicitPageBreakBefore: boolean;
        isCover: boolean;
        isGantt: boolean;
    }

    const pages: LogicalPage[] = [];
    let currentBlocks: DocumentBlock[] = [];
    let pendingExplicitBreak = false;

    const pushPage = (isCover = false, isGantt = false) => {
        if (currentBlocks.length === 0) return;
        const firstBlock = currentBlocks[0];
        const orientation: 'portrait' | 'landscape' = 
            (firstBlock?.id && sectionOverrides[firstBlock.id])
                ? sectionOverrides[firstBlock.id]
                : (isGantt ? 'landscape' : globalDocOrientation);

        pages.push({
            blocks: currentBlocks,
            orientation,
            hasExplicitPageBreakBefore: pendingExplicitBreak,
            isCover,
            isGantt,
        });

        currentBlocks = [];
        pendingExplicitBreak = false;
    };

    for (const block of blockList) {
        if (!block.isActive) continue;

        const hasBreakBefore = (block.config as any)?.pageBreakBefore === true;
        const isGantt = block.type === 'gantt';
        const isCover = block.type === 'cover';
        const isPageBreak = block.type === 'page_break';
        const hasOrientationOverride = !!sectionOverrides[block.id];

        if (isPageBreak) {
            pushPage();
            pendingExplicitBreak = true;
        } else if (isCover) {
            pushPage();
            currentBlocks = [block];
            pushPage(true, false);
        } else if (isGantt) {
            pushPage();
            currentBlocks = [block];
            pushPage(false, true);
        } else if ((hasBreakBefore || hasOrientationOverride) && currentBlocks.length > 0) {
            pushPage();
            currentBlocks = [block];
            if (hasBreakBefore) pendingExplicitBreak = true;
        } else {
            currentBlocks.push(block);
        }
    }
    pushPage();

    let html = `${BASE_STYLES}\n<div class="doc-container" data-document-orientation="${globalDocOrientation}">`;
    let isFirstNonCoverBlock = true;

    for (const page of pages) {
        if (page.isCover) {
            html += generateCoverHtml(page.blocks[0], themeConfig);
            continue;
        }

        let pageHtml = '';
        for (const block of page.blocks) {
            if (isFirstNonCoverBlock && docCode) {
                pageHtml += `\n<div class="doc-normative-code">${docCode}</div>`;
                isFirstNonCoverBlock = false;
            } else if (page.hasExplicitPageBreakBefore && block === page.blocks[0] && pageHtml === '') {
                pageHtml += generatePageBreakHtml();
                if (docCode) {
                    pageHtml += `\n<div class="doc-normative-code">${docCode}</div>`;
                }
            }

            pageHtml += renderSingleBlockHtml(block, themeConfig, docCode);
        }

        // Si la página es Gantt, ya incluye internamente el wrapper START_LANDSCAPE_SECTION
        if (page.isGantt) {
            html += pageHtml;
        } else if (page.orientation !== globalDocOrientation) {
            // Sección con orientación personalizada diferente a la predeterminada del documento
            if (page.orientation === 'landscape') {
                html += `\n<!-- START_LANDSCAPE_SECTION -->\n<div class="landscape-section" data-page-orientation="landscape" style="page-break-before: always; page-break-after: always; width: 100%;">\n${pageHtml}\n</div>\n<!-- END_LANDSCAPE_SECTION -->`;
            } else {
                html += `\n<!-- START_PORTRAIT_SECTION -->\n<div class="portrait-section" data-page-orientation="portrait" style="page-break-before: always; page-break-after: always; width: 100%;">\n${pageHtml}\n</div>\n<!-- END_PORTRAIT_SECTION -->`;
            }
        } else {
            html += pageHtml;
        }
    }

    html += '\n</div>';
    return html.trim();
};

function generateArbitrationDictamenHtml(_block?: DocumentBlock): string {
    return `
    <div style="margin: 20px 0; border: 1.5px solid #222c57; padding: 15px; border-radius: 6px;">
        <h2 style="font-size: 11pt; color: #222c57; margin: 0 0 10px 0; text-transform: uppercase;">Acta de Dictamen de Arbitraje Consolidado</h2>
        <p style="font-size: 9pt; color: #64748b;">[Sección renderizada dinámicamente con la matriz de pares evaluadores y dictamen CACES]</p>
    </div>
    `;
}

export const generateFullHtml = generateHtmlFromBlocks;


import React, { useState } from 'react';
import { FileText, Copy, Check, X, Download, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import type { PresupuestoResumen } from '../types/budget.types';
import { generateFinancialReportHtml } from '../utils/budgetReportFormatter';

interface BudgetReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumen: PresupuestoResumen;
  projectTitle?: string;
}

export const BudgetReportModal: React.FC<BudgetReportModalProps> = ({
  isOpen,
  onClose,
  resumen,
  projectTitle = ''
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const reportHtml = generateFinancialReportHtml(resumen, projectTitle);

  const handleCopyHtml = async () => {
    try {
      const blobHtml = new Blob([reportHtml], { type: 'text/html' });
      const blobText = new Blob([reportHtml.replace(/<[^>]*>/g, ' ')], { type: 'text/plain' });
      
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText
          })
        ]);
      } else {
        await navigator.clipboard.writeText(reportHtml);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar reporte:', err);
      // Fallback a texto
      await navigator.clipboard.writeText(reportHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-surface border border-border-thin rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="p-5 border-b border-border-thin bg-surface-hover/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand/10 text-brand">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-wider font-mono">
                  Balance Financiero para Informes CACES / ISTPET
                </h3>
                <span className="badge-vercel badge-vercel-brand !text-[9px] !py-0.2 !px-1.5">
                  Oficial
                </span>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                Consolidado listo para la Sección 12 del Informe Final y rendición en Informes de Avance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Banner Informativo sobre Auto-Sincronización */}
        <div className="px-5 py-2.5 bg-brand/5 border-b border-border-thin flex items-center justify-between gap-3 text-xs text-text-dim">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-brand shrink-0" />
            <span>
              <strong>Asistente inteligente:</strong> Al redactar el <em>Informe Final</em> en el sistema, también puedes presionar <em>"Cargar Balance de Gastos"</em> dentro del editor para insertar esta tabla directamente.
            </span>
          </div>
        </div>

        {/* Vista previa del documento renderizado */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-950 custom-scrollbar">
          <div
            className="prose prose-sm max-w-none text-zinc-900 dark:text-zinc-100"
            dangerouslySetInnerHTML={{ __html: reportHtml }}
          />
        </div>

        {/* Pie del Modal con Acciones */}
        <div className="p-4 border-t border-border-thin bg-surface flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-text-dim font-mono">
            {resumen.items?.length || 0} partidas planificadas • {resumen.gastos?.length || 0} comprobantes devengados
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-vercel-secondary !h-9 !px-4 !text-xs cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleCopyHtml}
              className="btn-vercel-primary !h-9 !px-5 !text-xs flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar para Informe (Formato Tabla)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Copy, Check, FileText, X } from 'lucide-react';
import type { CronogramaResumen } from '../types/schedule.types';
import { formatScheduleClipboardHtml } from '../utils/scheduleReportFormatter';

interface ScheduleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumen: CronogramaResumen;
  projectTitle?: string;
}

export const ScheduleReportModal: React.FC<ScheduleReportModalProps> = ({
  isOpen,
  onClose,
  resumen,
  projectTitle = 'Proyecto de Investigación'
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const htmlContent = formatScheduleClipboardHtml(resumen, projectTitle);

  const handleCopy = async () => {
    try {
      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const blobText = new Blob([htmlContent.replace(/<[^>]+>/g, ' ')], { type: 'text/plain' });
      
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText
          })
        ]);
      } else {
        await navigator.clipboard.writeText(htmlContent);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bento-card bg-surface w-full max-w-3xl p-6 space-y-4 shadow-2xl border border-border-thin animate-scale-in max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="flex justify-between items-center border-b border-border-thin pb-3">
          <div className="flex items-center gap-2">
            <FileText className="text-brand" size={18} />
            <div>
              <h3 className="text-sm font-bold text-text-main">
                Cronograma y Seguimiento para Informes Institucionales
              </h3>
              <p className="text-[11px] text-text-dim">
                Tabla estructurada lista para copiar y pegar directamente en Microsoft Word o Excel.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-dim hover:text-text-main text-xs p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Vista previa en scroll */}
        <div className="flex-1 overflow-y-auto border border-border-thin rounded-xl p-4 bg-surface-hover/10 scrollbar-thin">
          <div
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            className="text-xs bg-white text-black p-4 rounded shadow-xs"
          />
        </div>

        {/* Barra de Acciones */}
        <div className="flex items-center justify-between pt-3 border-t border-border-thin">
          <span className="text-[11px] text-text-dim">
            Formato compatible con tablas CACES y modelos de informe semestral/final.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-vercel-secondary text-xs px-3 py-1.5"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="btn-vercel-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Tabla para Word/Excel'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

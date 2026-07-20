import {
    Plus, Calendar, FileText, CheckCircle,
    Trash2, Edit2, Activity, AlertCircle, ShieldCheck
} from 'lucide-react';

import {
    useConvocatorias,
    canEditConvocatoria,
    getAnioDisplay,
    getStatusTextClass
} from './hooks/useConvocatorias';

import { VercelUsageCard } from './components/VercelUsageCard';
import { DraftRestoreBanner } from './components/DraftRestoreBanner';
import { ConvocatoriaFormModal } from './components/ConvocatoriaFormModal';
import { ConvocatoriaDetailPanel } from './components/ConvocatoriaDetailPanel';

const ConvocatoriasPage = () => {
    const {
        // States
        convocatorias,
        periodos,
        tiposConv,
        selectedConvocatoria,
        setSelectedConvocatoria,
        lastActiveUuid,
        setLastActiveUuid,
        loading,
        showModal,
        isEditing,
        selectedUuid,
        formFieldErrors,
        setFormFieldErrors,
        isDraftRestored,
        setIsDraftRestored,
        pendingDraft,
        setPendingDraft,
        formData,
        setFormData,
        convocatoriasAbiertas,
        proximasACerrar,

        // Handlers
        handleRestoreDraft,
        handleDiscardDraft,
        handleNewConvocatoria,
        handleCloseModal,
        handleSave,
        handleEdit,
        handleDelete,
        handleStatusChange
    } = useConvocatorias();

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <style>{`
                .row-last-active {
                    background-color: rgba(0, 112, 243, 0.05) !important;
                    border-color: rgba(0, 112, 243, 0.35) !important;
                    box-shadow: 0 0 12px rgba(0, 112, 243, 0.08) !important;
                    transition: all 0.2s ease-in-out;
                }
            `}</style>
            {/* Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 lg:mb-16 animate-fade-up gap-8 lg:gap-0">
                <div className="space-y-2">
                    <div className="section-label">
                        <Activity size={10} strokeWidth={2} />
                        <span>Gestión de Investigación - Convocatorias</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight leading-none">Ciclos de Investigación</h2>
                    <p className="text-xs lg:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Administración de convocatorias anuales para proyectos de investigación.
                        Alineado con estándares CACES y SENESCYT.
                    </p>
                </div>

                <div className="w-full lg:w-auto">
                    <button
                        onClick={handleNewConvocatoria}
                        className="btn-vercel-primary w-full lg:w-auto"
                    >
                        <Plus size={14} strokeWidth={3} />
                        Nueva Convocatoria
                    </button>
                </div>
            </header>

            {/* Banner de Recuperación de Borrador */}
            <DraftRestoreBanner
                pendingDraft={pendingDraft}
                handleRestoreDraft={handleRestoreDraft}
                handleDiscardDraft={handleDiscardDraft}
            />

            {/* Two-column Vercel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-up" style={{ animationDelay: '100ms' }}>

                {/* Main Content: List View (Left Column) */}
                <div className="lg:col-span-3 space-y-5 md:space-y-4">
                    {convocatorias.map((conv) => (
                        <div
                            key={conv.uuid}
                            onClick={() => { setSelectedConvocatoria(conv); setLastActiveUuid(null); }}
                            className={`bento-card px-5 py-6 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 md:gap-0 group cursor-pointer transition-all ${selectedConvocatoria?.uuid === conv.uuid
                                    ? 'bg-brand/[0.05] border-brand/35 shadow-[0_0_12px_rgba(0,112,243,0.08)]'
                                    : (!selectedConvocatoria && lastActiveUuid === conv.uuid)
                                        ? 'row-last-active'
                                        : ''
                                }`}
                        >
                            <div className="flex items-start md:items-center gap-4 md:gap-6 flex-1 w-full">
                                <div className="icon-circle-brand shrink-0 mt-0.5 md:mt-0">
                                    <FileText size={20} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-3 md:space-y-1.5 min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                        <span className={getStatusTextClass(conv.estado)}>
                                            {conv.estado}
                                        </span>
                                        <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest">{conv.codigo_convocatoria}</span>
                                    </div>
                                    <h4 className="text-[15px] md:text-lg font-bold tracking-tight text-text-main leading-normal md:leading-snug break-words group-hover:translate-x-0.5 transition-transform">
                                        {conv.titulo}
                                    </h4>
                                    <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-1.5 text-[10px] text-text-dim font-medium uppercase tracking-tight">
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                            <span className="flex items-center gap-1 shrink-0"><Calendar size={12} /> {getAnioDisplay(conv)}</span>
                                            <span className="flex items-center gap-1 min-w-0 break-words"><ShieldCheck size={12} className="shrink-0" /> {conv.periodo_nombre || conv.id_periodo}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-t-0 border-border-thin pt-5 mt-1 md:pt-0 md:mt-0 shrink-0">
                                <div className="text-left md:text-right md:mr-4">
                                    <p className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Cierre</p>
                                    <p className="text-xs font-mono text-text-main">{conv.fecha_cierre}</p>
                                </div>

                                <div className="flex items-center gap-1">
                                    {conv.estado === 'Borrador' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(conv.uuid, 'Abierta');
                                            }}
                                            className="p-2 text-text-dim hover:text-success hover:bg-surface-hover rounded transition-colors"
                                            title="Publicar Convocatoria"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                    )}

                                    {canEditConvocatoria(conv.estado) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(conv);
                                            }}
                                            className="p-2 text-text-dim hover:text-text-main hover:bg-surface-hover rounded transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(conv.uuid);
                                        }}
                                        className="p-2 text-text-dim hover:text-error hover:bg-surface-hover rounded transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {convocatorias.length === 0 && !loading && (
                        <div className="empty-state py-20">
                            <div className="icon-circle-neutral mb-4">
                                <AlertCircle size={24} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-text-main font-bold uppercase tracking-widest">No hay convocatorias activas</p>
                                <p className="text-xs text-text-dim">Empieza creando una nueva convocatoria para este periodo.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Metrics (Right Column) */}
                <div className="space-y-6">
                    <VercelUsageCard
                        title="Resumen del Periodo"
                        items={[
                            {
                                label: 'Total Anual',
                                value: convocatorias.length,
                                displayValue: `${convocatorias.length} ciclos`,
                                max: 10,
                                color: 'var(--brand)',
                                hint: 'Cantidad total de convocatorias registradas en el sistema.'
                            },
                            {
                                label: 'Abiertas',
                                value: convocatoriasAbiertas,
                                displayValue: `${convocatoriasAbiertas} vigentes`,
                                max: convocatorias.length || 1,
                                color: 'var(--success)',
                                hint: 'Convocatorias en estado Abierta, disponibles para postulaciones de docentes.'
                            },
                            {
                                label: 'Próximas a Cerrar',
                                value: proximasACerrar,
                                displayValue: proximasACerrar === 1 ? '1 en 30 días' : `${proximasACerrar} en 30 días`,
                                max: convocatoriasAbiertas || 1,
                                color: 'var(--warning)',
                                hint: 'Convocatorias abiertas cuya fecha de cierre está dentro de los próximos 30 días.'
                            }
                        ]}
                    />
                </div>
            </div>

            {/* Modal - Create/Edit */}
            <ConvocatoriaFormModal
                showModal={showModal}
                isEditing={isEditing}
                formData={formData}
                setFormData={setFormData}
                formFieldErrors={formFieldErrors}
                setFormFieldErrors={setFormFieldErrors}
                periodos={periodos}
                tiposConv={tiposConv}
                isDraftRestored={isDraftRestored}
                setIsDraftRestored={setIsDraftRestored}
                setPendingDraft={setPendingDraft}
                selectedUuid={selectedUuid}
                convocatorias={convocatorias}
                handleCloseModal={handleCloseModal}
                handleSave={handleSave}
            />

            {/* Detail Panel */}
            <ConvocatoriaDetailPanel
                selectedConvocatoria={selectedConvocatoria}
                setSelectedConvocatoria={setSelectedConvocatoria}
                setLastActiveUuid={setLastActiveUuid}
                tiposConv={tiposConv}
                canEditConvocatoria={canEditConvocatoria}
                handleEdit={handleEdit}
                handleStatusChange={handleStatusChange}
            />
        </main>
    );
};

export default ConvocatoriasPage;

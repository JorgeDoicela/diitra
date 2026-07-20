import React from 'react';
import {
    Users, Shield, Calendar, CheckCircle, XCircle, BookOpen, GraduationCap, User, MessageCircle, Loader2
} from 'lucide-react';
import type { useGroupDetail } from '../useGroupDetail';
import type { Domain, Career, ResearchLine } from './GroupInfoEditView';
import { formatNombre, formatWhatsappLink } from '../utils/groupInfoHelpers';

export interface GroupInfoReadOnlyViewProps {
    hook: ReturnType<typeof useGroupDetail>;
    dominios: Domain[];
    carreras: Career[];
    lines: ResearchLine[];
    formatCareerName: (name: string) => string;
    renderFieldFeedbackButton: (fieldKey: string, fieldName: string) => React.ReactNode;
}

export const GroupInfoReadOnlyView: React.FC<GroupInfoReadOnlyViewProps> = ({
    hook,
    dominios,
    carreras,
    lines,
    formatCareerName,
    renderFieldFeedbackButton
}) => {
    const { detailGroup, detailMembers, highlightedField } = hook;

    if (!detailGroup) return null;

    const teachers = detailMembers.filter(member => {
        const rolLower = (member.rol || '').toLowerCase();
        return rolLower.includes('investigador') || rolLower.includes('director') || rolLower.includes('coordinador');
    });

    const students = detailMembers.filter(member => {
        const rolLower = (member.rol || '').toLowerCase();
        return rolLower.includes('semillerista') || rolLower.includes('alumno') || rolLower.includes('estudiante');
    });

    return (
        <div className="space-y-6">
            {/* Status & Type & Consolidation */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bento-card static p-4">
                    <label className="section-label text-text-dim mb-2">
                        <Shield size={12} /> Estado
                    </label>
                    {(!detailGroup.estado || detailGroup.estado === 'Aprobado') && (
                        <span className="badge-vercel badge-vercel-success">
                            <CheckCircle size={10} /> Aprobado
                        </span>
                    )}
                    {detailGroup.estado === 'Pendiente' && (
                        <span className="badge-vercel badge-vercel-warning">
                            <Calendar size={10} /> Pendiente
                        </span>
                    )}
                    {detailGroup.estado === 'En Evaluación' && (
                        <span className="badge-vercel badge-vercel-info">
                            <Loader2 size={10} className="animate-spin" /> En Evaluación
                        </span>
                    )}
                    {detailGroup.estado === 'Rechazado' && (
                        <span className="badge-vercel badge-vercel-error">
                            <XCircle size={10} /> Rechazado
                        </span>
                    )}
                    <p className={`text-[8px] font-mono tracking-wider uppercase mt-1 ${detailGroup.activo ? 'text-success' : 'text-text-dim/60'}`}>
                        ● {detailGroup.activo ? 'Vigente' : 'Inactivo'}
                    </p>
                </div>

                <div className="bento-card static p-4">
                    <label className="section-label text-text-dim mb-2">Tipo de Grupo</label>
                    <p className="text-xs font-black text-text-main uppercase tracking-tight">
                        {detailGroup.tipo_grupo || 'Investigación'}
                    </p>
                </div>

                <div className="bento-card static p-4">
                    <label className="section-label text-text-dim mb-2">Etapa del grupo</label>
                    <span className={`badge-vercel ${
                        detailGroup.categoria_consolidacion === 'Consolidado'
                            ? 'badge-vercel-success'
                            : 'badge-vercel-neutral'
                    }`}>
                        {detailGroup.categoria_consolidacion || 'En Formación'}
                    </span>
                </div>
            </div>

            {/* Coordinator */}
            <div
                id="field-container-coordinador"
                className={`bento-card static p-4 space-y-2 transition-all duration-500 rounded-xl ${
                    highlightedField === 'coordinador'
                        ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                        : ''
                }`}
            >
                <div className="flex justify-between items-center">
                    <label className="section-label text-text-dim flex items-center gap-1.5">
                        <User size={12} /> Coordinador Responsable
                    </label>
                    {renderFieldFeedbackButton('coordinador', 'Coordinador Responsable')}
                </div>
                <p className="text-sm font-semibold text-text-main flex items-center gap-2">
                    <span>{detailGroup.nombre_coordinador ? formatNombre(detailGroup.nombre_coordinador) : 'No asignado'}</span>
                    {detailGroup.telefono_coordinador && (
                        <a
                            href={formatWhatsappLink(detailGroup.telefono_coordinador)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center justify-center inline-flex"
                            title={`Escribir por WhatsApp a ${detailGroup.nombre_coordinador}`}
                        >
                            <MessageCircle size={12} />
                        </a>
                    )}
                </p>
                {detailGroup.id_profesor_coordinador && (
                    <p className="text-[10px] font-mono text-text-dim">C.I. {detailGroup.id_profesor_coordinador}</p>
                )}
            </div>

            {/* Domain */}
            {detailGroup.id_dominio && (
                <div className="bento-card static p-4 space-y-2">
                    <label className="section-label text-text-dim">Dominio Académico</label>
                    <p className="text-xs font-semibold text-text-main">
                        {dominios.find(d => d.id_dominio === detailGroup.id_dominio)?.nombre || 'Sin dominio'}
                    </p>
                </div>
            )}

            {/* Objective */}
            {detailGroup.objetivo_general && (
                <div
                    id="field-container-objetivo"
                    className={`bento-card static p-4 space-y-2 transition-all duration-500 rounded-xl ${
                        highlightedField === 'objetivo'
                            ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                            : ''
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <label className="section-label text-text-dim">Objetivo General</label>
                        {renderFieldFeedbackButton('objetivo', 'Objetivo General')}
                    </div>
                    <p className="text-sm text-text-main leading-relaxed">{detailGroup.objetivo_general}</p>
                </div>
            )}

            {/* Mission */}
            {detailGroup.mision && (
                <div
                    id="field-container-mision"
                    className={`bento-card static p-4 space-y-2 transition-all duration-500 rounded-xl ${
                        highlightedField === 'mision'
                            ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                            : ''
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <label className="section-label text-text-dim">Misión</label>
                        {renderFieldFeedbackButton('mision', 'Misión')}
                    </div>
                    <p className="text-sm text-text-main leading-relaxed">{detailGroup.mision}</p>
                </div>
            )}

            {/* Vision */}
            {detailGroup.vision && (
                <div
                    id="field-container-vision"
                    className={`bento-card static p-4 space-y-2 transition-all duration-500 rounded-xl ${
                        highlightedField === 'vision'
                            ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                            : ''
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <label className="section-label text-text-dim">Visión</label>
                        {renderFieldFeedbackButton('vision', 'Visión')}
                    </div>
                    <p className="text-sm text-text-main leading-relaxed">{detailGroup.vision}</p>
                </div>
            )}

            {/* Resolution & Dates */}
            {(detailGroup.resolucion_aprobacion || detailGroup.fecha_creacion) && (
                <div className="grid grid-cols-2 gap-4">
                    {detailGroup.resolucion_aprobacion && (
                        <div className="bento-card static p-4 space-y-1">
                            <label className="section-label text-text-dim">Resolución</label>
                            <p className="text-sm font-bold text-text-main font-mono">{detailGroup.resolucion_aprobacion}</p>
                        </div>
                    )}
                    {detailGroup.fecha_creacion && (
                        <div className="bento-card static p-4 space-y-1">
                            <label className="section-label text-text-dim">Fecha Creación</label>
                            <p className="text-sm font-bold text-text-main font-mono">{new Date(detailGroup.fecha_creacion).toLocaleDateString()}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Lines of Research */}
            {detailGroup.lineas_ids && detailGroup.lineas_ids.length > 0 && (
                <div
                    id="field-container-lineas"
                    className={`bento-card static p-4 space-y-3 transition-all duration-500 rounded-xl ${
                        highlightedField === 'lineas'
                            ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                            : ''
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <label className="section-label text-text-dim flex items-center gap-1">
                            <BookOpen size={12} /> Líneas de Investigación
                        </label>
                        {renderFieldFeedbackButton('lineas', 'Líneas de Investigación')}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {detailGroup.lineas_ids.map((lineId: number) => {
                            const line = lines.find(l => l.id === lineId);
                            if (!line) return null;
                            return (
                                <span key={lineId} className="text-xs font-bold text-text-main uppercase tracking-tight bg-bg-deep border border-border-thin rounded-xl p-2.5">
                                    {line.nombre}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Careers */}
            {detailGroup.carreras_ids && detailGroup.carreras_ids.length > 0 && (
                <div
                    id="field-container-carreras"
                    className={`bento-card static p-4 space-y-3 transition-all duration-500 rounded-xl ${
                        highlightedField === 'carreras'
                            ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                            : ''
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <label className="section-label text-text-dim flex items-center gap-1">
                            <GraduationCap size={12} /> Carreras / Programas
                        </label>
                        {renderFieldFeedbackButton('carreras', 'Carreras / Programas')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {detailGroup.carreras_ids.map((carrId: number) => {
                            const career = carreras.find(c => c.id_carrera === carrId);
                            if (!career) return null;
                            return (
                                <span key={carrId} className="badge-vercel badge-vercel-info text-[9px] py-1 px-2.5 font-bold uppercase">
                                    {formatCareerName(career.carrera1)}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Detailed Members Lists */}
            <div
                id="field-container-integrantes"
                className={`bento-card static p-4 space-y-3 transition-all duration-500 rounded-xl ${
                    highlightedField === 'integrantes'
                        ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                        : ''
                }`}
            >
                <div className="flex justify-between items-center border-b border-border-thin/20 pb-2 mb-2">
                    <label className="section-label text-text-dim flex items-center gap-1">
                        <Users size={12} /> Integrantes del Grupo
                    </label>
                    {renderFieldFeedbackButton('integrantes', 'Integrantes del Grupo')}
                </div>

                {detailMembers.length > 0 ? (
                    <div className="space-y-4">
                        {/* Docentes */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                                <User size={10} />
                                <span>Docentes Investigadores ({teachers.length})</span>
                            </div>
                            <div className="space-y-1.5">
                                {teachers.map(member => (
                                    <div key={member.id_grupo_miembro} className="flex items-center justify-between p-2.5 bg-bg-deep/40 rounded-lg border border-emerald-500/10">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                <User size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-text-main truncate" title={formatNombre(member.nombre_completo)}>{formatNombre(member.nombre_completo)}</p>
                                                <span className="text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                                    {member.rol}
                                                </span>
                                            </div>
                                        </div>
                                        {member.cedula && (
                                            <div className="flex items-center gap-2">
                                                {member.telefono_contacto && (
                                                    <a
                                                        href={formatWhatsappLink(member.telefono_contacto)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center justify-center inline-flex"
                                                        title={`Escribir por WhatsApp a ${member.nombre_completo}`}
                                                    >
                                                        <MessageCircle size={10} />
                                                    </a>
                                                )}
                                                <span className="text-[9px] font-mono text-text-dim">C.I. {member.cedula}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {teachers.length === 0 && (
                                    <p className="text-[9px] text-text-dim font-bold uppercase py-2 text-center bg-bg-deep/10 border border-dashed border-border-thin rounded-lg">Sin docentes investigadores</p>
                                )}
                            </div>
                        </div>

                        {/* Estudiantes */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-400">
                                <GraduationCap size={10} />
                                <span>Estudiantes Semilleristas ({students.length})</span>
                            </div>
                            <div className="space-y-1.5">
                                {students.map(member => (
                                    <div key={member.id_grupo_miembro} className="flex items-center justify-between p-2.5 bg-bg-deep/40 rounded-lg border border-blue-500/10">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                                <GraduationCap size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-text-main truncate" title={formatNombre(member.nombre_completo)}>{formatNombre(member.nombre_completo)}</p>
                                                <span className="text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                                    {member.rol}
                                                </span>
                                            </div>
                                        </div>
                                        {member.cedula && (
                                            <div className="flex items-center gap-2">
                                                {member.telefono_contacto && (
                                                    <a
                                                        href={formatWhatsappLink(member.telefono_contacto)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center justify-center inline-flex"
                                                        title={`Escribir por WhatsApp a ${member.nombre_completo}`}
                                                    >
                                                        <MessageCircle size={10} />
                                                    </a>
                                                )}
                                                <span className="text-[9px] font-mono text-text-dim">C.I. {member.cedula}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {students.length === 0 && (
                                    <p className="text-[9px] text-text-dim font-bold uppercase py-2 text-center bg-bg-deep/10 border border-dashed border-border-thin rounded-lg">Sin estudiantes semilleristas</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-6 text-center">
                        <Users size={20} className="mx-auto text-text-dim/30 mb-2" />
                        <p className="text-[10px] text-text-dim font-medium uppercase tracking-widest">Sin integrantes registrados</p>
                    </div>
                )}
            </div>
        </div>
    );
};

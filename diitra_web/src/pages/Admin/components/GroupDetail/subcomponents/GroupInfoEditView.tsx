import React from 'react';
import {
    Users, Shield, Calendar, AlertTriangle, BookOpen, User, Search, UserMinus, FileText, Plus, Loader2
} from 'lucide-react';
import type { useGroupDetail } from '../useGroupDetail';
import { formatNombre } from '../utils/groupInfoHelpers';

export interface Domain {
    id_dominio: number;
    nombre: string;
}

export interface Career {
    id_carrera: number;
    carrera1: string;
}

export interface ResearchLine {
    id: number;
    nombre: string;
}

export interface GroupInfoEditViewProps {
    hook: ReturnType<typeof useGroupDetail>;
    dominios: Domain[];
    carreras: Career[];
    lines: ResearchLine[];
    formatCareerName: (name: string) => string;
    renderFieldFeedbackButton: (fieldKey: string, fieldName: string) => React.ReactNode;
}

export const GroupInfoEditView: React.FC<GroupInfoEditViewProps> = ({
    hook,
    dominios,
    carreras,
    lines,
    formatCareerName,
    renderFieldFeedbackButton
}) => {
    const {
        detailMembers,
        isDraftRestored,
        clearDraft,
        editFormData,
        setEditFormData,
        coordSearchQuery,
        setCoordSearchQuery,
        coordSearchResults,
        isCoordSearching,
        showCoordResults,
        setShowCoordResults,
        selectedCoordName,
        handleSelectCoordinator,
        teacherSearchQuery,
        setTeacherSearchQuery,
        showTeacherResults,
        setShowTeacherResults,
        isTeacherSearching,
        teacherSearchResults,
        handleSelectTeacher,
        teacherPhone,
        setTeacherPhone,
        teacherRol,
        setTeacherRol,
        selectedTeacher,
        handleAddTeacher,
        studentSearchQuery,
        setStudentSearchQuery,
        showStudentResults,
        setShowStudentResults,
        isStudentSearching,
        studentSearchResults,
        handleSelectStudent,
        studentPhone,
        setStudentPhone,
        studentRol,
        setStudentRol,
        selectedStudent,
        handleAddStudent,
        handleRemoveMember,
        toggleLine,
        isAdmin
    } = hook;

    return (
        <div className="space-y-6">
            {isDraftRestored && (
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-up">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                        <p className="text-xs font-semibold">Edición restaurada desde un borrador local no guardado.</p>
                    </div>
                    <button
                        type="button"
                        onClick={clearDraft}
                        className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border border-amber-500/20 hover:bg-amber-500/10 text-amber-500 active:scale-95 transition-all"
                    >
                        Descartar Borrador
                    </button>
                </div>
            )}
            
            {/* Basic Settings */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-bg-deep/20 rounded-2xl border border-border-thin">
                <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Nombre del Grupo</label>
                        {renderFieldFeedbackButton('nombre', 'Nombre del Grupo')}
                    </div>
                    <input
                        type="text"
                        required
                        value={editFormData.nombre}
                        onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                        className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all uppercase placeholder:normal-case font-medium"
                        placeholder="Ej: Grupo de Investigación en Sistemas Inteligentes"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Siglas / Acrónimo</label>
                        {renderFieldFeedbackButton('siglas', 'Siglas del Grupo')}
                    </div>
                    <input
                        type="text"
                        required
                        value={editFormData.siglas}
                        onChange={(e) => setEditFormData({ ...editFormData, siglas: e.target.value })}
                        className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all uppercase font-semibold"
                        placeholder="Ej: GISI"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Tipo de Grupo</label>
                        {renderFieldFeedbackButton('tipoGrupo', 'Tipo de Grupo')}
                    </div>
                    <select
                        value={editFormData.tipo_grupo}
                        onChange={(e) => setEditFormData({ ...editFormData, tipo_grupo: e.target.value })}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all font-medium"
                    >
                        <option value="Investigación">Grupo de Investigación</option>
                        <option value="Semillero">Semillero de Investigación</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Dominio Académico</label>
                        {renderFieldFeedbackButton('idDominio', 'Dominio Académico')}
                    </div>
                    <select
                        required
                        value={editFormData.id_dominio}
                        onChange={(e) => setEditFormData({ ...editFormData, id_dominio: e.target.value })}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all font-medium"
                    >
                        <option value="">Seleccione Dominio...</option>
                        {dominios.map(d => (
                            <option key={d.id_dominio} value={d.id_dominio}>{d.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Etapa del grupo</label>
                    <select
                        value={editFormData.categoria_consolidacion}
                        onChange={(e) => setEditFormData({ ...editFormData, categoria_consolidacion: e.target.value })}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all font-medium"
                    >
                        <option value="En Formación">En Formación (Grupo Inicial / Reciente)</option>
                        <option value="Consolidado">Consolidado (Trayectoria Probada)</option>
                    </select>
                </div>

                {/* WhatsApp and Coordinator Phone */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Enlace de Grupo de WhatsApp (Opcional)</label>
                    <input
                        type="url"
                        value={editFormData.link_whatsapp}
                        onChange={(e) => setEditFormData({ ...editFormData, link_whatsapp: e.target.value })}
                        placeholder="https://chat.whatsapp.com/..."
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all font-medium"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Teléfono del Coordinador (Opcional)</label>
                    <input
                        type="tel"
                        value={editFormData.telefono_coordinador}
                        onChange={(e) => setEditFormData({ ...editFormData, telefono_coordinador: e.target.value })}
                        placeholder="0999999999"
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all font-medium"
                    />
                </div>

                {/* Coordinator Selection */}
                <div className="space-y-2 md:col-span-2 relative">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                        <User size={12} /> Coordinador Responsable
                    </label>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                        <input
                            type="text"
                            value={coordSearchQuery}
                            onChange={(e) => {
                                setCoordSearchQuery(e.target.value);
                                setShowCoordResults(true);
                            }}
                            onFocus={() => setShowCoordResults(true)}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg pl-9 pr-4 py-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase placeholder:normal-case font-medium"
                            placeholder={selectedCoordName ? selectedCoordName : "Buscar docente por nombre o cédula..."}
                        />
                        {showCoordResults && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowCoordResults(false)}></div>
                                <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-border-thin rounded-lg p-1.5 shadow-xl max-h-[180px] overflow-y-auto z-30 custom-scrollbar">
                                    {isCoordSearching ? (
                                        <div className="p-3 text-center text-xs text-text-dim font-mono flex items-center justify-center gap-2">
                                            <Loader2 size={12} className="animate-spin" /> Buscando docente...
                                        </div>
                                    ) : coordSearchResults.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-text-dim font-mono">
                                            No se encontraron docentes con ese nombre o cédula.
                                        </div>
                                    ) : (
                                        coordSearchResults.map((teacher: any) => (
                                            <button
                                                key={teacher.cedula}
                                                type="button"
                                                onClick={() => handleSelectCoordinator(teacher)}
                                                className="w-full text-left p-2.5 rounded hover:bg-bg-deep/50 transition-colors flex justify-between items-center"
                                            >
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold text-text-main text-xs flex items-center gap-2">
                                                        <span>{formatNombre(teacher.nombre)}</span>
                                                        {teacher.horas_disponibles !== undefined && (
                                                            <span className={`badge-vercel text-[10px] font-medium px-2 py-0.5 ${
                                                                (teacher.horas_disponibles - (teacher.horas_asignadas || 0)) > 0 
                                                                    ? 'badge-vercel-success' 
                                                                    : 'badge-vercel-error'
                                                            }`}>
                                                                Disp: {teacher.horas_disponibles - (teacher.horas_asignadas || 0)}h / {teacher.horas_disponibles}h
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-text-dim font-mono text-[9px] mt-0.5">C.I. {teacher.cedula} | {teacher.carrera || 'SIN CARRERA'}</p>
                                                </div>
                                                <span className="badge-vercel text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 badge-vercel-violet">
                                                    Docente
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Linked Careers */}
            <section className="space-y-2 p-4 bg-bg-deep/20 rounded-2xl border border-border-thin">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Carreras Vinculadas Automáticamente</label>
                {(() => {
                    const linkedCareers = editFormData.carreras_ids.map((carrId: number) => {
                        const career = carreras.find(c => c.id_carrera === carrId);
                        return career ? career.carrera1 : null;
                    }).filter(c => c !== null) as string[];

                    const filtered = linkedCareers.filter((cName: string) => {
                        const clean = cName.trim().toUpperCase();
                        return clean !== 'DOCENTE' && clean !== 'ESTUDIANTE';
                    });

                    if (filtered.length === 0) {
                        return (
                            <div className="p-3 text-center text-[10px] text-text-dim font-mono bg-bg-deep/30 rounded-xl border border-dashed border-border-thin">
                                Sin carreras vinculadas.
                            </div>
                        );
                    }

                    return (
                        <div className="flex flex-wrap gap-2 p-4 bg-bg-deep/40 rounded-xl border border-border-thin">
                            {filtered.map((cName, idx) => (
                                <span key={idx} className="badge-vercel badge-vercel-info text-[9px] py-1 px-2.5 font-bold uppercase">
                                    {formatCareerName(cName)}
                                </span>
                            ))}
                        </div>
                    );
                })()}
            </section>

            {/* Identity Statements */}
            <section className="space-y-6 p-4 bg-bg-deep/20 rounded-2xl border border-border-thin">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Objetivo General</label>
                        {renderFieldFeedbackButton('objetivoGeneral', 'Objetivo General')}
                    </div>
                    <textarea
                        rows={3}
                        value={editFormData.objetivo_general}
                        onChange={(e) => setEditFormData({ ...editFormData, objetivo_general: e.target.value })}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none font-medium"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Misión</label>
                            {renderFieldFeedbackButton('mision', 'Misión')}
                        </div>
                        <textarea
                            rows={3}
                            value={editFormData.mision}
                            onChange={(e) => setEditFormData({ ...editFormData, mision: e.target.value })}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Visión</label>
                            {renderFieldFeedbackButton('vision', 'Visión')}
                        </div>
                        <textarea
                            rows={3}
                            value={editFormData.vision}
                            onChange={(e) => setEditFormData({ ...editFormData, vision: e.target.value })}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none font-medium"
                        />
                    </div>
                </div>
            </section>

            {/* Research Lines */}
            <section className="space-y-4 p-4 bg-bg-deep/20 rounded-2xl border border-border-thin">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                        <BookOpen size={12} /> Líneas de Investigación Institucionales
                    </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lines.map(line => (
                        <div
                            key={line.id}
                            onClick={() => toggleLine(line.id)}
                            className={`p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                                editFormData.lineas_ids.includes(line.id)
                                    ? 'bg-text-main/10 border-text-main text-text-main'
                                    : 'bg-bg-deep/50 border-border-thin text-text-dim hover:border-text-dim/50'
                            }`}
                        >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                editFormData.lineas_ids.includes(line.id) ? 'border-text-main bg-text-main' : 'border-border-thin'
                            }`}>
                                {editFormData.lineas_ids.includes(line.id) && <Shield size={10} className="text-bg-deep" />}
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-tight">{line.nombre}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Members Section (In-place additions and deletions) */}
            <section className="space-y-6 p-4 bg-bg-deep/20 rounded-2xl border border-border-thin">
                <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                    <Users size={12} /> Integrantes del Grupo
                </h4>

                {/* Existing members */}
                <div className="space-y-3">
                    {detailMembers.map(member => (
                        <div key={member.id_grupo_miembro} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border-thin">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-black bg-surface-hover text-text-dim">
                                    {member.rol?.includes('Director') ? <Shield size={14} /> : <User size={14} />}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-text-main">{formatNombre(member.nombre_completo)}</p>
                                    <p className="text-[8px] font-bold uppercase text-text-dim mt-0.5">{member.rol}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveMember(member.id_grupo_miembro)}
                                className="p-1.5 rounded-lg border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-all"
                                title="Retirar Integrante"
                            >
                                <UserMinus size={12} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add Teacher Investigator */}
                <div className="p-4 bg-surface rounded-xl border border-border-thin space-y-4">
                    <h5 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                        <Plus size={10} /> Añadir Docente Investigador
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1 relative">
                            <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Buscar Docente</label>
                            <div className="relative">
                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim/60" />
                                <input
                                    type="text"
                                    value={teacherSearchQuery}
                                    onChange={(e) => {
                                        setTeacherSearchQuery(e.target.value);
                                        setShowTeacherResults(true);
                                    }}
                                    onFocus={() => setShowTeacherResults(true)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg pl-8 pr-3 py-2 text-xs text-text-main focus:outline-none transition-all uppercase placeholder:normal-case font-medium"
                                    placeholder="Buscar por nombre o cédula..."
                                />
                                {showTeacherResults && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setShowTeacherResults(false)}></div>
                                        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-thin rounded-lg p-1.5 shadow-xl max-h-[150px] overflow-y-auto z-30 custom-scrollbar">
                                            {isTeacherSearching ? (
                                                <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                    Buscando...
                                                </div>
                                            ) : teacherSearchResults.length === 0 ? (
                                                <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                    No se encontraron resultados.
                                                </div>
                                            ) : (
                                                teacherSearchResults.map((teacher: any) => (
                                                    <button
                                                        key={teacher.cedula}
                                                        type="button"
                                                        onClick={() => handleSelectTeacher(teacher)}
                                                        className="w-full text-left p-2 rounded hover:bg-bg-deep/50 transition-colors flex justify-between items-center"
                                                    >
                                                        <div className="space-y-0.5">
                                                            <p className="font-semibold text-text-main text-xs flex items-center gap-2">
                                                                <span>{formatNombre(teacher.nombre)}</span>
                                                                {teacher.horas_disponibles !== undefined && (
                                                                    <span className={`badge-vercel text-[10px] font-medium px-2 py-0.5 ${
                                                                        (teacher.horas_disponibles - (teacher.horas_asignadas || 0)) > 0 
                                                                            ? 'badge-vercel-success' 
                                                                            : 'badge-vercel-error'
                                                                    }`}>
                                                                        Disp: {teacher.horas_disponibles - (teacher.horas_asignadas || 0)}h / {teacher.horas_disponibles}h
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-text-dim font-mono text-[9px] mt-0.5">C.I. {teacher.cedula} | {teacher.carrera || 'SIN CARRERA'}</p>
                                                        </div>
                                                        <span className="badge-vercel text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 badge-vercel-violet">
                                                            Docente
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Teléfono (WhatsApp)</label>
                            <input
                                type="tel"
                                value={teacherPhone}
                                onChange={(e) => setTeacherPhone(e.target.value)}
                                placeholder="Opcional"
                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-2 text-xs text-text-main focus:outline-none transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Rol en el Grupo</label>
                            <select
                                value={teacherRol}
                                onChange={(e) => setTeacherRol(e.target.value)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-2.5 text-xs text-text-main focus:outline-none transition-all font-medium"
                            >
                                <option value="Co-Investigador">Co-Investigador</option>
                                <option value="Director de Proyecto">Director de Proyecto</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddTeacher}
                        disabled={!selectedTeacher}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-bg-deep font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
                    >
                        Añadir Docente
                    </button>
                </div>

                {/* Add Student Semillerista */}
                <div className="p-4 bg-surface rounded-xl border border-border-thin space-y-4">
                    <h5 className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                        <Plus size={10} /> Añadir Estudiante Semillerista
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1 relative">
                            <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Buscar Estudiante</label>
                            <div className="relative">
                                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim/60" />
                                <input
                                    type="text"
                                    value={studentSearchQuery}
                                    onChange={(e) => {
                                        setStudentSearchQuery(e.target.value);
                                        setShowStudentResults(true);
                                    }}
                                    onFocus={() => setShowStudentResults(true)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg pl-8 pr-3 py-2 text-xs text-text-main focus:outline-none transition-all uppercase placeholder:normal-case font-medium"
                                    placeholder="Buscar por nombre o cédula..."
                                />
                                {showStudentResults && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setShowStudentResults(false)}></div>
                                        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-thin rounded-lg p-1.5 shadow-xl max-h-[150px] overflow-y-auto z-30 custom-scrollbar">
                                            {isStudentSearching ? (
                                                <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                    Buscando...
                                                </div>
                                            ) : studentSearchResults.length === 0 ? (
                                                <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                    No se encontraron resultados.
                                                </div>
                                            ) : (
                                                studentSearchResults.map((student: any) => (
                                                    <button
                                                        key={student.cedula}
                                                        type="button"
                                                        onClick={() => handleSelectStudent(student)}
                                                        className="w-full text-left p-2 rounded hover:bg-bg-deep/50 transition-colors"
                                                    >
                                                        <p className="font-semibold text-text-main text-xs">{formatNombre(student.nombre)}</p>
                                                        <p className="text-text-dim font-mono text-[9px] mt-0.5">C.I. {student.cedula} | {student.carrera || 'SIN CARRERA'}</p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Teléfono (WhatsApp)</label>
                            <input
                                type="tel"
                                value={studentPhone}
                                onChange={(e) => setStudentPhone(e.target.value)}
                                placeholder="Opcional"
                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-2 text-xs text-text-main focus:outline-none transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Rol en el Grupo</label>
                            <select
                                value={studentRol}
                                onChange={(e) => setStudentRol(e.target.value)}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg p-2.5 text-xs text-text-main focus:outline-none transition-all font-medium"
                            >
                                <option value="Semillerista">Semillerista</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddStudent}
                        disabled={!selectedStudent}
                        className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-blue-500 text-bg-deep font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
                    >
                        Añadir Estudiante
                    </button>
                </div>
            </section>

            {/* Admin approval fields */}
            {isAdmin && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-bg-deep/20 rounded-2xl border border-border-thin">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                            <FileText size={12} /> Resolución de Aprobación
                        </label>
                        <input
                            type="text"
                            value={editFormData.resolucion_aprobacion}
                            onChange={(e) => setEditFormData({ ...editFormData, resolucion_aprobacion: e.target.value })}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase font-medium"
                            placeholder="ACTA-DI-2026-001"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12} /> Fecha de Creación
                        </label>
                        <input
                            type="date"
                            value={editFormData.fecha_creacion}
                            onChange={(e) => setEditFormData({ ...editFormData, fecha_creacion: e.target.value })}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all"
                        />
                    </div>
                </section>
            )}
        </div>
    );
};

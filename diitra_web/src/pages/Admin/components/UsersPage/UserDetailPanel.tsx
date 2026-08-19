import React from 'react';
import { createPortal } from 'react-dom';
import { User as UserIcon, ChevronRight, Mail, Hash, Activity, GraduationCap, Globe, Shield, Fingerprint, Settings2 } from 'lucide-react';
import type { ManagedUser } from '../../hooks/useUsersPage';
import { formatCarrera, formatNombre } from './utils';

interface UserDetailPanelProps {
    detailUser: ManagedUser | null;
    handleCloseDetail: () => void;
    isOverlayMouseDownRef: React.MutableRefObject<boolean>;
    setSelectedUser: (user: ManagedUser | null) => void;
}

export const UserDetailPanel: React.FC<UserDetailPanelProps> = ({
    detailUser,
    handleCloseDetail,
    isOverlayMouseDownRef,
    setSelectedUser
}) => {
    if (!detailUser) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        isOverlayMouseDownRef.current = true;
                    }
                }}
                onClick={(e) => {
                    if (e.target === e.currentTarget && isOverlayMouseDownRef.current) {
                        handleCloseDetail();
                    }
                    isOverlayMouseDownRef.current = false;
                }}
            />
            <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="icon-circle icon-circle-brand">
                            <UserIcon size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-main tracking-tight">{formatNombre(detailUser.nombre_completo)}</h3>
                            <p className="section-label text-text-dim">
                                {detailUser.type === 'DOCENTE' ? 'Docente Investigador' : detailUser.type === 'ESTUDIANTE' ? 'Estudiante' : 'Evaluador Externo'} — DIITRA
                            </p>
                        </div>
                    </div>
                    <button onClick={handleCloseDetail} className="text-text-dim hover:text-text-main transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bento-card static p-4">
                            <label className="section-label text-text-dim mb-2">
                                <Mail size={12} /> Correo Electrónico
                            </label>
                            <p className="text-sm font-bold text-text-main break-all">{detailUser.email}</p>
                        </div>
                        <div className="bento-card static p-4">
                            <label className="section-label text-text-dim mb-2">
                                <Hash size={12} /> Cédula / ID
                            </label>
                            <p className="text-sm font-bold text-text-main font-mono">{detailUser.id_profesor}</p>
                        </div>
                    </div>

                    {detailUser.type === 'DOCENTE' && (
                        <div className="bento-card static p-4 space-y-3">
                            <label className="section-label text-text-main">
                                <Activity size={12} /> Capacidades Docentes
                            </label>
                            <div className="divider-vercel !my-0" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="section-label text-text-dim mb-1">Horas Distributivo</p>
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-text-main">
                                        <span className={`w-1.5 h-1.5 rounded-full ${(detailUser.horas_investigacion || 0) > 0 ? 'bg-success' : 'bg-error'}`} />
                                        {detailUser.horas_investigacion || 0}h
                                    </div>
                                </div>
                                <div>
                                    <p className="section-label text-text-dim mb-1">Horas Asignadas</p>
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-text-main">
                                        <span className={`w-1.5 h-1.5 rounded-full ${(detailUser.horas_asignadas || 0) > 0 ? 'bg-info' : 'bg-text-dim/40'}`} />
                                        {detailUser.horas_asignadas || 0}h
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <p className="section-label text-text-dim mb-1">Horas Disponibles</p>
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-text-main">
                                        <span className={`w-1.5 h-1.5 rounded-full ${((detailUser.horas_investigacion || 0) - (detailUser.horas_asignadas || 0)) > 0 ? 'bg-success' : 'bg-error'}`} />
                                        {Math.max(0, (detailUser.horas_investigacion || 0) - (detailUser.horas_asignadas || 0))}h
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <p className="section-label text-text-dim mb-1">Carrera / Tecnología</p>
                                    <p className="text-sm font-bold text-text-main flex items-center gap-1.5">
                                        <GraduationCap size={14} className="text-text-dim" />
                                        {formatCarrera(detailUser.carrera)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {detailUser.type === 'ESTUDIANTE' && (
                        <div className="bento-card static p-4 space-y-3">
                            <label className="section-label text-text-main">
                                <GraduationCap size={12} /> Información Académica
                            </label>
                            <div className="divider-vercel !my-0" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="section-label text-text-dim mb-1">Carrera</p>
                                    <p className="text-sm font-bold text-text-main">{formatCarrera(detailUser.carrera)}</p>
                                </div>
                                <div>
                                    <p className="section-label text-text-dim mb-1">Nivel</p>
                                    <p className="text-sm font-bold text-text-main">{detailUser.nivel || 'Sin nivel'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {detailUser.type === 'EXTERNO' && (
                        <div className="bento-card static p-4 space-y-3">
                            <label className="section-label text-text-main">
                                <Globe size={12} /> Perfil Externo
                            </label>
                            <div className="divider-vercel !my-0" />
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="section-label text-text-dim">ORCID</span>
                                    <span className={`badge-vercel ${detailUser.orcid_id ? 'badge-vercel-success' : 'badge-vercel-error'}`}>
                                        {detailUser.orcid_id ? 'Verificado' : 'No registrado'}
                                    </span>
                                </div>
                                {detailUser.orcid_id && (
                                    <p className="text-xs font-mono text-text-dim break-all">{detailUser.orcid_id}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bento-card static p-4 space-y-3">
                        <label className="section-label text-text-main">
                            <Shield size={12} /> Permisos Asignados
                        </label>
                        <div className="divider-vercel !my-0" />
                        <div className="flex flex-wrap gap-2">
                            {detailUser.role_codes && detailUser.role_codes.length > 0 ? (
                                detailUser.role_codes.map(code => (
                                    <span key={code} className="text-xs font-semibold text-brand-light font-mono">
                                        {code}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm text-text-dim">Sin roles asignados</p>
                            )}
                        </div>
                    </div>

                    <div className="bento-card static p-4 space-y-3">
                        <label className="section-label text-text-main">
                            <Fingerprint size={12} /> Firma Electrónica
                        </label>
                        <div className="divider-vercel !my-0" />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-text-dim">Estado del Certificado</span>
                            <div className="flex items-center gap-2 text-xs font-medium text-text-main">
                                <span className={`dot ${detailUser.firma_habilitada ? 'dot-success' : 'dot-neutral'}`} />
                                {detailUser.firma_habilitada ? 'Habilitada' : 'No cargada'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={handleCloseDetail} className="btn-vercel-secondary">Cerrar</button>
                    <button
                        onClick={() => { setSelectedUser(detailUser); handleCloseDetail(); }}
                        className="btn-vercel-primary flex items-center gap-2"
                    >
                        <Settings2 size={14} /> Editar Perfil
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, FileText, Calendar, Award, RefreshCw, Trash } from 'lucide-react';
import api from '../../api/axios_config';
import { useAuth } from '../../api/AuthContext';
import { useConfirm } from '../../api/ConfirmContext';
import { useNotifications } from '../../api/NotificationsContext';

interface DeletedItem {
    uuid: string;
    titulo?: string;
    nombre?: string;
    codigoInstitucional?: string;
    codigoConvocatoria?: string;
    siglas?: string;
    estado: string;
    fechaEliminacion: string;
    eliminadoPor: string;
}

const RecycleBinPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const confirm = useConfirm();
    const { addToast } = useNotifications();
    const [activeTab, setActiveTab] = useState<'projects' | 'convocatorias' | 'groups'>('projects');
    const [items, setItems] = useState<DeletedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/recyclebin/${activeTab}`);
            setItems(response.data || []);
        } catch (error) {
            console.error(`Error fetching deleted ${activeTab}:`, error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [activeTab]);

    const handleRestore = async (uuid: string, title: string) => {
        const entityLabel = activeTab === 'projects' ? 'proyecto' : activeTab === 'convocatorias' ? 'convocatoria' : 'grupo';
        if (!await confirm({
            title: `Restaurar ${entityLabel === 'proyecto' ? 'Proyecto' : entityLabel === 'convocatoria' ? 'Convocatoria' : 'Grupo'}`,
            message: `¿Está seguro de restaurar el ${entityLabel} "${title}"?`,
            confirmText: "Restaurar",
            cancelText: "Cancelar",
            variant: "warning"
        })) return;

        try {
            setActionLoading(uuid);
            const type = activeTab === 'projects' ? 'project' : activeTab === 'convocatorias' ? 'convocatoria' : 'group';
            await api.post(`/recyclebin/restore/${type}/${uuid}`);
            setItems(items.filter(item => item.uuid !== uuid));
            addToast('Restauración Exitosa', `El ${entityLabel} "${title}" ha sido restaurado con éxito.`, 'success');
        } catch (error: any) {
            console.error('Error restoring item:', error);
            addToast('Error al Restaurar', error.response?.data?.message || 'No se pudo restaurar el elemento en este momento.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePurge = async (uuid: string, title: string) => {
        const entityLabel = activeTab === 'projects' ? 'proyecto' : activeTab === 'convocatorias' ? 'convocatoria' : 'grupo';
        const warningMessage = activeTab === 'projects'
            ? `¿Está seguro de ELIMINAR PERMANENTEMENTE el proyecto "${title}"? Esta acción es irreversible e incluye el presupuesto, cronograma, productos y todos los datos asociados.`
            : `¿Está seguro de ELIMINAR PERMANENTEMENTE la ${entityLabel} "${title}"? Esta acción no se puede deshacer de ninguna manera.`;

        if (!await confirm({
            title: "Eliminación Permanente",
            message: warningMessage,
            confirmText: "Eliminar Definitivamente",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;

        try {
            setActionLoading(uuid);
            const type = activeTab === 'projects' ? 'project' : activeTab === 'convocatorias' ? 'convocatoria' : 'group';
            await api.delete(`/recyclebin/purge/${type}/${uuid}`);
            setItems(items.filter(item => item.uuid !== uuid));
            addToast('Eliminado Definitivamente', `El ${entityLabel} "${title}" ha sido purgado permanentemente del sistema.`, 'success');
        } catch (error: any) {
            console.error('Error purging item:', error);
            addToast('Error al Eliminar', error.response?.data?.message || 'No se pudo eliminar el elemento de forma permanente.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-EC', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const tabs = [
        { id: 'projects', name: 'Proyectos', icon: FileText, roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE'] },
        { id: 'convocatorias', name: 'Convocatorias', icon: Calendar, roles: ['DIITRA_ADMIN'] },
        { id: 'groups', name: 'Grupos de Investigación', icon: Award, roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE'] }
    ].filter(tab => tab.roles.includes('DIITRA_ADMIN') || !tab.roles.includes('DIITRA_ADMIN') || (tab.roles.includes('DIITRA_DOCENTE') && !isAdmin));

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-5">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-main flex items-center gap-2">
                        <Trash2 className="text-text-main" size={24} />
                        Papelera de Reciclaje
                    </h1>
                    <p className="text-sm text-text-dim mt-1">
                        Restaura elementos eliminados temporalmente o elimínalos de forma permanente de la base de datos.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-black/5 dark:border-white/5">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all cursor-pointer ${
                                isActive
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-text-dim hover:text-text-main hover:border-black/10 dark:hover:border-white/10'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.name}
                        </button>
                    );
                })}
            </div>

            {/* Content list */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <RefreshCw size={32} className="animate-spin text-red-600" />
                    <span className="text-sm text-text-dim font-medium">Cargando elementos...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-black/10 dark:border-white/10 rounded-xl bg-surface/30">
                    <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-dim/60 mb-3">
                        <Trash size={22} />
                    </div>
                    <h3 className="text-base font-semibold text-text-main">La papelera está vacía</h3>
                    <p className="text-sm text-text-dim mt-1 text-center max-w-sm">
                        No hay {activeTab === 'projects' ? 'proyectos' : activeTab === 'convocatorias' ? 'convocatorias' : 'grupos'} eliminados en este momento.
                    </p>
                </div>
            ) : (
                <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-surface">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-black/5 dark:border-white/5 bg-black/2 dark:bg-white/2 text-[12px] font-semibold text-text-dim uppercase tracking-wider">
                                    <th className="px-6 py-4">Título / Nombre</th>
                                    <th className="px-6 py-4">Código / Estado</th>
                                    <th className="px-6 py-4">Fecha de Eliminación</th>
                                    <th className="px-6 py-4">Eliminado Por</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm text-text-main">
                                {items.map((item) => {
                                    const title = item.titulo || item.nombre || 'Sin título';
                                    const code = item.codigoInstitucional || item.codigoConvocatoria || item.siglas || '-';
                                    const isPendingAction = actionLoading === item.uuid;

                                    return (
                                        <tr key={item.uuid} className="hover:bg-black/1 dark:hover:bg-white/1 transition-colors">
                                            <td className="px-6 py-4 font-medium max-w-md">
                                                <div className="truncate" title={title}>{title}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-mono text-xs text-text-dim">{code}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 w-fit font-medium">
                                                        {item.estado}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-text-dim text-xs">
                                                {formatDate(item.fechaEliminacion)}
                                            </td>
                                            <td className="px-6 py-4 text-text-dim text-xs">
                                                {item.eliminadoPor}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleRestore(item.uuid, title)}
                                                        disabled={isPendingAction}
                                                        className="p-2 text-text-main hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                                        title="Restaurar"
                                                    >
                                                        <RotateCcw size={16} className={isPendingAction ? 'animate-spin' : ''} />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePurge(item.uuid, title)}
                                                        disabled={isPendingAction}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                                        title="Eliminar permanentemente"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </main>
    );
};

export default RecycleBinPage;

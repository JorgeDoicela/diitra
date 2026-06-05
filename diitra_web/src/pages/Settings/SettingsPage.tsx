import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Key, UploadCloud, FileText, CheckCircle2, AlertCircle, Calendar, Info, Lock, FileSignature, Loader2 } from 'lucide-react';
import api from '../../api/axios_config';
import { useAuth } from '../../api/AuthContext';
import { useNotifications } from '../../api/NotificationsContext';
import { useConfirm } from '../../api/ConfirmContext';

interface PerfilData {
    orcid_id?: string;
    scopus_id?: string;
    google_scholar_url?: string;
    research_gate_url?: string;
    especialidad?: string;
    grado_academico_maximo?: string;
    acepto_terminos_firma: boolean;
    fecha_consentimiento_firma?: string;
    has_p12_certificate: boolean;
}

interface ArcoRequest {
    id_solicitud_arco: number;
    uuid: string;
    id_usuario: number;
    nombre_usuario: string;
    tipo_solicitud: string;
    detalle_solicitud: string;
    fecha_solicitud: string;
    fecha_limite_resolucion: string;
    estado: string;
    resolucion_detalle?: string;
    fecha_resolucion?: string;
    documento_resolucion_path?: string;
}

const SettingsPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const { addToast } = useNotifications();
    const confirm = useConfirm();

    const [activeTab, setActiveTab] = useState<'profile' | 'arco' | 'admin_arco'>('profile');
    const [profile, setProfile] = useState<PerfilData>({
        orcid_id: '',
        scopus_id: '',
        google_scholar_url: '',
        research_gate_url: '',
        especialidad: '',
        grado_academico_maximo: '',
        acepto_terminos_firma: false,
        has_p12_certificate: false
    });

    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingConsent, setIsSavingConsent] = useState(false);

    // Firma electrónica state
    const [p12File, setP12File] = useState<File | null>(null);
    const [p12Password, setP12Password] = useState('');
    const [isUploadingFirma, setIsUploadingFirma] = useState(false);

    // ARCO State
    const [arcoRequests, setArcoRequests] = useState<ArcoRequest[]>([]);
    const [isLoadingArco, setIsLoadingArco] = useState(false);
    const [newArcoType, setNewArcoType] = useState('Acceso');
    const [newArcoDetail, setNewArcoDetail] = useState('');
    const [isSubmittingArco, setIsSubmittingArco] = useState(false);

    // Admin ARCO State
    const [allArcoRequests, setAllArcoRequests] = useState<ArcoRequest[]>([]);
    const [isLoadingAllArco, setIsLoadingAllArco] = useState(false);
    const [selectedArco, setSelectedArco] = useState<ArcoRequest | null>(null);
    const [resolutionText, setResolutionText] = useState('');
    const [resolutionStatus, setResolutionStatus] = useState('Aprobado');
    const [isResolvingArco, setIsResolvingArco] = useState(false);

    // Consentimientos State
    interface ConsentimientoData {
        id_consentimiento: number;
        uuid: string;
        id_usuario: number;
        nombre_usuario: string;
        version_politica: string;
        canal: string;
        fecha_consentimiento: string;
        ip_direccion?: string;
        user_agent?: string;
        estado: string;
    }
    const [consents, setConsents] = useState<ConsentimientoData[]>([]);
    const [isLoadingConsents, setIsLoadingConsents] = useState(false);
    const [adminSubTab, setAdminSubTab] = useState<'arco' | 'consents'>('arco');

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'arco') {
            fetchArcoRequests();
        } else if (activeTab === 'admin_arco' && isAdmin) {
            if (adminSubTab === 'arco') {
                fetchAllArcoRequests();
            } else if (adminSubTab === 'consents') {
                fetchConsents();
            }
        }
    }, [activeTab, adminSubTab]);

    const fetchProfile = async () => {
        setIsLoadingProfile(true);
        try {
            const res = await api.get('/lopdp/perfil');
            setProfile(res.data);
        } catch (err) {
            console.error('Error fetching profile:', err);
            addToast('Error', 'No se pudo cargar el perfil científico.', 'error');
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            await api.put('/lopdp/perfil', {
                orcid_id: profile.orcid_id,
                scopus_id: profile.scopus_id,
                google_scholar_url: profile.google_scholar_url,
                research_gate_url: profile.research_gate_url,
                especialidad: profile.especialidad,
                grado_academico_maximo: profile.grado_academico_maximo
            });
            addToast('Perfil Guardado', 'Los datos científicos se actualizaron correctamente.', 'success');
        } catch (err) {
            console.error('Error updating profile:', err);
            addToast('Error', 'No se pudo guardar la información del perfil.', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleConsentToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        if (!checked) {
            if (!await confirm({
                title: 'Revocar Consentimiento',
                message: '¿Está seguro de revocar el consentimiento de firma? No podrá realizar firmas electrónicas en DIITRA hasta otorgarlo nuevamente.',
                confirmText: 'Revocar',
                cancelText: 'Cancelar',
                variant: 'destructive'
            })) {
                return;
            }
        }

        setIsSavingConsent(true);
        try {
            await api.post('/lopdp/consentimiento', {
                version_politica: 'FIRMA_ELECTRONICA'
            });
            setProfile(prev => ({
                ...prev,
                acepto_terminos_firma: checked,
                fecha_consentimiento_firma: checked ? new Date().toISOString() : undefined
            }));
            addToast(
                checked ? 'Consentimiento Otorgado' : 'Consentimiento Revocado',
                checked ? 'Ha aceptado los términos para el uso de firma electrónica.' : 'Ha revocado su consentimiento.',
                checked ? 'success' : 'warning'
            );
        } catch (err) {
            console.error('Error logging consent:', err);
            addToast('Error', 'No se pudo actualizar el estado de consentimiento.', 'error');
        } finally {
            setIsSavingConsent(false);
        }
    };

    const handleFirmaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!p12File) {
            addToast('Validación', 'Seleccione un archivo de firma digital (.p12).', 'warning');
            return;
        }
        if (!p12Password) {
            addToast('Validación', 'Ingrese la contraseña del certificado.', 'warning');
            return;
        }

        setIsUploadingFirma(true);
        const formData = new FormData();
        formData.append('file', p12File);
        formData.append('password', p12Password);

        try {
            const res = await api.post('/lopdp/perfil/firma', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            addToast('Certificado Guardado', res.data.message || 'Firma configurada exitosamente.', 'success');
            setP12File(null);
            setP12Password('');
            setProfile(prev => ({ ...prev, has_p12_certificate: true }));
        } catch (err: any) {
            console.error('Error uploading signature:', err);
            const errMsg = err.response?.data?.error || 'No se pudo validar o guardar la firma.';
            addToast('Error de Firma', errMsg, 'error');
        } finally {
            setIsUploadingFirma(false);
        }
    };

    const fetchArcoRequests = async () => {
        setIsLoadingArco(true);
        try {
            const res = await api.get('/lopdp/arco/mis-solicitudes');
            setArcoRequests(res.data);
        } catch (err) {
            console.error('Error fetching ARCO requests:', err);
        } finally {
            setIsLoadingArco(false);
        }
    };

    const handleCreateArco = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newArcoDetail.trim()) {
            addToast('Validación', 'El detalle de la solicitud es requerido.', 'warning');
            return;
        }

        setIsSubmittingArco(true);
        try {
            const res = await api.post('/lopdp/arco', {
                tipo_solicitud: newArcoType,
                detalle_solicitud: newArcoDetail
            });
            addToast('Solicitud Enviada', res.data.message || 'Solicitud ARCO registrada.', 'success');
            setNewArcoDetail('');
            fetchArcoRequests();
        } catch (err: any) {
            console.error('Error creating ARCO:', err);
            addToast('Error', 'No se pudo registrar la solicitud ARCO.', 'error');
        } finally {
            setIsSubmittingArco(false);
        }
    };

    const fetchAllArcoRequests = async () => {
        setIsLoadingAllArco(true);
        try {
            const res = await api.get('/lopdp/arco/todas');
            setAllArcoRequests(res.data);
        } catch (err) {
            console.error('Error fetching all ARCO requests:', err);
        } finally {
            setIsLoadingAllArco(false);
        }
    };

    const fetchConsents = async () => {
        setIsLoadingConsents(true);
        try {
            const res = await api.get('/lopdp/consentimientos');
            setConsents(res.data);
        } catch (err) {
            console.error('Error fetching consents:', err);
            addToast('Error', 'No se pudieron cargar los consentimientos.', 'error');
        } finally {
            setIsLoadingConsents(false);
        }
    };

    const handleResolveArco = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedArco) return;
        if (!resolutionText.trim()) {
            addToast('Validación', 'La resolución es requerida.', 'warning');
            return;
        }

        setIsResolvingArco(true);
        try {
            await api.post('/lopdp/arco/resolver', {
                id_solicitud_arco: selectedArco.id_solicitud_arco,
                resolucion_detalle: resolutionText,
                estado: resolutionStatus
            });
            addToast('Resolución Guardada', 'La solicitud ARCO ha sido respondida.', 'success');
            setSelectedArco(null);
            setResolutionText('');
            fetchAllArcoRequests();
        } catch (err) {
            console.error('Error resolving ARCO:', err);
            addToast('Error', 'No se pudo guardar la resolución.', 'error');
        } finally {
            setIsResolvingArco(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Aprobado':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'Rechazado':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
            case 'En_Analisis':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            default:
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        }
    };

    return (
        <div className="p-4 md:p-10 space-y-8 animate-fade-up">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">
                    <ShieldCheck size={12} className="text-brand" />
                    <span>LOPDP · Ecuador</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Mi Cuenta y Privacidad</h1>
                <p className="text-xs md:text-sm text-text-dim max-w-xl leading-relaxed">
                    Administre sus credenciales, perfil de investigación, términos de firma digital y ejerza sus derechos de protección de datos (ARCO) según la normativa ecuatoriana.
                </p>
            </header>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border-thin gap-1">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'profile' ? 'border-brand text-text-main' : 'border-transparent text-text-dim hover:text-text-main'}`}
                >
                    Perfil y Firma
                </button>
                <button
                    onClick={() => setActiveTab('arco')}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'arco' ? 'border-brand text-text-main' : 'border-transparent text-text-dim hover:text-text-main'}`}
                >
                    Derechos ARCO
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('admin_arco')}
                        className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'admin_arco' ? 'border-brand text-text-main' : 'border-transparent text-text-dim hover:text-text-main'}`}
                    >
                        Panel LOPDP (Admin)
                    </button>
                )}
            </div>

            {/* Tab Contents */}
            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Metadata form */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSaveProfile} className="bento-card static p-6 space-y-6">
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                                <User size={16} />
                                Perfil Científico
                            </h2>

                            {isLoadingProfile ? (
                                <div className="py-12 flex justify-center">
                                    <Loader2 className="animate-spin text-brand" size={24} />
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Especialidad Científica</label>
                                            <input
                                                type="text"
                                                className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                                placeholder="Ej. Inteligencia Artificial, Biotecnología"
                                                value={profile.especialidad || ''}
                                                onChange={e => setProfile(prev => ({ ...prev, especialidad: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Máximo Grado Académico</label>
                                            <input
                                                type="text"
                                                className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                                placeholder="Ej. PhD en Ciencias de la Computación"
                                                value={profile.grado_academico_maximo || ''}
                                                onChange={e => setProfile(prev => ({ ...prev, grado_academico_maximo: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">ORCID ID</label>
                                            <input
                                                type="text"
                                                className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand font-mono"
                                                placeholder="0000-0000-0000-0000"
                                                value={profile.orcid_id || ''}
                                                onChange={e => setProfile(prev => ({ ...prev, orcid_id: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Scopus Author ID</label>
                                            <input
                                                type="text"
                                                className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand font-mono"
                                                placeholder="Ej. 57218320492"
                                                value={profile.scopus_id || ''}
                                                onChange={e => setProfile(prev => ({ ...prev, scopus_id: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Google Scholar URL</label>
                                            <input
                                                type="url"
                                                className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                                placeholder="https://scholar.google.com/citations?user=..."
                                                value={profile.google_scholar_url || ''}
                                                onChange={e => setProfile(prev => ({ ...prev, google_scholar_url: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">ResearchGate URL</label>
                                            <input
                                                type="url"
                                                className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                                placeholder="https://www.researchgate.net/profile/..."
                                                value={profile.research_gate_url || ''}
                                                onChange={e => setProfile(prev => ({ ...prev, research_gate_url: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSavingProfile}
                                            className="btn-vercel-primary text-xs"
                                        >
                                            {isSavingProfile && <Loader2 className="animate-spin mr-1.5" size={14} />}
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>

                    {/* Right: Signature settings & Consent */}
                    <div className="space-y-6">
                        <div className="bento-card static p-6 space-y-6">
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                                <Key size={16} />
                                Firma Electrónica
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-3 bg-surface border border-border-thin rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="termsConsent"
                                        className="mt-1"
                                        checked={profile.acepto_terminos_firma}
                                        disabled={isSavingConsent}
                                        onChange={handleConsentToggle}
                                    />
                                    <label htmlFor="termsConsent" className="text-xs text-text-dim leading-relaxed cursor-pointer select-none">
                                        Acepto los términos de la **Ley Orgánica de Protección de Datos Personales (LOPDP)** y autorizo a DIITRA a custodiar mi firma cifrada para uso exclusivo de documentos académicos.
                                    </label>
                                </div>

                                {profile.acepto_terminos_firma && profile.fecha_consentimiento_firma && (
                                    <div className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                                        <CheckCircle2 size={12} />
                                        Consentimiento otorgado el {new Date(profile.fecha_consentimiento_firma).toLocaleDateString()}
                                    </div>
                                )}

                                <hr className="border-border-thin" />

                                {profile.has_p12_certificate ? (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                        <FileSignature className="text-emerald-500" size={24} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-semibold text-text-main">Certificado Guardado</h3>
                                            <p className="text-[10px] text-text-dim mt-0.5">La contraseña se encuentra cifrada bajo AES-256 en BD.</p>
                                        </div>
                                        <CheckCircle2 className="text-emerald-500" size={16} />
                                    </div>
                                ) : (
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                                        <AlertCircle className="text-amber-500" size={24} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-semibold text-text-main">Sin Firma Registrada</h3>
                                            <p className="text-[10px] text-text-dim mt-0.5">Deberá cargar su certificado .p12 cada vez que desee firmar.</p>
                                        </div>
                                    </div>
                                )}

                                {profile.acepto_terminos_firma && (
                                    <form onSubmit={handleFirmaSubmit} className="space-y-4 pt-2">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Subir Certificado (.p12 / .pfx)</label>
                                            <div className="flex items-center justify-center border border-dashed border-border-thin rounded-lg p-4 bg-surface hover:border-brand/40 transition-colors cursor-pointer relative">
                                                <input
                                                    type="file"
                                                    accept=".p12,.pfx"
                                                    onChange={e => setP12File(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                <div className="text-center space-y-1">
                                                    <UploadCloud className="mx-auto text-text-dim" size={20} />
                                                    <p className="text-xs font-semibold text-text-main">{p12File ? p12File.name : 'Seleccionar Archivo'}</p>
                                                    <p className="text-[10px] text-text-dim">Formatos válidos: PKCS#12 (.p12, .pfx)</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Contraseña del Certificado</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    required
                                                    className="w-full bg-surface border border-border-thin rounded-lg pl-3 pr-8 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                                    placeholder="Contraseña del certificado"
                                                    value={p12Password}
                                                    onChange={e => setP12Password(e.target.value)}
                                                />
                                                <Lock className="absolute right-2.5 top-2.5 text-text-dim" size={14} />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isUploadingFirma}
                                            className="btn-vercel-primary text-xs w-full justify-center"
                                        >
                                            {isUploadingFirma && <Loader2 className="animate-spin mr-1.5" size={14} />}
                                            Guardar y Habilitar Firma
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'arco' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form to submit ARCO */}
                    <div className="bento-card static p-6 space-y-6">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                            <ShieldCheck size={16} />
                            Nueva Solicitud ARCO
                        </h2>

                        <form onSubmit={handleCreateArco} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Tipo de Derecho</label>
                                <select
                                    className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                    value={newArcoType}
                                    onChange={e => setNewArcoType(e.target.value)}
                                >
                                    <option value="Acceso">Acceso (Ver qué datos se guardan)</option>
                                    <option value="Rectificacion">Rectificación (Corregir datos incorrectos)</option>
                                    <option value="Eliminacion">Eliminación (Borrar datos personales)</option>
                                    <option value="Oposicion">Oposición (Oponerse al tratamiento de datos)</option>
                                    <option value="Portabilidad">Portabilidad (Trasladar datos a otra entidad)</option>
                                    <option value="Limitacion">Limitación (Limitar el tratamiento temporalmente)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Detalle y Justificación de la Solicitud</label>
                                <textarea
                                    rows={5}
                                    required
                                    className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                    placeholder="Detalle de forma clara qué datos desea consultar, corregir o eliminar, y el motivo de su solicitud."
                                    value={newArcoDetail}
                                    onChange={e => setNewArcoDetail(e.target.value)}
                                />
                            </div>

                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-2">
                                <Info className="text-amber-500 shrink-0" size={14} />
                                <p className="text-[10px] text-text-dim leading-normal">
                                    **Nota:** Por ley (LOPDP), la institución cuenta con un plazo máximo de **15 días** laborables para dar resolución legal a su solicitud.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingArco}
                                className="btn-vercel-primary text-xs w-full justify-center"
                            >
                                {isSubmittingArco && <Loader2 className="animate-spin mr-1.5" size={14} />}
                                Registrar Solicitud
                            </button>
                        </form>
                    </div>

                    {/* List of requests */}
                    <div className="lg:col-span-2 bento-card static p-6 space-y-6">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                            <FileText size={16} />
                            Historial de Solicitudes ARCO
                        </h2>

                        {isLoadingArco ? (
                            <div className="py-12 flex justify-center">
                                <Loader2 className="animate-spin text-brand" size={24} />
                            </div>
                        ) : arcoRequests.length === 0 ? (
                            <div className="py-16 text-center text-text-dim space-y-2">
                                <ShieldCheck className="mx-auto opacity-20" size={32} />
                                <p className="text-xs uppercase font-semibold tracking-widest">No ha presentado solicitudes</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {arcoRequests.map(req => (
                                    <div key={req.id_solicitud_arco} className="p-4 bg-surface border border-border-thin rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-text-main">Derecho de {req.tipo_solicitud}</span>
                                                <span className="text-[10px] font-mono text-text-dim">· {req.uuid.substring(0, 8)}</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${getStatusStyle(req.estado)}`}>
                                                {req.estado.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <p className="text-xs text-text-dim leading-relaxed">{req.detalle_solicitud}</p>

                                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-thin/40 text-[10px] text-text-dim font-medium">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                <span>Solicitado: {new Date(req.fecha_solicitud).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} className="text-amber-500" />
                                                <span>Límite de Respuesta: {req.fecha_limite_resolucion}</span>
                                            </div>
                                        </div>

                                        {req.resolucion_detalle && (
                                            <div className="p-3 bg-surface-hover/50 border border-border-thin rounded-lg space-y-1">
                                                <h4 className="text-[10px] font-semibold text-text-main uppercase tracking-wider flex items-center gap-1">
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                    Resolución Institucional
                                                </h4>
                                                <p className="text-xs text-text-dim leading-relaxed">{req.resolucion_detalle}</p>
                                                {req.fecha_resolucion && (
                                                    <span className="block text-[9px] text-text-dim mt-1 font-mono">
                                                        Dictaminado el {new Date(req.fecha_resolucion).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'admin_arco' && isAdmin && (
                <div className="space-y-6">
                    {/* Sub-tabs to choose between ARCO requests and Consents log */}
                    <div className="flex border-b border-border-thin gap-1">
                        <button
                            onClick={() => setAdminSubTab('arco')}
                            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${adminSubTab === 'arco' ? 'border-brand text-text-main' : 'border-transparent text-text-dim hover:text-text-main'}`}
                        >
                            Peticiones ARCO
                        </button>
                        <button
                            onClick={() => setAdminSubTab('consents')}
                            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${adminSubTab === 'consents' ? 'border-brand text-text-main' : 'border-transparent text-text-dim hover:text-text-main'}`}
                        >
                            Consentimientos Registrados
                        </button>
                    </div>

                    {adminSubTab === 'arco' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Request selector & list */}
                            <div className="lg:col-span-2 bento-card static p-6 space-y-6">
                                <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                                    <FileText size={16} />
                                    Peticiones ARCO Pendientes del Instituto
                                </h2>

                                {isLoadingAllArco ? (
                                    <div className="py-12 flex justify-center">
                                        <Loader2 className="animate-spin text-brand" size={24} />
                                    </div>
                                ) : allArcoRequests.length === 0 ? (
                                    <div className="py-16 text-center text-text-dim space-y-2">
                                        <CheckCircle2 className="mx-auto opacity-20 text-emerald-500" size={32} />
                                        <p className="text-xs uppercase font-semibold tracking-widest">Sin solicitudes pendientes</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {allArcoRequests.map(req => (
                                            <div
                                                key={req.id_solicitud_arco}
                                                onClick={() => setSelectedArco(req)}
                                                className={`p-4 bg-surface border rounded-xl space-y-2 cursor-pointer transition-all hover:border-brand/40 ${selectedArco?.id_solicitud_arco === req.id_solicitud_arco ? 'border-brand ring-1 ring-brand' : 'border-border-thin'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-text-main">{req.nombre_usuario}</span>
                                                            <span className="text-[10px] text-text-dim">({req.tipo_solicitud})</span>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${getStatusStyle(req.estado)}`}>
                                                        {req.estado.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-text-dim leading-relaxed line-clamp-2">{req.detalle_solicitud}</p>
                                                <div className="flex items-center gap-4 text-[9px] text-text-dim font-mono">
                                                    <span>SLA Límite: {req.fecha_limite_resolucion}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Resolution Form */}
                            <div className="bento-card static p-6 space-y-6">
                                <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                                    <Lock size={16} />
                                    Resolución LOPDP
                                </h2>

                                {selectedArco ? (
                                    <form onSubmit={handleResolveArco} className="space-y-4">
                                        <div className="p-3 bg-surface border border-border-thin rounded-lg space-y-2">
                                            <div className="text-[10px] text-text-dim uppercase font-semibold tracking-wider">Solicitud Seleccionada</div>
                                            <div className="text-xs font-semibold text-text-main">{selectedArco.nombre_usuario}</div>
                                            <div className="text-xs text-text-dim font-semibold">Derecho de {selectedArco.tipo_solicitud}</div>
                                            <p className="text-xs text-text-dim italic leading-normal">"{selectedArco.detalle_solicitud}"</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Dictamen Legal / Respuesta</label>
                                            <textarea
                                                rows={4}
                                                required
                                                className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                                placeholder="Ingrese el detalle legal de la resolución para responder al titular..."
                                                value={resolutionText}
                                                onChange={e => setResolutionText(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Resolución</label>
                                            <select
                                                className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                                value={resolutionStatus}
                                                onChange={e => setResolutionStatus(e.target.value)}
                                            >
                                                <option value="Aprobado">Aprobado (Otorga la petición)</option>
                                                <option value="Rechazado">Rechazado (Niega la petición con justificación legal)</option>
                                                <option value="En_Analisis">En Análisis (Extender plazo)</option>
                                            </select>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedArco(null)}
                                                className="btn-vercel-secondary text-xs flex-1 justify-center"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isResolvingArco}
                                                className="btn-vercel-primary text-xs flex-1 justify-center"
                                            >
                                                {isResolvingArco && <Loader2 className="animate-spin mr-1.5" size={14} />}
                                                Guardar
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="py-16 text-center text-text-dim text-xs font-semibold">
                                        Seleccione una solicitud de la lista para resolverla.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bento-card static p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                                    <ShieldCheck size={16} />
                                    Registro de Consentimientos LOPDP
                                </h2>
                                <span className="text-xs text-text-dim font-medium bg-surface px-3 py-1 rounded-full border border-border-thin">
                                    Total: {consents.length}
                                </span>
                            </div>

                            {isLoadingConsents ? (
                                <div className="py-12 flex justify-center">
                                    <Loader2 className="animate-spin text-brand" size={24} />
                                </div>
                            ) : consents.length === 0 ? (
                                <div className="py-16 text-center text-text-dim space-y-2">
                                    <ShieldCheck className="mx-auto opacity-20" size={32} />
                                    <p className="text-xs uppercase font-semibold tracking-widest">No hay consentimientos registrados</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border-thin text-[10px] font-semibold uppercase tracking-wider text-text-dim">
                                                <th className="py-3 px-4">Usuario</th>
                                                <th className="py-3 px-4">Política / Versión</th>
                                                <th className="py-3 px-4">Canal</th>
                                                <th className="py-3 px-4">Fecha</th>
                                                <th className="py-3 px-4">Dirección IP</th>
                                                <th className="py-3 px-4">User Agent</th>
                                                <th className="py-3 px-4 text-right">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-thin/40 text-xs">
                                            {consents.map(consent => (
                                                <tr key={consent.id_consentimiento} className="hover:bg-surface-hover/30 transition-colors">
                                                    <td className="py-3.5 px-4 font-semibold text-text-main">
                                                        {consent.nombre_usuario}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className="font-mono text-[11px] bg-surface-hover/50 px-2 py-0.5 rounded border border-border-thin">
                                                            {consent.version_politica}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-text-dim">{consent.canal}</td>
                                                    <td className="py-3.5 px-4 text-text-dim font-mono text-[11px]">
                                                        {new Date(consent.fecha_consentimiento).toLocaleString()}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-text-dim font-mono text-[11px]">
                                                        {consent.ip_direccion || 'N/D'}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-text-dim max-w-xs truncate" title={consent.user_agent}>
                                                        {consent.user_agent || 'N/D'}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${consent.estado === 'Otorgado' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
                                                            {consent.estado}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SettingsPage;

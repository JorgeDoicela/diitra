import React, { useState, useRef } from 'react';
import { ShieldCheck, LogOut, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import api from '../../api/axios_config';
import { useAuth } from '../../api/AuthContext';
import { useNotifications } from '../../api/NotificationsContext';

const LopdpConsentPage: React.FC = () => {
    const { logout, refreshUser, user } = useAuth();
    const { addToast } = useNotifications();

    const [hasRead, setHasRead] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Check if scrolled close to the bottom (within 10 pixels tolerance)
        const isBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
        if (isBottom) {
            setHasRead(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasRead || !accepted) return;

        setIsSubmitting(true);
        try {
            // Se registran ambos consentimientos en paralelo para la auditoría forense LOPDP
            await Promise.all([
                api.post('/lopdp/consentimiento', { version_politica: 'LOPDP_GENERAL' }),
                api.post('/lopdp/consentimiento', { version_politica: 'FIRMA_ELECTRONICA' })
            ]);
            addToast('Consentimientos Registrados', 'Ha aceptado la política de tratamiento de datos y los términos de uso de firma electrónica.', 'success');
            // Refresh user state so the guard lets the user proceed
            await refreshUser();
        } catch (err) {
            console.error('Error submitting LOPDP consent:', err);
            addToast('Error', 'No se pudo registrar su consentimiento. Intente nuevamente.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-4 md:p-6 vercel-grid-fade bg-glow">
            <div className="w-full max-w-xl bento-card static p-6 md:p-8 space-y-6 shadow-sm border border-border-thin rounded-lg animate-scale-up">
                
                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="text-text-main mb-1">
                        <ShieldCheck size={32} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-main">
                        Protección de Datos Personales (LOPDP)
                    </h1>
                    <p className="text-xs md:text-sm text-text-dim max-w-md">
                        Hola, <span className="font-semibold text-text-main">{user?.nombre_completo}</span>. Para poder ingresar a DIITRA, es necesario que leas y aceptes los términos de tratamiento de tus datos personales.
                    </p>
                </div>

                {/* Policy terms scroll container */}
                <div 
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="border border-border-thin bg-bg-deep/40 rounded-lg p-4 h-64 overflow-y-auto custom-scrollbar text-[11px] text-text-dim space-y-4 leading-relaxed"
                >
                    <h3 className="font-bold text-text-main text-center uppercase tracking-wider text-[10px] mb-2">
                        TÉRMINOS DE CONSENTIMIENTO Y POLÍTICA DE PROTECCIÓN DE DATOS PERSONALES
                    </h3>
                    <p className="text-center font-semibold text-text-main text-[9px]">
                        DIITRA — SISTEMA DE GESTIÓN DE INVESTIGACIÓN E INNOVACIÓN (ECUADOR)
                    </p>

                    <p>
                        <strong>1. OBJETO Y ALCANCE:</strong><br />
                        El presente documento regula el tratamiento de los datos personales proporcionados por los docentes, estudiantes, revisores y personal administrativo en la plataforma DIITRA. De conformidad con lo dispuesto en la Ley Orgánica de Protección de Datos Personales (LOPDP) de la República del Ecuador, garantizamos la confidencialidad, seguridad e integridad de su información.
                    </p>

                    <p>
                        <strong>2. FINALIDADES DEL TRATAMIENTO:</strong><br />
                        Sus datos personales serán tratados exclusivamente para las siguientes finalidades institucionales y académicas:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Gestión, evaluación, monitoreo y archivo de proyectos de investigación científica, desarrollo experimental y transferencia tecnológica.</li>
                        <li>Registro y acreditación de la producción científica ante los organismos de control de la educación superior (SENESCYT, CACES).</li>
                        <li>Habilitación y uso temporal de firmas electrónicas (sin almacenamiento ni custodia del certificado en el servidor) para la suscripción de actas de acreditación y reportes de avance.</li>
                        <li>Procesos de revisión por pares ciegos (evaluadores internos y externos).</li>
                        <li>Envío de notificaciones críticas de la plataforma y alertas sobre hitos y fechas límite.</li>
                    </ul>

                    <p>
                        <strong>3. DATOS OBJETO DE TRATAMIENTO:</strong><br />
                        DIITRA recopila y procesa los siguientes datos:
                        Datos de identificación y contacto (nombres completos, cédula/pasaporte, correo institucional).
                        Datos académicos e investigadores (grados académicos, especialidades, ORCID ID, Scopus Author ID, Google Scholar URL, ResearchGate URL).
                        Datos técnicos de seguridad y de auditoría (dirección IP, navegador y dispositivo, fecha y hora de acceso, firmas electrónicas y códigos de verificación del consentimiento).
                    </p>

                    <p>
                        <strong>4. SEGURIDAD Y PRIVACIDAD DE LA FIRMA:</strong><br />
                        Los datos personales son custodiados utilizando altos estándares de seguridad informática. El certificado digital (.p12) y su contraseña ingresados para la firma electrónica se procesan de forma temporal en la memoria del servidor durante la firma y <strong>nunca se almacenan</strong> en bases de datos o discos del sistema.
                    </p>

                    <p className="border-t border-border-thin/50 pt-3 text-center text-[10px] font-semibold text-text-main">
                        --- FIN DEL DOCUMENTO ---
                    </p>
                </div>

                {/* Instructions helper */}
                {!hasRead && (
                    <p className="text-[10px] text-center text-text-dim/70 font-normal">
                        * La habilitación de la conformidad requiere completar la revisión íntegra de las condiciones descritas.
                    </p>
                )}

                {/* Checkbox Acceptance */}
                <div className={`flex items-start gap-3 p-3 bg-surface border rounded-lg transition-all duration-300 ${hasRead ? 'border-border-thin opacity-100' : 'border-border-thin/40 opacity-50'}`}>
                    <input
                        type="checkbox"
                        id="lopdpAcceptanceCheckbox"
                        disabled={!hasRead}
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                        className="mt-1 h-3.5 w-3.5 rounded border-border-thin text-accent-vercel focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <label 
                        htmlFor="lopdpAcceptanceCheckbox"
                        className={`text-[11px] leading-relaxed select-none ${hasRead ? 'text-text-main cursor-pointer' : 'text-text-dim cursor-not-allowed'}`}
                    >
                        Declaro que he leído atentamente y otorgo mi consentimiento libre, específico, informado e inequívoco para el tratamiento de mis datos personales y autorizo el procesamiento temporal de mi firma electrónica en DIITRA según los términos descritos.
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                        type="button"
                        onClick={logout}
                        className="btn-vercel-secondary sm:w-1/3 order-2 sm:order-1"
                    >
                        <LogOut size={12} />
                        Cerrar Sesión
                    </button>
                    
                    <button
                        type="button"
                        disabled={!hasRead || !accepted || isSubmitting}
                        onClick={handleSubmit}
                        className="btn-vercel-primary flex-1 order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={12} />
                                Registrando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={12} />
                                Aceptar y Continuar
                                <ArrowRight size={12} />
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default LopdpConsentPage;

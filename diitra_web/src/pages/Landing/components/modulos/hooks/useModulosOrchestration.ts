import { useState, useEffect, useRef } from 'react';
import {
    FileSignature,
    Clock,
    Cpu,
    ShieldCheck,
    Key,
    type LucideIcon
} from 'lucide-react';

export interface ModuleItem {
    id: number;
    title: string;
    subtitle: string;
    icon: LucideIcon;
    desc: string;
}

export interface CommitItem {
    hash: string;
    msg: string;
    time: string;
}

export interface HitoItem {
    id: number;
    name: string;
    completed: boolean;
}

export interface BudgetToggles {
    equipos: boolean;
    materiales: boolean;
    vinculacion: boolean;
}

export const useModulosOrchestration = () => {
    // Estado del selector de módulos interactivo
    const [activeModule, setActiveModule] = useState<number | null>(null);
    const [showDetail, setShowDetail] = useState<boolean>(false);

    // Estados para simulación de exportación CACES y notificaciones Toast
    const [exportState, setExportState] = useState<'idle' | 'loading' | 'success'>('idle');
    const [showToast, setShowToast] = useState<boolean>(false);
    const [cacesProgress, setCacesProgress] = useState({ id: 0, vinc: 0, prop: 0 });

    useEffect(() => {
        if (activeModule === 4) {
            setCacesProgress({ id: 0, vinc: 0, prop: 0 });

            const duration = 800; // Animación de 800ms
            const steps = 20;
            const stepTime = duration / steps;
            let currentStep = 0;

            const interval = setInterval(() => {
                currentStep++;
                setCacesProgress({
                    id: Math.min(100, Math.round((100 / steps) * currentStep)),
                    vinc: Math.min(85, Math.round((85 / steps) * currentStep)),
                    prop: Math.min(60, Math.round((60 / steps) * currentStep))
                });

                if (currentStep >= steps) {
                    clearInterval(interval);
                }
            }, stepTime);

            return () => clearInterval(interval);
        }
    }, [activeModule]);

    const handleExportSiies = () => {
        if (exportState !== 'idle') return;
        setExportState('loading');

        setTimeout(() => {
            setExportState('success');
            setShowToast(true);

            setTimeout(() => {
                setShowToast(false);
            }, 4000);

            setTimeout(() => {
                setExportState('idle');
            }, 5500);
        }, 1500);
    };

    const laptopContainerRef = useRef<HTMLDivElement>(null);
    const [laptopScale, setLaptopScale] = useState<number>(1);

    useEffect(() => {
        const updateScale = () => {
            if (!laptopContainerRef.current) return;
            const containerWidth = laptopContainerRef.current.getBoundingClientRect().width;
            const baseWidth = 740; // Base layout width for the laptop mockup in CSS (max-width: 740px)
            if (containerWidth < baseWidth && containerWidth > 0) {
                setLaptopScale(containerWidth / baseWidth);
            } else {
                setLaptopScale(1);
            }
        };

        updateScale();
        const timer = setTimeout(updateScale, 100);

        window.addEventListener('resize', updateScale);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateScale);
        };
    }, []);

    const modulesList: ModuleItem[] = [
        {
            id: 1,
            title: "Postulación",
            subtitle: "Postulación & Peer Review",
            icon: FileSignature,
            desc: "Optimiza la etapa inicial de investigación académica. Diseña presupuestos dinámicos desglosados en equipos, materiales y vinculación, y gestiona la asignación inteligente de pares evaluadores mediante un riguroso protocolo de doble ciego."
        },
        {
            id: 2,
            title: "Seguimiento",
            subtitle: "Seguimiento & Distributivo",
            icon: Clock,
            desc: "Lleva el control exacto del avance de tus proyectos. Registra los hitos y evidencias en tiempo real con una barra de progreso interactiva para el seguimiento docente y la validación automatizada de horas de investigación."
        },
        {
            id: 3,
            title: "SENADI",
            subtitle: "SENADI & Repositorio",
            icon: Cpu,
            desc: "Gestiona los derechos de autor y la propiedad intelectual de tus desarrollos científicos de manera directa. Descarga certificados oficiales del SENADI y empaqueta el código fuente con verificación de estado instantánea."
        },
        {
            id: 4,
            title: "Acreditación",
            subtitle: "Acreditación & Reportes",
            icon: ShieldCheck,
            desc: "Prepara a tu institución para las auditorías externas. Conéctate automáticamente con la pasarela SIIES para sincronizar evidencias y audita el cumplimiento del indicador de investigación CACES desde una terminal interactiva."
        },
        {
            id: 5,
            title: "Firma Electrónica",
            subtitle: "Firma Electrónica IST",
            icon: Key,
            desc: "Integración nativa con archivos .p12. Las rúbricas, actas de aprobación y reportes mensuales se firman digitalmente con validez jurídica completa, cumpliendo de forma estricta con la normativa vigente de firma electrónica en el Ecuador."
        }
    ];

    const handleModuleSelect = (id: number | null) => {
        setActiveModule(id);
        if (id !== null) {
            setShowDetail(true);
        } else {
            setShowDetail(false);
        }
    };

    const handleNextModule = () => {
        if (activeModule === null) {
            handleModuleSelect(1);
        } else {
            const next = activeModule === 5 ? 1 : activeModule + 1;
            handleModuleSelect(next);
        }
    };

    const handlePrevModule = () => {
        if (activeModule === null) {
            handleModuleSelect(5);
        } else {
            const prev = activeModule === 1 ? 5 : activeModule - 1;
            handleModuleSelect(prev);
        }
    };

    // Estados para la firma electrónica interactiva
    const [signState, setSignState] = useState<'idle' | 'scanning' | 'signed'>('idle');
    const [signProgress, setSignProgress] = useState<number>(0);
    const [signTimestamp, setSignTimestamp] = useState<string>('');

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (signState === 'scanning') {
            setSignProgress(0);
            interval = setInterval(() => {
                setSignProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        const now = new Date();
                        setSignTimestamp(now.toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }));
                        setSignState('signed');
                        return 100;
                    }
                    return prev + 5;
                });
            }, 80);
        }
        return () => clearInterval(interval);
    }, [signState]);

    const startSigning = () => {
        if (signState !== 'idle') return;
        setSignState('scanning');
    };

    const resetSignature = () => {
        setSignState('idle');
        setSignProgress(0);
    };

    // Commits del Repositorio simulados para el Módulo 3
    const [commits, setCommits] = useState<CommitItem[]>([
        { hash: 'e8a3d9f', msg: 'feat: integracion senadi api', time: 'Hace 2 min' },
        { hash: '4f1a2c9', msg: 'refactor: validacion p12', time: 'Hace 12 min' },
        { hash: '9b8c2d1', msg: 'init: esqueleto del proyecto', time: 'Hace 1 hora' }
    ]);

    const handlePushCommit = () => {
        const msgs = [
            'fix: corregido buffer de firma criptografica',
            'docs: actualizado manual de indicadores CACES',
            'style: mejoras visuales en panel de monitoreo',
            'perf: optimizada pasarela de sincronizacion SIIES'
        ];
        const newMsg = msgs[Math.floor(Math.random() * msgs.length)];
        const newHash = Math.random().toString(36).substring(2, 9);
        setCommits(prev => [
            { hash: newHash, msg: newMsg, time: 'Ahora mismo' },
            ...prev.slice(0, 2)
        ]);
    };

    // Módulo 1: Presupuesto
    const [budgetToggles, setBudgetToggles] = useState<BudgetToggles>({
        equipos: true,
        materiales: true,
        vinculacion: false
    });

    const budgetValues = {
        equipos: 2100,
        materiales: 900,
        vinculacion: 1500
    };

    const toggleBudget = (key: keyof BudgetToggles) => {
        setBudgetToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const currentBudgetTotal = (budgetToggles.equipos ? budgetValues.equipos : 0) +
        (budgetToggles.materiales ? budgetValues.materiales : 0) +
        (budgetToggles.vinculacion ? budgetValues.vinculacion : 0);

    const budgetMax = budgetValues.equipos + budgetValues.materiales + budgetValues.vinculacion;
    const budgetPct = Math.round((currentBudgetTotal / budgetMax) * 100);

    // Módulo 2: Hitos
    const [hitos, setHitos] = useState<HitoItem[]>([
        { id: 1, name: 'Hito 1: Marco Teórico', completed: true },
        { id: 2, name: 'Hito 2: Diseño de Algoritmo', completed: true },
        { id: 3, name: 'Hito 3: Evidencias y Pruebas', completed: false }
    ]);

    const toggleHito = (id: number) => {
        setHitos(prev => prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
    };

    const hitosCompletedCount = hitos.filter(h => h.completed).length;
    const hitosTotalCount = hitos.length;

    // Módulo 3: Descargas (SENADI)
    const [downloadStates, setDownloadStates] = useState<{ [key: string]: 'idle' | number | 'success' }>({
        'Certificado_SENADI.pdf': 'idle',
        'Codigo_Fuente.zip': 'idle'
    });

    const triggerDownload = (fileName: string) => {
        if (downloadStates[fileName] !== 'idle') return;

        let progress = 0;
        setDownloadStates(prev => ({ ...prev, [fileName]: 0 }));

        const interval = setInterval(() => {
            progress += 25;
            if (progress >= 100) {
                clearInterval(interval);
                setDownloadStates(prev => ({ ...prev, [fileName]: 'success' }));

                setTimeout(() => {
                    setDownloadStates(prev => ({ ...prev, [fileName]: 'idle' }));
                }, 3000);
            } else {
                setDownloadStates(prev => ({ ...prev, [fileName]: progress }));
            }
        }, 200);
    };

    return {
        activeModule,
        showDetail,
        exportState,
        showToast,
        cacesProgress,
        laptopContainerRef,
        laptopScale,
        modulesList,
        handleModuleSelect,
        handleNextModule,
        handlePrevModule,
        signState,
        signProgress,
        signTimestamp,
        startSigning,
        resetSignature,
        commits,
        handlePushCommit,
        budgetToggles,
        budgetValues,
        toggleBudget,
        currentBudgetTotal,
        budgetPct,
        hitos,
        toggleHito,
        hitosCompletedCount,
        hitosTotalCount,
        downloadStates,
        triggerDownload,
        handleExportSiies
    };
};

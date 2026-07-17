import React, { useState, useEffect, useRef } from 'react';

interface FullscreenLoaderProps {
    message?: string | string[];
    isFinished?: boolean;
    fullscreen?: boolean;
}

const DEFAULT_MESSAGES = [
    'Preparando tu espacio de trabajo...',
    'Conectando al editor en tiempo real...',
    'Sincronizando base de datos...',
    'Cargando tus proyectos de investigación...',
    'Inicializando módulos de colaboración...'
];

export const FullscreenLoader: React.FC<FullscreenLoaderProps> = ({ 
    message, 
    isFinished = false,
    fullscreen = true
}) => {
    const baseUrl = import.meta.env.BASE_URL;

    // Estados para simular el comportamiento real de YouTube / Vercel
    const [progress, setProgress] = useState<number>(0);
    const [isVisible, setIsVisible] = useState<boolean>(true);

    // Estados para el cambio dinámico y suave de mensajes
    const [, setCurrentMessageIndex] = useState<number>(0);
    const [displayMessage, setDisplayMessage] = useState<string>('');
    const [textOpacity, setTextOpacity] = useState<number>(1);

    const intervalRef = useRef<any>(null);
    const messageRotationRef = useRef<any>(null);
    const timeoutRef = useRef<any>(null);

    // Determinar la lista de mensajes a usar de forma segura
    const messageList = React.useMemo(() => {
        if (message === '') return [];
        if (!message) return DEFAULT_MESSAGES;
        if (Array.isArray(message)) return message;
        return [message];
    }, [message]);

    // Lógica para cambiar de mensaje con animación suave (fade out -> cambiar -> fade in)
    const transitionToMessage = (newText: string) => {
        setTextOpacity(0);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setDisplayMessage(newText);
            setTextOpacity(1);
        }, 300); // Duración de la animación de salida
    };

    // 1. Efecto para iniciar el progreso de carga (Estilo YouTube)
    useEffect(() => {
        setProgress(15);
        setIsVisible(true);

        intervalRef.current = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 85) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return 85;
                }
                const increment = Math.floor(Math.random() * 6) + 2;
                return Math.min(prev + increment, 85);
            });
        }, 500);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // 2. Efecto para controlar el mensaje inicial y rotación automática
    useEffect(() => {
        // Inicializar con el primer mensaje
        setDisplayMessage(messageList[0] || '');
        setCurrentMessageIndex(0);

        // Si hay más de un mensaje, rotar cada 3.5 segundos
        if (messageList.length > 1) {
            messageRotationRef.current = setInterval(() => {
                setCurrentMessageIndex((prevIndex) => {
                    const nextIndex = (prevIndex + 1) % messageList.length;
                    transitionToMessage(messageList[nextIndex]);
                    return nextIndex;
                });
            }, 3500);
        } else {
            // Si es un solo mensaje dinámico que cambia desde el padre,
            // reaccionamos a su cambio directo
            transitionToMessage(messageList[0] || '');
        }

        return () => {
            if (messageRotationRef.current) clearInterval(messageRotationRef.current);
        };
    }, [messageList]);

    // 3. Monitorear si la propiedad isFinished cambia a true
    useEffect(() => {
        if (isFinished) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setProgress(100);
            
            const fadeTimeout = setTimeout(() => {
                setIsVisible(false);
            }, 400);

            return () => clearTimeout(fadeTimeout);
        }
    }, [isFinished]);

    return (
        <div className={`${fullscreen ? 'fixed inset-0 w-screen h-screen z-50' : 'absolute inset-0 w-full h-full z-20'} bg-bg-deep overflow-hidden text-text-main animate-fade-in`}>
            {/* Barra superior de 3px */}
            <div 
                className="absolute top-0 left-0 h-[3px] bg-text-main transition-all duration-300 z-50"
                style={{
                    width: `${progress}%`,
                    opacity: isVisible ? 1 : 0,
                    transition: isVisible 
                        ? 'width 0.4s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.2s ease-in-out'
                        : 'width 0s, opacity 0.3s ease-in-out'
                }}
            />

            {isVisible && (
                <div 
                    className="absolute top-0 left-0 h-[3px] bg-text-main blur-[3px] opacity-40 transition-all duration-300 z-40"
                    style={{ width: `${progress}%` }}
                />
            )}
            
            {/* Logo de DIITRA centrado de forma absoluta e inmóvil */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center select-none z-10">
                <img 
                    src={`${baseUrl}logo_negro.webp`} 
                    alt="Logo DIITRA" 
                    className="w-full h-full object-contain block dark:hidden"
                />
                <img 
                    src={`${baseUrl}logo_blanco.webp`} 
                    alt="Logo DIITRA" 
                    className="w-full h-full object-contain hidden dark:block"
                />
            </div>

            {/* Texto de estado posicionado de forma fija debajo del logo */}
            {displayMessage && (
                <div 
                    className="absolute top-[calc(50%+4.5rem)] left-0 w-full flex justify-center px-4 transition-opacity duration-300 z-10"
                    style={{ opacity: textOpacity }}
                >
                    <span className="text-text-dim text-[10px] font-bold uppercase tracking-widest font-mono text-center max-w-xs leading-relaxed">
                        {displayMessage}
                    </span>
                </div>
            )}
        </div>
    );
};

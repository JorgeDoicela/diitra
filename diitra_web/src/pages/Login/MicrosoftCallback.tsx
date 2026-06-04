import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../api/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';

const MicrosoftCallback = () => {
    const { loginWithMicrosoft } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Parse hash params (OIDC response_mode=fragment)
                const hash = window.location.hash;
                const search = window.location.search;
                
                let idToken: string | null = null;
                let errorDescription: string | null = null;

                if (hash) {
                    const params = new URLSearchParams(hash.substring(1));
                    idToken = params.get('id_token');
                    errorDescription = params.get('error_description') || params.get('error');
                } else if (search) {
                    const params = new URLSearchParams(search);
                    idToken = params.get('id_token');
                    errorDescription = params.get('error_description') || params.get('error');
                }

                if (errorDescription) {
                    throw new Error(errorDescription);
                }

                if (!idToken) {
                    throw new Error("No se recibió ningún token de autenticación de Microsoft.");
                }

                // Call backend authentication
                const user = await loginWithMicrosoft(idToken);
                
                // Redirect user based on role
                let target = '/dashboard';
                const roles = (user.roles || [user.role] || []).map((r: string) => r.toUpperCase());
                const isAdmin = user.administrador || roles.includes('DIITRA_ADMIN') || roles.includes('ADMIN_SISTEMA');
                const isDocente = roles.includes('DIITRA_DOCENTE') || roles.includes('DOCENTE_INV') || roles.includes('DIRECTOR_INV');

                if (isAdmin) target = '/usuarios';
                else if (isDocente) target = '/investigacion';

                navigate(target, { replace: true });
            } catch (err: any) {
                console.error("Microsoft Authentication Error:", err);
                const msg = err.response?.data?.message || err.message || "Error al autenticar con Microsoft.";
                setError(msg);
            }
        };

        processCallback();
    }, [loginWithMicrosoft, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-deep transition-colors duration-500 overflow-hidden relative">
            <div className="w-full max-w-[420px] space-y-8 relative z-20 animate-fade-up">
                <div className="flex flex-col items-center space-y-6">
                    <img
                        src="/logo_blanco.png"
                        alt="DIITRA Logo"
                        className="h-16 w-auto object-contain"
                    />
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tighter text-text-main">
                            Autenticación Microsoft
                        </h1>
                        <p className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
                            Procesando credenciales institucionales
                        </p>
                    </div>
                </div>

                <div className="bento-card static p-8 border border-border-thin bg-surface/30 backdrop-blur-md rounded-2xl shadow-xl space-y-6">
                    {error ? (
                        <div className="space-y-4 text-center animate-in fade-in">
                            <div className="mx-auto w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-sm font-semibold text-text-main uppercase">Error de Acceso</h3>
                            <p className="text-xs text-text-dim leading-relaxed">
                                {error}
                            </p>
                            <Link 
                                to="/login" 
                                state={{ error }} 
                                replace 
                                className="btn-vercel-secondary w-full h-11 flex items-center justify-center no-underline cursor-pointer"
                            >
                                Volver al Inicio de Sesión
                            </Link>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="animate-spin text-text-main" size={40} />
                            <p className="text-xs text-text-dim font-semibold uppercase tracking-wider">
                                Validando sesión institucional...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MicrosoftCallback;

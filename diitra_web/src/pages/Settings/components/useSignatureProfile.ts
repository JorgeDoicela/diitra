import { useState, useEffect } from 'react';
import { getSignatureProfile, updateSignatureProfile } from '../../../services/signaturesService';
import type { UserSignatureProfileDto } from '../../../services/signaturesService';
import { useAuth } from '../../../api/AuthContext';

export type SignatureMode = 'auto' | 'upload' | 'draw';

const toTitleCase = (str: string): string =>
    str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export interface SignatureProfileState {
    profile: UserSignatureProfileDto | null;
    loading: boolean;
    saving: boolean;
    message: { text: string; type: 'success' | 'error' } | null;
    isEditing: boolean;
    cargo: string;
    departamento: string;
    firmaImagenB64: string | undefined;
    firmaAutoB64: string | undefined;
    firmaUploadB64: string | undefined;
    firmaDrawB64: string | undefined;
    activeMode: SignatureMode;
    autoText: string;
    selectedFont: string;
    setIsEditing: (v: boolean) => void;
    setCargo: (v: string) => void;
    setDepartamento: (v: string) => void;
    setAutoText: (v: string) => void;
    setSelectedFont: (v: string) => void;
    setMessage: (v: { text: string; type: 'success' | 'error' } | null) => void;
    cancelEdit: () => void;
    executeSaveProfile: () => Promise<void>;
    toTitleCase: (str: string) => string;
    selectMode: (mode: SignatureMode) => void;
    updateFirmaAuto: (b64: string | undefined) => void;
    updateFirmaUpload: (b64: string | undefined) => void;
    updateFirmaDraw: (b64: string | undefined) => void;
}

export function useSignatureProfile(): SignatureProfileState {
    const { user } = useAuth();

    const [profile, setProfile] = useState<UserSignatureProfileDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [cargo, setCargo] = useState('');
    const [departamento, setDepartamento] = useState('');
    const [firmaImagenB64, setFirmaImagenB64] = useState<string | undefined>(undefined);
    const [firmaAutoB64, setFirmaAutoB64] = useState<string | undefined>(undefined);
    const [firmaUploadB64, setFirmaUploadB64] = useState<string | undefined>(undefined);
    const [firmaDrawB64, setFirmaDrawB64] = useState<string | undefined>(undefined);
    const [activeMode, setActiveMode] = useState<SignatureMode>('auto');
    const [autoText, setAutoText] = useState('');
    const [selectedFont, setSelectedFont] = useState('Caveat');

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                setLoading(true);
                const data = await getSignatureProfile();
                if (!active) return;
                setProfile(data);
                setCargo(data.cargo || '');
                setDepartamento(data.departamento || '');
                setFirmaImagenB64(data.firmaImagenB64);
                setFirmaUploadB64(data.firmaImagenB64);
                setFirmaDrawB64(data.firmaImagenB64);
                setAutoText(toTitleCase(user?.nombre_completo || ''));
            } catch (err) {
                console.error('Error al cargar perfil de firma:', err);
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [user]);

    const cancelEdit = () => {
        setIsEditing(false);
        setMessage(null);
        setCargo(profile?.cargo || '');
        setDepartamento(profile?.departamento || '');
        setFirmaImagenB64(profile?.firmaImagenB64);
        setFirmaUploadB64(profile?.firmaImagenB64);
        setFirmaDrawB64(profile?.firmaImagenB64);
        setActiveMode('auto');
    };

    const selectMode = (mode: SignatureMode) => {
        if (mode === activeMode) return;
        setActiveMode(mode);
        if (mode === 'auto') setFirmaImagenB64(firmaAutoB64);
        if (mode === 'upload') setFirmaImagenB64(firmaUploadB64);
        if (mode === 'draw') setFirmaImagenB64(firmaDrawB64);
    };

    const updateFirmaAuto = (b64: string | undefined) => {
        setFirmaAutoB64(b64);
        setFirmaImagenB64(b64);
    };

    const updateFirmaUpload = (b64: string | undefined) => {
        setFirmaUploadB64(b64);
        setFirmaImagenB64(b64);
    };

    const updateFirmaDraw = (b64: string | undefined) => {
        setFirmaDrawB64(b64);
        setFirmaImagenB64(b64);
    };

    const executeSaveProfile = async () => {
        // Validar tamaño de firma (límite del backend: 300 KB en base64)
        if (firmaImagenB64 && firmaImagenB64.length > 307200) {
            setMessage({
                text: 'La imagen de firma optimizada excede el tamaño máximo permitido de 300 KB. Intente de nuevo recortando un área menor o usando trazos más compactos.',
                type: 'error'
            });
            return;
        }

        try {
            setSaving(true);
            setMessage(null);
            const updated = await updateSignatureProfile({
                cargo: cargo.trim() || undefined,
                departamento: departamento.trim() || undefined,
                firmaImagenB64,
            });
            setProfile(updated);
            setIsEditing(false);
            setMessage({ text: 'Perfil de firma institucional guardado con éxito.', type: 'success' });
        } catch (err: any) {
            setMessage({ text: err.response?.data?.error || 'No se pudo guardar el perfil de firma.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return {
        profile, loading, saving, message, isEditing,
        cargo, departamento, firmaImagenB64, firmaAutoB64, firmaUploadB64, firmaDrawB64,
        activeMode, autoText, selectedFont,
        setIsEditing, setCargo, setDepartamento,
        setAutoText, setSelectedFont, setMessage,
        cancelEdit, executeSaveProfile, toTitleCase,
        selectMode, updateFirmaAuto, updateFirmaUpload, updateFirmaDraw,
    };
}

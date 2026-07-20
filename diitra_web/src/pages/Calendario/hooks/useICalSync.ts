import { useState, useEffect } from 'react';
import { getIcalToken } from '../../../services/calendarioService';

export const useICalSync = () => {
    const [icalUrl, setIcalUrl] = useState<string>('');
    const [generatingToken, setGeneratingToken] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const savedUrl = localStorage.getItem('diitra_ical_url');
        if (savedUrl) setIcalUrl(savedUrl);
    }, []);

    const handleGenerarToken = async () => {
        try {
            setGeneratingToken(true);
            const data = await getIcalToken();
            if (data?.feed_url) {
                setIcalUrl(data.feed_url);
                localStorage.setItem('diitra_ical_url', data.feed_url);
            }
        } catch (error) {
            console.error('Error al generar enlace iCal:', error);
        } finally {
            setGeneratingToken(false);
        }
    };

    const fallbackCopyText = (text: string) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.cssText = 'position:fixed;top:0;left:0;';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Fallback de copia fallido:', err);
        }
        document.body.removeChild(textArea);
    };

    const handleCopyIcal = () => {
        if (!icalUrl) return;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(icalUrl)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(() => fallbackCopyText(icalUrl));
        } else {
            fallbackCopyText(icalUrl);
        }
    };

    return {
        icalUrl,
        generatingToken,
        copied,
        handleGenerarToken,
        handleCopyIcal,
    };
};

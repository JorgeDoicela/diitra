import { createContext } from 'react';

export const DocumentDataContext = createContext<any>(null);
export const DocumentMetadataContext = createContext<{ readOnlyReason?: string }>({});
export const SectionGuardContext = createContext<{
    readOnly: boolean;
    id?: string;
    title?: string;
    isBlocked?: boolean;
    handleToggleLock?: () => void;
}>({ readOnly: false });
export const SectionLockContext = createContext<{
    formData: any;
    readOnly: boolean;
    isDirectorOrAdmin: boolean;
    onUpdateField?: (name: string, value: any) => void;
} | null>(null);


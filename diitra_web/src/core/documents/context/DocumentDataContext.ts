import { createContext } from 'react';

export const DocumentDataContext = createContext<any>(null);
export const DocumentMetadataContext = createContext<{ readOnlyReason?: string }>({});

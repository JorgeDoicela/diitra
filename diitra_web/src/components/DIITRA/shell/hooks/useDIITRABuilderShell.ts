import type { CoWorkHandle } from '../../../../core/cowork/types';
import { useBuilderLayout } from './useBuilderLayout';
import type { BuilderSection } from './useBuilderLayout';
import { useBuilderAutoSave } from './useBuilderAutoSave';
import { useBuilderPdfAndSign } from './useBuilderPdfAndSign';
import { useBuilderNetworkMonitor } from './useBuilderNetworkMonitor';

export interface UseDIITRABuilderShellProps {
    title: string;
    subtitle: string;
    templateCode: string;
    sections: BuilderSection[];
    formData: any;
    localChangeCount?: number;
    remoteChangeCount?: number;
    cowork: CoWorkHandle;
    onSave?: (data: any) => Promise<void>;
    onClose: () => void;
    readOnly?: boolean;
    readOnlyReason?: string;
    projectStatus?: string;
    entityUuid?: string;
    canSign?: boolean;
    onUpdateField?: (name: string, value: any) => void;
    signatureType?: string;
    documentUuid?: string;
}

export const useDIITRABuilderShell = (props: UseDIITRABuilderShellProps) => {
    const layout = useBuilderLayout({
        sections: props.sections,
        formData: props.formData,
        cowork: props.cowork,
        readOnly: props.readOnly,
        canSign: props.canSign
    });

    const autoSave = useBuilderAutoSave({
        formData: props.formData,
        templateCode: props.templateCode,
        readOnly: props.readOnly,
        localChangeCount: props.localChangeCount,
        remoteChangeCount: props.remoteChangeCount,
        onSave: props.onSave,
        onClose: props.onClose,
        onUpdateField: props.onUpdateField
    });

    const pdfAndSign = useBuilderPdfAndSign({
        templateCode: props.templateCode,
        formData: props.formData,
        documentUuid: props.documentUuid,
        entityUuid: props.entityUuid,
        projectStatus: props.projectStatus,
        signatureType: props.signatureType,
        addAudit: autoSave.addAudit
    });

    const network = useBuilderNetworkMonitor({
        cowork: props.cowork,
        isSaving: autoSave.isSaving
    });

    return {
        layout,
        autoSave,
        pdfAndSign,
        network
    };
};

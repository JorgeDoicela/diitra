import React from 'react';
import { SignaturePad } from './SignaturePad';

interface DrawSignatureTabProps {
    firmaDrawB64: string | undefined;
    onSignatureChange: (b64: string) => void;
}

export const DrawSignatureTab: React.FC<DrawSignatureTabProps> = ({ firmaDrawB64, onSignatureChange }) => (
    <div className="sig-mode-draw-workspace">
        <SignaturePad
            defaultValue={firmaDrawB64}
            onSave={onSignatureChange}
        />
    </div>
);

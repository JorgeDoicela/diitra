import React from 'react';
import { FullscreenLoader } from '../../../components/Common/FullscreenLoader';

export const DashboardSkeleton: React.FC = () => {
    return <FullscreenLoader fullscreen={false} message="Sincronizando información del panel..." />;
};

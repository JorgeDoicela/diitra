import React from 'react';
import { Activity } from 'lucide-react';
import { PageHeader } from '../../../components/Common/PageHeader';

interface DashboardHeaderProps {
    title: string;
    subtitle: string;
    roleName: string;
    actions?: React.ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    title,
    subtitle,
    roleName,
    actions,
}) => {
    return (
        <PageHeader
            kicker={`${roleName} - ISTPET`}
            icon={Activity}
            title={title}
            description={subtitle}
        >
            {actions}
        </PageHeader>
    );
};

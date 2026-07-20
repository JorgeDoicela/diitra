import React from 'react';
import type { useGroupDetail } from './useGroupDetail';
import type { Domain, Career, ResearchLine } from './subcomponents/GroupInfoEditView';
import { GroupInfoEditView } from './subcomponents/GroupInfoEditView';
import { GroupInfoReadOnlyView } from './subcomponents/GroupInfoReadOnlyView';

export interface GroupInfoTabProps {
    hook: ReturnType<typeof useGroupDetail>;
    dominios: Domain[];
    carreras: Career[];
    lines: ResearchLine[];
    formatCareerName: (name: string) => string;
    renderFieldFeedbackButton: (fieldKey: string, fieldName: string) => React.ReactNode;
}

export const GroupInfoTab: React.FC<GroupInfoTabProps> = ({
    hook,
    dominios,
    carreras,
    lines,
    formatCareerName,
    renderFieldFeedbackButton
}) => {
    const { detailGroup, isEditing } = hook;

    if (!detailGroup) return null;

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {isEditing ? (
                <GroupInfoEditView
                    hook={hook}
                    dominios={dominios}
                    carreras={carreras}
                    lines={lines}
                    formatCareerName={formatCareerName}
                    renderFieldFeedbackButton={renderFieldFeedbackButton}
                />
            ) : (
                <GroupInfoReadOnlyView
                    hook={hook}
                    dominios={dominios}
                    carreras={carreras}
                    lines={lines}
                    formatCareerName={formatCareerName}
                    renderFieldFeedbackButton={renderFieldFeedbackButton}
                />
            )}
        </div>
    );
};

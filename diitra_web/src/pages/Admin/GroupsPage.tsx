import { GroupFormDrawer } from './components/GroupFormDrawer';
import { GroupDetailDrawer } from './components/GroupDetailDrawer';
import { useGroupsPage } from './components/GroupsPage/hooks/useGroupsPage';
import { GroupsHeader } from './components/GroupsPage/GroupsHeader';
import { GroupDraftBanner } from './components/GroupsPage/GroupDraftBanner';
import { GroupViewTabs } from './components/GroupsPage/GroupViewTabs';
import { GroupsTable } from './components/GroupsPage/GroupsTable';
import { GroupReviewModal } from './components/GroupsPage/GroupReviewModal';
import { ConfirmDialogModal } from './components/GroupsPage/ConfirmDialogModal';
import { formatUserDetails, formatCareerName, formatNombre } from './components/GroupsPage/utils';

// Re-export types for backward compatibility
export type { GroupMember, Group, ResearchLine, Domain, Career } from './components/GroupsPage/types';

const GroupsPage = () => {
    const {
        user,
        isAdmin,
        groups,
        lines,
        dominios,
        carreras,
        loading,
        search,
        setSearch,
        viewMode,
        setViewMode,
        isModalOpen,
        setIsModalOpen,
        isReadOnly,
        editingGroup,
        handleOpenModal,
        pendingDraft,
        setPendingDraft,
        handleRestoreDraft,
        handleDiscardDraft,
        detailGroup,
        setDetailGroup,
        detailGroupIsEditing,
        setDetailGroupIsEditing,
        lastActiveGroupId,
        setLastActiveGroupId,
        handleCloseGroupDetail,
        handleDelete,
        confirmDialog,
        setConfirmDialog,
        fetchData,
        review
    } = useGroupsPage();

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10">
            <style>{`
                .row-last-active {
                    background-color: rgba(0, 112, 243, 0.08) !important;
                    transition: background-color 0.2s ease-in-out;
                }
            `}</style>

            <GroupsHeader
                search={search}
                setSearch={setSearch}
                onOpenCreate={() => handleOpenModal(undefined, false)}
                isAdmin={isAdmin}
            />

            {pendingDraft && (
                <GroupDraftBanner
                    pendingDraft={pendingDraft}
                    onRestore={handleRestoreDraft}
                    onDiscard={handleDiscardDraft}
                />
            )}

            {!isAdmin && (
                <GroupViewTabs
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    myGroupsCount={
                        groups.filter(g =>
                            g.id_profesor_coordinador?.trim() === user?.id_referencia?.trim() ||
                            g.teacherMemberCedulas?.some((ced: string) => ced.trim() === user?.id_referencia?.trim())
                        ).length
                    }
                    allGroupsCount={groups.length}
                />
            )}

            <GroupsTable
                groups={groups}
                loading={loading}
                viewMode={viewMode}
                isAdmin={isAdmin}
                user={user}
                detailGroup={detailGroup}
                lastActiveGroupId={lastActiveGroupId}
                onSelectDetail={(g, isEditing) => {
                    setDetailGroup(g);
                    setDetailGroupIsEditing(!!isEditing);
                    setLastActiveGroupId(null);
                }}
                onDelete={handleDelete}
                formatNombre={formatNombre}
                formatCareerName={formatCareerName}
            />

            <GroupReviewModal review={review} />

            <ConfirmDialogModal
                confirmDialog={confirmDialog}
                setConfirmDialog={setConfirmDialog}
                isConfirming={review.isConfirming}
            />

            {/* Sub-Components Rendered Modally */}
            <GroupFormDrawer
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingGroup={editingGroup}
                isReadOnly={isReadOnly}
                isAdmin={isAdmin}
                dominios={dominios}
                carreras={carreras}
                lines={lines}
                fetchData={fetchData}
                setConfirmDialog={setConfirmDialog}
                formatUserDetails={formatUserDetails}
                formatCareerName={formatCareerName}
                onDraftCleared={() => setPendingDraft(null)}
            />

            <GroupDetailDrawer
                isOpen={!!detailGroup}
                onClose={handleCloseGroupDetail}
                detailGroup={detailGroup}
                setDetailGroup={setDetailGroup}
                isAdmin={isAdmin}
                user={user}
                dominios={dominios}
                carreras={carreras}
                lines={lines}
                formatCareerName={formatCareerName}
                handleOpenReview={review.handleOpenReview}
                fetchData={fetchData}
                isEditingInitial={detailGroupIsEditing}
            />
        </main>
    );
};

export default GroupsPage;

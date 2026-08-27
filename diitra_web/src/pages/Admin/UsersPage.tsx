import React from 'react';
import UserProfileModal from './components/UserProfileModal';
import { useUsersPage } from './hooks/useUsersPage';
import { UsersHeader } from './components/UsersPage/UsersHeader';
import { DraftBanners } from './components/UsersPage/DraftBanners';
import { UsersTable } from './components/UsersPage/UsersTable';
import { UserDetailPanel } from './components/UsersPage/UserDetailPanel';
import { ExternalEvaluatorModal } from './components/UsersPage/ExternalEvaluatorModal';
import { ConfirmDialogModal } from './components/UsersPage/ConfirmDialogModal';

const UsersPage = () => {
    const {
        users,
        roles,
        search,
        setSearch,
        userType,
        setUserType,
        soloConHoras,
        setSoloConHoras,
        estadoEstudiante,
        setEstadoEstudiante,
        origenEstudiante,
        setOrigenEstudiante,
        departamento,
        setDepartamento,
        availableDepartments,
        page,
        setPage,
        pageSize,
        totalCount,
        totalPages,
        loading,
        updating,
        selectedUser,
        setSelectedUser,
        detailUser,
        setDetailUser,
        lastActiveUserId,
        setLastActiveUserId,
        showExternalForm,
        setShowExternalForm,
        error,
        setError,
        pendingUserDraft,
        setPendingUserDraft,
        isExternalDraftRestored,
        setIsExternalDraftRestored,
        pendingExternalDraft,
        setPendingExternalDraft,
        confirmDialog,
        setConfirmDialog,
        externalForm,
        setExternalForm,
        searchInputRef,
        isOverlayMouseDownRef,
        fetchUsers,
        handleCloseDetail,
        handleRestoreUserDraft,
        handleDiscardUserDraft,
        handleRestoreExternalDraft,
        handleDiscardExternalDraft,
        handleCloseExternalModal,
        handleRoleToggle,
        handleRegisterExternal
    } = useUsersPage();

    const openedAtRef = React.useRef<number>(0);

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto transition-colors duration-300">
            <style>{`
                .row-last-active {
                    background-color: rgba(0, 112, 243, 0.08) !important;
                    border-color: rgba(0, 112, 243, 0.35) !important;
                    transition: all 0.2s ease-in-out;
                }
            `}</style>
            
            <UsersHeader
                userType={userType}
                setUserType={setUserType}
                soloConHoras={soloConHoras}
                setSoloConHoras={setSoloConHoras}
                estadoEstudiante={estadoEstudiante}
                setEstadoEstudiante={setEstadoEstudiante}
                origenEstudiante={origenEstudiante}
                setOrigenEstudiante={setOrigenEstudiante}
                departamento={departamento}
                setDepartamento={setDepartamento}
                availableDepartments={availableDepartments}
                search={search}
                setSearch={setSearch}
                loading={loading}
                searchInputRef={searchInputRef}
                setError={setError}
                setShowExternalForm={setShowExternalForm}
            />

            <DraftBanners
                pendingUserDraft={pendingUserDraft}
                handleRestoreUserDraft={handleRestoreUserDraft}
                handleDiscardUserDraft={handleDiscardUserDraft}
                pendingExternalDraft={pendingExternalDraft}
                handleRestoreExternalDraft={handleRestoreExternalDraft}
                handleDiscardExternalDraft={handleDiscardExternalDraft}
            />

            <UsersTable
                users={users}
                roles={roles}
                search={search}
                userType={userType}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                loading={loading}
                updating={updating}
                detailUser={detailUser}
                setDetailUser={setDetailUser}
                lastActiveUserId={lastActiveUserId}
                setLastActiveUserId={setLastActiveUserId}
                setSelectedUser={setSelectedUser}
                handleRoleToggle={handleRoleToggle}
                openedAtRef={openedAtRef}
            />

            <ExternalEvaluatorModal
                showExternalForm={showExternalForm}
                handleCloseExternalModal={handleCloseExternalModal}
                error={error}
                isExternalDraftRestored={isExternalDraftRestored}
                externalForm={externalForm}
                setExternalForm={setExternalForm}
                setIsExternalDraftRestored={setIsExternalDraftRestored}
                setPendingExternalDraft={setPendingExternalDraft}
                handleRegisterExternal={handleRegisterExternal}
            />

            {selectedUser && (
                <UserProfileModal
                    user={selectedUser}
                    onClose={() => { setSelectedUser(null); fetchUsers(); }}
                    onDraftCleared={() => setPendingUserDraft(null)}
                />
            )}

            <UserDetailPanel
                detailUser={detailUser}
                handleCloseDetail={handleCloseDetail}
                isOverlayMouseDownRef={isOverlayMouseDownRef}
                setSelectedUser={setSelectedUser}
            />

            <ConfirmDialogModal
                confirmDialog={confirmDialog}
                setConfirmDialog={setConfirmDialog}
            />
        </main>
    );
};

export default UsersPage;

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Header from '../Landing/components/Header';
import Footer from '../Landing/components/Footer';

import type { PublicGroupsPageProps } from './PublicGroups/types';
import { usePublicGroupsData } from './PublicGroups/hooks/usePublicGroupsData';
import { useGroupDetail } from './PublicGroups/hooks/useGroupDetail';

import { PublicGroupsHero } from './PublicGroups/components/PublicGroupsHero';
import { PublicGroupsCatalog } from './PublicGroups/components/PublicGroupsCatalog';
import { PublicGroupsImpact } from './PublicGroups/components/PublicGroupsImpact';

import { GroupDetailHero } from './PublicGroups/components/GroupDetailHero';
import { GroupWorkspaceSection } from './PublicGroups/components/GroupWorkspaceSection';
import { GroupMembersSection } from './PublicGroups/components/GroupMembersSection';
import { GroupProjectsSection } from './PublicGroups/components/GroupProjectsSection';
import { GroupGallerySection } from './PublicGroups/components/GroupGallerySection';

const PublicGroupsPage: React.FC<PublicGroupsPageProps> = ({
    currentTheme = 'dark',
    toggleTheme = () => { }
}) => {
    const { uuid } = useParams<{ uuid?: string }>();
    const navigate = useNavigate();

    // Hook de orquestación para datos del catálogo
    const catalogData = usePublicGroupsData(uuid);

    // Hook de orquestación para detalle de grupo y paneles interactivos
    const groupDetailData = useGroupDetail(uuid);

    // Determinación de Estado de Ruta de Detalle
    const isDetailRoute = !!uuid;
    const isDetailLoaded = isDetailRoute && groupDetailData.fetchedUuid === uuid;

    let mainContent: React.ReactNode;

    if (isDetailRoute && (groupDetailData.loading || !isDetailLoaded)) {
        mainContent = (
            <main className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
                <Loader2 className="animate-spin text-text-dim/60" size={20} />
            </main>
        );
    } else if (isDetailRoute && isDetailLoaded && !groupDetailData.selectedGroup) {
        mainContent = (
            <main className="flex-1 max-w-7xl mx-auto px-6 pt-40 pb-40 text-center min-h-[60vh]">
                <h2 className="text-2xl font-bold mb-3 tracking-tight">Grupo no encontrado</h2>
                <p className="text-text-dim text-xs mb-8">El grupo solicitado no existe o no está disponible públicamente.</p>
                <button
                    onClick={() => navigate('/grupos-investigacion')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border-thin text-xs font-medium text-text-dim hover:text-text-main transition-colors"
                >
                    <ArrowLeft size={12} /> Volver
                </button>
            </main>
        );
    } else if (uuid && groupDetailData.selectedGroup) {
        mainContent = (
            <main className="max-w-7xl mx-auto px-6 pt-24 pb-24">
                <GroupDetailHero selectedGroup={groupDetailData.selectedGroup} />
                <GroupWorkspaceSection
                    selectedGroup={groupDetailData.selectedGroup}
                    activeWorkspaceTab={groupDetailData.activeWorkspaceTab}
                    handleWorkspaceTabClick={groupDetailData.handleWorkspaceTabClick}
                    workspaceCardRefs={groupDetailData.workspaceCardRefs}
                />
                <GroupMembersSection
                    selectedGroup={groupDetailData.selectedGroup}
                    selectedMemberId={groupDetailData.selectedMemberId}
                    handleMemberCardClick={groupDetailData.handleMemberCardClick}
                    memberCardRefs={groupDetailData.memberCardRefs}
                />
                <GroupProjectsSection
                    selectedGroup={groupDetailData.selectedGroup}
                    selectedProjectUuid={groupDetailData.selectedProjectUuid}
                    setSelectedProjectUuid={groupDetailData.setSelectedProjectUuid}
                />
                <GroupGallerySection
                    selectedGroup={groupDetailData.selectedGroup}
                    canEdit={groupDetailData.canEdit}
                    uploading={groupDetailData.uploading}
                    activePhotoUrl={groupDetailData.activePhotoUrl}
                    setActivePhotoUrl={groupDetailData.setActivePhotoUrl}
                    handleUploadPhoto={groupDetailData.handleUploadPhoto}
                    handleDeletePhoto={groupDetailData.handleDeletePhoto}
                />
            </main>
        );
    } else {
        mainContent = (
            <main className="max-w-7xl mx-auto px-6 pt-24 pb-40 space-y-32">
                <PublicGroupsHero
                    heroRef={catalogData.heroRef}
                    handleHeroMouseMove={catalogData.handleHeroMouseMove}
                    currentTheme={currentTheme}
                    groups={catalogData.groups}
                    totalMiembros={catalogData.totalMiembros}
                    totalProyectos={catalogData.totalProyectos}
                    loading={catalogData.loading}
                />
                <PublicGroupsCatalog
                    selectedType={catalogData.selectedType}
                    setSelectedType={catalogData.setSelectedType}
                    searchQuery={catalogData.searchQuery}
                    setSearchQuery={catalogData.setSearchQuery}
                    selectedCarrera={catalogData.selectedCarrera}
                    setSelectedCarrera={catalogData.setSelectedCarrera}
                    uniqueCarreras={catalogData.uniqueCarreras}
                    groups={catalogData.groups}
                    filteredGroups={catalogData.filteredGroups}
                    loading={catalogData.loading}
                />
                <PublicGroupsImpact
                    groups={catalogData.groups}
                    lineasStats={catalogData.lineasStats}
                    totalProyectos={catalogData.totalProyectos}
                />
            </main>
        );
    }

    return (
        <div className="min-h-screen bg-bg-deep text-text-main font-sans selection:bg-selection-bg selection:text-selection-fg relative overflow-x-clip theme-transition">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none -z-20" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-bg-deep to-bg-deep -z-10" />
            <Header currentTheme={currentTheme} toggleTheme={toggleTheme} />
            {mainContent}
            <Footer currentTheme={currentTheme} />
        </div>
    );
};

export default PublicGroupsPage;

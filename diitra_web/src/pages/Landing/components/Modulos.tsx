import React from 'react';
import { useModulosOrchestration } from './modulos/hooks/useModulosOrchestration';
import { ModulosHeader } from './modulos/ModulosHeader';
import { ModulosSelector } from './modulos/ModulosSelector';
import { LaptopMockup } from './modulos/LaptopMockup';
import { VercelToastNotification } from './modulos/VercelToastNotification';
import { DashboardGeneralWidget } from './modulos/widgets/DashboardGeneralWidget';
import { PostulacionWidget } from './modulos/widgets/PostulacionWidget';
import { SeguimientoWidget } from './modulos/widgets/SeguimientoWidget';
import { SenadiWidget } from './modulos/widgets/SenadiWidget';
import { AcreditacionWidget } from './modulos/widgets/AcreditacionWidget';
import { FirmaElectronicaWidget } from './modulos/widgets/FirmaElectronicaWidget';

const Modulos: React.FC = () => {
    const {
        activeModule,
        showDetail,
        exportState,
        showToast,
        cacesProgress,
        laptopContainerRef,
        laptopScale,
        modulesList,
        handleModuleSelect,
        handleNextModule,
        handlePrevModule,
        signState,
        signProgress,
        signTimestamp,
        startSigning,
        resetSignature,
        commits,
        handlePushCommit,
        budgetToggles,
        budgetValues,
        toggleBudget,
        currentBudgetTotal,
        budgetPct,
        hitos,
        toggleHito,
        hitosCompletedCount,
        hitosTotalCount,
        downloadStates,
        triggerDownload,
        handleExportSiies
    } = useModulosOrchestration();

    return (
        <section id="modulos" className="py-24 relative lg:-ml-24 lg:-mr-24 overflow-hidden space-y-16">
            {/* Estilos Inline CSS para la Laptop Realista Matte Black de mayor tamaño */}
            <style>{`
                .laptop-container {
                    perspective: 1200px;
                    width: 100%;
                    max-width: 740px; /* Laptop más grande */
                    margin: 0 auto;
                    overflow: visible;
                    transition: transform 0.3s ease;
                }
                @media (min-width: 1024px) {
                    .laptop-container {
                        transform: translateX(-24px); /* Desplazar levemente a la izquierda */
                    }
                }
                .laptop-lid {
                    background: #0a0a0a; /* Negro profundo mate */
                    border: 12px solid #0a0a0a;
                    border-bottom: 2px solid #0a0a0a; /* Muy delgado para que la pantalla baje al máximo */
                    border-radius: 18px 18px 0 0;
                    box-shadow:
                        inset 0 1px 1px rgba(255, 255, 255, 0.08),
                        inset 0 -1px 1px rgba(0, 0, 0, 0.9);
                    position: relative;
                    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    z-index: 2;
                }
                [data-theme="light"] .laptop-lid {
                    background: #121212; /* Sigue siendo negra mate */
                    border-color: #121212;
                    border-bottom-color: #121212;
                    box-shadow:
                        inset 0 1px 1px rgba(255, 255, 255, 0.1),
                        inset 0 -1px 1px rgba(0, 0, 0, 0.85);
                }
                .laptop-screen-glass {
                    background: #000000;
                    border-radius: 8px 8px 0 0;
                    padding: 3px;
                    position: relative;
                    overflow: hidden;
                    aspect-ratio: 16/10;
                    display: flex;
                    flex-direction: column;
                }
                .laptop-camera {
                    position: absolute;
                    top: 6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 5px;
                    height: 5px;
                    background: #111;
                    border-radius: 50%;
                    border: 0.5px solid #333;
                    z-index: 10;
                }
                .laptop-camera::after {
                    content: '';
                    position: absolute;
                    top: 1.5px;
                    left: 1.5px;
                    width: 2px;
                    height: 2px;
                    background: #0070f3;
                    border-radius: 50%;
                    opacity: 0.65;
                }
                .laptop-display {
                    flex: 1;
                    background: #050505;
                    position: relative;
                    overflow: hidden;
                    border-radius: 5px;
                    border: 1px solid #111;
                }
                [data-theme="light"] .laptop-display {
                    background: #fafafa;
                    border-color: #eaeaea;
                }
                .laptop-screen-glare {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 200%;
                    height: 100%;
                    background: linear-gradient(
                        125deg,
                        rgba(255, 255, 255, 0.05) 0%,
                        rgba(255, 255, 255, 0.02) 25%,
                        rgba(255, 255, 255, 0) 50%
                    );
                    transform: rotate(-10deg) translateY(-20%);
                    pointer-events: none;
                    z-index: 8;
                }
                .laptop-base-wrapper {
                    position: relative;
                    width: 114%;
                    margin-left: -7%;
                    z-index: 3;
                }
                .laptop-base {
                    height: 14px;
                    background: linear-gradient(to bottom, #1f1f1f 0%, #121212 25%, #0a0a0a 70%, #050505 100%);
                    border-radius: 2px 2px 10px 10px;
                    box-shadow:
                        inset 0 1px 0 rgba(255, 255, 255, 0.1),
                        inset 0 -1px 2px rgba(0, 0, 0, 0.9);
                    position: relative;
                }
                [data-theme="light"] .laptop-base {
                    background: linear-gradient(to bottom, #2b2b2b 0%, #1c1c1c 25%, #141414 70%, #0d0d0d 100%);
                    box-shadow:
                        inset 0 1px 0 rgba(255, 255, 255, 0.15),
                        inset 0 -1px 2px rgba(0, 0, 0, 0.8);
                }
                .laptop-notch {
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 86px;
                    height: 5px;
                    background: #050505;
                    border-radius: 0 0 5px 5px;
                }
                [data-theme="light"] .laptop-notch {
                    background: #0d0d0d;
                }
                .laptop-shadow {
                    display: none;
                }
                [data-theme="light"] .laptop-shadow {
                    display: none;
                }
                .screen-transition {
                    animation: screenFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                @keyframes screenFadeIn {
                    from {
                        opacity: 0.9;
                        transform: scale(0.99);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .custom-blur-panel {
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                }
                @keyframes scanLine {
                    0% { top: 0%; opacity: 0.8; }
                    50% { top: 100%; opacity: 0.8; }
                    100% { top: 0%; opacity: 0.8; }
                }
                .animate-scan-line {
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: #0070f3;
                    box-shadow: 0 0 10px #0070f3, 0 0 4px #0070f3;
                    animation: scanLine 2s linear infinite;
                }
            `}</style>

            {/* Header de la sección */}
            <ModulosHeader />

            {/* Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">

                {/* Columna Izquierda: Selector pastillas y Tooltip explicativo */}
                <ModulosSelector
                    modulesList={modulesList}
                    activeModule={activeModule}
                    showDetail={showDetail}
                    onModuleSelect={handleModuleSelect}
                />

                {/* Columna Derecha: Laptop Mockup */}
                <LaptopMockup
                    laptopContainerRef={laptopContainerRef}
                    laptopScale={laptopScale}
                    activeModule={activeModule}
                    onModuleSelect={handleModuleSelect}
                    onPrevModule={handlePrevModule}
                    onNextModule={handleNextModule}
                >
                    {activeModule === null && (
                        <DashboardGeneralWidget
                            onSelectModule={handleModuleSelect}
                            currentBudgetTotal={currentBudgetTotal}
                            budgetPct={budgetPct}
                            hitosCompletedCount={hitosCompletedCount}
                            hitosTotalCount={hitosTotalCount}
                            signState={signState}
                        />
                    )}
                    {activeModule === 1 && (
                        <PostulacionWidget
                            budgetToggles={budgetToggles}
                            budgetValues={budgetValues}
                            toggleBudget={toggleBudget}
                            currentBudgetTotal={currentBudgetTotal}
                            budgetPct={budgetPct}
                        />
                    )}
                    {activeModule === 2 && (
                        <SeguimientoWidget
                            hitos={hitos}
                            toggleHito={toggleHito}
                            hitosCompletedCount={hitosCompletedCount}
                            hitosTotalCount={hitosTotalCount}
                        />
                    )}
                    {activeModule === 3 && (
                        <SenadiWidget
                            commits={commits}
                            handlePushCommit={handlePushCommit}
                            downloadStates={downloadStates}
                            triggerDownload={triggerDownload}
                        />
                    )}
                    {activeModule === 4 && (
                        <AcreditacionWidget
                            cacesProgress={cacesProgress}
                            exportState={exportState}
                            handleExportSiies={handleExportSiies}
                        />
                    )}
                    {activeModule === 5 && (
                        <FirmaElectronicaWidget
                            signState={signState}
                            signProgress={signProgress}
                            signTimestamp={signTimestamp}
                            startSigning={startSigning}
                            resetSignature={resetSignature}
                        />
                    )}
                </LaptopMockup>

            </div>

            {/* Notificación Toast Vercel */}
            <VercelToastNotification showToast={showToast} />

        </section>
    );
};

export default Modulos;

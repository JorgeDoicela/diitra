import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Workspace from './components/Workspace';
import Caces from './components/Caces';
import Modulos from './components/Modulos';
import Roles from './components/Roles';
import TechFirma from './components/TechFirma';
import Interoperability from './components/Interoperability';
import Footer from './components/Footer';
import './Landing.css';

interface LandingProps {
    currentTheme: 'dark' | 'light';
    toggleTheme: () => void;
}

const Landing: React.FC<LandingProps> = ({ currentTheme, toggleTheme }) => {
    return (
        <div className="min-h-screen bg-bg-deep text-text-main font-sans selection:bg-selection-bg selection:text-selection-fg theme-transition overflow-x-hidden relative">
            
            {/* Grid Overlay de fondo al estilo Vercel */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none -z-20" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-bg-deep to-bg-deep -z-10" />

            {/* Header Navigation */}
            <Header currentTheme={currentTheme} toggleTheme={toggleTheme} />

            {/* Main Content Space */}
            <main className="max-w-7xl mx-auto px-6 pt-32 pb-40 space-y-32">
                <Hero currentTheme={currentTheme} />
                <Workspace />
                <Caces />
                <Modulos />
                <Roles />
                <TechFirma />
                <Interoperability />
            </main>

            {/* Detailed Footer */}
            <Footer currentTheme={currentTheme} />
        </div>
    );
};

export default Landing;

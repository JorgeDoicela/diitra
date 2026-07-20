import React, { useState, useEffect, useRef } from 'react';

export const useRevisionTecnicaLayout = () => {
    const [viewMode, setViewMode] = useState<'interactive' | 'pdf'>('interactive');
    const [activeSection, setActiveSection] = useState<string>('identificacion');
    const [activeCommentField, setActiveCommentField] = useState<string>('titulo');
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [generalFeedback, setGeneralFeedback] = useState('');

    const [isDraggingLeft, setIsDraggingLeft] = useState(false);
    const [isDraggingRight, setIsDraggingRight] = useState(false);

    const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(() => {
        const saved = localStorage.getItem('rev_left_sidebar_width');
        return saved ? parseInt(saved, 10) : 260;
    });
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(() => {
        return localStorage.getItem('rev_left_sidebar_open') !== 'false';
    });

    const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
        const saved = localStorage.getItem('rev_right_sidebar_width');
        return saved ? parseInt(saved, 10) : 380;
    });
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(() => {
        return localStorage.getItem('rev_right_sidebar_open') !== 'false';
    });

    const leftSidebarRef = useRef<HTMLDivElement>(null);

    // Auditoría floating button drag state
    const [auditoriaButtonTop, setAuditoriaButtonTop] = useState<number>(() => {
        const saved = localStorage.getItem('rev_auditoria_button_top');
        return saved ? parseInt(saved, 10) : 180;
    });
    const [auditoriaButtonLeft, setAuditoriaButtonLeft] = useState<number | null>(null);
    const [isDraggingButton, setIsDraggingButton] = useState(false);

    // Secciones floating button drag state
    const [seccionesButtonTop, setSeccionesButtonTop] = useState<number>(() => {
        const saved = localStorage.getItem('rev_secciones_button_top');
        return saved ? parseInt(saved, 10) : 180;
    });
    const [seccionesButtonLeft, setSeccionesButtonLeft] = useState<number | null>(null);
    const [isDraggingSeccionesButton, setIsDraggingSeccionesButton] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            if (window.innerWidth < 1100) {
                setIsLeftSidebarOpen(false);
                localStorage.setItem('rev_left_sidebar_open', 'false');
            }
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const startDraggingLeft = (mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        setIsDraggingLeft(true);

        const startWidth = leftSidebarWidth;
        const startX = mouseDownEvent.clientX;

        const doDrag = (mouseMoveEvent: MouseEvent) => {
            const deltaX = mouseMoveEvent.clientX - startX;
            const newWidth = Math.max(220, Math.min(380, startWidth + deltaX));
            setLeftSidebarWidth(newWidth);
            localStorage.setItem('rev_left_sidebar_width', String(newWidth));
        };

        const stopDrag = () => {
            document.body.style.removeProperty('user-select');
            document.body.style.removeProperty('cursor');
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
            setIsDraggingLeft(false);
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    };

    const startDraggingRight = (mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        setIsDraggingRight(true);

        const startWidth = rightSidebarWidth;
        const startX = mouseDownEvent.clientX;

        const doDrag = (mouseMoveEvent: MouseEvent) => {
            const deltaX = startX - mouseMoveEvent.clientX;
            const newWidth = Math.max(360, Math.min(650, startWidth + deltaX));
            setRightSidebarWidth(newWidth);
            localStorage.setItem('rev_right_sidebar_width', String(newWidth));
        };

        const stopDrag = () => {
            document.body.style.removeProperty('user-select');
            document.body.style.removeProperty('cursor');
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
            setIsDraggingRight(false);
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    };

    const handleButtonDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingButton(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startTop = auditoriaButtonTop;
        const buttonWidth = 34;
        const initialX = window.innerWidth - buttonWidth;
        let hasMoved = false;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                hasMoved = true;
            }

            let newX = initialX + deltaX;
            newX = Math.max(window.innerWidth / 2, Math.min(window.innerWidth - buttonWidth, newX));

            let newTop = startTop + deltaY;
            newTop = Math.max(70, Math.min(window.innerHeight - 150, newTop));

            setAuditoriaButtonLeft(newX);
            setAuditoriaButtonTop(newTop);
        };

        const handleMouseUp = (mouseUpEvent: MouseEvent) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            setIsDraggingButton(false);

            if (hasMoved) {
                setAuditoriaButtonLeft(null);

                const finalY = startTop + (mouseUpEvent.clientY - startY);
                const boundedY = Math.max(70, Math.min(window.innerHeight - 150, finalY));
                setAuditoriaButtonTop(boundedY);
                localStorage.setItem('rev_auditoria_button_top', boundedY.toString());
            } else {
                setAuditoriaButtonLeft(null);
                setIsRightSidebarOpen(true);
                localStorage.setItem('rev_right_sidebar_open', 'true');
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleSeccionesButtonDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingSeccionesButton(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startTop = seccionesButtonTop;
        const buttonWidth = 36;
        const initialX = 0;
        let hasMoved = false;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                hasMoved = true;
            }

            let newX = initialX + deltaX;
            newX = Math.max(0, Math.min(window.innerWidth / 2 - buttonWidth, newX));

            let newTop = startTop + deltaY;
            newTop = Math.max(70, Math.min(window.innerHeight - 150, newTop));

            setSeccionesButtonLeft(newX);
            setSeccionesButtonTop(newTop);
        };

        const handleMouseUp = (mouseUpEvent: MouseEvent) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            setIsDraggingSeccionesButton(false);

            if (hasMoved) {
                setSeccionesButtonLeft(null);

                const finalY = startTop + (mouseUpEvent.clientY - startY);
                const boundedY = Math.max(70, Math.min(window.innerHeight - 150, finalY));
                setSeccionesButtonTop(boundedY);
                localStorage.setItem('rev_secciones_button_top', boundedY.toString());
            } else {
                setSeccionesButtonLeft(null);
                setIsLeftSidebarOpen(true);
                localStorage.setItem('rev_left_sidebar_open', 'true');
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const toggleLeftSidebar = (open?: boolean) => {
        const nextState = open !== undefined ? open : !isLeftSidebarOpen;
        setIsLeftSidebarOpen(nextState);
        localStorage.setItem('rev_left_sidebar_open', String(nextState));
    };

    const toggleRightSidebar = (open?: boolean) => {
        const nextState = open !== undefined ? open : !isRightSidebarOpen;
        setIsRightSidebarOpen(nextState);
        localStorage.setItem('rev_right_sidebar_open', String(nextState));
    };

    return {
        viewMode,
        setViewMode,
        activeSection,
        setActiveSection,
        activeCommentField,
        setActiveCommentField,
        isFinalizeModalOpen,
        setIsFinalizeModalOpen,
        generalFeedback,
        setGeneralFeedback,
        isDraggingLeft,
        isDraggingRight,
        leftSidebarWidth,
        isLeftSidebarOpen,
        setIsLeftSidebarOpen: toggleLeftSidebar,
        rightSidebarWidth,
        isRightSidebarOpen,
        setIsRightSidebarOpen: toggleRightSidebar,
        leftSidebarRef,
        auditoriaButtonTop,
        auditoriaButtonLeft,
        isDraggingButton,
        seccionesButtonTop,
        seccionesButtonLeft,
        isDraggingSeccionesButton,
        startDraggingLeft,
        startDraggingRight,
        handleButtonDragStart,
        handleSeccionesButtonDragStart
    };
};

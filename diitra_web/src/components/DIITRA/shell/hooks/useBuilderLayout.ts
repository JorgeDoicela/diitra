import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { CoWorkHandle } from '../../../../../core/cowork/types';

export interface BuilderSection {
    id: string;
    label: string;
    icon: React.ReactNode;
}

export interface UseBuilderLayoutProps {
    sections: BuilderSection[];
    formData: any;
    cowork: CoWorkHandle;
    readOnly?: boolean;
    canSign?: boolean;
}

export const useBuilderLayout = ({
    sections,
    formData,
    cowork,
    readOnly = false,
    canSign = true
}: UseBuilderLayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

    // ── Modo Oscuro / Claro ──
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        return document.documentElement.getAttribute('data-theme') !== 'light';
    });

    const toggleTheme = () => {
        const nextMode = !isDarkMode;
        setIsDarkMode(nextMode);
        document.documentElement.setAttribute('data-theme', nextMode ? 'dark' : 'light');
        localStorage.setItem('theme', nextMode ? 'dark' : 'light');
    };

    // ── Navegación de Secciones y URL ──
    const sectionParam = queryParams.get('section');
    const activeTab = sectionParam || sections[0]?.id || 'general';
    const activeSection = sections.find(s => s.id === activeTab);
    const activeSectionLabel = activeSection?.label || 'General';
    const isSectionBlocked = formData?.BlockedSections?.[activeTab] === true;
    const isDirectorOrAdmin = !!canSign;

    const setActiveTab = useCallback((tabId: string) => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('section', tabId);
        navigate({ search: searchParams.toString() }, { replace: true });
    }, [location.search, navigate]);

    // Ref para evitar notificar la misma sección múltiples veces a CoWork
    const lastNotifiedTabRef = useRef<string | null>(null);

    useEffect(() => {
        if (cowork && cowork.notifySectionActivity && activeTab && !readOnly) {
            if (lastNotifiedTabRef.current !== activeTab) {
                lastNotifiedTabRef.current = activeTab;
                cowork.notifySectionActivity(cowork.session.documentId, activeTab, "ha entrado a redactar");
            }
        }
    }, [cowork, activeTab, readOnly]);

    // ── Dimensiones y Estado de Sidebars ──
    const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(() => {
        const saved = localStorage.getItem('left_sidebar_width');
        return saved ? parseInt(saved, 10) : 320;
    });

    const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
        const saved = localStorage.getItem('right_sidebar_width');
        return saved ? parseInt(saved, 10) : 260;
    });

    const [isLeftSidebarOpen, setIsLeftSidebarOpenState] = useState<boolean>(() => {
        return localStorage.getItem('left_sidebar_open') !== 'false';
    });

    const [isSidebarOpen, setIsSidebarOpenState] = useState<boolean>(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            return false;
        }
        return localStorage.getItem('document_sidebar_open') !== 'false';
    });

    const [showMobileSections, setShowMobileSections] = useState(false);

    const leftSidebarRef = useRef<HTMLDivElement>(null);
    const rightSidebarRef = useRef<HTMLDivElement>(null);
    const isDraggingLeft = useRef(false);
    const isDraggingRight = useRef(false);

    const setIsLeftSidebarOpen = useCallback((open: boolean) => {
        localStorage.setItem('left_sidebar_open', String(open));
        if (open) {
            const comfortableWidth = 260;
            setLeftSidebarWidth(comfortableWidth);
            localStorage.setItem('left_sidebar_width', String(comfortableWidth));
            if (leftSidebarRef.current) {
                leftSidebarRef.current.style.width = `${comfortableWidth}px`;
            }
        }
        setIsLeftSidebarOpenState(open);
    }, []);

    const setIsSidebarOpen = useCallback((open: boolean) => {
        localStorage.setItem('document_sidebar_open', String(open));
        if (open) {
            const comfortableWidth = 260;
            setRightSidebarWidth(comfortableWidth);
            localStorage.setItem('right_sidebar_width', String(comfortableWidth));
            if (rightSidebarRef.current) {
                rightSidebarRef.current.style.width = `${comfortableWidth}px`;
            }
        }
        setIsSidebarOpenState(open);
    }, []);

    // ── Redimensionado de Sidebars (Drag Handles) ──
    const startDraggingLeft = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();

        isDraggingLeft.current = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';

        if (leftSidebarRef.current) {
            leftSidebarRef.current.style.transition = 'none';
        }

        const startWidth = leftSidebarWidth;
        const startX = mouseDownEvent.clientX;
        let maxDelta = 0;

        const doDrag = (mouseMoveEvent: MouseEvent) => {
            const deltaX = mouseMoveEvent.clientX - startX;
            maxDelta = Math.max(maxDelta, Math.abs(deltaX));

            const newWidth = Math.max(0, Math.min(500, startWidth + deltaX));
            if (leftSidebarRef.current) {
                leftSidebarRef.current.style.width = `${newWidth}px`;
            }
        };

        const stopDrag = () => {
            isDraggingLeft.current = false;
            document.body.style.removeProperty('user-select');
            document.body.style.removeProperty('cursor');
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);

            const currentWidth = leftSidebarRef.current
                ? parseInt(leftSidebarRef.current.style.width, 10)
                : startWidth;

            const clicked = maxDelta <= 4;
            const releasedInCollapseZone = maxDelta > 4 && currentWidth < 220;
            const shouldCollapse = clicked || releasedInCollapseZone;

            if (leftSidebarRef.current) {
                leftSidebarRef.current.style.transition = 'width 300ms ease-in-out';
            }

            if (shouldCollapse) {
                setIsLeftSidebarOpen(false);
            } else {
                const finalWidth = Math.max(200, Math.min(500, currentWidth));
                setLeftSidebarWidth(finalWidth);
                localStorage.setItem('left_sidebar_width', String(finalWidth));
                if (leftSidebarRef.current) {
                    leftSidebarRef.current.style.width = `${finalWidth}px`;
                }
            }
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }, [leftSidebarWidth, setIsLeftSidebarOpen]);

    const startDraggingRight = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();

        isDraggingRight.current = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';

        if (rightSidebarRef.current) {
            rightSidebarRef.current.style.transition = 'none';
        }

        const startWidth = rightSidebarWidth;
        const startX = mouseDownEvent.clientX;
        let maxDelta = 0;

        const doDrag = (mouseMoveEvent: MouseEvent) => {
            const deltaX = startX - mouseMoveEvent.clientX;
            maxDelta = Math.max(maxDelta, Math.abs(deltaX));

            const newWidth = Math.max(0, Math.min(600, startWidth + deltaX));
            if (rightSidebarRef.current) {
                rightSidebarRef.current.style.width = `${newWidth}px`;
            }
        };

        const stopDrag = () => {
            isDraggingRight.current = false;
            document.body.style.removeProperty('user-select');
            document.body.style.removeProperty('cursor');
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);

            const currentWidth = rightSidebarRef.current
                ? parseInt(rightSidebarRef.current.style.width, 10)
                : startWidth;

            const clicked = maxDelta <= 4;
            const releasedInCollapseZone = maxDelta > 4 && currentWidth < 250;
            const shouldCollapse = clicked || releasedInCollapseZone;

            if (rightSidebarRef.current) {
                rightSidebarRef.current.style.transition = 'width 300ms ease-in-out';
            }

            if (shouldCollapse) {
                setIsSidebarOpen(false);
            } else {
                const finalWidth = Math.max(240, Math.min(600, currentWidth));
                setRightSidebarWidth(finalWidth);
                localStorage.setItem('right_sidebar_width', String(finalWidth));
                if (rightSidebarRef.current) {
                    rightSidebarRef.current.style.width = `${finalWidth}px`;
                }
            }
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }, [rightSidebarWidth, setIsSidebarOpen]);

    // ── Drag & Drop de Pestañas Flotantes Re-abribles (Nav y Chat) ──
    const [navTopPercent, setNavTopPercent] = useState<number>(12);
    const [chatTopPercent, setChatTopPercent] = useState<number>(12);
    const [navXOffset, setNavXOffset] = useState<number>(0);
    const [chatXOffset, setChatXOffset] = useState<number>(0);
    const [isDraggingNav, setIsDraggingNav] = useState(false);
    const [isDraggingChat, setIsDraggingChat] = useState(false);
    const bodyContainerRef = useRef<HTMLDivElement>(null);

    const navTopPercentRef = useRef(12);
    const chatTopPercentRef = useRef(12);
    const navXOffsetRef = useRef(0);
    const chatXOffsetRef = useRef(0);
    useEffect(() => { navTopPercentRef.current = navTopPercent; }, [navTopPercent]);
    useEffect(() => { chatTopPercentRef.current = chatTopPercent; }, [chatTopPercent]);
    useEffect(() => { navXOffsetRef.current = navXOffset; }, [navXOffset]);
    useEffect(() => { chatXOffsetRef.current = chatXOffset; }, [chatXOffset]);

    const startDraggingNav = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        setIsDraggingNav(true);

        const isTouch = 'touches' in e;
        const startClientY = isTouch ? e.touches[0].clientY : e.clientY;
        const startClientX = isTouch ? e.touches[0].clientX : e.clientX;
        const rect = bodyContainerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const initialTopPx = (navTopPercentRef.current / 100) * rect.height;
        const initialLeftPx = navXOffsetRef.current;
        let hasMoved = false;

        const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
            if ('touches' in moveEvent && moveEvent.cancelable) {
                moveEvent.preventDefault();
            }

            const currentTouch = 'touches' in moveEvent ? moveEvent.touches[0] : moveEvent;
            const deltaY = currentTouch.clientY - startClientY;
            const deltaX = currentTouch.clientX - startClientX;

            if (Math.abs(deltaY) > 5 || Math.abs(deltaX) > 5) {
                hasMoved = true;
            }

            const newTopPx = initialTopPx + deltaY;
            const newPercent = Math.max(10, Math.min(90, (newTopPx / rect.height) * 100));
            setNavTopPercent(newPercent);

            const newX = Math.max(0, Math.min(120, initialLeftPx + deltaX));
            setNavXOffset(newX);
        };

        const handleEnd = () => {
            setIsDraggingNav(false);
            setNavXOffset(0);

            if (isTouch) {
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
            } else {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleEnd);
            }

            if (!hasMoved) {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setShowMobileSections(true);
                } else {
                    setIsLeftSidebarOpen(true);
                }
            }
        };

        if (isTouch) {
            document.addEventListener('touchmove', handleMove, { passive: false });
            document.addEventListener('touchend', handleEnd);
        } else {
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleEnd);
        }
    }, [setIsLeftSidebarOpen]);

    const startDraggingChat = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        setIsDraggingChat(true);

        const isTouch = 'touches' in e;
        const startClientY = isTouch ? e.touches[0].clientY : e.clientY;
        const startClientX = isTouch ? e.touches[0].clientX : e.clientX;
        const rect = bodyContainerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const initialTopPx = (chatTopPercentRef.current / 100) * rect.height;
        const initialRightPx = chatXOffsetRef.current;
        let hasMoved = false;

        const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
            if ('touches' in moveEvent && moveEvent.cancelable) {
                moveEvent.preventDefault();
            }

            const currentTouch = 'touches' in moveEvent ? moveEvent.touches[0] : moveEvent;
            const deltaY = currentTouch.clientY - startClientY;
            const deltaX = startClientX - currentTouch.clientX;

            if (Math.abs(deltaY) > 5 || Math.abs(deltaX) > 5) {
                hasMoved = true;
            }

            const newTopPx = initialTopPx + deltaY;
            const newPercent = Math.max(10, Math.min(90, (newTopPx / rect.height) * 100));
            setChatTopPercent(newPercent);

            const newX = Math.max(0, Math.min(120, initialRightPx + deltaX));
            setChatXOffset(newX);
        };

        const handleEnd = () => {
            setIsDraggingChat(false);
            setChatXOffset(0);

            if (isTouch) {
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
            } else {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleEnd);
            }

            if (!hasMoved) {
                setIsSidebarOpen(true);
            }
        };

        if (isTouch) {
            document.addEventListener('touchmove', handleMove, { passive: false });
            document.addEventListener('touchend', handleEnd);
        } else {
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleEnd);
        }
    }, [setIsSidebarOpen]);

    return {
        isDarkMode,
        toggleTheme,
        activeTab,
        activeSectionLabel,
        isSectionBlocked,
        isDirectorOrAdmin,
        setActiveTab,
        leftSidebarWidth,
        rightSidebarWidth,
        isLeftSidebarOpen,
        setIsLeftSidebarOpen,
        isSidebarOpen,
        setIsSidebarOpen,
        showMobileSections,
        setShowMobileSections,
        leftSidebarRef,
        rightSidebarRef,
        bodyContainerRef,
        startDraggingLeft,
        startDraggingRight,
        navTopPercent,
        chatTopPercent,
        navXOffset,
        chatXOffset,
        isDraggingNav,
        isDraggingChat,
        startDraggingNav,
        startDraggingChat
    };
};

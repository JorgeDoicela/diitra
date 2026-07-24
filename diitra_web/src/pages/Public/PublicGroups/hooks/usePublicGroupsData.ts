import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../../api/axios_config';
import type { Group } from '../types';

export const usePublicGroupsData = (uuid?: string) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('todos');
    const [selectedCarrera, setSelectedCarrera] = useState('todas');

    const heroRef = useRef<HTMLDivElement>(null);

    const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        heroRef.current.style.setProperty('--mouse-x', `${x}px`);
        heroRef.current.style.setProperty('--mouse-y', `${y}px`);
    }, []);

    const fetchGroups = async (search?: string) => {
        setLoading(true);
        try {
            const url = search ? `/groups/public?search=${encodeURIComponent(search)}` : '/groups/public';
            const res = await api.get(url);
            setGroups(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Buscar grupos del catálogo (debounced) cuando no hay UUID de detalle
    useEffect(() => {
        if (uuid) return;
        const t = setTimeout(() => {
            fetchGroups(searchQuery);
        }, 200);
        return () => clearTimeout(t);
    }, [searchQuery, uuid]);

    const uniqueCarreras = Array.from(
        new Set(groups.flatMap(g => g.carrerasNombres || []))
    ).filter(Boolean).sort();

    const filteredGroups = groups.filter(g => {
        const q = searchQuery.toLowerCase();
        const match = g.nombre.toLowerCase().includes(q) ||
            (g.siglas?.toLowerCase().includes(q)) ||
            (g.lineasNombres?.some(l => l.toLowerCase().includes(q)));

        const matchesType = selectedType === 'todos' || g.tipoGrupo.toLowerCase() === selectedType.toLowerCase();
        const matchesCarrera = selectedCarrera === 'todas' || g.carrerasNombres?.includes(selectedCarrera);

        return match && matchesType && matchesCarrera;
    });

    const totalMiembros = groups.reduce((acc, g) => acc + (g.miembros?.length || 0), 0);
    const totalProyectos = groups.reduce((acc, g) => acc + (g.proyectos?.length || 0), 0);

    const lineasStats = (() => {
        const statsMap: { [key: string]: { groupsCount: number, projectsCount: number } } = {};
        groups.forEach(g => {
            (g.lineasNombres || []).forEach(linea => {
                if (!statsMap[linea]) {
                    statsMap[linea] = { groupsCount: 0, projectsCount: 0 };
                }
                statsMap[linea].groupsCount += 1;
                statsMap[linea].projectsCount += (g.proyectos?.length || 0);
            });
        });
        return Object.entries(statsMap)
            .map(([nombre, data]) => ({ nombre, ...data }))
            .sort((a, b) => b.projectsCount - a.projectsCount)
            .slice(0, 4);
    })();

    return {
        groups,
        loading,
        searchQuery,
        setSearchQuery,
        selectedType,
        setSelectedType,
        selectedCarrera,
        setSelectedCarrera,
        heroRef,
        handleHeroMouseMove,
        uniqueCarreras,
        filteredGroups,
        totalMiembros,
        totalProyectos,
        lineasStats
    };
};

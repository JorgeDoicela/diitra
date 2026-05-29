export const formatNombre = (name: string) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map(word => {
            const preps = ['de', 'la', 'del', 'los', 'las', 'y'];
            if (preps.includes(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ')
        .replace(/^\w/, c => c.toUpperCase());
};

export const getAvatarStyle = (name: string) => {
    const colors = [
        { bg: 'from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20' },
        { bg: 'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20' },
        { bg: 'from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20' },
        { bg: 'from-rose-500/10 to-pink-500/10 text-rose-400 border-rose-500/20' },
        { bg: 'from-violet-500/10 to-fuchsia-500/10 text-violet-400 border-violet-500/20' }
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

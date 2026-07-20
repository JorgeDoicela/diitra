export const formatNombre = (nombre: string | null | undefined): string => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

export const formatWhatsappLink = (phone: string | null | undefined): string => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '');
    return `https://wa.me/593${cleanPhone}`;
};

import { useState, useEffect, useCallback } from 'react';
import api from '../../../../api/axios_config';
import { useNotifications } from '../../../../api/NotificationsContext';
import { useConfirm } from '../../../../api/ConfirmContext';

export function useResearchProducts(resolvedProjectUuid: string | null, activeDocument: string | null, isPreproposalState: boolean) {
    const { addToast } = useNotifications();
    const confirm = useConfirm();

    const [products, setProducts] = useState<any[]>([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [productTypes, setProductTypes] = useState<any[]>([]);

    const [newProduct, setNewProduct] = useState({
        id_tipo_producto: 1,
        titulo: '',
        cantidad: 1,
        url_producto: '',
        es_propiedad_intelectual: false,
        numero_registro: '',
        fecha_registro_senadi: ''
    });

    const fetchProducts = useCallback(async (pUuid?: string) => {
        const uuidToUse = pUuid || resolvedProjectUuid;
        if (!uuidToUse) return;

        let retries = 3;
        let success = false;
        let res: any = null;
        while (retries > 0 && !success) {
            try {
                res = await api.get(`/ResearchProducts/project/${uuidToUse}`);
                success = true;
            } catch (err: any) {
                retries--;
                if (err?.response?.status === 404 && retries > 0) {
                    console.warn(`[DIITRA] Productos no encontrados (404), reintentando en 1s... (${retries} intentos restantes)`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    retries = 0;
                    console.error("[DIITRA] Error al cargar productos", err);
                }
            }
        }
        if (success && res) {
            setProducts(res.data);
        }
    }, [resolvedProjectUuid]);

    const fetchProductTypes = useCallback(async () => {
        try {
            const res = await api.get('/catalogs/tipo-producto');
            setProductTypes(res.data);
            if (res.data.length > 0) {
                setNewProduct(prev => ({ ...prev, id_tipo_producto: res.data[0].id_tipo_producto }));
            }
        } catch (err) {
            console.error("[DIITRA] Error al cargar tipos de producto", err);
        }
    }, []);

    useEffect(() => {
        fetchProductTypes();
    }, [fetchProductTypes]);

    useEffect(() => {
        if (resolvedProjectUuid && !isPreproposalState) {
            fetchProducts(resolvedProjectUuid);
        }
    }, [resolvedProjectUuid, activeDocument, isPreproposalState, fetchProducts]);

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resolvedProjectUuid) return;
        try {
            await api.post('/ResearchProducts', {
                project_uuid: resolvedProjectUuid,
                id_tipo_producto: Number(newProduct.id_tipo_producto),
                titulo: newProduct.titulo,
                cantidad: Number(newProduct.cantidad),
                url_producto: newProduct.url_producto || null,
                es_propiedad_intelectual: newProduct.es_propiedad_intelectual,
                numero_registro: newProduct.es_propiedad_intelectual ? newProduct.numero_registro : null,
                fecha_registro_senadi: newProduct.es_propiedad_intelectual && newProduct.fecha_registro_senadi ? newProduct.fecha_registro_senadi : null
            });
            setShowProductModal(false);
            setNewProduct({
                id_tipo_producto: productTypes[0]?.id_tipo_producto || 1,
                titulo: '',
                cantidad: 1,
                url_producto: '',
                es_propiedad_intelectual: false,
                numero_registro: '',
                fecha_registro_senadi: ''
            });
            fetchProducts(resolvedProjectUuid);
            addToast("Producto Registrado", "Producto de investigación registrado con éxito.", "success");
        } catch (err) {
            console.error("[DIITRA] Error al crear producto", err);
            addToast("Error al Registrar", "Error al registrar el producto.", "error");
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!await confirm({
            title: "Eliminar Producto",
            message: "¿Está seguro de eliminar este producto de investigación?",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;
        try {
            await api.delete(`/ResearchProducts/${id}`);
            fetchProducts(resolvedProjectUuid || undefined);
        } catch (err) {
            console.error("[DIITRA] Error al eliminar producto", err);
        }
    };

    return {
        products,
        showProductModal,
        setShowProductModal,
        productTypes,
        newProduct,
        setNewProduct,
        fetchProducts,
        handleCreateProduct,
        handleDeleteProduct
    };
}

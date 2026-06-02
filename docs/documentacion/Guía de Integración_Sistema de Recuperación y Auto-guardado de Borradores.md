# Guía de Integración: Sistema de Recuperación y Auto-guardado de Borradores

Esta guía técnica detalla paso a paso la arquitectura, los componentes y la lógica requerida para replicar el sistema de auto-guardado en tiempo real y banners de recuperación en otros formularios del sistema (ej: `UsersPage.tsx`, `ConvocatoriasPage.tsx`, etc.).

---

## 1. Modificaciones en el Componente Padre (Listado / Página Principal)

### A. Declaración de Estados

Añade el estado para controlar el borrador pendiente y el modal de confirmación en la inicialización de la página:

```tsx
// Estado para almacenar la metadata del borrador detectado
const [pendingDraft, setPendingDraft] = useState<{
    type: 'new' | 'edit';
    uuid?: string;
    groupName: string; // Cambiar por el nombre del recurso relevante (ej: userName)
    timestamp: number;
} | null>(null);
```

### B. Hook de Carga (Mounting Effect)

Al montar el componente, comprueba si existe un borrador no resuelto en el almacenamiento local:

```tsx
useEffect(() => {
    const metaStr = localStorage.getItem('recurso_draft_metadata'); // Reemplaza 'recurso'
    if (metaStr) {
        try {
            setPendingDraft(JSON.parse(metaStr));
        } catch (e) {
            console.error("Error reading draft metadata", e);
        }
    }
}, []);
```

### C. Handlers para Restaurar y Descartar

```tsx
const handleRestoreDraft = () => {
    if (!pendingDraft) return;

    if (pendingDraft.type === 'new') {
        setEditingRecurso(null); // Reemplaza por tu objeto recurso
        setIsReadOnly(false);
        setIsModalOpen(true);
    } else if (pendingDraft.type === 'edit' && pendingDraft.uuid) {
        // Buscar el objeto completo correspondiente en la lista cargada
        const item = recursos.find(r => r.uuid === pendingDraft.uuid); // Reemplaza 'recursos'
        if (item) {
            setEditingRecurso(item);
            setIsReadOnly(false);
            setIsModalOpen(true);
        } else {
            alert("No se pudo encontrar el registro original.");
        }
    }
};

const handleDiscardDraft = () => {
    setConfirmDialog({
        isOpen: true,
        title: 'Descartar Borrador',
        message: '¿Está seguro de descartar el borrador guardado? Esta acción no se puede deshacer.',
        type: 'danger',
        onConfirm: () => {
            localStorage.removeItem('recurso_draft_metadata');
            localStorage.removeItem('new_recurso_form_draft');
            if (pendingDraft?.type === 'edit' && pendingDraft.uuid) {
                localStorage.removeItem(`edit_recurso_form_draft_${pendingDraft.uuid}`);
            }
            setPendingDraft(null);
        }
    });
};
```

### D. Render del Banner de Recuperación (Vercel Geist Styles)

Coloca este bloque justo debajo de tu `<header>` de la página, arriba de tu listado o bento grid:

```tsx
{pendingDraft && (
    <div className="bento-card static p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-up mb-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-brand via-brand/40 to-transparent" />

        <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                <FileText size={18} />
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Borrador Detectado</h4>
                    <span className="badge-vercel badge-vercel-info text-[8px] font-bold uppercase py-0 px-2 leading-none shrink-0 font-mono">
                        No Guardado
                    </span>
                </div>
                <p className="text-[10px] text-text-dim uppercase font-bold leading-none">
                    Tienes un borrador sin guardar de: <span className="text-text-main font-black">"{pendingDraft.groupName}"</span>
                </p>
                <p className="text-[8px] text-text-dim/60 font-semibold uppercase tracking-wider font-mono">
                    Guardado automáticamente el {new Date(pendingDraft.timestamp).toLocaleDateString()} a las {new Date(pendingDraft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>

        <div className="flex gap-2.5 w-full md:w-auto relative z-10 shrink-0">
            <button
                onClick={handleRestoreDraft}
                className="btn-brand flex-1 md:flex-none !py-2.5 flex items-center justify-center gap-1.5"
            >
                Restaurar Borrador
            </button>
            <button
                onClick={handleDiscardDraft}
                className="btn-vercel-secondary flex-1 md:flex-none !py-2.5 flex items-center justify-center gap-1.5"
            >
                Descartar
            </button>
        </div>
    </div>
)}
```

### E. Integración de Props en el Modal / Drawer

Asegúrate de pasarle al Modal/Drawer la prop de callback para sincronizar la desaparición del banner:

```tsx
<RecursoFormDrawer
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    editingRecurso={editingRecurso}
    isReadOnly={isReadOnly}
    onDraftCleared={() => setPendingDraft(null)} // Sincronizador de UI
    // ...otras props
/>
```

---

## 2. Modificaciones en el Componente Hijo (Drawer / Modal / Formulario)

### A. Tipado de Props

Agrega la prop opcional de limpieza al listado de interfaces:

```typescript
interface RecursoFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    editingRecurso: Recurso | null;
    isReadOnly: boolean;
    onDraftCleared?: () => void; // Callback para alertar al padre
    // ...
}
```

### B. Declaración de Estados de Control Interno

Añade en el componente la referencia de inicialización para evitar la sobreescritura (condición de carrera) y el estado visual de restauración:

```tsx
const [isDraftRestored, setIsDraftRestored] = useState(false);
const isInitializedRef = useRef(false);
```

### C. Hook de Inicialización de Estados (Cargar Borrador)

Modifica tu carga de datos para evaluar `localStorage` antes de inicializar valores vacíos, controlando los flags de inicialización:

```tsx
useEffect(() => {
    if (!isOpen) {
        isInitializedRef.current = false;
        setIsDraftRestored(false);
        return;
    }

    if (editingRecurso) {
        const draftKey = `edit_recurso_form_draft_${editingRecurso.uuid}`;
        const draft = localStorage.getItem(draftKey);
        if (draft && !isReadOnly) {
            try {
                const parsed = JSON.parse(draft);
                setFormData(parsed.formData); // Restaurar estados del form
                // Restaurar otros estados específicos locales (ej. miembros, multiselects)
                setIsDraftRestored(true);
                isInitializedRef.current = true;
                return;
            } catch (e) {
                console.error("Error parsing edit draft", e);
            }
        }

        // Cargar por defecto los datos oficiales de la base de datos
        setFormData({
            nombre: editingRecurso.nombre || '',
            // ...
        });
    } else {
        const draft = localStorage.getItem('new_recurso_form_draft');
        if (draft && !isReadOnly) {
            try {
                const parsed = JSON.parse(draft);
                setFormData(parsed.formData);
                setIsDraftRestored(true);
                isInitializedRef.current = true;
                return;
            } catch (e) {
                console.error("Error parsing new draft", e);
            }
        }

        // Cargar por defecto valores vacíos de nuevo recurso
        setFormData({
            nombre: '',
            // ...
        });
    }

    setIsDraftRestored(false);
    isInitializedRef.current = true;
}, [editingRecurso, isOpen, isReadOnly]);
```

### D. Hook de Auto-guardado en Tiempo Real

Un efecto optimizado que escucha las actualizaciones del formulario y las guarda, protegido por el flag de inicialización:

```tsx
useEffect(() => {
    if (!isOpen || isReadOnly || !isInitializedRef.current) return;

    const draftData = {
        formData,
        // ...otros estados locales que desees guardar
    };

    if (editingRecurso) {
        const draftKey = `edit_recurso_form_draft_${editingRecurso.uuid}`;
        localStorage.setItem(draftKey, JSON.stringify(draftData));

        const meta = {
            type: 'edit',
            uuid: editingRecurso.uuid,
            groupName: formData.nombre || editingRecurso.nombre || 'Borrador sin nombre',
            timestamp: Date.now()
        };
        localStorage.setItem('recurso_draft_metadata', JSON.stringify(meta));
    } else {
        localStorage.setItem('new_recurso_form_draft', JSON.stringify(draftData));

        const meta = {
            type: 'new',
            groupName: formData.nombre || 'Borrador de Nueva Propuesta',
            timestamp: Date.now()
        };
        localStorage.setItem('recurso_draft_metadata', JSON.stringify(meta));
    }
}, [formData, isOpen, isReadOnly, editingRecurso]);
```

### E. Función Helper de Limpieza (`clearDraft`)

Centraliza el borrado de claves al finalizar las operaciones:

```tsx
const clearDraft = () => {
    localStorage.removeItem('new_recurso_form_draft');
    localStorage.removeItem('recurso_draft_metadata');
    if (editingRecurso) {
        localStorage.removeItem(`edit_recurso_form_draft_${editingRecurso.uuid}`);
    }
    if (onDraftCleared) {
        onDraftCleared();
    }
};
```

**Invoca `clearDraft()` en:**

1. La función de envío exitoso (`handleSubmitForm`).
2. La confirmación de descarte de cambios al cancelar o cerrar el drawer (`handleCloseModal`).

### F. Render del Banner de Restauración Interno (Acción Directa de Escape)

Inserta este banner en la parte superior de tu formulario `<form className="...">` para brindarle transparencia al usuario y permitirle deshacer sus cambios locales al instante:

```tsx
{isDraftRestored && (
    <div className="bg-brand-subtle border border-brand/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in">
        <div className="flex items-center gap-3">
            <FileText size={16} className="text-brand shrink-0" />
            <p className="text-[11px] text-text-dim uppercase tracking-wider font-bold">
                <span className="text-brand font-black">Borrador Restaurado:</span> Se han recuperado tus datos no guardados localmente.
            </p>
        </div>
        <button
            type="button"
            onClick={() => {
                // 1. Reestablecer estados a los oficiales
                if (editingRecurso) {
                    setFormData({
                        nombre: editingRecurso.nombre || '',
                        // ...
                    });
                } else {
                    setFormData({
                        nombre: '',
                        // ...
                    });
                }

                // 2. Limpiar almacenamiento local
                clearDraft();
                setIsDraftRestored(false);
            }}
            className="text-[10px] font-black text-brand uppercase tracking-widest hover:underline cursor-pointer shrink-0"
        >
            Revertir al Original
        </button>
    </div>
)}
```

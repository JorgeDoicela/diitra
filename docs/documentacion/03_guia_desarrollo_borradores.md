# Guía de Integración: Sistema de Recuperación y Auto-guardado de Borradores

Esta guía técnica detalla paso a paso la arquitectura, los componentes y la lógica requerida para replicar el sistema de auto-guardado en tiempo real y banners de recuperación en otros formularios del sistema (ej: `UsersPage.tsx`, `ConvocatoriasPage.tsx`, etc.).

---

## 1. Modificaciones en el Componente Padre (Listado / Página Principal)

El componente principal que renderiza el listado de recursos debe buscar si existen borradores huérfanos sin persistir en el navegador del usuario al cargarse.

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

Lógica para recuperar los datos temporales del borrador o limpiar las claves del almacenamiento local ante el descarte manual:

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

El componente del formulario es el responsable de guardar dinámicamente los campos actualizados en el almacenamiento local.

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

---

## 3. Consideraciones Avanzadas y Buenas Prácticas de Ingeniería (Nivel Senior)

Para que el sistema de borradores sea considerado profesional y apto para producción a gran escala, debe cumplir con directrices estrictas sobre **seguridad, eficiencia de memoria y resiliencia de datos**.

### A. ¿Qué NO se debe guardar en el Borrador? (Exclusión de Estados Efímeros)

Un error común de desarrollo es serializar todo el estado del componente. **Solo se debe persistir el estado de valor final del formulario**. Debes omitir estrictamente del guardado:
1. **Buscadores y Queries de Autocompletado**: Estados como `coordSearchQuery` o `teacherSearchQuery` no deben guardarse. Al restaurarse la página, estas barras de búsqueda deben aparecer vacías.
2. **Resultados de Búsquedas en Curso**: Colecciones dinámicas como `coordSearchResults` son respuestas efímeras del backend y no forman parte del formulario.
3. **Visibilidad de Overlays / Dropdowns**: Banderas booleanas de UI como `showCoordResults` siempre deben inicializarse en `false`.
4. **Estados de Carga / Loaders**: Indicadores como `isCoordSearching` o `loading` son operacionales y deben inicializarse por defecto.
5. **Selecciones Intermedias no Vinculadas**: Si el usuario seleccionó un docente en el buscador pero no presionó "Vincular", ese objeto temporal no debe persistirse.

### B. Seguridad y Datos Sensibles

`localStorage` es vulnerable a ataques de secuestro de sesión (XSS). Por lo tanto:
*   **PROHIBIDO GUARDAR**: Contraseñas en texto plano, tokens de autenticación (JWT), llaves de API o identificadores confidenciales privados.
*   **INFORMACIÓN NO SENSIBLE**: Solo persiste cadenas descriptivas públicas (nombres, descripciones, selecciones de catálogos públicos).
*   **EXCEPCIÓN DE ARCHIVOS (BLOBS/FILES)**: No intentes guardar el objeto `File` o un Blob en localStorage. Esto causará excepciones de serialización. En su lugar, guarda la URL temporal devuelta por el servidor una vez que el archivo haya sido subido con éxito.

### C. Manejo de Colecciones y Estructuras Complejas (Arrays de Integrantes / Relaciones)

Cuando el formulario maneja listas dinámicas locales (como la lista de miembros agregados antes de enviar la propuesta), el borrador debe persistir el array completo de objetos planos:

```typescript
const draftData = {
    formData: {
        nombre: '...',
        lineas_ids: [1, 4, 8],
    },
    selectedCoordName: 'Dr. John Doe',
    groupMembers: [
        { id_usuario: 0, cedula: '172...', nombre_completo: 'Alice Smith', rol: 'Co-Investigador', activo: true }
    ]
};
```

Al restaurarse el estado, asegúrate de asignar cada array a su respectivo `useState` de React (`setGroupMembers`, `setFormData`, etc.), garantizando que la UI renderice automáticamente las tarjetas Bento y listas vinculadas.

### D. Resiliencia ante Cambios de Esquema y Excepciones (Outdated Drafts)

Si actualizas la estructura del formulario en el futuro, los usuarios pueden tener en su navegador borradores antiguos (JSON incompatible). Si intentas parsear este JSON, la aplicación podría crasear por propiedades no definidas.

Para prevenir esto de manera profesional, implementa un **bloque de captura y saneamiento robusto** en tu hook de inicialización:

```typescript
try {
    const parsed = JSON.parse(draft);
    if (parsed && typeof parsed === 'object' && parsed.formData) {
        setFormData(parsed.formData);
        setGroupMembers(Array.isArray(parsed.groupMembers) ? parsed.groupMembers : []);
        setIsDraftRestored(true);
        isInitializedRef.current = true;
        return;
    } else {
        throw new Error("Estructura de borrador inválida");
    }
} catch (e) {
    console.warn("Borrador corrupto o desactualizado detectado. Limpiando almacenamiento...", e);
    localStorage.removeItem(draftKey);
}
```

### E. Protección de Vistas de Solo Lectura (Read-Only Safety)

Uno de los fallos de lógica más sutiles ocurre cuando la misma interfaz del formulario se reutiliza para visualizar registros existentes en modo **Solo Lectura** (`isReadOnly = true`).
*   **En la inicialización**: Bloqueamos la lectura del borrador en modo lectura. Solo recuperamos borradores si `!isReadOnly`:
    ```typescript
    if (draft && !isReadOnly) { ... }
    ```
*   **En el trigger de auto-guardado**: Añadimos una cláusula de guarda inmediata para abortar cualquier operación de escritura si `isReadOnly` es `true`:
    ```typescript
    if (!isOpen || isReadOnly || !isInitializedRef.current) return;
    ```

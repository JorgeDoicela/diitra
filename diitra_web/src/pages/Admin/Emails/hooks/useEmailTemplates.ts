import React, { useState } from 'react';
import api from '../../../../api/axios_config';
import { useConfirm } from '../../../../api/ConfirmContext';
import type { EmailTemplate } from '../emailEngineTypes';
import { mapTemplateToCamelCase } from './useEmailEngineData';

export interface UseEmailTemplatesProps {
    templates: EmailTemplate[];
    setTemplates: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
}

export interface UseEmailTemplatesResult {
    isTemplateModalOpen: boolean;
    setIsTemplateModalOpen: (open: boolean) => void;
    editingTemplate: EmailTemplate | null;
    templateForm: {
        codigo: string;
        nombre: string;
        descripcion: string;
        asunto: string;
        cuerpoHtml: string;
        activo: boolean;
    };
    setTemplateForm: React.Dispatch<React.SetStateAction<{
        codigo: string;
        nombre: string;
        descripcion: string;
        asunto: string;
        cuerpoHtml: string;
        activo: boolean;
    }>>;
    templateError: string;
    setTemplateError: (err: string) => void;
    showTemplateHtmlEditor: boolean;
    setShowTemplateHtmlEditor: React.Dispatch<React.SetStateAction<boolean>>;
    openCreateTemplateModal: () => void;
    openEditTemplateModal: (t: EmailTemplate) => void;
    handleSaveTemplate: (e: React.FormEvent) => Promise<void>;
    handleDeleteTemplate: (id: number) => Promise<void>;
}

export const useEmailTemplates = ({ setTemplates }: UseEmailTemplatesProps): UseEmailTemplatesResult => {
    const confirm = useConfirm();

    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [templateForm, setTemplateForm] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        asunto: '',
        cuerpoHtml: '',
        activo: true
    });
    const [templateError, setTemplateError] = useState('');
    const [showTemplateHtmlEditor, setShowTemplateHtmlEditor] = useState(false);

    const openCreateTemplateModal = () => {
        setEditingTemplate(null);
        setTemplateForm({
            codigo: '',
            nombre: '',
            descripcion: '',
            asunto: '',
            cuerpoHtml: '<p style="color:#444;font-size:14px;line-height:1.6;">Mensaje principal de la plantilla. El diseño institucional (logos y pie de página) se aplica automáticamente al enviar.</p>\n<p style="color:#444;font-size:14px;line-height:1.6;">Puede usar datos dinámicos como [[proyecto_titulo]] o [[convocatoria_titulo]].</p>',
            activo: true
        });
        setTemplateError('');
        setShowTemplateHtmlEditor(false);
        setIsTemplateModalOpen(true);
    };

    const openEditTemplateModal = (t: EmailTemplate) => {
        setEditingTemplate(t);
        setTemplateForm({
            codigo: t.codigo,
            nombre: t.nombre,
            descripcion: t.descripcion || '',
            asunto: t.asunto,
            cuerpoHtml: t.cuerpoHtml,
            activo: t.activo
        });
        setTemplateError('');
        setShowTemplateHtmlEditor(false);
        setIsTemplateModalOpen(true);
    };

    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        setTemplateError('');
        if (!templateForm.codigo.trim() || !templateForm.nombre.trim() || !templateForm.asunto.trim() || !templateForm.cuerpoHtml.trim()) {
            setTemplateError('Todos los campos marcados con asterisco son obligatorios.');
            return;
        }

        try {
            if (editingTemplate) {
                const payload = {
                    id_email_template: editingTemplate.idEmailTemplate,
                    uuid: editingTemplate.uuid,
                    codigo: templateForm.codigo.trim(),
                    nombre: templateForm.nombre.trim(),
                    descripcion: templateForm.descripcion.trim(),
                    asunto: templateForm.asunto.trim(),
                    cuerpo_html: templateForm.cuerpoHtml,
                    activo: templateForm.activo
                };
                const res = await api.put<any>(`/Admin/email-engine/templates/${editingTemplate.idEmailTemplate}`, payload);
                const saved = mapTemplateToCamelCase(res.data);
                setTemplates(prev => prev.map(t => t.idEmailTemplate === editingTemplate.idEmailTemplate ? saved : t));
            } else {
                const payload = {
                    codigo: templateForm.codigo.trim(),
                    nombre: templateForm.nombre.trim(),
                    descripcion: templateForm.descripcion.trim(),
                    asunto: templateForm.asunto.trim(),
                    cuerpo_html: templateForm.cuerpoHtml,
                    activo: templateForm.activo
                };
                const res = await api.post<any>('/Admin/email-engine/templates', payload);
                const saved = mapTemplateToCamelCase(res.data);
                setTemplates(prev => [saved, ...prev]);
            }
            setIsTemplateModalOpen(false);
        } catch (err: any) {
            console.error('[DIITRA EMAIL ENGINE] Error saving template:', err);
            setTemplateError(err.response?.data || 'Error al guardar la plantilla. Asegúrese de que el código no esté duplicado.');
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        if (!await confirm({
            title: "Eliminar Plantilla",
            message: "¿Está seguro de eliminar esta plantilla de correo de forma permanente?",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;
        try {
            await api.delete(`/Admin/email-engine/templates/${id}`);
            setTemplates(prev => prev.filter(t => t.idEmailTemplate !== id));
        } catch (e) {
            console.error('[DIITRA EMAIL ENGINE] Error deleting template:', e);
            alert('No se pudo eliminar la plantilla.');
        }
    };

    return {
        isTemplateModalOpen,
        setIsTemplateModalOpen,
        editingTemplate,
        templateForm,
        setTemplateForm,
        templateError,
        setTemplateError,
        showTemplateHtmlEditor,
        setShowTemplateHtmlEditor,
        openCreateTemplateModal,
        openEditTemplateModal,
        handleSaveTemplate,
        handleDeleteTemplate
    };
};

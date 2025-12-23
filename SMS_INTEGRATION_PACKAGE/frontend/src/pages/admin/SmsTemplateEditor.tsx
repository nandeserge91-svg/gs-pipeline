import React, { useState, useEffect } from 'react';
import {
  Mail,
  Edit2,
  RotateCcw,
  Save,
  Eye,
  AlertCircle,
  CheckCircle2,
  Loader
} from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface SmsTemplate {
  id: number;
  key: string;
  label: string;
  description: string;
  category: string;
  icon: string;
  template: string;
  defaultTemplate: string;
  variables: string[];
  characterCount: number;
  isActive: boolean;
  lastModifiedAt: string;
}

const SmsTemplateEditor: React.FC = () => {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
  const [editedTemplate, setEditedTemplate] = useState('');
  const [preview, setPreview] = useState('');
  const [exampleVariables, setExampleVariables] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Charger tous les templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sms-templates');
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Erreur chargement templates:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  // Charger les variables d'exemple pour un template
  const getExampleVariables = (template: SmsTemplate): Record<string, string> => {
    const examples: Record<string, string> = {
      prenom: 'Kouame',
      ref: 'ORD-12345',
      produit: 'BEE VENOM',
      montant: '10000',
      livreur: 'Mohamed',
      telephone: '+2250712345678',
      code: 'EXP-2024-789',
      ville: 'Yamoussoukro',
      agence: 'Agence Cocody',
      date: '20/12/2024',
      heure: '14:00',
      jours: '3'
    };

    const result: Record<string, string> = {};
    template.variables.forEach(varName => {
      result[varName] = examples[varName] || `{${varName}}`;
    });
    return result;
  };

  // Sélectionner un template pour édition
  const selectTemplate = (template: SmsTemplate) => {
    setSelectedTemplate(template);
    setEditedTemplate(template.template);
    const vars = getExampleVariables(template);
    setExampleVariables(vars);
    updatePreview(template.template, vars);
  };

  // Mettre à jour la prévisualisation
  const updatePreview = (templateText: string, vars: Record<string, string>) => {
    let result = templateText;
    Object.entries(vars).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    setPreview(result);
  };

  // Modifier le template
  const handleTemplateChange = (value: string) => {
    setEditedTemplate(value);
    updatePreview(value, exampleVariables);
  };

  // Sauvegarder les modifications
  const saveTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setSaving(true);
      await api.put(`/sms-templates/${selectedTemplate.key}`, {
        template: editedTemplate,
        isActive: selectedTemplate.isActive
      });

      toast.success('Template modifié avec succès !');
      await loadTemplates();
      
      // Mettre à jour le template sélectionné
      const updatedTemplates = templates.map(t => 
        t.key === selectedTemplate.key 
          ? { ...t, template: editedTemplate, characterCount: editedTemplate.length }
          : t
      );
      setTemplates(updatedTemplates);
      
      const updated = updatedTemplates.find(t => t.key === selectedTemplate.key);
      if (updated) setSelectedTemplate(updated);
      
    } catch (error) {
      console.error('Erreur sauvegarde template:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Réinitialiser au template par défaut
  const resetTemplate = async () => {
    if (!selectedTemplate) return;

    if (!confirm(`Voulez-vous réinitialiser "${selectedTemplate.label}" à sa valeur par défaut ?`)) {
      return;
    }

    try {
      setSaving(true);
      await api.post(`/sms-templates/${selectedTemplate.key}/reset`);

      toast.success('Template réinitialisé !');
      await loadTemplates();
      
      // Mettre à jour avec le template par défaut
      setEditedTemplate(selectedTemplate.defaultTemplate);
      updatePreview(selectedTemplate.defaultTemplate, exampleVariables);
      
    } catch (error) {
      console.error('Erreur réinitialisation template:', error);
      toast.error('Erreur lors de la réinitialisation');
    } finally {
      setSaving(false);
    }
  };

  // Grouper les templates par catégorie
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, SmsTemplate[]>);

  const hasChanges = selectedTemplate && editedTemplate !== selectedTemplate.template;
  const isDefaultTemplate = selectedTemplate && editedTemplate === selectedTemplate.defaultTemplate;
  const characterCount = editedTemplate.length;
  const isOverLimit = characterCount > 160;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Chargement des templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-7 h-7 text-blue-600" />
            Éditeur de Templates SMS
          </h2>
          <p className="text-gray-600 mt-1">
            Personnalisez les messages SMS envoyés automatiquement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des templates */}
        <div className="lg:col-span-1 space-y-4">
          {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{category}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {categoryTemplates.map((template) => (
                  <button
                    key={template.key}
                    onClick={() => selectTemplate(template)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      selectedTemplate?.key === template.key ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {template.label}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {template.characterCount} caractères
                        </p>
                      </div>
                      {template.template !== template.defaultTemplate && (
                        <div className="flex-shrink-0">
                          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Éditeur */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header template */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <span className="text-2xl">{selectedTemplate.icon}</span>
                      {selectedTemplate.label}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTemplate.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Variables disponibles */}
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Variables disponibles :
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map((variable) => (
                    <code
                      key={variable}
                      className="px-2 py-1 bg-white border border-blue-200 rounded text-sm text-blue-700 font-mono"
                    >
                      {`{${variable}}`}
                    </code>
                  ))}
                </div>
              </div>

              {/* Éditeur de texte */}
              <div className="px-6 py-4 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Edit2 className="w-4 h-4 inline mr-1" />
                  Template personnalisé
                </label>
                <textarea
                  value={editedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Entrez votre message..."
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-sm ${
                    isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-600'
                  }`}>
                    {characterCount} / 160 caractères
                    {isOverLimit && ' (⚠️ Trop long, sera facturé 2 SMS)'}
                  </span>
                  {!isDefaultTemplate && (
                    <span className="text-xs text-blue-600">
                      • Modifié
                    </span>
                  )}
                </div>
              </div>

              {/* Prévisualisation */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Eye className="w-4 h-4 inline mr-1" />
                  Prévisualisation (avec variables d'exemple)
                </label>
                <div className="bg-white border border-gray-300 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{preview}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 flex items-center justify-between gap-4">
                <button
                  onClick={resetTemplate}
                  disabled={saving || isDefaultTemplate}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Réinitialiser
                </button>

                <button
                  onClick={saveTemplate}
                  disabled={saving || !hasChanges}
                  className="flex items-center gap-2 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Sauvegarder
                    </>
                  )}
                </button>
              </div>

              {/* Informations */}
              <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Informations importantes :</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>Les modifications sont instantanées après sauvegarde</li>
                      <li>Les variables {`{prenom}`}, {`{ref}`}, etc. seront remplacées automatiquement</li>
                      <li>Limite recommandée : 160 caractères pour 1 SMS</li>
                      <li>Au-delà de 160 caractères, le SMS sera facturé en multiple</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                Sélectionnez un template à gauche pour commencer l'édition
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmsTemplateEditor;

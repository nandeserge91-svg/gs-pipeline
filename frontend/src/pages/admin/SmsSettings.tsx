/**
 * Page de gestion des paramètres SMS pour les administrateurs
 */

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Send, 
  ToggleLeft, 
  ToggleRight, 
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Smartphone,
  Loader,
  Edit3
} from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import SmsTemplateEditor from './SmsTemplateEditor';

interface SmsSetting {
  key: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  enabled: boolean;
}

interface SmsStats {
  [key: string]: {
    sent: number;
    failed: number;
    total: number;
  };
}

interface AndroidConfig {
  deviceId: string | null;
  simSlot: string | null;
  selectionMode: 'SIM_SLOT';
  usesSenderNumber: false;
}

export default function SmsSettings() {
  const [activeTab, setActiveTab] = useState<'settings' | 'templates'>('settings');
  const [loading, setLoading] = useState(true);
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [settings, setSettings] = useState<SmsSetting[]>([]);
  const [stats, setStats] = useState<SmsStats>({});
  const [androidConfig, setAndroidConfig] = useState<AndroidConfig>({
    deviceId: null,
    simSlot: null,
    selectionMode: 'SIM_SLOT',
    usesSenderNumber: false
  });
  const [testPhone, setTestPhone] = useState('');
  const [testingType, setTestingType] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/sms-settings');
      setSettings(response.data.settings);
      setGlobalEnabled(response.data.globalEnabled);
      setAndroidConfig(response.data.androidConfig);
    } catch (error: any) {
      console.error('Erreur chargement paramètres SMS:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/sms-settings/stats');
      setStats(response.data.stats);
    } catch (error: any) {
      console.error('Erreur chargement stats SMS:', error);
    }
  };

  const toggleGlobal = async () => {
    try {
      const newValue = !globalEnabled;
      await api.put('/sms-settings/global', { enabled: newValue });
      setGlobalEnabled(newValue);
      toast.success(
        newValue ? 'SMS activés globalement' : 'SMS désactivés globalement',
        { icon: newValue ? '✅' : '⏸️' }
      );
    } catch (error: any) {
      console.error('Erreur toggle global:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const toggleSetting = async (key: string, currentValue: boolean) => {
    setSavingKey(key);
    try {
      const newValue = !currentValue;
      await api.put('/sms-settings/toggle', { key, enabled: newValue });
      
      setSettings(prev =>
        prev.map(s => s.key === key ? { ...s, enabled: newValue } : s)
      );
      
      const setting = settings.find(s => s.key === key);
      toast.success(
        `${setting?.label} ${newValue ? 'activé' : 'désactivé'}`,
        { icon: newValue ? '✅' : '⏸️' }
      );
    } catch (error: any) {
      console.error('Erreur toggle setting:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setSavingKey(null);
    }
  };

  const testSms = async (key: string) => {
    if (!testPhone) {
      toast.error('Veuillez entrer un numéro de téléphone');
      return;
    }

    setTestingType(key);
    try {
      await api.post(`/sms-settings/test/${key}`, {
        phoneNumber: testPhone
      });
      toast.success('SMS de test envoyé avec succès !');
      setTestPhone('');
    } catch (error: any) {
      console.error('Erreur test SMS:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi du test');
    } finally {
      setTestingType(null);
    }
  };

  const groupByCategory = () => {
    const grouped: { [key: string]: SmsSetting[] } = {};
    settings.forEach(setting => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      grouped[setting.category].push(setting);
    });
    return grouped;
  };

  const getSuccessRate = (type: string) => {
    const stat = stats[type.replace('SMS_', '')];
    if (!stat || stat.total === 0) return 0;
    return Math.round((stat.sent / stat.total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const grouped = groupByCategory();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-600" />
            Paramètres SMS
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez l'activation des notifications SMS et personnalisez les messages
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Paramètres
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'templates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Edit3 className="w-4 h-4 inline mr-2" />
            Éditeur de Templates
          </button>
        </nav>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'templates' ? (
        <SmsTemplateEditor />
      ) : (
        <>
      {/* Configuration Android - visible seulement dans l'onglet paramètres */}

      {/* Configuration Android */}
      {androidConfig.deviceId && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="w-6 h-6 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-2">
                📱 Android Dédié Configuré
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-green-700 font-medium">Device ID:</span>
                  <span className="ml-2 text-green-900">{androidConfig.deviceId}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">SIM Slot:</span>
                  <span className="ml-2 text-green-900">
                    {androidConfig.simSlot === '0' ? 'SIM 1' : 'SIM 2'}
                  </span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Sélection:</span>
                  <span className="ml-2 text-green-900">Emplacement SIM uniquement</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-green-700">
                Aucun numéro de SIM n'est enregistré : la carte insérée dans SIM 1 est utilisée.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Activation globale */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Activation Globale des SMS
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Désactiver tous les SMS en une seule fois
            </p>
          </div>
          <button
            onClick={toggleGlobal}
            className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors ${
              globalEnabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform ${
                globalEnabled ? 'translate-x-13' : 'translate-x-1'
              }`}
            >
              {globalEnabled ? (
                <CheckCircle className="w-6 h-6 text-green-600 m-2" />
              ) : (
                <XCircle className="w-6 h-6 text-gray-400 m-2" />
              )}
            </span>
          </button>
        </div>

        {!globalEnabled && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              <strong>Attention :</strong> Les SMS sont désactivés globalement. 
              Aucun SMS ne sera envoyé même si les types individuels sont activés.
            </p>
          </div>
        )}
      </div>

      {/* Avertissement changements temporaires */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <strong>Note importante :</strong> Les modifications effectuées ici sont 
            <strong> temporaires</strong> et seront perdues au redémarrage du serveur. 
            Pour des changements permanents, modifiez les variables d'environnement sur Railway.
          </div>
        </div>
      </div>

      {/* Paramètres par catégorie */}
      {Object.entries(grouped).map(([category, categorySettings]) => (
        <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {categorySettings.map((setting) => {
              const stat = stats[setting.key.replace('SMS_', '')];
              const successRate = getSuccessRate(setting.key);

              return (
                <div key={setting.key} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{setting.icon}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {setting.label}
                          </h4>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {setting.description}
                          </p>
                        </div>
                      </div>

                      {/* Statistiques */}
                      {stat && stat.total > 0 && (
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 ml-11">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{stat.total} envoyés (30j)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>{stat.sent} réussis</span>
                          </div>
                          {stat.failed > 0 && (
                            <div className="flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>{stat.failed} échoués</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span className={`font-medium ${
                              successRate >= 95 ? 'text-green-600' : 
                              successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {successRate}% succès
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Bouton test */}
                      <button
                        onClick={() => testSms(setting.key)}
                        disabled={testingType === setting.key}
                        className="px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 
                                 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {testingType === setting.key ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Test
                      </button>

                      {/* Toggle */}
                      <button
                        onClick={() => toggleSetting(setting.key, setting.enabled)}
                        disabled={savingKey === setting.key}
                        className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${
                          setting.enabled ? 'bg-green-600' : 'bg-gray-300'
                        } ${savingKey === setting.key ? 'opacity-50' : ''}`}
                      >
                        <span
                          className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-md transition-transform ${
                            setting.enabled ? 'translate-x-11' : 'translate-x-1'
                          }`}
                        >
                          {savingKey === setting.key ? (
                            <Loader className="w-5 h-5 animate-spin text-gray-400 m-1.5" />
                          ) : setting.enabled ? (
                            <ToggleRight className="w-5 h-5 text-green-600 m-1.5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-400 m-1.5" />
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Panel de test */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tester l'envoi de SMS
        </h3>
        <div className="flex gap-3">
          <input
            type="tel"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="+225 XX XX XX XX XX"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => {
              const firstEnabled = settings.find(s => s.enabled);
              if (firstEnabled) {
                testSms(firstEnabled.key);
              } else {
                toast.error('Aucun type de SMS n\'est activé');
              }
            }}
            disabled={!testPhone || testingType !== null}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-2"
          >
            {testingType ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Envoyer Test
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Le SMS de test sera envoyé avec le premier type activé
        </p>
      </div>
        </>
      )}
    </div>
  );
}

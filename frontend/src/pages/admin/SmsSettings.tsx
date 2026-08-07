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
  MessageCircle,
  Loader,
  Edit3
} from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
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

interface WhatsAppConfig {
  provider: 'WaSenderAPI';
  apiUrl: string;
  configured: boolean;
  enabled: boolean;
  sessionScoped: boolean;
}

type WhatsAppStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

interface WhatsAppLog {
  id: number;
  phoneNumber: string;
  status: WhatsAppStatus;
  type: string;
  orderId: number | null;
  attempts: number;
  errorMessage: string | null;
  sentAt: string;
}

const emptyWhatsAppStats: Record<WhatsAppStatus, number> = {
  PENDING: 0,
  SENT: 0,
  DELIVERED: 0,
  READ: 0,
  FAILED: 0
};

const whatsappStatusLabels: Record<WhatsAppStatus, string> = {
  PENDING: 'En attente',
  SENT: 'Accepté',
  DELIVERED: 'Livré',
  READ: 'Lu',
  FAILED: 'Échec'
};

const whatsappStatusStyles: Record<WhatsAppStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  SENT: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  READ: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800'
};

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
  const [whatsappConfig, setWhatsAppConfig] = useState<WhatsAppConfig>({
    provider: 'WaSenderAPI',
    apiUrl: 'https://www.wasenderapi.com/api',
    configured: false,
    enabled: false,
    sessionScoped: true
  });
  const [whatsappStats, setWhatsAppStats] = useState(emptyWhatsAppStats);
  const [whatsappLogs, setWhatsAppLogs] = useState<WhatsAppLog[]>([]);
  const [testPhone, setTestPhone] = useState('');
  const [testingType, setTestingType] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadStats();
    loadWhatsAppHistory();
    const refreshTimer = window.setInterval(loadWhatsAppHistory, 30000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/sms-settings');
      setSettings(response.data.settings);
      setGlobalEnabled(response.data.globalEnabled);
      setAndroidConfig(response.data.androidConfig);
      setWhatsAppConfig(response.data.whatsappConfig);
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

  const loadWhatsAppHistory = async () => {
    try {
      const response = await api.get('/sms-settings/whatsapp-history');
      setWhatsAppStats({ ...emptyWhatsAppStats, ...response.data.stats });
      setWhatsAppLogs(response.data.logs || []);
    } catch (error: any) {
      console.error('Erreur chargement suivi WhatsApp:', error);
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

      {/* Canal WhatsApp supplémentaire */}
      <div className={`border rounded-lg p-4 ${
        whatsappConfig.configured && whatsappConfig.enabled
          ? 'bg-green-50 border-green-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-start gap-3">
          <MessageCircle className={`w-6 h-6 mt-0.5 ${
            whatsappConfig.configured && whatsappConfig.enabled
              ? 'text-green-600'
              : 'text-amber-600'
          }`} />
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${
              whatsappConfig.configured && whatsappConfig.enabled
                ? 'text-green-900'
                : 'text-amber-900'
            }`}>
              Canal WhatsApp via WaSenderAPI
            </h3>
            <p className={`mt-1 text-sm ${
              whatsappConfig.configured && whatsappConfig.enabled
                ? 'text-green-800'
                : 'text-amber-800'
            }`}>
              {whatsappConfig.configured && whatsappConfig.enabled
                ? 'Actif uniquement pour « Livreur assigné ». Toutes les autres notifications restent envoyées par SMS seulement.'
                : 'Inactif : ajoutez la clé de session WaSenderAPI et activez WHATSAPP_ENABLED sur Railway.'}
            </p>

            {whatsappConfig.configured && whatsappConfig.enabled && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(Object.keys(emptyWhatsAppStats) as WhatsAppStatus[]).map(status => (
                    <div key={status} className="rounded-lg bg-white/80 border border-white px-3 py-2">
                      <div className="text-lg font-bold text-gray-900">{whatsappStats[status]}</div>
                      <div className="text-xs text-gray-600">{whatsappStatusLabels[status]}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-lg border border-green-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Derniers messages WhatsApp</h4>
                      <p className="text-xs text-gray-500">Mise à jour automatique toutes les 30 secondes</p>
                    </div>
                    <button
                      type="button"
                      onClick={loadWhatsAppHistory}
                      className="text-xs font-medium text-green-700 hover:text-green-900"
                    >
                      Actualiser
                    </button>
                  </div>
                  {whatsappLogs.length === 0 ? (
                    <p className="px-4 py-5 text-sm text-gray-500">Aucun message WhatsApp enregistré.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs text-gray-500">
                          <tr>
                            <th className="px-4 py-2 font-medium">Date</th>
                            <th className="px-4 py-2 font-medium">Destinataire</th>
                            <th className="px-4 py-2 font-medium">Notification</th>
                            <th className="px-4 py-2 font-medium">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {whatsappLogs.slice(0, 10).map(log => (
                            <tr key={log.id} title={log.errorMessage || undefined}>
                              <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                                {new Date(log.sentAt).toLocaleString('fr-FR')}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-gray-900">{log.phoneNumber}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                                {log.type.replaceAll('_', ' ')}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${whatsappStatusStyles[log.status]}`}>
                                  {whatsappStatusLabels[log.status]}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
                      {setting.key === 'SMS_MARKETING_RELAUNCH' ? (
                        <Link
                          to="/admin/products"
                          className="px-3 py-2 text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-4 h-4" />
                          Configurer par produit
                        </Link>
                      ) : (
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
                      )}

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

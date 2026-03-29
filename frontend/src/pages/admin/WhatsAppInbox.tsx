import { useEffect, useMemo, useState } from 'react';
import {
  MessageCircle,
  Search,
  Bot,
  User,
  UserCheck,
  Send,
  Loader2,
  RefreshCw,
  Save,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { whatsappApi } from '@/lib/api';
import type { WhatsAppConversation, WhatsAppMessage, WhatsAppIntent } from '@/types';

interface InboxStats {
  totalConversations: number;
  activeConversations7d: number;
  handoverCount: number;
  messages7d: {
    client: number;
    bot: number;
    agent: number;
  };
}

interface KnowledgeRow {
  productId: number;
  productCode: string;
  productName: string;
  configured: boolean;
  knowledge: {
    keyBenefits?: string;
    usageTips?: string;
    objectionHandling?: Array<{ keywords?: string[]; answer: string }>;
    faq?: Array<{ keywords?: string[]; answer: string }>;
    closingScript?: string;
    missingInfoEscalation?: string;
  } | null;
}

const INTENT_OPTIONS: Array<{ label: string; value: WhatsAppIntent | 'ALL' }> = [
  { label: 'Tous', value: 'ALL' },
  { label: 'Commande', value: 'ORDER' },
  { label: 'Info produit', value: 'PRODUCT_INFO' },
  { label: 'Service client', value: 'CUSTOMER_SERVICE' },
  { label: 'SAV', value: 'AFTER_SALES' },
  { label: 'Inconnu', value: 'UNKNOWN' }
];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('fr-FR');
}

function getIntentBadge(intent: WhatsAppIntent) {
  const map: Record<WhatsAppIntent, string> = {
    ORDER: 'bg-green-100 text-green-700',
    PRODUCT_INFO: 'bg-blue-100 text-blue-700',
    CUSTOMER_SERVICE: 'bg-purple-100 text-purple-700',
    AFTER_SALES: 'bg-orange-100 text-orange-700',
    UNKNOWN: 'bg-gray-100 text-gray-700'
  };
  return map[intent] || map.UNKNOWN;
}

export default function WhatsAppInbox() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [search, setSearch] = useState('');
  const [intent, setIntent] = useState<WhatsAppIntent | 'ALL'>('ALL');
  const [handoverFilter, setHandoverFilter] = useState<'all' | 'human' | 'bot'>('all');
  const [knowledgeRows, setKnowledgeRows] = useState<KnowledgeRow[]>([]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeRow | null>(null);
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [savingKnowledge, setSavingKnowledge] = useState(false);
  const [knowledgeForm, setKnowledgeForm] = useState({
    keyBenefits: '',
    usageTips: '',
    objectionHandling: '[]',
    faq: '[]',
    closingScript: '',
    missingInfoEscalation: ''
  });

  const filters = useMemo(() => {
    const params: {
      search?: string;
      intent?: string;
      handedToHuman?: 'true' | 'false';
      page?: number;
      limit?: number;
    } = { page: 1, limit: 100 };

    if (search.trim()) params.search = search.trim();
    if (intent !== 'ALL') params.intent = intent;
    if (handoverFilter === 'human') params.handedToHuman = 'true';
    if (handoverFilter === 'bot') params.handedToHuman = 'false';

    return params;
  }, [search, intent, handoverFilter]);

  const loadStats = async () => {
    const data = await whatsappApi.getStats();
    setStats(data);
  };

  const loadConversations = async () => {
    const data = await whatsappApi.getConversations(filters);
    setConversations(data.conversations || []);
    if (!selectedConversation && data.conversations?.length > 0) {
      setSelectedConversation(data.conversations[0]);
    }
  };

  const loadMessages = async (conversationId: number) => {
    setLoadingMessages(true);
    try {
      const data = await whatsappApi.getMessages(conversationId, 200);
      setMessages(data.messages || []);
      setSelectedConversation(data.conversation || null);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erreur lors du chargement des messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadKnowledge = async () => {
    const data = await whatsappApi.getKnowledge({
      search: knowledgeSearch.trim() || undefined
    });
    setKnowledgeRows(data.items || []);
    if (!selectedKnowledge && data.items?.length > 0) {
      setSelectedKnowledge(data.items[0]);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadStats(), loadConversations()]);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erreur lors du chargement WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    loadKnowledge().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations().catch(() => undefined);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadKnowledge().catch(() => undefined);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knowledgeSearch]);

  useEffect(() => {
    if (selectedConversation?.id) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (!selectedKnowledge) return;
    setKnowledgeForm({
      keyBenefits: selectedKnowledge.knowledge?.keyBenefits || '',
      usageTips: selectedKnowledge.knowledge?.usageTips || '',
      objectionHandling: JSON.stringify(selectedKnowledge.knowledge?.objectionHandling || [], null, 2),
      faq: JSON.stringify(selectedKnowledge.knowledge?.faq || [], null, 2),
      closingScript: selectedKnowledge.knowledge?.closingScript || '',
      missingInfoEscalation: selectedKnowledge.knowledge?.missingInfoEscalation || ''
    });
  }, [selectedKnowledge]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadStats(), loadConversations()]);
      await loadKnowledge();
      if (selectedConversation?.id) {
        await loadMessages(selectedConversation.id);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const toggleHandover = async () => {
    if (!selectedConversation) return;
    try {
      const next = !selectedConversation.handedToHuman;
      await whatsappApi.setHandover(selectedConversation.id, next);
      toast.success(next ? 'Conversation transferee a un agent humain' : 'Conversation rendue au bot');
      await Promise.all([loadConversations(), loadMessages(selectedConversation.id)]);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erreur de mise a jour');
    }
  };

  const sendManualReply = async () => {
    if (!selectedConversation || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await whatsappApi.sendManualReply(selectedConversation.id, replyText.trim());
      setReplyText('');
      toast.success('Message envoye');
      await loadMessages(selectedConversation.id);
      await loadConversations();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erreur envoi message');
    } finally {
      setSendingReply(false);
    }
  };

  const saveKnowledge = async () => {
    if (!selectedKnowledge) return;
    setSavingKnowledge(true);
    try {
      let objectionHandling: Array<{ keywords?: string[]; answer: string }> = [];
      let faq: Array<{ keywords?: string[]; answer: string }> = [];
      try {
        objectionHandling = JSON.parse(knowledgeForm.objectionHandling || '[]');
        faq = JSON.parse(knowledgeForm.faq || '[]');
      } catch {
        toast.error('Le JSON objections/FAQ est invalide');
        return;
      }

      await whatsappApi.upsertKnowledge(selectedKnowledge.productId, {
        keyBenefits: knowledgeForm.keyBenefits.trim(),
        usageTips: knowledgeForm.usageTips.trim(),
        objectionHandling,
        faq,
        closingScript: knowledgeForm.closingScript.trim(),
        missingInfoEscalation: knowledgeForm.missingInfoEscalation.trim()
      });

      toast.success('Connaissance produit enregistree');
      await loadKnowledge();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erreur sauvegarde connaissance');
    } finally {
      setSavingKnowledge(false);
    }
  };

  const deleteKnowledge = async () => {
    if (!selectedKnowledge) return;
    setSavingKnowledge(true);
    try {
      await whatsappApi.deleteKnowledge(selectedKnowledge.productId);
      toast.success('Connaissance supprimee');
      await loadKnowledge();
      setSelectedKnowledge(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Erreur suppression connaissance');
    } finally {
      setSavingKnowledge(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-7 h-7 text-green-600" />
            WhatsApp Inbox
          </h1>
          <p className="text-gray-600 mt-1">
            Supervision des conversations bot/agent et reponse manuelle.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm flex items-center gap-2"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Conversations total</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalConversations || 0}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Actives (7j)</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.activeConversations7d || 0}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">En mode humain</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.handoverCount || 0}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Messages 7j (C/B/A)</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats?.messages7d?.client || 0}/{stats?.messages7d?.bot || 0}/{stats?.messages7d?.agent || 0}
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Knowledge commerciale (V2)</h2>
            <p className="text-sm text-gray-600">Arguments, objections, FAQ, closing et message d'escalade.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="border rounded-lg p-3">
            <input
              className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
              placeholder="Rechercher produit code/nom..."
              value={knowledgeSearch}
              onChange={(e) => setKnowledgeSearch(e.target.value)}
            />
            <div className="max-h-[320px] overflow-y-auto space-y-2">
              {knowledgeRows.map((row) => (
                <button
                  key={row.productId}
                  onClick={() => setSelectedKnowledge(row)}
                  className={`w-full text-left border rounded-lg p-2 ${
                    selectedKnowledge?.productId === row.productId ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{row.productCode}</p>
                  <p className="text-xs text-gray-600 truncate">{row.productName}</p>
                  <p className={`text-[11px] mt-1 ${row.configured ? 'text-green-600' : 'text-gray-500'}`}>
                    {row.configured ? 'Configure' : 'Non configure'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 border rounded-lg p-3 space-y-3">
            {!selectedKnowledge ? (
              <p className="text-sm text-gray-500">Selectionne un produit pour configurer la connaissance.</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedKnowledge.productCode} - {selectedKnowledge.productName}
                </p>
                <textarea
                  className="w-full border rounded-lg p-2 text-sm min-h-[70px]"
                  placeholder="Arguments convaincants / benefices"
                  value={knowledgeForm.keyBenefits}
                  onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, keyBenefits: e.target.value }))}
                />
                <textarea
                  className="w-full border rounded-lg p-2 text-sm min-h-[70px]"
                  placeholder="Conseils d'utilisation"
                  value={knowledgeForm.usageTips}
                  onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, usageTips: e.target.value }))}
                />
                <textarea
                  className="w-full border rounded-lg p-2 text-sm min-h-[100px] font-mono"
                  placeholder='Objections JSON: [{"keywords":["cher","prix"],"answer":"..."}]'
                  value={knowledgeForm.objectionHandling}
                  onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, objectionHandling: e.target.value }))}
                />
                <textarea
                  className="w-full border rounded-lg p-2 text-sm min-h-[100px] font-mono"
                  placeholder='FAQ JSON: [{"keywords":["livraison"],"answer":"..."}]'
                  value={knowledgeForm.faq}
                  onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, faq: e.target.value }))}
                />
                <textarea
                  className="w-full border rounded-lg p-2 text-sm min-h-[70px]"
                  placeholder="Script de closing intelligent"
                  value={knowledgeForm.closingScript}
                  onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, closingScript: e.target.value }))}
                />
                <textarea
                  className="w-full border rounded-lg p-2 text-sm min-h-[70px]"
                  placeholder="Message d'escalade si info manquante"
                  value={knowledgeForm.missingInfoEscalation}
                  onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, missingInfoEscalation: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveKnowledge}
                    disabled={savingKnowledge}
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-2 disabled:opacity-60"
                  >
                    {savingKnowledge ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer
                  </button>
                  <button
                    onClick={deleteKnowledge}
                    disabled={savingKnowledge}
                    className="px-3 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-sm flex items-center gap-2 disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[600px]">
        <div className="bg-white border rounded-lg overflow-hidden lg:col-span-1">
          <div className="p-3 border-b space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                placeholder="Nom ou numero..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="border rounded-lg px-2 py-2 text-sm"
                value={intent}
                onChange={(e) => setIntent(e.target.value as WhatsAppIntent | 'ALL')}
              >
                {INTENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="border rounded-lg px-2 py-2 text-sm"
                value={handoverFilter}
                onChange={(e) => setHandoverFilter(e.target.value as 'all' | 'human' | 'bot')}
              >
                <option value="all">Tous modes</option>
                <option value="human">Humain</option>
                <option value="bot">Bot</option>
              </select>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {conversations.map((conv) => {
              const latest = conv.messages?.[0];
              const active = selectedConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-3 border-b hover:bg-gray-50 ${
                    active ? 'bg-blue-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {conv.clientName || 'Client WhatsApp'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{conv.phoneNumber}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getIntentBadge(conv.currentIntent)}`}>
                      {conv.currentIntent}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                    {latest?.message || 'Aucun message'}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{formatDateTime(conv.lastMessageAt)}</span>
                    <span className={conv.handedToHuman ? 'text-orange-600' : 'text-green-600'}>
                      {conv.handedToHuman ? 'Mode humain' : 'Mode bot'}
                    </span>
                  </div>
                </button>
              );
            })}
            {conversations.length === 0 && (
              <div className="p-4 text-sm text-gray-500">Aucune conversation trouvee.</div>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden lg:col-span-2 flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Selectionne une conversation.
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedConversation.clientName || 'Client WhatsApp'}
                  </p>
                  <p className="text-sm text-gray-500">{selectedConversation.phoneNumber}</p>
                </div>
                <button
                  onClick={toggleHandover}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    selectedConversation.handedToHuman
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {selectedConversation.handedToHuman ? 'Rendre au bot' : 'Transferer humain'}
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[430px]">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isClient = msg.sender === 'CLIENT';
                    const isAgent = msg.sender === 'AGENT';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                            isClient
                              ? 'bg-gray-100 text-gray-800'
                              : isAgent
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1 text-xs opacity-70">
                            {isClient ? <User className="w-3 h-3" /> : isAgent ? <UserCheck className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                            {msg.sender}
                          </div>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          <p className="text-[11px] mt-1 opacity-60">{formatDateTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 border-t">
                <div className="flex items-end gap-2">
                  <textarea
                    className="flex-1 border rounded-lg p-2 text-sm min-h-[72px]"
                    placeholder="Reponse manuelle au client..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button
                    onClick={sendManualReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60 flex items-center gap-2"
                  >
                    {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Envoyer
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Astuce: active le mode humain avant de repondre manuellement.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

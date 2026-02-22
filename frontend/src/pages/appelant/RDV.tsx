import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Clock, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  Edit2,
  X,
  Search,
  Filter,
  Truck,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { rdvApi, ordersApi } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';
import ExpeditionModal from '@/components/modals/ExpeditionModal';
import ExpressModal from '@/components/modals/ExpressModal';

export default function RDV() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRappele, setFilterRappele] = useState<string>('non'); // 'tous', 'non', 'oui'
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showTraiterModal, setShowTraiterModal] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [showExpeditionModal, setShowExpeditionModal] = useState(false);
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [note, setNote] = useState('');
  const [modifRdvDate, setModifRdvDate] = useState('');
  const [modifRdvNote, setModifRdvNote] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

  const { data: rdvData, isLoading } = useQuery({
    queryKey: ['rdv', filterRappele, searchTerm],
    queryFn: () => rdvApi.getAll({
      rappele: filterRappele === 'tous' ? undefined : filterRappele === 'oui',
      search: searchTerm || undefined
    }),
    refetchInterval: 60000, // ✅ Optimisé : 1 minute
    staleTime: 30000, // ✅ Données fraîches pendant 30 secondes
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: string; note?: string }) =>
      ordersApi.updateStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      queryClient.invalidateQueries({ queryKey: ['appelant-my-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caller-stats'] });
      setSelectedOrder(null);
      setNote('');
      setShowTraiterModal(false);
      toast.success('✅ Commande traitée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  const attentePaiementMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      ordersApi.marquerAttentePaiement(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      queryClient.invalidateQueries({ queryKey: ['appelant-my-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caller-stats'] });
      setSelectedOrder(null);
      setNote('');
      setShowTraiterModal(false);
      toast.success('✅ Commande marquée en attente de paiement');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise en attente');
    },
  });

  const modifierMutation = useMutation({
    mutationFn: ({ orderId, rdvDate, rdvNote }: { orderId: number; rdvDate?: string; rdvNote?: string }) => 
      rdvApi.modifier(orderId, rdvDate, rdvNote),
    onSuccess: () => {
      toast.success('✅ RDV modifié avec succès');
      queryClient.invalidateQueries({ queryKey: ['rdv'] });
      setShowModifierModal(false);
      setSelectedOrder(null);
      setModifRdvDate('');
      setModifRdvNote('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    },
  });

  const annulerMutation = useMutation({
    mutationFn: (orderId: number) => rdvApi.annuler(orderId),
    onSuccess: () => {
      toast.success('✅ RDV annulé');
      queryClient.invalidateQueries({ queryKey: ['rdv'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'annulation');
    },
  });

  const annulerSelectionMutation = useMutation({
    mutationFn: async (orderIds: number[]) => {
      const results = await Promise.allSettled(orderIds.map((orderId) => rdvApi.annuler(orderId)));
      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failedCount = results.length - successCount;
      return { successCount, failedCount };
    },
    onSuccess: ({ successCount, failedCount }) => {
      queryClient.invalidateQueries({ queryKey: ['rdv'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrderIds([]);

      if (failedCount > 0) {
        toast.error(`Suppression partielle: ${successCount} supprimé(s), ${failedCount} échec(s).`);
        return;
      }

      toast.success(`✅ ${successCount} contact(s) supprimé(s) du RDV.`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression multiple');
    },
  });

  const handleTraiter = (order: any) => {
    setSelectedOrder(order);
    setNote('');
    setShowTraiterModal(true);
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedOrder) return;
    updateStatusMutation.mutate({
      id: selectedOrder.id,
      status,
      note: note.trim() || undefined
    });
  };

  const handleAttentePaiement = () => {
    if (!selectedOrder) return;
    attentePaiementMutation.mutate({
      id: selectedOrder.id,
      note: note.trim() || undefined
    });
  };

  const handleModifier = (order: any) => {
    setSelectedOrder(order);
    setModifRdvDate(order.rdvDate ? new Date(order.rdvDate).toISOString().slice(0, 16) : '');
    setModifRdvNote(order.rdvNote || '');
    setShowModifierModal(true);
  };

  const confirmModifier = () => {
    if (selectedOrder) {
      modifierMutation.mutate({
        orderId: selectedOrder.id,
        rdvDate: modifRdvDate || undefined,
        rdvNote: modifRdvNote || undefined
      });
    }
  };

  const handleAnnuler = (order: any) => {
    if (window.confirm(`Voulez-vous vraiment annuler le RDV pour ${order.clientNom} ?`)) {
      annulerMutation.mutate(order.id);
    }
  };

  const orders = rdvData?.orders || [];

  useEffect(() => {
    const visibleIds = new Set(orders.map((order: any) => order.id));
    setSelectedOrderIds((prevIds) => prevIds.filter((id) => visibleIds.has(id)));
  }, [orders]);

  const selectedCount = selectedOrderIds.length;
  const allSelected = useMemo(
    () => orders.length > 0 && selectedCount === orders.length,
    [orders.length, selectedCount]
  );

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrderIds((prevIds) =>
      prevIds.includes(orderId) ? prevIds.filter((id) => id !== orderId) : [...prevIds, orderId]
    );
  };

  const toggleAllSelection = () => {
    if (allSelected) {
      setSelectedOrderIds([]);
      return;
    }
    setSelectedOrderIds(orders.map((order: any) => order.id));
  };

  const handleDeleteSelection = () => {
    if (selectedOrderIds.length === 0) return;
    if (window.confirm(`Supprimer ${selectedOrderIds.length} contact(s) RDV sélectionné(s) ?`)) {
      annulerSelectionMutation.mutate(selectedOrderIds);
    }
  };

  const getUrgenceClass = (rdvDate: string, rappele: boolean) => {
    if (rappele) return 'border-green-300 bg-green-50';
    
    const now = new Date();
    const rdv = new Date(rdvDate);
    const diffHours = (rdv.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) return 'border-red-300 bg-red-50'; // En retard
    if (diffHours < 24) return 'border-orange-300 bg-orange-50'; // Aujourd'hui
    return 'border-blue-300 bg-blue-50'; // Futur
  };

  const getUrgenceBadge = (rdvDate: string, rappele: boolean) => {
    if (rappele) return <span className="badge bg-green-100 text-green-800">✓ Rappelé</span>;
    
    const now = new Date();
    const rdv = new Date(rdvDate);
    const diffHours = (rdv.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) return <span className="badge bg-red-100 text-red-800 flex items-center gap-1"><AlertCircle size={14} /> En retard</span>;
    if (diffHours < 24) return <span className="badge bg-orange-100 text-orange-800 flex items-center gap-1"><Clock size={14} /> Aujourd'hui</span>;
    return <span className="badge bg-blue-100 text-blue-800 flex items-center gap-1"><Calendar size={14} /> À venir</span>;
  };

  const stats = rdvData?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📅 Rendez-vous (RDV)</h1>
          <p className="text-gray-600 mt-1">Gestion des rappels clients programmés</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total RDV</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total || 0}</p>
            </div>
            <Calendar className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="card bg-orange-50 border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Aujourd'hui</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{stats.aujourdhui || 0}</p>
            </div>
            <Clock className="text-orange-500" size={32} />
          </div>
        </div>

        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">En retard</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{stats.enRetard || 0}</p>
            </div>
            <AlertCircle className="text-red-500" size={32} />
          </div>
        </div>

        <div className="card bg-yellow-50 border-2 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">À rappeler</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.aRappeler || 0}</p>
            </div>
            <Phone className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="card bg-green-50 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Rappelés</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.rappeles || 0}</p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterRappele}
              onChange={(e) => setFilterRappele(e.target.value)}
              className="input"
            >
              <option value="tous">Tous les RDV</option>
              <option value="non">À rappeler</option>
              <option value="oui">Déjà rappelés</option>
            </select>
          </div>
        </div>

        {orders.length > 0 && (
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-gray-200 pt-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAllSelection}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Tout sélectionner
            </label>

            <button
              onClick={handleDeleteSelection}
              disabled={selectedCount === 0 || annulerSelectionMutation.isPending}
              className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {annulerSelectionMutation.isPending
                ? 'Suppression...'
                : `Supprimer la sélection (${selectedCount})`}
            </button>
          </div>
        )}
      </div>

      {/* Liste des RDV */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">Aucun RDV programmé</p>
          <p className="text-gray-500 text-sm mt-2">Les RDV programmés apparaîtront ici</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map((order: any) => (
            <div key={order.id} className={`card border-2 ${getUrgenceClass(order.rdvDate, order.rdvRappele)}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    {getUrgenceBadge(order.rdvDate, order.rdvRappele)}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">{order.clientNom}</h3>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-primary-400" />
                    <a 
                      href={`tel:${order.clientTelephone}`}
                      className="text-sm text-primary-600 hover:text-primary-800 hover:underline font-medium"
                    >
                      {order.clientTelephone}
                    </a>
                  </div>
                  <p className="text-sm text-gray-600">📍 {order.clientVille}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Réf: {order.orderReference}</p>
                  <p className="font-bold text-gray-900">{formatCurrency(order.montant)}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {new Date(order.rdvDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {new Date(order.rdvDate).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {order.rdvNote && (
                <div className="bg-white bg-opacity-70 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Note:</span> {order.rdvNote}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 mb-3">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Produit:</span> {order.product?.nom || order.produitNom} (x{order.quantite})
                </p>
              </div>

              {!order.rdvRappele && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTraiter(order)}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Phone size={18} />
                    Traiter
                  </button>
                  <button
                    onClick={() => handleModifier(order)}
                    className="btn btn-secondary flex items-center justify-center gap-2"
                    disabled={modifierMutation.isPending}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleAnnuler(order)}
                    className="btn bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
                    disabled={annulerMutation.isPending}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {order.rdvRappele && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Client rappelé - Commande retournée dans "À appeler"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Traiter */}
      {showTraiterModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Traiter l'appel</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg">{selectedOrder.clientNom}</h3>
              <p className="text-gray-600">{selectedOrder.clientVille}</p>
              <a href={`tel:${selectedOrder.clientTelephone}`} className="text-primary-600 text-lg font-medium">
                {selectedOrder.clientTelephone}
              </a>
              <p className="mt-2 text-sm">
                <strong>Produit:</strong> {selectedOrder.product?.nom || selectedOrder.produitNom} (x{selectedOrder.quantite})
              </p>
              <p className="text-sm">
                <strong>Montant:</strong> {formatCurrency(selectedOrder.montant)}
              </p>
              {selectedOrder.rdvNote && (
                <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-xs text-yellow-800 font-medium mb-1">📝 Note RDV:</p>
                  <p className="text-sm text-gray-700">{selectedOrder.rdvNote}</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note (optionnel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input"
                rows={3}
                placeholder="Ajouter une note..."
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleUpdateStatus('VALIDEE')}
                className="btn btn-success w-full"
                disabled={updateStatusMutation.isPending}
              >
                ✓ Commande validée (Livraison locale)
              </button>
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="text-xs text-gray-600 mb-2 font-medium">Pour les villes éloignées :</p>
                
              <button
                onClick={() => {
                  setShowExpeditionModal(true);
                }}
                className="btn bg-blue-600 text-white hover:bg-blue-700 w-full flex items-center justify-center gap-2"
                disabled={updateStatusMutation.isPending}
              >
                <Truck size={18} />
                📦 EXPÉDITION (Paiement 100%)
              </button>
              
              <button
                onClick={handleAttentePaiement}
                className="btn bg-purple-100 text-purple-700 hover:bg-purple-200 w-full flex items-center justify-center gap-2 mt-2 border border-purple-300"
                disabled={attentePaiementMutation.isPending}
              >
                <Clock size={18} />
                ⏳ En attente de paiement (EXPÉDITION)
              </button>
              
              <button
                onClick={() => {
                  setShowExpressModal(true);
                }}
                className="btn bg-amber-600 text-white hover:bg-amber-700 w-full flex items-center justify-center gap-2 mt-2"
                disabled={updateStatusMutation.isPending}
              >
                <Zap size={18} />
                ⚡ EXPRESS (Paiement 10%)
              </button>
              </div>
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <button
                  onClick={() => handleUpdateStatus('INJOIGNABLE')}
                  className="btn btn-secondary w-full"
                  disabled={updateStatusMutation.isPending}
                >
                  📵 Client injoignable
                </button>
                <button
                  onClick={() => handleUpdateStatus('ANNULEE')}
                  className="btn btn-danger w-full mt-2"
                  disabled={updateStatusMutation.isPending}
                >
                  ✕ Commande annulée
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setShowTraiterModal(false);
                setSelectedOrder(null);
                setNote('');
              }}
              className="btn btn-secondary w-full mt-4"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modals EXPÉDITION & EXPRESS */}
      {showExpeditionModal && selectedOrder && (
        <ExpeditionModal
          order={selectedOrder}
          onClose={() => {
            setShowExpeditionModal(false);
            setShowTraiterModal(false);
            setSelectedOrder(null);
            setNote('');
          }}
        />
      )}

      {showExpressModal && selectedOrder && (
        <ExpressModal
          order={selectedOrder}
          onClose={() => {
            setShowExpressModal(false);
            setShowTraiterModal(false);
            setSelectedOrder(null);
            setNote('');
          }}
        />
      )}

      {/* Modal Modifier */}
      {showModifierModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">✏️ Modifier le RDV</h3>
            <p className="text-gray-700 mb-4">
              Client: <span className="font-medium">{selectedOrder.clientNom}</span>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date et heure du RDV *
                </label>
                <input
                  type="datetime-local"
                  value={modifRdvDate}
                  onChange={(e) => setModifRdvDate(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={modifRdvNote}
                  onChange={(e) => setModifRdvNote(e.target.value)}
                  placeholder="Ex: Client occupé, en voyage, demande rappel..."
                  className="input w-full"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmModifier}
                disabled={!modifRdvDate || modifierMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {modifierMutation.isPending ? 'Modification...' : 'Modifier'}
              </button>
              <button
                onClick={() => {
                  setShowModifierModal(false);
                  setSelectedOrder(null);
                  setModifRdvDate('');
                  setModifRdvNote('');
                }}
                className="btn btn-secondary flex-1"
                disabled={modifierMutation.isPending}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


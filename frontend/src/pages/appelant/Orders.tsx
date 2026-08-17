import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Search, RefreshCw, Truck, Zap, Clock, Calendar, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi, rdvApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import type { Order } from '@/types';
import ExpeditionModal from '@/components/modals/ExpeditionModal';
import ExpressModal from '@/components/modals/ExpressModal';
import CreateOrderModal from '@/components/modals/CreateOrderModal';
import { useAuthStore } from '@/store/authStore';

// 🚀 PAGINATION SERVEUR
const ITEMS_PER_PAGE = 150; // Charge 150 commandes par requête serveur

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [note, setNote] = useState('');
  const [showExpeditionModal, setShowExpeditionModal] = useState(false);
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showRdvModal, setShowRdvModal] = useState(false);
  const [rdvDate, setRdvDate] = useState('');
  const [rdvNote, setRdvNote] = useState('');
  const [showQuantiteModal, setShowQuantiteModal] = useState(false);
  const [newQuantite, setNewQuantite] = useState(1);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // 🆕 Pagination
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Vérifier si l'utilisateur peut modifier la quantité (Admin ou Gestionnaire)
  const canEditQuantite = user?.role === 'ADMIN' || user?.role === 'GESTIONNAIRE';
  
  // Vérifier si l'utilisateur peut supprimer des commandes (Admin uniquement)
  const canDeleteOrders = user?.role === 'ADMIN';

  // Vérifier si l'utilisateur peut prioriser des commandes (Admin ou Gestionnaire)
  const canPrioritize = user?.role === 'ADMIN' || user?.role === 'GESTIONNAIRE';

  const { data: ordersData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['appelant-orders', currentPage, searchTerm, statusFilter],
    queryFn: () =>
      ordersApi.getAll({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        lightweight: true,
        toCallOnly: true,
        search: searchTerm || undefined,
        status: statusFilter || undefined
      }),
    staleTime: 60000, // 🚀 OPTIMISATION : Considérer les données fraîches pendant 1 minute
    gcTime: 300000, // 🚀 OPTIMISATION : Garder en cache 5 minutes (anciennement cacheTime)
    refetchInterval: 60000, // 🚀 OPTIMISATION : Refetch toutes les 60s au lieu de 30s
    refetchIntervalInBackground: true, // Continue même si l'onglet n'est pas actif
  });

  // Compteur pour afficher le temps écoulé depuis la dernière actualisation
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [previousCount, setPreviousCount] = useState(0);

  useEffect(() => {
    if (!isFetching) {
      setLastUpdate(new Date());
      setSecondsSinceUpdate(0);
    }
  }, [isFetching]);

  // Mise à jour du compteur toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSinceUpdate(Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: string; note?: string }) =>
      ordersApi.updateStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      queryClient.invalidateQueries({ queryKey: ['appelant-my-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caller-stats'] }); // ✅ AJOUTÉ : Invalider aussi les stats de Performance des Appelants
      setSelectedOrder(null);
      setNote('');
      toast.success('Commande mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  const attentePaiementMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      ordersApi.marquerAttentePaiement(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      queryClient.invalidateQueries({ queryKey: ['appelant-my-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caller-stats'] }); // ✅ AJOUTÉ : Invalider aussi les stats de Performance des Appelants
      setSelectedOrder(null);
      setNote('');
      toast.success('✅ Commande marquée en attente de paiement');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise en attente');
    },
  });

  const programmerRdvMutation = useMutation({
    mutationFn: ({ id, rdvDate, rdvNote }: { id: number; rdvDate: string; rdvNote?: string }) =>
      rdvApi.programmer(id, rdvDate, rdvNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      queryClient.invalidateQueries({ queryKey: ['rdv'] });
      setShowRdvModal(false);
      setRdvDate('');
      setRdvNote('');
      toast.success('✅ RDV programmé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la programmation du RDV');
    },
  });

  const updateQuantiteMutation = useMutation({
    mutationFn: ({ orderId, quantite }: { orderId: number; quantite: number }) => 
      ordersApi.updateQuantite(orderId, quantite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      setShowQuantiteModal(false);
      setSelectedOrder(null);
      toast.success('✅ Quantité modifiée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification');
    },
  });

  const deleteOrdersMutation = useMutation({
    mutationFn: (orderIds: number[]) => ordersApi.deleteMultiple(orderIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      setSelectedOrderIds([]);
      setShowDeleteConfirmModal(false);
      toast.success(`✅ ${data.deletedCount} commande(s) supprimée(s) avec succès`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  const prioritizeOrderMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.prioritize(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      toast.success('📌 Commande remontée en haut de la liste');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la priorisation');
    },
  });

  const unprioritizeOrderMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.unprioritize(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      toast.success('✅ Priorité retirée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la dépriorisation');
    },
  });

  const handleUpdateStatus = (status: string) => {
    if (!selectedOrder) return;
    updateStatusMutation.mutate({
      id: selectedOrder.id,
      status,
      note: note || undefined,
    });
  };

  const handleAttentePaiement = () => {
    if (!selectedOrder) return;
    attentePaiementMutation.mutate({
      id: selectedOrder.id,
      note: note || undefined,
    });
  };

  const handleProgrammerRdv = (order: Order) => {
    setSelectedOrder(order);
    // Définir la date/heure par défaut à demain à 9h
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setRdvDate(tomorrow.toISOString().slice(0, 16));
    setRdvNote('');
    setShowRdvModal(true);
  };

  const confirmRdv = () => {
    if (!selectedOrder || !rdvDate) {
      toast.error('Veuillez sélectionner une date et heure pour le RDV');
      return;
    }
    programmerRdvMutation.mutate({
      id: selectedOrder.id,
      rdvDate,
      rdvNote: rdvNote || undefined,
    });
  };

  const handleEditQuantite = (order: Order) => {
    setSelectedOrder(order);
    setNewQuantite(order.quantite);
    setShowQuantiteModal(true);
  };

  const handleUpdateQuantite = () => {
    if (!selectedOrder) return;
    if (newQuantite < 1) {
      toast.error('La quantité doit être au minimum 1');
      return;
    }
    updateQuantiteMutation.mutate({
      orderId: selectedOrder.id,
      quantite: newQuantite,
    });
  };

  const handleToggleOrder = (orderId: number) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const orders = useMemo<Order[]>(() => {
    const rawOrders = (ordersData?.orders || []) as Order[];

    // Garde-fou métier: la page "À appeler" ne doit montrer
    // que les commandes réellement à traiter côté appelant.
    return rawOrders.filter((order) => {
      const isToCall = order.status === 'NOUVELLE' || order.status === 'A_APPELER';
      const hasRdv = (order as any).rdvProgramme;
      return isToCall && !hasRdv;
    });
  }, [ordersData?.orders]);

  const pagination = ordersData?.pagination;
  const totalOrders = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 1;
  const startIndex = totalOrders === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + orders.length, totalOrders);

  const handleToggleAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o: Order) => o.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedOrderIds.length === 0) {
      toast.error('Aucune commande sélectionnée');
      return;
    }
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = () => {
    deleteOrdersMutation.mutate(selectedOrderIds);
  };

  const handlePrioritizeSelected = async () => {
    if (selectedOrderIds.length === 0) {
      toast.error('Aucune commande sélectionnée');
      return;
    }
    
    try {
      // Prioriser toutes les commandes sélectionnées en parallèle
      await Promise.all(
        selectedOrderIds.map(orderId => ordersApi.prioritize(orderId))
      );
      
      // Les commandes remontées passent en tête de liste: revenir page 1 pour les afficher tout de suite.
      setCurrentPage(1);
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      setSelectedOrderIds([]);
      toast.success(`✅ ${selectedOrderIds.length} commande(s) remontée(s) en haut`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la priorisation');
    }
  };

  const handleUnprioritizeSelected = async () => {
    if (selectedOrderIds.length === 0) {
      toast.error('Aucune commande sélectionnée');
      return;
    }
    
    try {
      // Retirer la priorité de toutes les commandes sélectionnées
      await Promise.all(
        selectedOrderIds.map(orderId => ordersApi.unprioritize(orderId))
      );
      
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      setSelectedOrderIds([]);
      toast.success(`✅ Priorité retirée pour ${selectedOrderIds.length} commande(s)`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la dépriorisation');
    }
  };

  // Réinitialiser la page à 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Détecter les nouvelles commandes
  useEffect(() => {
    if (totalOrders > 0 && previousCount > 0 && totalOrders > previousCount) {
      toast.success(`🔔 ${totalOrders - previousCount} nouvelle(s) commande(s) !`, {
        duration: 5000,
      });
    }
    if (totalOrders >= 0) {
      setPreviousCount(totalOrders);
    }
  }, [totalOrders, previousCount]);

  return (
    <div className="space-y-4 px-1 sm:space-y-6 sm:px-0">
      {/* Header responsive */}
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 p-5 text-white shadow-2xl shadow-indigo-950/20 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="relative min-w-0 flex-1">
          <h1 className="flex items-center gap-3 text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-950/30 ring-1 ring-white/25">
              <Phone size={22} />
            </span>
            <span className="truncate">À appeler</span>
          </h1>
          <p className="ml-14 mt-1 text-xs text-sky-100/80 sm:text-sm">Votre file d’appels, claire et priorisée</p>
        </div>
        
        {/* Compteur et actions */}
        <div className="relative flex items-center gap-3 sm:gap-4">
          {ordersData && (
            <div className="flex-shrink-0 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-center shadow-inner backdrop-blur-md sm:text-right">
              <p className="text-lg font-black text-white sm:text-2xl">{totalOrders}</p>
              <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-sky-100/75 sm:text-xs">commande(s)</p>
              {(canPrioritize || canDeleteOrders) && selectedOrderIds.length > 0 && (
                <p className="mt-0.5 text-[10px] font-semibold text-emerald-300 sm:text-xs">
                  {selectedOrderIds.length} sélect.
                </p>
              )}
            </div>
          )}
          
          {/* Actions - Plus compactes sur mobile */}
          <div className="flex flex-col items-end gap-1.5 sm:gap-2">
            {isFetching ? (
              <span className="flex items-center gap-1 text-[10px] text-sky-100/80 sm:text-sm">
                <RefreshCw size={14} className="animate-spin" />
                <span className="hidden sm:inline">Actualisation...</span>
              </span>
            ) : (
              <span className="text-[10px] text-sky-100/60 sm:text-xs">
                {secondsSinceUpdate}s
              </span>
            )}
            
            {/* Boutons - Version mobile optimisée */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-end">
              <button
                onClick={() => setShowCreateOrderModal(true)}
                className="btn flex items-center gap-1 bg-white px-2 py-1.5 text-xs font-bold text-indigo-700 shadow-lg shadow-indigo-950/20 hover:bg-cyan-50 sm:px-4 sm:py-2 sm:text-sm"
                title="Créer une commande"
              >
                <Plus size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Nouvelle</span>
                <span className="sm:hidden">+</span>
              </button>
              
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="btn flex items-center gap-1 border border-white/15 bg-white/10 px-2 py-1.5 text-xs text-white shadow-sm backdrop-blur-md hover:bg-white/20 sm:px-4 sm:py-2 sm:text-sm"
                title="Actualiser"
              >
                <RefreshCw size={14} className={`sm:w-4 sm:h-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </button>
              
              {canPrioritize && selectedOrderIds.length > 0 && (
                <>
                  <button
                    onClick={handlePrioritizeSelected}
                    className="btn bg-gradient-to-r from-success-500 to-emerald-500 text-white hover:from-success-600 hover:to-emerald-600 flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 shadow-md"
                    title="Remonter"
                  >
                    <ArrowUpCircle size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">📌 Remonter</span>
                    <span className="sm:hidden">↑</span>
                    <span className="sm:hidden">({selectedOrderIds.length})</span>
                  </button>
                  
                  <button
                    onClick={handleUnprioritizeSelected}
                    className="btn bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
                    title="Retirer priorité"
                  >
                    <ArrowDownCircle size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Retirer</span>
                    <span className="sm:hidden">↓</span>
                  </button>
                </>
              )}
              
              {canDeleteOrders && selectedOrderIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleteOrdersMutation.isPending}
                  className="btn bg-gradient-to-r from-danger-500 to-red-600 text-white hover:from-danger-600 hover:to-red-700 flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 shadow-md"
                  title="Supprimer"
                >
                  <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Supprimer</span>
                  <span className="sm:hidden">🗑️</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtres - Version mobile optimisée */}
      <div className="rounded-[1.75rem] border border-indigo-100/80 bg-white/90 p-3 shadow-xl shadow-indigo-100/50 backdrop-blur-xl sm:p-4 md:p-5">
        <div className="flex flex-col gap-3">
          {/* Checkbox + Recherche sur une ligne sur mobile */}
          <div className="flex flex-col sm:flex-row gap-3">
            {(canPrioritize || canDeleteOrders) && orders.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                  onChange={handleToggleAll}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="select-all" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer whitespace-nowrap">
                  Tout
                </label>
              </div>
            )}
            
            {/* Recherche */}
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={17} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input border-indigo-100 bg-slate-50/80 pl-9 pr-2 text-sm hover:border-indigo-200"
              />
            </div>
            
            {/* Filtre statut */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full border-indigo-100 bg-slate-50/80 text-sm sm:w-auto sm:min-w-[150px]"
            >
              <option value="">📋 Tous</option>
              <option value="NOUVELLE">🆕 Nouvelle</option>
              <option value="A_APPELER">📞 À appeler</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">Aucune commande trouvée</p>
          <p className="text-gray-400 text-sm mt-2">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <>
          {/* Grid responsive - 1 colonne sur mobile, 2 sur tablette, 3 sur desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {orders?.map((order: Order) => (
            <div
              key={order.id} 
              className={`group relative overflow-hidden rounded-[1.75rem] border p-3 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-4 ${
                selectedOrderIds.includes(order.id) 
                  ? 'border-indigo-500 bg-gradient-to-br from-indigo-100 via-violet-50 to-blue-100 shadow-indigo-300/70 ring-2 ring-indigo-500/70'
                  : order.sourcePage === 'WhatsApp'
                  ? 'border-pink-400 bg-gradient-to-br from-pink-100 via-fuchsia-50 to-rose-100 shadow-pink-200/80 hover:shadow-pink-300/70'
                  : order.enAttentePaiement
                  ? 'border-amber-600 bg-gradient-to-br from-yellow-300 via-amber-200 to-yellow-400 shadow-amber-300/90 hover:shadow-amber-400/80'
                  : (order as any).renvoyeAAppelerAt 
                  ? 'border-emerald-400 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 shadow-emerald-200/80 hover:shadow-emerald-300/70'
                  : order.status === 'A_APPELER'
                  ? 'border-violet-400 bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100 shadow-violet-200/80 hover:shadow-violet-300/70'
                  : 'border-sky-400 bg-gradient-to-br from-cyan-100 via-sky-50 to-blue-100 shadow-sky-200/80 hover:shadow-sky-300/70'
              }`}
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 ${
                selectedOrderIds.includes(order.id)
                  ? 'bg-gradient-to-r from-indigo-500 via-violet-600 to-fuchsia-500'
                  : order.sourcePage === 'WhatsApp'
                  ? 'bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500'
                  : order.enAttentePaiement
                  ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600'
                  : (order as any).renvoyeAAppelerAt
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500'
                  : order.status === 'A_APPELER'
                  ? 'bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-500'
                  : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600'
              }`} />
              {/* Header compacte */}
              <div className="mb-2 flex items-start justify-between pt-1 sm:mb-3">
                <div className="flex items-start gap-1.5 sm:gap-2 flex-1 min-w-0">
                  {(canPrioritize || canDeleteOrders) && (
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={() => handleToggleOrder(order.id)}
                      className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-base font-black tracking-tight text-slate-900 sm:text-lg">{order.clientNom}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{order.clientVille}</p>
                  </div>
                </div>
                
                <div className="flex gap-1 sm:gap-2 items-start flex-shrink-0 ml-2">
                  {canEditQuantite && (
                    <button
                      onClick={() => handleEditQuantite(order)}
                      className="p-1 sm:p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Modifier la quantité"
                    >
                      <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  )}
                  <div className="flex flex-col gap-0.5 sm:gap-1 items-end">
                    <span className={`badge text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    {order.sourcePage === 'WhatsApp' && (
                      <span className="badge bg-pink-100 text-pink-700 border border-pink-300 text-[10px] sm:text-xs flex items-center gap-0.5 px-1.5 py-0.5">
                        💬 <span className="hidden sm:inline">WhatsApp</span>
                      </span>
                    )}
                    {(order as any).renvoyeAAppelerAt && (
                      <span className="badge bg-success-100 text-success-700 border border-success-300 text-[10px] sm:text-xs flex items-center gap-0.5 px-1.5 py-0.5">
                        📌 <span className="hidden sm:inline">Prior.</span>
                      </span>
                    )}
                    {order.enAttentePaiement && (
                      <span className="badge bg-warning-100 text-warning-800 border border-warning-400 text-[10px] sm:text-xs flex items-center gap-0.5 px-1.5 py-0.5">
                        <Clock size={10} className="sm:w-3 sm:h-3" />
                        <span className="hidden sm:inline">⏳</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Infos - Version compacte */}
              <div className="space-y-1.5 sm:space-y-2 mb-3">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/65 px-2.5 py-2 text-xs shadow-sm sm:gap-2 sm:text-sm">
                  <Phone size={14} className="flex-shrink-0 text-sky-500 sm:h-4 sm:w-4" />
                  <a href={`tel:${order.clientTelephone}`} className="truncate font-semibold text-sky-700 hover:underline">
                    {order.clientTelephone}
                  </a>
                </div>
                
                <div className="flex items-start gap-1 text-xs sm:text-sm text-gray-700">
                  <span className="font-semibold flex-shrink-0">📦</span>
                  <span className="line-clamp-2">{order.produitNom}</span>
                </div>
                
                <div className="flex items-center gap-4 rounded-xl border border-white/80 bg-white/65 px-2.5 py-2 text-xs shadow-sm sm:text-sm">
                  <div className="text-gray-700">
                    <span className="font-semibold">Qté:</span> <span className="text-primary-600 font-bold">{order.quantite}</span>
                  </div>
                  <div className="text-gray-900 font-bold">
                    💰 <span className="text-primary-600">{formatCurrency(order.montant)}</span>
                  </div>
                </div>
                
                {/* Note gestionnaire */}
                {(order as any).noteGestionnaire && (
                  <div className="p-1.5 sm:p-2 bg-purple-50 rounded border border-purple-200">
                    <p className="text-[10px] sm:text-xs text-purple-600 font-medium truncate">👕 {(order as any).noteGestionnaire}</p>
                  </div>
                )}
                
                {/* Adresse - affichage conditionnel */}
                {order.clientAdresse && (
                  <div className="text-[10px] sm:text-xs text-gray-600 line-clamp-1">
                    📍 {order.clientAdresse}
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="btn flex items-center justify-center gap-1 bg-gradient-to-r from-sky-500 to-blue-600 px-2 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:from-sky-600 hover:to-blue-700 sm:gap-2 sm:px-4 sm:text-sm"
                >
                  <Phone size={14} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Traiter</span>
                </button>
                <button
                  onClick={() => handleProgrammerRdv(order)}
                  className="btn flex items-center justify-center gap-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2 py-2 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/20 hover:from-violet-700 hover:to-fuchsia-700 sm:gap-2 sm:px-4 sm:text-sm"
                >
                  <Calendar size={14} className="sm:w-[18px] sm:h-[18px]" />
                  <span>RDV</span>
                </button>
              </div>

              {/* Date - Plus compacte */}
              <p className="text-[10px] sm:text-xs text-gray-500 mt-2 truncate">
                🕐 {formatDateTime(order.createdAt)}
              </p>
            </div>
          ))}
          </div>
        </>
      )}

      {/* 🚀 PAGINATION - Responsive optimisée */}
      {totalOrders > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-[1.75rem] border border-indigo-100 bg-white/90 p-3 shadow-xl shadow-indigo-100/40 backdrop-blur-xl sm:mt-6 sm:p-4">
          {/* Compteur */}
          <div className="text-xs sm:text-sm text-center sm:text-left text-gray-600">
            <span className="font-semibold text-primary-600">{startIndex + 1}</span> à{' '}
            <span className="font-semibold text-primary-600">{Math.min(endIndex, totalOrders)}</span> sur{' '}
            <span className="font-bold text-primary-700">{totalOrders}</span>
          </div>

          {/* Boutons de pagination */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Première page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border-2 border-gray-300 text-xs sm:text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-50 hover:border-primary-500 transition-all"
            >
              <span className="hidden sm:inline">⏮ Première</span>
              <span className="sm:hidden">⏮</span>
            </button>
            
            {/* Précédent */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 text-xs sm:text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:from-primary-100 hover:to-primary-200 hover:border-primary-500 transition-all shadow-sm"
            >
              <span className="hidden sm:inline">← Préc.</span>
              <span className="sm:hidden">←</span>
            </button>
            
            {/* Numéro de page */}
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white text-xs sm:text-sm font-black shadow-lg whitespace-nowrap">
              <span className="hidden sm:inline">Page </span>{currentPage} <span className="text-white/70">/ {totalPages}</span>
            </div>
            
            {/* Suivant */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 text-xs sm:text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:from-primary-100 hover:to-primary-200 hover:border-primary-500 transition-all shadow-sm"
            >
              <span className="hidden sm:inline">Suiv. →</span>
              <span className="sm:hidden">→</span>
            </button>
            
            {/* Dernière page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border-2 border-gray-300 text-xs sm:text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-50 hover:border-primary-500 transition-all"
            >
              <span className="hidden sm:inline">Dernière ⏭</span>
              <span className="sm:hidden">⏭</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de traitement */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/60 bg-white p-5 shadow-2xl shadow-slate-950/30 sm:p-6">
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-4 text-white shadow-lg shadow-blue-500/20">
              <span className="rounded-xl bg-white/15 p-2"><Phone size={20} /></span>
              <div>
                <h2 className="text-xl font-black">Traiter l'appel</h2>
                <p className="text-xs text-sky-100">Choisissez la prochaine étape</p>
              </div>
            </div>
            
            <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <h3 className="font-semibold text-lg">{selectedOrder.clientNom}</h3>
              <p className="text-gray-600">{selectedOrder.clientVille}</p>
              <a href={`tel:${selectedOrder.clientTelephone}`} className="text-primary-600 text-lg font-medium">
                {selectedOrder.clientTelephone}
              </a>
              <p className="mt-2 text-sm">
                <strong>Produit:</strong> {selectedOrder.produitNom} (x{selectedOrder.quantite})
              </p>
              <p className="text-sm">
                <strong>Montant:</strong> {formatCurrency(selectedOrder.montant)}
              </p>
              {/* 🆕 Afficher noteGestionnaire (taille, code, etc.) */}
              {(selectedOrder as any).noteGestionnaire && (
                <div className="mt-3 p-2 bg-purple-50 rounded border border-purple-200">
                  <p className="text-xs text-purple-600 font-medium mb-1">📝 Détails produit</p>
                  <p className="text-sm text-gray-700">{(selectedOrder as any).noteGestionnaire}</p>
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
                  setSelectedOrder(selectedOrder);
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
                  setSelectedOrder(selectedOrder);
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
            setSelectedOrder(null);
            setNote('');
          }}
        />
      )}

      {/* Modal RDV */}
      {showRdvModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="text-purple-600" size={24} />
              Programmer un RDV
            </h3>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Client: <span className="font-medium">{selectedOrder.clientNom}</span>
              </p>
              <p className="text-gray-600 text-sm mb-4">
                📞 {selectedOrder.clientTelephone} • 📍 {selectedOrder.clientVille}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date et heure du RDV *
                </label>
                <input
                  type="datetime-local"
                  value={rdvDate}
                  onChange={(e) => setRdvDate(e.target.value)}
                  className="input w-full"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note / Raison du RDV
                </label>
                <textarea
                  value={rdvNote}
                  onChange={(e) => setRdvNote(e.target.value)}
                  placeholder="Ex: Client occupé, en voyage, demande rappel à une heure précise..."
                  className="input w-full"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cette commande sera retirée de "À appeler" et visible dans "RDV Programmés"
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmRdv}
                disabled={!rdvDate || programmerRdvMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {programmerRdvMutation.isPending ? 'Programmation...' : '✓ Programmer RDV'}
              </button>
              <button
                onClick={() => {
                  setShowRdvModal(false);
                  setRdvDate('');
                  setRdvNote('');
                }}
                className="btn btn-secondary flex-1"
                disabled={programmerRdvMutation.isPending}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification de quantité */}
      {showQuantiteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">📦 Modifier la quantité</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-1">Commande</p>
              <p className="font-semibold">{selectedOrder.orderReference}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Client</p>
              <p className="font-semibold">{selectedOrder.clientNom}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Produit</p>
              <p className="font-semibold">{selectedOrder.produitNom}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Quantité actuelle</p>
              <p className="font-semibold text-primary-600">{selectedOrder.quantite}</p>
              
              <p className="text-sm text-gray-600 mt-2 mb-1">Montant actuel</p>
              <p className="font-semibold">{formatCurrency(selectedOrder.montant)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouvelle quantité <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={newQuantite}
                onChange={(e) => setNewQuantite(parseInt(e.target.value) || 1)}
                className="input"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Prix unitaire: {formatCurrency(selectedOrder.montant / selectedOrder.quantite)}
              </p>
              {newQuantite !== selectedOrder.quantite && (
                <p className="text-sm text-primary-600 mt-2 font-semibold">
                  → Nouveau montant: {formatCurrency((selectedOrder.montant / selectedOrder.quantite) * newQuantite)}
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUpdateQuantite}
                disabled={newQuantite === selectedOrder.quantite || updateQuantiteMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {updateQuantiteMutation.isPending ? 'Modification...' : '✓ Confirmer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQuantiteModal(false);
                  setSelectedOrder(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Confirmer la suppression</h2>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Êtes-vous sûr de vouloir supprimer <span className="font-bold text-red-600">{selectedOrderIds.length} commande(s)</span> ?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">⚠️ Attention !</p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Cette action est <strong>irréversible</strong></li>
                  <li>• Les commandes seront définitivement supprimées</li>
                  <li>• Les données ne pourront pas être récupérées</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                disabled={deleteOrdersMutation.isPending}
                className="btn bg-red-600 text-white hover:bg-red-700 flex-1 flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                {deleteOrdersMutation.isPending ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                disabled={deleteOrdersMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de commande */}
      {showCreateOrderModal && (
        <CreateOrderModal onClose={() => setShowCreateOrderModal(false)} />
      )}
    </div>
  );
}


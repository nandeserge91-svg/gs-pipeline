import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Bell, 
  Clock, 
  MapPin,
  User,
  Package,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MessageSquare,
  Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { expressApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/utils/statusHelpers';

export default function ExpressAgence() {
  const [searchTerm, setSearchTerm] = useState('');
  const [agenceFilter, setAgenceFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [nonRetiresOnly, setNonRetiresOnly] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateType, setDateType] = useState<'arrive' | 'retrait'>('arrive'); // Type de filtre de date
  const [triPar, setTriPar] = useState<'date' | 'notifications' | 'jours' | 'dateRetrait'>('jours');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [noteNotification, setNoteNotification] = useState('');
  
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['express-en-agence', searchTerm, agenceFilter, statutFilter, nonRetiresOnly, startDate, endDate, dateType],
    queryFn: () => expressApi.getEnAgence({
      search: searchTerm,
      agence: agenceFilter,
      statut: statutFilter,
      nonRetires: nonRetiresOnly ? 'true' : 'false',
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      dateType: dateType || undefined
    }),
    refetchInterval: 60000, // ✅ Optimisé : 1 minute
    staleTime: 30000, // ✅ Données fraîches pendant 30 secondes // Refresh toutes les 30 secondes
  });

  const notifierMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => 
      expressApi.notifierClient(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['express-en-agence'] });
      setSelectedOrder(null);
      setNoteNotification('');
      toast.success('✅ Client notifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la notification');
    },
  });

  const confirmerRetraitMutation = useMutation({
    mutationFn: (id: number) => expressApi.confirmerRetrait(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['express-en-agence'] });
      toast.success('✅ Retrait confirmé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la confirmation');
    },
  });

  const handleNotifier = (order: any) => {
    setSelectedOrder(order);
    setNoteNotification('');
  };

  const confirmNotification = () => {
    if (!selectedOrder) return;
    notifierMutation.mutate({
      id: selectedOrder.id,
      note: noteNotification.trim() || undefined
    });
  };

  const handleConfirmerRetrait = (orderId: number) => {
    if (window.confirm('Confirmer que le client a retiré son colis ?')) {
      confirmerRetraitMutation.mutate(orderId);
    }
  };

  const orders = data?.orders || [];
  const stats = data?.stats || {};

  // Trier les commandes selon le critère sélectionné
  // ✅ PRIORITÉ: Non retirés (EXPRESS_ARRIVE) en premier, puis Retirés (EXPRESS_LIVRE) en bas
  const sortedOrders = [...orders].sort((a, b) => {
    // 1️⃣ Séparer les non retirés et retirés (priorité absolue)
    const aIsRetire = a.status === 'EXPRESS_LIVRE';
    const bIsRetire = b.status === 'EXPRESS_LIVRE';
    
    if (aIsRetire !== bIsRetire) {
      return aIsRetire ? 1 : -1; // Non retirés en premier
    }
    
    // 2️⃣ À l'intérieur de chaque groupe, trier selon le critère sélectionné
    switch (triPar) {
      case 'date':
        return new Date(b.arriveAt || b.expedieAt).getTime() - new Date(a.arriveAt || a.expedieAt).getTime();
      case 'notifications':
        return b.nombreNotifications - a.nombreNotifications;
      case 'jours':
        return a.joursEnAgence - b.joursEnAgence; // ✅ Récents en premier (moins de jours)
      case 'dateRetrait':
        // Tri par date de retrait (pour les EXPRESS_LIVRE uniquement)
        const aRetraitAt = a.status === 'EXPRESS_LIVRE' ? new Date(a.updatedAt).getTime() : 0;
        const bRetraitAt = b.status === 'EXPRESS_LIVRE' ? new Date(b.updatedAt).getTime() : 0;
        return bRetraitAt - aRetraitAt; // Plus récent en premier
      default:
        return 0;
    }
  });

  // Raccourcis de dates
  const setDateRaccourci = (type: string) => {
    const today = new Date();
    switch(type) {
      case 'aujourdhui':
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'hier':
        const hier = new Date(today);
        hier.setDate(hier.getDate() - 1);
        setStartDate(hier.toISOString().split('T')[0]);
        setEndDate(hier.toISOString().split('T')[0]);
        break;
      case 'semaine':
        const semaine = new Date(today);
        semaine.setDate(semaine.getDate() - 7);
        setStartDate(semaine.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'mois':
        const mois = new Date(today);
        mois.setMonth(mois.getMonth() - 1);
        setStartDate(mois.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'tout':
        setStartDate('');
        setEndDate('');
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec stats */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-slate-950 via-violet-950 to-orange-950 p-5 text-white shadow-2xl shadow-orange-950/20 sm:p-7">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-orange-400/25 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-amber-500 to-rose-600 text-white shadow-xl shadow-orange-950/30 ring-1 ring-white/25">
              <Package size={24} />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">EXPRESS – En agence</h1>
              <p className="mt-1 text-sm text-orange-100/80">Suivi des colis jusqu’au retrait client</p>
            </div>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
            Suivi actif
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="group relative overflow-hidden rounded-[1.6rem] border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-xl shadow-blue-100/60 transition hover:-translate-y-1 hover:shadow-2xl">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-400/10 blur-2xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700/70">Total en agence</p>
              <p className="mt-1 text-3xl font-black text-blue-700">{stats.total || 0}</p>
            </div>
            <span className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-500/25"><Package size={24} /></span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[1.6rem] border border-orange-100 bg-gradient-to-br from-white to-orange-50 p-5 shadow-xl shadow-orange-100/60 transition hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-700/70">Non retirés</p>
              <p className="mt-1 text-3xl font-black text-orange-600">{stats.nonRetires || 0}</p>
            </div>
            <span className="rounded-2xl bg-orange-500 p-3 text-white shadow-lg shadow-orange-500/25"><AlertCircle size={24} /></span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[1.6rem] border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-5 shadow-xl shadow-emerald-100/60 transition hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/70">Retirés</p>
              <p className="mt-1 text-3xl font-black text-emerald-600">{stats.retires || 0}</p>
            </div>
            <span className="rounded-2xl bg-emerald-500 p-3 text-white shadow-lg shadow-emerald-500/25"><CheckCircle2 size={24} /></span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[1.6rem] border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-5 shadow-xl shadow-violet-100/60 transition hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-700/70">Notifications totales</p>
              <p className="mt-1 text-3xl font-black text-violet-600">{stats.nombreNotificationsTotal || 0}</p>
            </div>
            <span className="rounded-2xl bg-violet-600 p-3 text-white shadow-lg shadow-violet-500/25"><Bell size={24} /></span>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="rounded-[2rem] border border-orange-100/80 bg-white/90 p-4 shadow-xl shadow-orange-100/40 backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-gradient-to-br from-orange-100 to-violet-100 p-2 text-violet-700"><Filter size={19} /></span>
            <div>
              <h2 className="text-lg font-black text-slate-900">Filtres de recherche</h2>
              <p className="text-xs text-slate-500">Affinez la file EXPRESS en quelques secondes</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setAgenceFilter('all');
              setStatutFilter('all');
              setNonRetiresOnly(false);
              setStartDate('');
              setEndDate('');
            }}
            className="btn border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          >
            Réinitialiser
          </button>
        </div>

        {/* Raccourcis de dates */}
        <div className="mb-4 border-b border-slate-100 pb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">📅 Filtrer par période :</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setDateRaccourci('aujourdhui')} className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-3 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition hover:-translate-y-0.5">
              Aujourd'hui
            </button>
            <button onClick={() => setDateRaccourci('hier')} className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-100">
              Hier
            </button>
            <button onClick={() => setDateRaccourci('semaine')} className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100">
              7 derniers jours
            </button>
            <button onClick={() => setDateRaccourci('mois')} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
              30 derniers jours
            </button>
            <button onClick={() => setDateRaccourci('tout')} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
              Tout afficher
            </button>
          </div>
        </div>

        {/* Filtres détaillés */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Recherche
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, téléphone, référence, produit..."
                className="input w-full border-orange-100 bg-slate-50/80 pl-10 hover:border-orange-200"
              />
            </div>
          </div>

          {/* Type de filtre de date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📆 Filtrer les dates par
            </label>
            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value as 'arrive' | 'retrait')}
              className="input w-full border-orange-100 bg-slate-50/80"
            >
              <option value="arrive">Date d'arrivée en agence</option>
              <option value="retrait">Date de retrait par client</option>
            </select>
          </div>

          {/* Date de début */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Date de début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-full border-orange-100 bg-slate-50/80"
            />
          </div>

          {/* Date de fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Date de fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-full border-orange-100 bg-slate-50/80"
            />
          </div>

          {/* Tri */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔄 Trier par
            </label>
            <select
              value={triPar}
              onChange={(e) => setTriPar(e.target.value as any)}
              className="input w-full border-violet-100 bg-slate-50/80"
            >
              <option value="jours">Date d'arrivée (récent en premier)</option>
              <option value="notifications">Notifications (à relancer)</option>
              <option value="date">Date d'arrivée exacte (récent)</option>
              <option value="dateRetrait">Date de retrait (récent en premier)</option>
            </select>
          </div>

          {/* Agence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📍 Agence
            </label>
            <select
              value={agenceFilter}
              onChange={(e) => setAgenceFilter(e.target.value)}
              className="input w-full border-violet-100 bg-slate-50/80"
            >
              <option value="all">Toutes les agences</option>
              {stats.agences?.map((agence: string) => (
                <option key={agence} value={agence}>{agence}</option>
              ))}
            </select>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⚡ Statut
            </label>
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="input w-full border-violet-100 bg-slate-50/80"
            >
              <option value="all">Tous les statuts</option>
              <option value="EXPRESS_ARRIVE">En attente de retrait</option>
              <option value="EXPRESS_LIVRE">Retiré</option>
            </select>
          </div>

          {/* Non retirés */}
          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-2 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 p-3 transition hover:border-orange-200 hover:shadow-md">
              <input
                type="checkbox"
                checked={nonRetiresOnly}
                onChange={(e) => setNonRetiresOnly(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">⏳ Non retirés uniquement</span>
            </label>
          </div>
        </div>

        {/* Résumé des filtres actifs */}
        {(searchTerm || agenceFilter !== 'all' || statutFilter !== 'all' || nonRetiresOnly || startDate || endDate) && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">Filtres actifs :</p>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="badge bg-blue-100 text-blue-800">
                  🔍 "{searchTerm}"
                </span>
              )}
              {agenceFilter !== 'all' && (
                <span className="badge bg-purple-100 text-purple-800">
                  📍 {agenceFilter}
                </span>
              )}
              {statutFilter !== 'all' && (
                <span className="badge bg-green-100 text-green-800">
                  ⚡ {statutFilter === 'EXPRESS_ARRIVE' ? 'En attente' : 'Retiré'}
                </span>
              )}
              {nonRetiresOnly && (
                <span className="badge bg-orange-100 text-orange-800">
                  ⏳ Non retirés
                </span>
              )}
              {startDate && (
                <span className="badge bg-cyan-100 text-cyan-800">
                  📅 Du {new Date(startDate).toLocaleDateString('fr-FR')}
                </span>
              )}
              {endDate && (
                <span className="badge bg-cyan-100 text-cyan-800">
                  📅 Au {new Date(endDate).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Liste des commandes */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 text-lg">Aucun colis en agence</p>
          <p className="text-gray-400 text-sm mt-2">
            {orders.length === 0 ? "Aucun EXPRESS en agence pour le moment" : "Aucun résultat avec ces filtres"}
          </p>
        </div>
      ) : (
        <>
          {/* En-tête de la liste */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-lg shadow-slate-200/40 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                📋 {sortedOrders.length} colis {sortedOrders.length !== orders.length && `sur ${orders.length}`}
              </p>
              <p className="text-xs text-gray-600">
                Trié par: <strong>
                  {triPar === 'jours' ? 'Date d\'arrivée (récent en premier)' : 
                   triPar === 'notifications' ? 'Notifications (à relancer)' : 
                   'Date d\'arrivée exacte (récent)'}
                </strong>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {sortedOrders.map((order: any) => {
              // Déterminer l'urgence
              const isUrgent = order.joursEnAgence > 7;
              const isAttention = order.joursEnAgence > 3;
              const isTropNotifie = order.nombreNotifications > 5;

              return (
                <div key={order.id} className={`relative overflow-hidden rounded-[1.75rem] border p-4 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl sm:p-5 ${
                  isUrgent ? 'border-red-200 bg-gradient-to-br from-white to-red-50/90' :
                  isTropNotifie ? 'border-orange-200 bg-gradient-to-br from-white to-orange-50/90' :
                  isAttention ? 'border-amber-200 bg-gradient-to-br from-white to-amber-50/80' :
                  order.nombreNotifications > 0 ? 'border-blue-100 bg-gradient-to-br from-white to-blue-50/50' :
                  'border-slate-100 bg-white/90'
                }`}>
              <div className={`absolute inset-y-0 left-0 w-1.5 ${isUrgent ? 'bg-red-500' : isTropNotifie ? 'bg-orange-500' : isAttention ? 'bg-amber-400' : order.nombreNotifications > 0 ? 'bg-blue-500' : 'bg-slate-300'}`} />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Informations client - 4 colonnes */}
                <div className="lg:col-span-4">
                  {/* Badges d'urgence */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {isUrgent && (
                      <span className="badge bg-red-100 text-red-700 text-xs">
                        🚨 URGENT - {order.joursEnAgence}j en agence
                      </span>
                    )}
                    {!isUrgent && isAttention && (
                      <span className="badge bg-yellow-100 text-yellow-700 text-xs">
                        ⚠️ {order.joursEnAgence}j en agence
                      </span>
                    )}
                    {isTropNotifie && (
                      <span className="badge bg-orange-100 text-orange-700 text-xs">
                        🔔 {order.nombreNotifications} notifications
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{order.clientNom}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-gray-400" />
                        <a 
                          href={`tel:${order.clientTelephone}`}
                          className="text-primary-600 hover:underline"
                        >
                          {order.clientTelephone}
                        </a>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Réf: {order.orderReference}</p>
                    </div>
                    {order.status === 'EXPRESS_ARRIVE' ? (
                      <span className="badge bg-orange-100 text-orange-700">En attente</span>
                    ) : (
                      <span className="badge bg-green-100 text-green-700">Retiré ✓</span>
                    )}
                  </div>
                  
                  <div className="space-y-1 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Package size={14} className="text-gray-400" />
                      <span className="text-gray-700">{order.product?.nom || order.produitNom} (x{order.quantite})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-gray-700 font-medium">{order.agenceRetrait}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-600">
                        Arrivé le {formatDateTime(order.arriveAt || order.expedieAt)}
                      </span>
                    </div>
                    {order.codeExpedition && (
                      <div className="flex items-center gap-2 text-sm mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <Package size={14} className="text-blue-600" />
                        <span className="text-blue-800 font-mono font-semibold">
                          Code: {order.codeExpedition}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats de suivi - 3 colonnes */}
                <div className="border-slate-100 lg:col-span-3 lg:border-l lg:pl-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Suivi</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className={
                        order.joursEnAgence > 7 ? 'text-red-500' :
                        order.joursEnAgence > 3 ? 'text-orange-500' :
                        'text-blue-500'
                      } />
                      <span className={`text-sm font-medium ${
                        order.joursEnAgence > 7 ? 'text-red-600' :
                        order.joursEnAgence > 3 ? 'text-orange-600' :
                        'text-gray-700'
                      }`}>
                        <strong>{order.joursEnAgence}</strong> jour(s) en agence
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell size={16} className={
                        order.nombreNotifications > 5 ? 'text-red-500' :
                        order.nombreNotifications > 2 ? 'text-orange-500' :
                        order.nombreNotifications > 0 ? 'text-yellow-500' :
                        'text-gray-400'
                      } />
                      <span className="text-sm">
                        <strong>{order.nombreNotifications}</strong> notification(s)
                      </span>
                    </div>
                    {order.derniereNotification && (
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-purple-500" />
                        <span className="text-xs text-gray-600">
                          Par {order.derniereNotification.user.prenom} {order.derniereNotification.user.nom}
                        </span>
                      </div>
                    )}
                    {order.derniereNotification?.notifiedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-xs text-gray-600">
                          Dernier rappel: {formatDateTime(order.derniereNotification.notifiedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dernière note - 3 colonnes */}
                <div className="border-slate-100 lg:col-span-3 lg:border-l lg:pl-4">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Dernière note</p>
                  {order.derniereNotification?.note ? (
                    <div className="bg-gray-50 p-2 rounded text-sm italic">
                      "{order.derniereNotification.note}"
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(order.derniereNotification.notifiedAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Aucune note</p>
                  )}
                </div>

                {/* Actions - 2 colonnes */}
                <div className="lg:col-span-2 flex flex-col gap-2 justify-center">
                  <div className="text-center mb-2">
                    <p className="text-xs text-gray-500">À payer</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(order.montant * 0.90)}
                    </p>
                  </div>
                  
                  {order.status === 'EXPRESS_ARRIVE' ? (
                    <>
                      <button
                        onClick={() => handleNotifier(order)}
                        className="btn flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-fuchsia-700"
                      >
                        <Bell size={16} />
                        Notifier
                      </button>
                      <button
                        onClick={() => handleConfirmerRetrait(order.id)}
                        disabled={confirmerRetraitMutation.isPending}
                        className="btn flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
                      >
                        <CheckCircle2 size={16} />
                        Client a retiré
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle2 size={20} />
                      <span className="text-sm font-medium">Retiré</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Historique complet des notifications (collapsible) */}
              {order.expressNotifications.length > 1 && (
                <details className="mt-4 border-t pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700">
                    Voir l'historique complet ({order.expressNotifications.length} notifications)
                  </summary>
                  <div className="mt-3 space-y-2">
                    {order.expressNotifications.map((notif: any, index: number) => (
                      <div key={notif.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                        <Calendar size={16} className="text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">{formatDateTime(notif.notifiedAt)}</p>
                          <p className="text-sm font-medium">
                            {notif.user.prenom} {notif.user.nom}
                          </p>
                          {notif.note && (
                            <p className="text-sm text-gray-700 italic mt-1">"{notif.note}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal de notification */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/60 bg-white p-5 shadow-2xl shadow-slate-950/30 sm:p-6">
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-violet-600 p-4 text-white shadow-lg shadow-rose-500/20">
              <span className="rounded-xl bg-white/15 p-2"><Bell size={20} /></span>
              <div>
                <h2 className="text-xl font-black">Notifier le client</h2>
                <p className="text-xs text-orange-50">Ajoutez une note de suivi si nécessaire</p>
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/80 to-violet-50/60 p-4">
              <p className="font-semibold">{selectedOrder.clientNom}</p>
              <div className="flex items-center gap-2 mt-1">
                <Phone size={16} className="text-primary-400" />
                <a 
                  href={`tel:${selectedOrder.clientTelephone}`}
                  className="text-primary-600 hover:underline font-medium"
                >
                  {selectedOrder.clientTelephone}
                </a>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Agence: <strong>{selectedOrder.agenceRetrait}</strong>
              </p>
              {selectedOrder.codeExpedition && (
                <p className="text-sm text-blue-700 font-mono mt-1">
                  Code: <strong>{selectedOrder.codeExpedition}</strong>
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                À payer: <strong className="text-green-600">{formatCurrency(selectedOrder.montant * 0.90)}</strong>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare size={16} className="inline mr-1" />
                Note (optionnelle)
              </label>
              <textarea
                value={noteNotification}
                onChange={(e) => setNoteNotification(e.target.value)}
                placeholder="Ex: Client occupé, rappeler demain..."
                className="input"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Cette note sera enregistrée dans l'historique
              </p>
            </div>

            {selectedOrder.nombreNotifications > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ Ce client a déjà été notifié <strong>{selectedOrder.nombreNotifications} fois</strong>
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={confirmNotification}
                disabled={notifierMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {notifierMutation.isPending ? 'Envoi...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


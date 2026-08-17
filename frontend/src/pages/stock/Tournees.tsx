import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, CheckCircle, Truck, Calendar, Search, Filter, User, Clock, AlertTriangle, AlertCircle, BellRing, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import { useAuthStore } from '@/store/authStore';

const RAISONS_RETOUR = {
  CLIENT_ABSENT: 'Client absent / Injoignable',
  CLIENT_REFUSE: 'Client a refusé le colis',
  CLIENT_REPORTE: 'Client veut reporter la livraison',
  ADRESSE_INCORRECTE: 'Adresse incorrecte / Introuvable',
  ZONE_DANGEREUSE: 'Zone dangereuse / Inaccessible',
  AUTRE: 'Autre raison'
};

type CompactDeliveryType = 'LOCAL' | 'EXPEDITION' | 'EXPRESS';

const compactDeliveryTypes: Array<{ value: CompactDeliveryType; label: string; icon: string }> = [
  { value: 'LOCAL', label: 'Livraison', icon: '🏠' },
  { value: 'EXPEDITION', label: 'Expédition', icon: '✈️' },
  { value: 'EXPRESS', label: 'Express', icon: '⚡' },
];

const compactCardPalettes = [
  {
    card: 'border-sky-200/90 bg-gradient-to-br from-white via-sky-50/90 to-blue-100/70 shadow-sky-200/50 hover:border-sky-400',
    icon: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-200',
    accent: 'from-sky-500 via-blue-500 to-indigo-500',
  },
  {
    card: 'border-violet-200/90 bg-gradient-to-br from-white via-violet-50/90 to-fuchsia-100/60 shadow-violet-200/50 hover:border-violet-400',
    icon: 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-200',
    accent: 'from-violet-500 via-fuchsia-500 to-pink-500',
  },
  {
    card: 'border-emerald-200/90 bg-gradient-to-br from-white via-emerald-50/90 to-cyan-100/60 shadow-emerald-200/50 hover:border-emerald-400',
    icon: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200',
    accent: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
];

function orderHasDeliveryType(order: any, type: CompactDeliveryType) {
  return (order.deliveryType || 'LOCAL') === type;
}

function getOrdersForDeliveryType(orders: any[], type: CompactDeliveryType) {
  const uniqueOrders = new Map<number | string, any>();
  orders.forEach((order: any) => {
    if (orderHasDeliveryType(order, type)) uniqueOrders.set(order.id, order);
  });
  return Array.from(uniqueOrders.values());
}

function isTourneeRefusedStatus(status: string) {
  return ['REFUSEE', 'ANNULEE_LIVRAISON'].includes(status);
}

function getTourneeOrderStatusLabel(status: string) {
  return isTourneeRefusedStatus(status)
    ? 'Refusée'
    : getStatusLabel(status as Parameters<typeof getStatusLabel>[0]);
}

function getTourneeOrderStatusColor(status: string) {
  return isTourneeRefusedStatus(status)
    ? 'bg-rose-100 text-rose-700'
    : getStatusColor(status as Parameters<typeof getStatusColor>[0]);
}

const appDayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Abidjan',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const appDayLabelFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Africa/Abidjan',
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export default function Tournees() {
  const { user } = useAuthStore();
  const today = appDayKeyFormatter.format(new Date());
  const [dateDebut, setDateDebut] = useState(today);
  const [dateFin, setDateFin] = useState(today);
  const [selectedTournee, setSelectedTournee] = useState<any>(null);
  const [colisRemis, setColisRemis] = useState('');
  const [colisRetour, setColisRetour] = useState('');
  const [ecartMotif, setEcartMotif] = useState('');
  const [modalType, setModalType] = useState<'remise' | 'retour' | 'detail' | null>(null);
  const [raisonsRetour, setRaisonsRetour] = useState<Record<number, string>>({});
  
  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'remise' | 'retour' | 'completed'>('all');
  const [delivererFilter, setDelivererFilter] = useState('');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'all' | 'LOCAL' | 'EXPEDITION'>('all');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [selectedCompactGroup, setSelectedCompactGroup] = useState<any>(null);
  const [compactGroupType, setCompactGroupType] = useState<CompactDeliveryType>('LOCAL');
  const [compactRemiseConfirmationOpen, setCompactRemiseConfirmationOpen] = useState(false);
  const [selectedRefusedOrderIds, setSelectedRefusedOrderIds] = useState<number[]>([]);
  const [unreturnedAlertsOpen, setUnreturnedAlertsOpen] = useState(false);
  const canSeeUnreturnedAlerts = user?.role === 'ADMIN' || user?.role === 'GESTIONNAIRE';
  
  const queryClient = useQueryClient();

  // Fonctions pour les raccourcis de dates
  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = appDayKeyFormatter.format(yesterday);
    setDateDebut(yesterdayStr);
    setDateFin(yesterdayStr);
  };

  const setToday = () => {
    const todayStr = appDayKeyFormatter.format(new Date());
    setDateDebut(todayStr);
    setDateFin(todayStr);
  };

  const setThisWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    setDateDebut(appDayKeyFormatter.format(monday));
    setDateFin(appDayKeyFormatter.format(sunday));
  };

  const setThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateDebut(appDayKeyFormatter.format(firstDay));
    setDateFin(appDayKeyFormatter.format(lastDay));
  };

  const setThisYear = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31);
    setDateDebut(appDayKeyFormatter.format(firstDay));
    setDateFin(appDayKeyFormatter.format(lastDay));
  };

  const { data: tourneesData, isLoading } = useQuery({
    queryKey: ['stock-tournees', dateDebut, dateFin],
    queryFn: async () => {
      const { data } = await api.get('/stock/tournees', {
        params: { dateDebut, dateFin }
      });
      return data;
    },
  });

  const { data: tourneeDetail } = useQuery({
    queryKey: ['stock-tournee-detail', selectedTournee?.id],
    queryFn: async () => {
      if (!selectedTournee) return null;
      const { data } = await api.get(`/stock/tournees/${selectedTournee.id}`);
      return data;
    },
    enabled: !!selectedTournee,
  });

  // Liste unique des livreurs pour le filtre
  const deliverers = useMemo(() => {
    if (!tourneesData?.tournees) return [];
    const uniqueDeliverers = new Map();
    tourneesData.tournees.forEach((t: any) => {
      if (!uniqueDeliverers.has(t.deliverer.id)) {
        uniqueDeliverers.set(t.deliverer.id, t.deliverer);
      }
    });
    return Array.from(uniqueDeliverers.values());
  }, [tourneesData]);

  // Filtrage des tournées
  const filteredTournees = useMemo(() => {
    if (!tourneesData?.tournees) return [];
    
    return tourneesData.tournees
      .sort((a: any, b: any) => {
        return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
      })
      .filter((tournee: any) => {
        // Filtre de recherche
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
          tournee.nom.toLowerCase().includes(searchLower) ||
          `${tournee.deliverer.prenom} ${tournee.deliverer.nom}`.toLowerCase().includes(searchLower) ||
          tournee.zone?.toLowerCase().includes(searchLower);

        // Filtre par statut
        let matchesStatus = true;
        if (statusFilter === 'pending') {
          matchesStatus = !tournee.stats.remisConfirme;
        } else if (statusFilter === 'remise') {
          matchesStatus = tournee.stats.remisConfirme && !tournee.stats.retourConfirme;
        } else if (statusFilter === 'retour') {
          matchesStatus = tournee.stats.retourConfirme;
        } else if (statusFilter === 'completed') {
          matchesStatus = tournee.stats.remisConfirme && tournee.stats.retourConfirme;
        }

        // Filtre par livreur
        const matchesDeliverer = !delivererFilter || tournee.deliverer.id.toString() === delivererFilter;

        // Filtre par type de livraison
        let matchesDeliveryType = true;
        if (deliveryTypeFilter !== 'all') {
          // Vérifier si au moins une commande de la tournée correspond au type
          matchesDeliveryType = tournee.orders?.some((order: any) => order.deliveryType === deliveryTypeFilter);
        }

        return matchesSearch && matchesStatus && matchesDeliverer && matchesDeliveryType;
      });
  }, [tourneesData, searchTerm, statusFilter, delivererFilter, deliveryTypeFilter]);

  // En vue compacte, les enregistrements techniques restent intacts mais sont
  // présentés dans un seul bloc par jour et par livreur, tous types confondus.
  const compactGroups = useMemo(() => {
    const groups = new Map<string, any>();

    filteredTournees.forEach((tournee: any) => {
      const rawDate = tournee.date || tournee.createdAt;
      const parsedDate = new Date(rawDate);
      const dayKey = Number.isNaN(parsedDate.getTime())
        ? String(rawDate)
        : appDayKeyFormatter.format(parsedDate);
      const dayLabel = Number.isNaN(parsedDate.getTime())
        ? String(rawDate)
        : appDayLabelFormatter.format(parsedDate);
      const groupKey = `${dayKey}-${tournee.deliverer.id}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          dayKey,
          dayLabel,
          deliverer: tournee.deliverer,
          tournees: [],
          orders: [],
          stats: {
            totalOrders: 0,
            colisRemis: 0,
            livrees: 0,
            colisRestants: 0,
            remisConfirme: true,
            remisesConfirmees: 0,
            remisesEnAttente: 0,
            colisEnAttenteRemise: 0,
            retourConfirme: true,
            joursChezLivreur: 0,
            alerteRetard: false,
            alerteCritique: false,
          },
        });
      }

      const group = groups.get(groupKey);
      group.tournees.push(tournee);
      group.orders.push(...(tournee.orders || []));
      group.stats.totalOrders += tournee.stats.totalOrders || 0;
      group.stats.colisRemis += tournee.stats.colisRemis || 0;
      group.stats.livrees += tournee.stats.livrees || 0;
      group.stats.colisRestants += tournee.stats.colisRestants || 0;
      group.stats.remisConfirme = group.stats.remisConfirme && tournee.stats.remisConfirme;
      if (tournee.stats.remisConfirme) {
        group.stats.remisesConfirmees += 1;
      } else {
        group.stats.remisesEnAttente += 1;
        group.stats.colisEnAttenteRemise += tournee.stats.totalOrders || 0;
      }
      group.stats.retourConfirme = group.stats.retourConfirme && tournee.stats.retourConfirme;
      group.stats.joursChezLivreur = Math.max(
        group.stats.joursChezLivreur,
        tournee.stats.joursChezLivreur || 0
      );
      group.stats.alerteRetard = group.stats.alerteRetard || tournee.stats.alerteRetard;
      group.stats.alerteCritique = group.stats.alerteCritique || tournee.stats.alerteCritique;
    });

    return Array.from(groups.values())
      .sort((a: any, b: any) => {
        const dayOrder = b.dayKey.localeCompare(a.dayKey);
        if (dayOrder !== 0) return dayOrder;
        return a.deliverer.id - b.deliverer.id;
      });
  }, [filteredTournees]);

  const selectedCompactGroupOrders = useMemo(() => {
    if (!selectedCompactGroup) return [];
    return getOrdersForDeliveryType(selectedCompactGroup.orders, compactGroupType);
  }, [selectedCompactGroup, compactGroupType]);

  const refusedCompactGroupOrders = useMemo(
    () => selectedCompactGroupOrders.filter((order: any) => isTourneeRefusedStatus(order.status)),
    [selectedCompactGroupOrders]
  );

  const selectedCompactGroupSummary = useMemo(() => {
    const deliveredStatuses = new Set(['LIVREE', 'EXPRESS_LIVRE']);
    const returnedStatuses = new Set(['REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE']);

    let delivered = 0;
    let refused = 0;
    let returned = 0;
    let pending = 0;
    let totalAmount = 0;
    let deliveredAmount = 0;

    selectedCompactGroupOrders.forEach((order: any) => {
      const amount = Number(order.montant) || 0;
      const isDelivered = deliveredStatuses.has(order.status);
      const isReturned = returnedStatuses.has(order.status);

      totalAmount += amount;
      if (isDelivered) {
        delivered += 1;
        deliveredAmount += amount;
      } else if (!isReturned) {
        pending += 1;
      }

      if (isTourneeRefusedStatus(order.status)) refused += 1;
      if (order.status === 'RETOURNE') returned += 1;
    });

    return {
      total: selectedCompactGroupOrders.length,
      delivered,
      refused,
      pending,
      remaining: Math.max(0, selectedCompactGroupOrders.length - delivered - returned),
      totalAmount,
      deliveredAmount,
      undeliveredAmount: Math.max(0, totalAmount - deliveredAmount),
    };
  }, [selectedCompactGroupOrders]);

  const selectedCompactGroupPendingRemise = useMemo(() => {
    const pendingTournees = selectedCompactGroup?.tournees?.filter(
      (tournee: any) => !tournee.stats.remisConfirme
    ) || [];
    const confirmedTournees = selectedCompactGroup?.tournees?.filter(
      (tournee: any) => tournee.stats.remisConfirme
    ) || [];

    return {
      tournees: pendingTournees,
      confirmedTournees,
      totalColis: pendingTournees.reduce(
        (sum: number, tournee: any) => sum + (tournee.stats.totalOrders || 0),
        0
      ),
      confirmedColis: confirmedTournees.reduce(
        (sum: number, tournee: any) => sum + (tournee.stats.totalOrders || 0),
        0
      ),
    };
  }, [selectedCompactGroup]);

  const confirmRemiseMutation = useMutation({
    mutationFn: async ({ tourneeId, colisRemis }: any) => {
      const { data } = await api.post(`/stock/tournees/${tourneeId}/confirm-remise`, {
        colisRemis: parseInt(colisRemis)
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-tournees'] });
      setModalType(null);
      setSelectedTournee(null);
      setColisRemis('');
      toast.success('Remise de colis confirmée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la confirmation');
    },
  });

  const confirmCompactGroupRemiseMutation = useMutation({
    mutationFn: async (group: any) => {
      const tournees = group.tournees
        .filter((tournee: any) => !tournee.stats.remisConfirme)
        .map((tournee: any) => ({
          id: tournee.id,
          colisRemis: tournee.stats.totalOrders || 0,
        }));
      const { data } = await api.post('/stock/tournees/confirm-remise-group', { tournees });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-tournees'] });
      setCompactRemiseConfirmationOpen(false);
      setSelectedCompactGroup(null);
      toast.success(data.message || 'Remise des colis confirmée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la confirmation de la remise');
    },
  });

  const { data: unreturnedAlerts } = useQuery({
    queryKey: ['stock-unreturned-alerts'],
    queryFn: async () => {
      const { data } = await api.get('/stock/tournees/alerts');
      return data;
    },
    enabled: canSeeUnreturnedAlerts,
    refetchInterval: 5 * 60 * 1000,
  });

  const confirmRetourMutation = useMutation({
    mutationFn: async ({ tourneeId, colisRetour, ecartMotif, raisonsRetour }: any) => {
      const { data } = await api.post(`/stock/tournees/${tourneeId}/confirm-retour`, {
        colisRetour: parseInt(colisRetour),
        ecartMotif,
        raisonsRetour
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-tournees'] });
      queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
      queryClient.invalidateQueries({ queryKey: ['returned-orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock-unreturned-alerts'] });
      setModalType(null);
      setSelectedTournee(null);
      setColisRetour('');
      setEcartMotif('');
      setRaisonsRetour({});
      toast.success(data.message || 'Retour confirmé et stock mis à jour');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la confirmation');
    },
  });

  const returnToValidatedMutation = useMutation({
    mutationFn: async ({ orderId }: any) => {
      const { data } = await api.post(`/orders/${orderId}/return-to-validated`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-tournees'] });
      queryClient.invalidateQueries({ queryKey: ['stock-tournee-detail'] });
      queryClient.invalidateQueries({ queryKey: ['validated-orders'] });
      queryClient.invalidateQueries({ queryKey: ['validated-orders-count'] });
      queryClient.invalidateQueries({ queryKey: ['stock-unreturned-alerts'] });
      toast.success(data.message || 'Commande retournée dans "Commandes validées".');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors du retour de la commande');
    },
  });

  const returnRefusedToStoreMutation = useMutation({
    mutationFn: async (orderIds: number[]) => {
      const { data } = await api.post('/stock/orders/return-to-store', { orderIds });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-tournees'] });
      queryClient.invalidateQueries({ queryKey: ['stock-tournee-detail'] });
      queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
      queryClient.invalidateQueries({ queryKey: ['returned-orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock-unreturned-alerts'] });
      setSelectedRefusedOrderIds([]);
      setSelectedCompactGroup(null);
      toast.success(data.message || 'Retour en magasin enregistré.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors du retour en magasin');
    },
  });

  const canReturnToValidated = user?.role === 'ADMIN' || user?.role === 'GESTIONNAIRE';
  const canConfirmStock = user?.role === 'ADMIN' || user?.role === 'GESTIONNAIRE' || user?.role === 'GESTIONNAIRE_STOCK';

  const handleConfirmRemise = () => {
    if (!selectedTournee || !colisRemis) return;
    confirmRemiseMutation.mutate({
      tourneeId: selectedTournee.id,
      colisRemis
    });
  };

  const handleConfirmRetour = () => {
    if (!selectedTournee || !colisRetour) return;
    
    const ecartCalcule = (selectedTournee.stats.colisRemis || selectedTournee.stats.totalOrders) - 
                          (selectedTournee.stats.livrees + parseInt(colisRetour));
    
    if (ecartCalcule !== 0 && !ecartMotif) {
      toast.error('Veuillez expliquer l\'écart de colis');
      return;
    }

    // Vérifier que toutes les raisons ont été spécifiées
    const ordersNonLivres = tourneeDetail?.tournee?.orders?.filter((order: any) =>
      ['REFUSEE', 'ANNULEE_LIVRAISON'].includes(order.status)
    ) || [];
    
    const missingReasons = ordersNonLivres.filter((order: any) => !raisonsRetour[order.id]);
    if (missingReasons.length > 0) {
      toast.error('Veuillez spécifier la raison de retour pour tous les colis non livrés');
      return;
    }

    confirmRetourMutation.mutate({
      tourneeId: selectedTournee.id,
      colisRetour,
      ecartMotif: ecartCalcule !== 0 ? ecartMotif : null,
      raisonsRetour
    });
  };

  const openRemiseModal = (tournee: any) => {
    setSelectedTournee(tournee);
    setColisRemis(tournee.stats.totalOrders.toString());
    setTimeout(() => setModalType('remise'), 100);
  };

  const openRetourModal = (tournee: any) => {
    setSelectedTournee(tournee);
    const colisNonLivres = tournee.stats.totalOrders - tournee.stats.livrees;
    setColisRetour(colisNonLivres.toString());
    setRaisonsRetour({});
    setTimeout(() => setModalType('retour'), 100);
  };

  const setRaisonForOrder = (orderId: number, raison: string) => {
    setRaisonsRetour(prev => ({
      ...prev,
      [orderId]: raison
    }));
  };

  const getStatusBadge = (tournee: any) => {
    if (tournee.stats.remisesConfirmees > 0 && tournee.stats.remisesEnAttente > 0) {
      return <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">📦 Nouvelle remise</span>;
    }
    if (tournee.stats.remisConfirme && tournee.stats.retourConfirme) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">✓ Terminée</span>;
    } else if (tournee.stats.remisConfirme) {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">🚚 En livraison</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">⏳ En attente</span>;
    }
  };
  
  const getAlerteBadge = (tournee: any) => {
    if (!tournee.stats.remisConfirme || tournee.stats.retourConfirme) return null;
    
    if (tournee.stats.alerteCritique) {
      return (
        <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full flex items-center gap-1 animate-pulse">
          <AlertCircle size={14} /> CRITIQUE ({tournee.stats.joursChezLivreur}j)
        </span>
      );
    }
    
    if (tournee.stats.alerteRetard) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full flex items-center gap-1">
          <AlertTriangle size={14} /> Retard ({tournee.stats.joursChezLivreur}j)
        </span>
      );
    }
    
    if (tournee.stats.joursChezLivreur > 0) {
      return (
        <span className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full flex items-center gap-1">
          <Clock size={14} /> {tournee.stats.joursChezLivreur}j chez livreur
        </span>
      );
    }
    
    return null;
  };
  
  const getDeliveryTypeBadge = (tournee: any) => {
    // Compter les types de livraison dans la tournée
    const localCount = tournee.orders?.filter((o: any) => o.deliveryType === 'LOCAL').length || 0;
    const expeditionCount = tournee.orders?.filter((o: any) => o.deliveryType === 'EXPEDITION').length || 0;
    const expressCount = tournee.orders?.filter((o: any) => o.deliveryType === 'EXPRESS').length || 0;
    const typeCount = [localCount, expeditionCount, expressCount].filter((count) => count > 0).length;
    
    if (typeCount > 1) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded flex items-center gap-1">
          🏠✈️ Mixte
        </span>
      );
    } else if (expressCount > 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded flex items-center gap-1">
          ⚡ Express
        </span>
      );
    } else if (expeditionCount > 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded flex items-center gap-1">
          ✈️ Expédition
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded flex items-center gap-1">
          🏠 Local
        </span>
      );
    }
  };

  // Calcul des KPIs globaux
  const kpis = useMemo(() => {
    if (!filteredTournees) return null;
    
    const totalColisRemis = filteredTournees.reduce((sum: number, t: any) => sum + t.stats.colisRemis, 0);
    const totalColisLivres = filteredTournees.reduce((sum: number, t: any) => sum + t.stats.livrees, 0);
    const totalColisRestants = filteredTournees.reduce((sum: number, t: any) => sum + t.stats.colisRestants, 0);
    const tauxLivraison = totalColisRemis > 0 ? ((totalColisLivres / totalColisRemis) * 100).toFixed(1) : 0;
    
    return {
      totalColisRemis,
      totalColisLivres,
      totalColisRestants,
      tauxLivraison
    };
  }, [filteredTournees]);

  return (
    <div className="min-h-full space-y-6 rounded-[2rem] bg-gradient-to-br from-slate-50 via-sky-50/70 to-violet-50/80 p-4 sm:p-6">
      {/* En-tête */}
      <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-white/80 bg-white/85 p-5 shadow-xl shadow-slate-200/50 backdrop-blur-xl md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-3 text-white shadow-lg shadow-indigo-200">
            <Sparkles size={28} />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-slate-900 via-blue-800 to-violet-700 bg-clip-text text-3xl font-bold text-transparent">
              Gestion des Tournées
            </h1>
            <p className="mt-1 text-gray-600">Remise et retour des colis</p>
          </div>
        </div>
        
        <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
          {canSeeUnreturnedAlerts && (unreturnedAlerts?.totalColis || 0) > 0 && (
            <button
              type="button"
              onClick={() => setUnreturnedAlertsOpen(true)}
              className="inline-flex w-fit items-center gap-2 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 px-4 py-2.5 text-left text-rose-800 shadow-lg shadow-rose-100 transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-xl"
              aria-label={`Ouvrir les alertes : ${unreturnedAlerts.totalColis} colis non retournés`}
            >
              <span className="relative rounded-xl bg-rose-100 p-2 text-rose-700">
                <BellRing size={20} className="animate-bounce motion-reduce:animate-none" />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white motion-reduce:animate-none">
                  {unreturnedAlerts.totalLivreurs}
                </span>
              </span>
              <span>
                <span className="block text-xs font-medium text-rose-600">Retours en retard</span>
                <span className="block font-bold">{unreturnedAlerts.totalColis} colis chez les livreurs</span>
              </span>
            </button>
          )}

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-xl border border-orange-200/80 bg-gradient-to-br from-orange-50 to-amber-100/70 px-4 py-2 shadow-sm shadow-orange-100">
            <p className="text-xs text-gray-600">⏳ En attente</p>
            <p className="text-xl font-bold text-orange-600">
              {filteredTournees.filter((t: any) => !t.stats.remisConfirme).length}
            </p>
          </div>
          <div className="rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50 to-cyan-100/70 px-4 py-2 shadow-sm shadow-blue-100">
            <p className="text-xs text-gray-600">🚚 En livraison</p>
            <p className="text-xl font-bold text-blue-600">
              {filteredTournees.filter((t: any) => t.stats.remisConfirme && !t.stats.retourConfirme).length}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-100/70 px-4 py-2 shadow-sm shadow-emerald-100">
            <p className="text-xs text-gray-600">✓ Terminées</p>
            <p className="text-xl font-bold text-green-600">
              {filteredTournees.filter((t: any) => t.stats.retourConfirme).length}
            </p>
          </div>
          <div className="rounded-xl border border-yellow-200/80 bg-gradient-to-br from-yellow-50 to-lime-100/70 px-4 py-2 shadow-sm shadow-yellow-100">
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <AlertTriangle size={12} /> Retards
            </p>
            <p className="text-xl font-bold text-yellow-600">
              {filteredTournees.filter((t: any) => t.stats.alerteRetard).length}
            </p>
          </div>
          <div className="rounded-xl border border-rose-200/80 bg-gradient-to-br from-rose-50 to-pink-100/70 px-4 py-2 shadow-sm shadow-rose-100">
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <AlertCircle size={12} /> Critiques
            </p>
            <p className="text-xl font-bold text-red-600">
              {filteredTournees.filter((t: any) => t.stats.alerteCritique).length}
            </p>
          </div>
          </div>
        </div>
      </div>

      {unreturnedAlertsOpen && unreturnedAlerts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm"
          onClick={() => setUnreturnedAlertsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unreturned-alerts-title"
            className="max-h-[85dvh] w-full max-w-lg overflow-hidden rounded-3xl border border-white/50 bg-white shadow-2xl shadow-rose-950/30"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-rose-700 via-red-600 to-orange-600 p-5 text-white">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-white/15 p-2"><BellRing size={24} /></span>
                <div>
                  <h2 id="unreturned-alerts-title" className="text-xl font-bold">Colis non retournés</h2>
                  <p className="mt-1 text-sm text-rose-50">
                    {unreturnedAlerts.totalColis} colis chez {unreturnedAlerts.totalLivreurs} livreur(s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnreturnedAlertsOpen(false)}
                className="rounded-xl border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Fermer les alertes"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(85dvh-130px)] space-y-3 overflow-y-auto p-4 sm:p-5">
              {unreturnedAlerts.alertes.map((alerte: any) => (
                <div key={alerte.deliverer.id} className="flex items-center justify-between gap-4 rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50/80 to-orange-50/60 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="rounded-xl bg-white p-2 text-rose-700 shadow-sm"><User size={20} /></span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {alerte.deliverer.prenom} {alerte.deliverer.nom}
                      </p>
                      <p className="text-xs text-gray-600">
                        {alerte.tourneesConcernees} tournée(s) • jusqu’à {alerte.joursMax} jours
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-bold text-rose-700">{alerte.colisNonRetournes}</p>
                    <p className="text-xs font-medium text-rose-600">colis</p>
                  </div>
                </div>
              ))}
              <p className="rounded-xl bg-slate-50 p-3 text-center text-xs text-gray-500">
                L’alerte apparaît à partir de {unreturnedAlerts.seuilJours} jours chez le livreur.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard KPIs Globaux */}
      {kpis && (
        <div className="card overflow-hidden border border-blue-200/70 bg-gradient-to-r from-blue-100/90 via-white to-violet-100/80 shadow-xl shadow-blue-200/40">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={24} className="text-primary-600" />
            📊 Vue d'ensemble - {dateDebut === dateFin ? formatDate(dateDebut) : `${formatDate(dateDebut)} → ${formatDate(dateFin)}`}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-blue-100/60 backdrop-blur">
              <p className="text-xs text-gray-600 mb-1">📦 Total Remis</p>
              <p className="text-3xl font-bold text-blue-600">{kpis.totalColisRemis}</p>
              <p className="text-xs text-gray-500 mt-1">colis confiés aux livreurs</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-emerald-100/60 backdrop-blur">
              <p className="text-xs text-gray-600 mb-1">✅ Total Livrés</p>
              <p className="text-3xl font-bold text-green-600">{kpis.totalColisLivres}</p>
              <p className="text-xs text-gray-500 mt-1">colis livrés aux clients</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-orange-100/60 backdrop-blur">
              <p className="text-xs text-gray-600 mb-1">⏳ Total Restants</p>
              <p className={`text-3xl font-bold ${kpis.totalColisRestants > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                {kpis.totalColisRestants}
              </p>
              <p className="text-xs text-gray-500 mt-1">colis encore en circulation</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-violet-100/60 backdrop-blur">
              <p className="text-xs text-gray-600 mb-1">📈 Taux de Livraison</p>
              <p className={`text-3xl font-bold ${parseFloat(kpis.tauxLivraison as string) >= 80 ? 'text-green-600' : parseFloat(kpis.tauxLivraison as string) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {kpis.tauxLivraison}%
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${parseFloat(kpis.tauxLivraison as string) >= 80 ? 'bg-green-600' : parseFloat(kpis.tauxLivraison as string) >= 60 ? 'bg-yellow-600' : 'bg-red-600'}`}
                  style={{ width: `${kpis.tauxLivraison}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="card relative z-10 border border-white/80 bg-white/85 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher (tournée, livreur, zone...)"
              className="input pl-10 w-full relative"
            />
          </div>

          {/* Date de début */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="input pl-10 w-full relative bg-white"
              placeholder="Date de début"
            />
            <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-600 z-10">Du</label>
          </div>

          {/* Date de fin */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="input pl-10 w-full relative bg-white"
              placeholder="Date de fin"
            />
            <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-600 z-10">Au</label>
          </div>

          {/* Filtre par statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input pl-10 w-full relative bg-white appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">⏳ En attente remise</option>
              <option value="remise">🚚 En livraison</option>
              <option value="completed">✓ Terminées</option>
            </select>
          </div>

          {/* Filtre par type de livraison */}
          <div className="relative md:col-span-2">
            <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
            <select
              value={deliveryTypeFilter}
              onChange={(e) => setDeliveryTypeFilter(e.target.value as any)}
              className="input pl-10 w-full relative bg-white appearance-none"
            >
              <option value="all">🌍 Tous les types</option>
              <option value="LOCAL">🏠 Livraisons locales</option>
              <option value="EXPEDITION">✈️ Expéditions</option>
            </select>
          </div>

          {/* Filtre par livreur */}
          {deliverers.length > 0 && (
            <div className="relative md:col-span-2">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
              <select
                value={delivererFilter}
                onChange={(e) => setDelivererFilter(e.target.value)}
                className="input pl-10 w-full relative bg-white appearance-none"
              >
                <option value="">Tous les livreurs</option>
                {deliverers.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.prenom} {d.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode d'affichage */}
          <div className="flex gap-2 md:col-span-2">
            <button
              onClick={() => setViewMode('compact')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'compact' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 Compact
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'detailed' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📊 Détaillé
            </button>
          </div>
        </div>

        {/* Raccourcis de dates */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">📅 Raccourcis :</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={setYesterday}
              className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            >
              ⏮️ Hier
            </button>
            <button
              onClick={setToday}
              className={`px-3 py-1 text-sm rounded-lg transition-colors border ${
                dateDebut === today
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
              }`}
            >
              📅 Aujourd'hui
            </button>
            <button
              onClick={setThisWeek}
              className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
            >
              📆 Cette semaine
            </button>
            <button
              onClick={setThisMonth}
              className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
            >
              🗓️ Ce mois
            </button>
            <button
              onClick={setThisYear}
              className="px-3 py-1 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
            >
              📊 Cette année
            </button>
          </div>
        </div>

        {/* Compteur de résultats */}
        {searchTerm || statusFilter !== 'all' || delivererFilter || deliveryTypeFilter !== 'all' ? (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>{compactGroups.length}</strong> bloc(s) journalier(s) • {filteredTournees.length} assignation(s)
              {searchTerm && ` pour "${searchTerm}"`}
              {deliveryTypeFilter !== 'all' && ` • Type: ${deliveryTypeFilter === 'LOCAL' ? '🏠 Locales' : '✈️ Expéditions'}`}
            </p>
          </div>
        ) : null}
      </div>

      {/* Liste des tournées */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredTournees.length === 0 ? (
        <div className="card text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm || statusFilter !== 'all' || delivererFilter || deliveryTypeFilter !== 'all'
              ? 'Aucune tournée ne correspond aux filtres'
              : 'Aucune tournée pour cette date'}
          </p>
          {(searchTerm || statusFilter !== 'all' || delivererFilter || deliveryTypeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDelivererFilter('');
                setDeliveryTypeFilter('all');
              }}
              className="btn btn-secondary mt-4"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : viewMode === 'compact' ? (
        /* MODE COMPACT - Cartes journalières */
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 capitalize">
                {dateDebut === dateFin
                  ? `Blocs du ${formatDate(dateDebut)}`
                  : `Blocs du ${formatDate(dateDebut)} au ${formatDate(dateFin)}`}
              </h2>
              <p className="text-sm text-gray-500">
                {compactGroups.length} bloc(s) • {filteredTournees.length} assignation(s)
              </p>
            </div>
            {dateDebut === today && dateFin === today && (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                <Calendar size={14} /> Aujourd'hui
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {compactGroups.map((group: any, index: number) => {
              const palette = compactCardPalettes[index % compactCardPalettes.length];
              return (
              <button
                type="button"
                key={group.key}
                onClick={() => {
                  setCompactGroupType('LOCAL');
                  setCompactRemiseConfirmationOpen(false);
                  setSelectedRefusedOrderIds([]);
                  setSelectedCompactGroup(group);
                }}
                className={`relative w-full overflow-hidden rounded-3xl border p-5 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${palette.card} ${
                  group.stats.alerteCritique
                    ? 'border-red-400'
                    : group.stats.alerteRetard
                      ? 'border-orange-300'
                      : ''
                }`}
                aria-label={`Ouvrir les détails de ${group.deliverer.prenom} ${group.deliverer.nom} pour ${group.dayLabel}`}
              >
                <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${palette.accent}`} aria-hidden="true"></span>
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-start gap-3">
                    <span className={`rounded-2xl p-3 ${palette.icon}`}>
                      <Truck size={22} />
                    </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {group.deliverer.prenom} {group.deliverer.nom}
                          </span>
                          {getDeliveryTypeBadge(group)}
                        </span>
                        <span className="mt-1 block text-sm capitalize text-gray-500">{group.dayLabel}</span>
                    </span>
                  </span>
                  <span className="shrink-0">{getStatusBadge(group)}</span>
                </span>

                <span className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1 font-medium text-gray-800">
                    <Package size={15} /> {group.tournees.length} assignation(s)
                  </span>
                  <span>•</span>
                  <span>{group.stats.totalOrders} colis</span>
                </span>

                <span className="mt-4 grid grid-cols-3 gap-3">
                  <span className="rounded-2xl border border-white/80 bg-white/80 p-3 text-center shadow-sm backdrop-blur">
                    <span className="block text-xs text-gray-500">Remis</span>
                    <span className="block text-2xl font-bold text-blue-600">{group.stats.colisRemis}</span>
                  </span>
                  <span className="rounded-2xl border border-white/80 bg-emerald-50/90 p-3 text-center shadow-sm backdrop-blur">
                    <span className="block text-xs text-gray-500">Livrés</span>
                    <span className="block text-2xl font-bold text-green-600">{group.stats.livrees}</span>
                  </span>
                  <span className="rounded-2xl border border-white/80 bg-orange-50/90 p-3 text-center shadow-sm backdrop-blur">
                    <span className="block text-xs text-gray-500">Restants</span>
                    <span className={`block text-2xl font-bold ${group.stats.colisRestants > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {group.stats.colisRestants}
                    </span>
                  </span>
                </span>

              </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* MODE DÉTAILLÉ - Cartes */
        <div className="space-y-4">
          {filteredTournees.map((tournee: any) => (
            <div key={tournee.id} className={`card ${tournee.stats.alerteCritique ? 'border-2 border-red-500' : tournee.stats.alerteRetard ? 'border-2 border-orange-400' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${tournee.stats.alerteCritique ? 'bg-red-100 text-red-600' : tournee.stats.alerteRetard ? 'bg-orange-100 text-orange-600' : 'bg-primary-100 text-primary-600'}`}>
                    <Truck size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{tournee.nom}</h3>
                      {getDeliveryTypeBadge(tournee)}
                      {getAlerteBadge(tournee)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {tournee.deliverer.prenom} {tournee.deliverer.nom}
                      {tournee.zone && ` • Zone: ${tournee.zone}`}
                    </p>
                    {tournee.stats.dateRemise && (
                      <p className="text-xs text-gray-500 mt-1">
                        📅 Remise: {formatDate(tournee.stats.dateRemise)}
                        {tournee.stats.dateRetour && ` → Retour: ${formatDate(tournee.stats.dateRetour)}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    {tournee.stats.colisRemis} colis remis
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(tournee.date)}
                  </p>
                  <div className="mt-2">
                    {getStatusBadge(tournee)}
                  </div>
                </div>
              </div>

              {/* Statut de la tournée */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Remis</p>
                  <p className="text-xl font-bold text-blue-600">{tournee.stats.colisRemis}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Livrés</p>
                  <p className="text-xl font-bold text-green-600">{tournee.stats.livrees}</p>
                </div>
                <div className={`p-3 rounded-lg text-center ${tournee.stats.colisRestants > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-600">Restants</p>
                  <p className={`text-xl font-bold ${tournee.stats.colisRestants > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                    {tournee.stats.colisRestants}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600">En attente</p>
                  <p className="text-xl font-bold text-yellow-600">{tournee.stats.enAttente}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Refusés</p>
                  <p className="text-xl font-bold text-red-600">{tournee.stats.refusees + tournee.stats.annulees}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                {!tournee.stats.remisConfirme ? (
                  <button
                    onClick={() => openRemiseModal(tournee)}
                    className="btn btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <Package size={18} />
                    Confirmer la remise
                  </button>
                ) : !tournee.stats.retourConfirme ? (
                  <button
                    onClick={() => openRetourModal(tournee)}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Confirmer le retour
                  </button>
                ) : (
                  <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <span className="text-green-700 font-medium">✓ Tournée terminée et traitée</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelectedTournee(tournee);
                    setModalType('detail');
                  }}
                  className="btn btn-secondary"
                >
                  Voir détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fenêtre de détail d'un bloc journalier */}
      {selectedCompactGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4"
          onClick={() => {
            setCompactRemiseConfirmationOpen(false);
            setSelectedRefusedOrderIds([]);
            setSelectedCompactGroup(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="compact-group-title"
            className="flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-white/40 bg-white/95 shadow-2xl shadow-blue-950/30 sm:max-h-[90dvh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="z-10 flex shrink-0 items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-slate-950 via-blue-900 to-violet-900 p-4 text-white sm:p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="compact-group-title" className="text-xl font-bold text-white">
                    {selectedCompactGroup.deliverer.prenom} {selectedCompactGroup.deliverer.nom}
                  </h2>
                  {getDeliveryTypeBadge(selectedCompactGroup)}
                </div>
                <p className="mt-1 text-sm capitalize text-blue-100">{selectedCompactGroup.dayLabel}</p>
                <p className="mt-1 text-sm text-slate-200">
                  {selectedCompactGroup.tournees.length} assignation(s) • {selectedCompactGroup.stats.totalOrders} colis
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCompactRemiseConfirmationOpen(false);
                  setSelectedRefusedOrderIds([]);
                  setSelectedCompactGroup(null);
                }}
                className="rounded-xl border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Fermer"
              >
                <X size={22} />
              </button>
            </div>

            <div className="grid shrink-0 grid-cols-3 gap-2 border-b border-white/70 bg-gradient-to-r from-sky-50 via-violet-50 to-orange-50 p-3 sm:p-4" role="tablist" aria-label="Type de livraison">
              {compactDeliveryTypes.map((type) => {
                const typeCount = getOrdersForDeliveryType(selectedCompactGroup.orders, type.value).length;
                const isActive = compactGroupType === type.value;
                const activeTypeClass = type.value === 'LOCAL'
                  ? 'border-emerald-500 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200'
                  : type.value === 'EXPEDITION'
                    ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200'
                    : 'border-orange-500 bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-200';
                return (
                  <button
                    key={type.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setCompactGroupType(type.value);
                      setSelectedRefusedOrderIds([]);
                    }}
                    className={`flex min-w-0 flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center transition-all duration-200 sm:flex-row sm:gap-2 ${
                      isActive
                        ? activeTypeClass
                        : 'border-white bg-white/85 text-gray-700 shadow-sm hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white'
                    }`}
                  >
                    <span aria-hidden="true">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                    <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>({typeCount})</span>
                  </button>
                );
              })}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
              <div className={`mb-6 rounded-2xl border p-4 ${
                selectedCompactGroupPendingRemise.tournees.length > 0
                  ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'
                  : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2 ${
                      selectedCompactGroupPendingRemise.tournees.length > 0
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {selectedCompactGroupPendingRemise.tournees.length > 0 ? <Package size={22} /> : <CheckCircle size={22} />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedCompactGroupPendingRemise.tournees.length > 0 && selectedCompactGroupPendingRemise.confirmedTournees.length > 0
                          ? 'Nouvelle remise à confirmer'
                          : 'Remise des colis'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedCompactGroupPendingRemise.tournees.length > 0
                          ? `${selectedCompactGroupPendingRemise.totalColis} ${selectedCompactGroupPendingRemise.totalColis > 1 ? 'nouveaux colis' : 'nouveau colis'} dans ${selectedCompactGroupPendingRemise.tournees.length} ${selectedCompactGroupPendingRemise.tournees.length > 1 ? 'nouvelles assignations' : 'nouvelle assignation'} à remettre${
                              selectedCompactGroupPendingRemise.confirmedTournees.length > 0
                                ? ` • ${selectedCompactGroupPendingRemise.confirmedColis} colis déjà remis`
                                : ''
                            }`
                          : 'Tous les colis de ce bloc ont été remis au livreur'}
                      </p>
                    </div>
                  </div>

                  {canConfirmStock && selectedCompactGroupPendingRemise.tournees.length > 0 && !compactRemiseConfirmationOpen && (
                    <button
                      type="button"
                      onClick={() => setCompactRemiseConfirmationOpen(true)}
                      className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:from-violet-700 hover:to-purple-800"
                    >
                      {selectedCompactGroupPendingRemise.confirmedTournees.length > 0 ? 'Confirmer la nouvelle remise' : 'Marquer « Remise »'}
                    </button>
                  )}
                </div>

                {compactRemiseConfirmationOpen && selectedCompactGroupPendingRemise.tournees.length > 0 && (
                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-white/90 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-700">
                      Confirmer la remise de <strong>{selectedCompactGroupPendingRemise.totalColis} colis</strong> à {selectedCompactGroup.deliverer.prenom} {selectedCompactGroup.deliverer.nom} ?
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => setCompactRemiseConfirmationOpen(false)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmCompactGroupRemiseMutation.mutate(selectedCompactGroup)}
                        disabled={confirmCompactGroupRemiseMutation.isPending}
                        className="rounded-lg bg-gradient-to-r from-violet-600 to-purple-700 px-3 py-2 text-sm font-semibold text-white hover:from-violet-700 hover:to-purple-800 disabled:opacity-60"
                      >
                        {confirmCompactGroupRemiseMutation.isPending ? 'Confirmation…' : 'Confirmer la remise'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                {[
                  { label: 'Total colis', value: selectedCompactGroupSummary.total, className: 'border-blue-200 bg-blue-50 text-blue-700' },
                  { label: 'Livrés', value: selectedCompactGroupSummary.delivered, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
                  { label: 'Refusés', value: selectedCompactGroupSummary.refused, className: 'border-rose-200 bg-rose-50 text-rose-700' },
                  { label: 'En attente', value: selectedCompactGroupSummary.pending, className: 'border-amber-200 bg-amber-50 text-amber-700' },
                  { label: 'Restants', value: selectedCompactGroupSummary.remaining, className: 'border-orange-200 bg-orange-50 text-orange-700' },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-2xl border p-3 ${stat.className}`}>
                    <p className="text-xs font-medium opacity-80">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>

              <h3 className="mb-3 font-semibold text-gray-900">
                Commandes — {compactDeliveryTypes.find((type) => type.value === compactGroupType)?.label} ({selectedCompactGroupOrders.length})
              </h3>

              {canConfirmStock && refusedCompactGroupOrders.length > 0 && (
                <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-rose-900">
                      {refusedCompactGroupOrders.length} colis refusé(s) disponible(s)
                    </p>
                    <p className="text-sm text-rose-700">Cochez les colis reçus physiquement au magasin.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRefusedOrderIds.length === 0) return;
                      const confirm = window.confirm(
                        `Confirmer le retour en magasin de ${selectedRefusedOrderIds.length} colis refusé(s) ?`
                      );
                      if (!confirm) return;
                      returnRefusedToStoreMutation.mutate(selectedRefusedOrderIds);
                    }}
                    disabled={selectedRefusedOrderIds.length === 0 || returnRefusedToStoreMutation.isPending}
                    className="rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-200 hover:from-rose-700 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {returnRefusedToStoreMutation.isPending
                      ? 'Enregistrement…'
                      : `Retour en magasin (${selectedRefusedOrderIds.length})`}
                  </button>
                </div>
              )}

              {selectedCompactGroupOrders.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-100/50">
                  <table className="w-full text-sm" style={{ minWidth: '900px' }}>
                    <thead className="bg-gradient-to-r from-slate-50 via-blue-50 to-violet-50">
                      <tr>
                        <th className="px-3 py-3 text-center">
                          {canConfirmStock && refusedCompactGroupOrders.length > 0 ? (
                            <input
                              type="checkbox"
                              aria-label="Sélectionner tous les colis refusés"
                              checked={refusedCompactGroupOrders.every((order: any) => selectedRefusedOrderIds.includes(order.id))}
                              onChange={(event) => {
                                const refusedIds = refusedCompactGroupOrders.map((order: any) => order.id);
                                setSelectedRefusedOrderIds(event.target.checked ? refusedIds : []);
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                            />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </th>
                        <th className="px-3 py-3 text-left">Client</th>
                        <th className="px-3 py-3 text-left">Produit</th>
                        <th className="px-3 py-3 text-center">Qté</th>
                        <th className="px-3 py-3 text-right">Montant</th>
                        <th className="px-3 py-3 text-left">Note</th>
                        <th className="px-3 py-3 text-center">Statut</th>
                        <th className="px-3 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {selectedCompactGroupOrders.map((order: any) => (
                        <tr
                          key={order.id}
                          className={`transition-colors ${
                            ['LIVREE', 'EXPRESS_LIVRE'].includes(order.status)
                              ? 'bg-emerald-50/70 hover:bg-emerald-100/70'
                              : isTourneeRefusedStatus(order.status)
                                ? 'bg-rose-50/70 hover:bg-rose-100/70'
                                : 'hover:bg-blue-50/60'
                          }`}
                        >
                          <td className="px-3 py-3 text-center">
                            {canConfirmStock && isTourneeRefusedStatus(order.status) ? (
                              <input
                                type="checkbox"
                                aria-label={`Sélectionner le colis refusé de ${order.clientNom}`}
                                checked={selectedRefusedOrderIds.includes(order.id)}
                                onChange={(event) => {
                                  setSelectedRefusedOrderIds((current) => (
                                    event.target.checked
                                      ? Array.from(new Set([...current, order.id]))
                                      : current.filter((id) => id !== order.id)
                                  ));
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                              />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-gray-900">{order.clientNom}</p>
                            <p className="text-xs text-gray-500">{order.clientVille}</p>
                          </td>
                          <td className="px-3 py-3">
                            <p className="max-w-[160px] truncate" title={order.produitNom}>{order.produitNom}</p>
                          </td>
                          <td className="px-3 py-3 text-center font-semibold text-blue-600">×{order.quantite}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-right font-medium">{formatCurrency(order.montant)}</td>
                          <td className="px-3 py-3 text-xs">
                            <p className="max-w-[200px] truncate text-gray-600" title={order.noteGestionnaire || order.noteAppelant || ''}>
                              {order.noteGestionnaire || order.noteAppelant || '—'}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`whitespace-nowrap rounded px-2 py-1 text-xs ${getTourneeOrderStatusColor(order.status)}`}>
                              {getTourneeOrderStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {canReturnToValidated && order.status === 'ASSIGNEE' && (order.deliveryType || 'LOCAL') === 'LOCAL' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const confirm = window.confirm('Retourner cette commande dans "Commandes validées" pour réassignation ?');
                                  if (!confirm) return;
                                  returnToValidatedMutation.mutate({ orderId: order.id });
                                }}
                                disabled={returnToValidatedMutation.isPending}
                                className="rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-orange-200 hover:from-orange-600 hover:to-rose-600 disabled:opacity-60"
                              >
                                Retourner
                              </button>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
                    Aucune commande dans cette catégorie pour ce livreur.
                  </div>
              )}

              {selectedCompactGroupOrders.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">Montant total</p>
                    <p className="mt-1 text-lg font-bold text-blue-700">{formatCurrency(selectedCompactGroupSummary.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Montant livré</p>
                    <p className="mt-1 text-lg font-bold text-emerald-700">{formatCurrency(selectedCompactGroupSummary.deliveredAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Montant non livré</p>
                    <p className="mt-1 text-lg font-bold text-orange-700">{formatCurrency(selectedCompactGroupSummary.undeliveredAmount)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de remise */}
      {modalType === 'remise' && selectedTournee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full my-8">
            <h2 className="text-xl font-bold mb-4">Confirmer la remise des colis</h2>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-gray-900">{selectedTournee.nom}</p>
              <p className="text-sm text-gray-600">
                Livreur: {selectedTournee.deliverer.prenom} {selectedTournee.deliverer.nom}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>{selectedTournee.stats.totalOrders}</strong> commande(s) dans cette tournée
              </p>
            </div>

            {/* Détail des produits à remettre */}
            {tourneeDetail?.produitsSummary && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">📦 Produits à remettre au livreur :</h3>
                <div className="space-y-2">
                  {tourneeDetail.produitsSummary.map((produit: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📦</span>
                        <div>
                          <p className="font-medium text-gray-900">{produit.produitNom}</p>
                          <p className="text-xs text-gray-600">
                            Total : {produit.quantiteTotal} unité(s)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-green-600">
                          {produit.quantiteTotal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de colis remis au livreur
              </label>
              <input
                type="number"
                value={colisRemis}
                onChange={(e) => setColisRemis(e.target.value)}
                className="input"
                min="0"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Confirmez le nombre total de colis physiques remis au livreur
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalType(null);
                  setSelectedTournee(null);
                  setColisRemis('');
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRemise}
                disabled={!colisRemis || confirmRemiseMutation.isPending}
                className="btn btn-success flex-1"
              >
                {confirmRemiseMutation.isPending ? 'Confirmation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de retour */}
      {modalType === 'retour' && selectedTournee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full my-8">
            <h2 className="text-xl font-bold mb-4">Confirmer le retour des colis</h2>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-gray-900">{selectedTournee.nom}</p>
              <p className="text-sm text-gray-600">
                Livreur: {selectedTournee.deliverer.prenom} {selectedTournee.deliverer.nom}
              </p>
            </div>

            <div className="mb-6 space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Colis remis:</span>
                <span className="font-semibold text-gray-900">{selectedTournee.stats.colisRemis || selectedTournee.stats.totalOrders}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">Colis livrés:</span>
                <span className="font-semibold text-green-600">{selectedTournee.stats.livrees}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-gray-700">Colis retournés attendus:</span>
                <span className="font-semibold text-orange-600">
                  {(selectedTournee.stats.colisRemis || selectedTournee.stats.totalOrders) - selectedTournee.stats.livrees}
                </span>
              </div>

              {/* Détail des produits non livrés attendus */}
              <div className="mt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Détail des produits non livrés attendus :</h4>
                <div className="space-y-3">
                  {tourneeDetail?.tournee?.orders
                    ?.filter((order: any) => ['REFUSEE', 'ANNULEE_LIVRAISON'].includes(order.status))
                    .map((order: any) => (
                      <div key={order.id} className="bg-white p-3 rounded-lg border border-orange-200">
                        <div className="mb-2">
                          <p className="text-sm font-medium text-gray-900">
                            {order.product?.nom || order.produitNom} (Qté: {order.quantite})
                          </p>
                          <p className="text-xs text-gray-600">
                            {order.clientNom} - {order.clientVille}
                          </p>
                          <p className="text-xs text-gray-500">
                            Statut: Refusé / non livré
                          </p>
                          {order.noteLivreur && (
                            <p className="text-xs text-gray-500 italic mt-1">
                              Note livreur: {order.noteLivreur}
                            </p>
                          )}
                        </div>
                        <select
                          value={raisonsRetour[order.id] || ''}
                          onChange={(e) => setRaisonForOrder(order.id, e.target.value)}
                          className="input w-full text-sm"
                          required
                        >
                          <option value="">Sélectionnez la raison du retour...</option>
                          {Object.entries(RAISONS_RETOUR).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  
                  {tourneeDetail?.tournee?.orders?.filter((order: any) => ['REFUSEE', 'ANNULEE_LIVRAISON'].includes(order.status)).length === 0 && (
                    <p className="text-sm text-gray-500 italic">Aucun colis non livré.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre total de colis retournés reçus
              </label>
              <input
                type="number"
                value={colisRetour}
                onChange={(e) => setColisRetour(e.target.value)}
                className="input"
                min="0"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Confirmez le nombre de colis physiquement retournés par le livreur
              </p>
            </div>

            {/* Calcul automatique de l'écart */}
            {colisRetour && (
              <div className="mb-6">
                {(() => {
                  const ecart = (selectedTournee.stats.colisRemis || selectedTournee.stats.totalOrders) - 
                                (selectedTournee.stats.livrees + parseInt(colisRetour));
                  return ecart !== 0 ? (
                    <div className={`p-4 rounded-lg ${ecart > 0 ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        ⚠️ Écart détecté : {Math.abs(ecart)} colis {ecart > 0 ? 'manquant(s)' : 'en trop'}
                      </p>
                      <textarea
                        value={ecartMotif}
                        onChange={(e) => setEcartMotif(e.target.value)}
                        placeholder="Expliquez la raison de cet écart (obligatoire)"
                        className="input min-h-[80px]"
                        required
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-700">
                        ✓ Aucun écart détecté. Compte correct !
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalType(null);
                  setSelectedTournee(null);
                  setColisRetour('');
                  setEcartMotif('');
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRetour}
                disabled={!colisRetour || confirmRetourMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {confirmRetourMutation.isPending ? 'Confirmation...' : 'Confirmer le retour'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {modalType === 'detail' && selectedTournee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-4xl w-full my-8">
            <h2 className="text-2xl font-bold mb-4">{selectedTournee.nom}</h2>

            {!tourneeDetail ? (
              // Chargement des détails
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des détails...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Alertes en haut du modal */}
                {selectedTournee.stats.alerteCritique && (
                  <div className="mb-4 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle size={24} className="animate-pulse" />
                      <div>
                        <p className="font-bold">⚠️ SITUATION CRITIQUE</p>
                        <p className="text-sm">Colis chez le livreur depuis {selectedTournee.stats.joursChezLivreur} jours ! {selectedTournee.stats.colisRestants} colis non livrés.</p>
                      </div>
                    </div>
                  </div>
                )}
                {selectedTournee.stats.alerteRetard && !selectedTournee.stats.alerteCritique && (
                  <div className="mb-4 p-4 bg-orange-50 border-2 border-orange-400 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle size={20} />
                      <div>
                        <p className="font-semibold">Retard détecté</p>
                        <p className="text-sm">Colis chez le livreur depuis {selectedTournee.stats.joursChezLivreur} jours.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">📦 Colis remis</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Total remis:</span>
                        <span className="font-bold text-blue-600 text-xl">{selectedTournee.stats.colisRemis}</span>
                      </div>
                      {selectedTournee.stats.dateRemise && (
                        <p className="text-xs text-gray-600">
                          📅 {formatDate(selectedTournee.stats.dateRemise)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">✓ Statuts</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Livrés:</span>
                        <span className="font-semibold text-green-600">{selectedTournee.stats.livrees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Refusés:</span>
                        <span className="font-semibold text-red-600">{selectedTournee.stats.refusees + selectedTournee.stats.annulees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>En attente:</span>
                        <span className="font-semibold text-orange-600">{selectedTournee.stats.enAttente}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-lg p-4 ${selectedTournee.stats.colisRestants > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className="font-semibold text-gray-700 mb-3">⏳ Suivi</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Restants:</span>
                        <span className={`font-bold text-xl ${selectedTournee.stats.colisRestants > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {selectedTournee.stats.colisRestants}
                        </span>
                      </div>
                      {selectedTournee.stats.joursChezLivreur > 0 && !selectedTournee.stats.retourConfirme && (
                        <div className="flex items-center gap-1 text-xs">
                          <Clock size={12} />
                          <span>{selectedTournee.stats.joursChezLivreur} jour(s) chez livreur</span>
                        </div>
                      )}
                      {selectedTournee.stats.dateRetour && (
                        <p className="text-xs text-gray-600">
                          ✓ Retour: {formatDate(selectedTournee.stats.dateRetour)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Produits de la tournée */}
                {tourneeDetail?.produitsSummary && tourneeDetail.produitsSummary.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3">📦 Produits de la tournée</h3>
                    <div className="space-y-2">
                      {tourneeDetail.produitsSummary.map((produit: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{produit.produitNom}</span>
                          <div className="flex gap-4 text-sm">
                            <span className="text-green-600">✓ Livrées: {produit.quantiteLivree}</span>
                            <span className="text-red-600">↩ Retour: {produit.quantiteRetour}</span>
                            <span className="font-semibold text-blue-600">Total: {produit.quantiteTotal}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Liste des commandes */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">📋 Commandes ({tourneeDetail?.tournee?.orders?.length || 0})</h3>
                  <div className="border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-sm" style={{ minWidth: '900px' }}>
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left" style={{ width: '20%' }}>Client</th>
                          <th className="px-3 py-2 text-left" style={{ width: '20%' }}>Produit</th>
                          <th className="px-3 py-2 text-center" style={{ width: '8%' }}>Qté</th>
                          <th className="px-3 py-2 text-right" style={{ width: '12%' }}>Montant</th>
                          <th className="px-3 py-2 text-left" style={{ width: '25%' }}>Note</th>
                          <th className="px-3 py-2 text-center" style={{ width: '12%' }}>Statut</th>
                          <th className="px-3 py-2 text-center" style={{ width: '10%' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {tourneeDetail?.tournee?.orders?.map((order: any) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2" style={{ maxWidth: '150px' }}>
                              <div>
                                <p className="font-medium truncate">{order.clientNom}</p>
                                <p className="text-xs text-gray-500 truncate">{order.clientVille}</p>
                              </div>
                            </td>
                            <td className="px-3 py-2" style={{ maxWidth: '150px' }}>
                              <div className="truncate" title={order.produitNom}>{order.produitNom}</div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="font-semibold text-blue-600">×{order.quantite}</span>
                            </td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">
                              <span className="font-medium">{formatCurrency(order.montant)}</span>
                            </td>
                            <td className="px-3 py-2 text-xs" style={{ maxWidth: '200px' }}>
                              {order.noteGestionnaire ? (
                                <div className="space-y-1">
                                  <div className="bg-purple-50 px-2 py-1 rounded border border-purple-200">
                                    <span className="text-xs text-purple-900 font-medium truncate block" title={order.noteGestionnaire}>
                                      📝 {order.noteGestionnaire}
                                    </span>
                                  </div>
                                  {order.noteAppelant && (
                                    <span className="text-gray-600 truncate block" title={order.noteAppelant}>
                                      💬 {order.noteAppelant}
                                    </span>
                                  )}
                                </div>
                              ) : order.noteAppelant ? (
                                <span className="text-gray-600 truncate block" title={order.noteAppelant}>
                                  💬 {order.noteAppelant}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${getTourneeOrderStatusColor(order.status)}`}>
                                {getTourneeOrderStatusLabel(order.status)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {canReturnToValidated && order.status === 'ASSIGNEE' && order.deliveryType === 'LOCAL' ? (
                                <button
                                  onClick={() => {
                                    const confirm = window.confirm('Retourner cette commande dans "Commandes validées" pour réassignation ?');
                                    if (!confirm) return;
                                    returnToValidatedMutation.mutate({ orderId: order.id });
                                  }}
                                  disabled={returnToValidatedMutation.isPending}
                                  className="px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors disabled:opacity-60"
                                  title="Retourner dans Commandes validées"
                                >
                                  Retourner
                                </button>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Résumé financier */}
                {tourneeDetail?.tournee?.orders && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Montant total</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(
                            tourneeDetail.tournee.orders.reduce((sum: number, order: any) => sum + order.montant, 0)
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Montant livré</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(
                            tourneeDetail.tournee.orders
                              .filter((o: any) => o.status === 'LIVREE')
                              .reduce((sum: number, order: any) => sum + order.montant, 0)
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Montant non livré</p>
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(
                            tourneeDetail.tournee.orders
                              .filter((o: any) => ['REFUSEE', 'ANNULEE_LIVRAISON', 'ASSIGNEE'].includes(o.status))
                              .reduce((sum: number, order: any) => sum + order.montant, 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setModalType(null);
                  setSelectedTournee(null);
                }}
                className="btn btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

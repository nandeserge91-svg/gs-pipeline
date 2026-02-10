import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  RefreshCw, 
  RotateCcw, 
  Package, 
  Truck, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  XCircle,
  Calendar,
  User,
  Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type DateFilter = 'today' | 'week' | 'month' | 'all';

interface StockAnalysisData {
  summary: {
    totalCommandes: number;
    totalQuantite: number;
    totalProduitsConcernes: number;
    totalLivreurs: number;
  };
  parProduit: Array<{
    product: any;
    quantiteReelle: number;
    nombreLivreurs: number;
    commandes: any[];
  }>;
  parLivreur: Array<{
    deliverer: any;
    totalQuantite: number;
    produits: Record<string, { nom: string; quantite: number }>;
    commandes: any[];
  }>;
}

const LiveraisonEnCours = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [expandedDeliverer, setExpandedDeliverer] = useState<number | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showHistory, setShowHistory] = useState(false);

  const canSync = user?.role === 'ADMIN';

  // Query pour récupérer les données
  const { data, isLoading, refetch } = useQuery<StockAnalysisData>({
    queryKey: ['stock-analysis-local', showHistory],
    queryFn: async () => {
      const { data } = await api.get('/stock-analysis/local-reserve', {
        params: { includeHistory: showHistory }
      });
      return data;
    }
  });

  // Mutation pour synchroniser
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/stock-analysis/recalculate-local-reserve');
      return data;
    },
    onSuccess: (result) => {
      toast.success(result.message || 'Synchronisation réussie');
      queryClient.invalidateQueries({ queryKey: ['stock-analysis-local'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la synchronisation');
    }
  });

  // Filtrage par date
  const filterByDate = (items: any[], type: 'deliverer' | 'product') => {
    if (dateFilter === 'all') return items;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return items.map(item => {
      const filteredCommandes = item.commandes.filter((cmd: any) => {
        const cmdDate = cmd.deliveryDate ? new Date(cmd.deliveryDate) : cmd.createdAt ? new Date(cmd.createdAt) : new Date();
        
        switch (dateFilter) {
          case 'today':
            return cmdDate >= today;
          case 'week':
            return cmdDate >= weekAgo;
          case 'month':
            return cmdDate >= monthAgo;
          default:
            return true;
        }
      });

      if (filteredCommandes.length === 0) return null;

      if (type === 'deliverer') {
        // Recalculer les produits
        const produits: Record<string, { nom: string; quantite: number }> = {};
        filteredCommandes.forEach((cmd: any) => {
          const key = cmd.produitNom || 'Inconnu';
          if (!produits[key]) {
            produits[key] = { nom: key, quantite: 0 };
          }
          produits[key].quantite += cmd.quantite || 1;
        });

        const totalQuantite = filteredCommandes.reduce((sum: number, cmd: any) => sum + (cmd.quantite || 1), 0);

        return {
          ...item,
          commandes: filteredCommandes,
          produits,
          totalQuantite
        };
      } else {
        const quantiteReelle = filteredCommandes.reduce((sum: number, cmd: any) => sum + (cmd.quantite || 1), 0);
        return {
          ...item,
          commandes: filteredCommandes,
          quantiteReelle
        };
      }
    }).filter(Boolean);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ASSIGNEE':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
            <Clock size={12} /> En livraison
          </span>
        );
      case 'REFUSEE':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
            <XCircle size={12} /> Refusé
          </span>
        );
      case 'ANNULEE_LIVRAISON':
        return (
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
            <XCircle size={12} /> Annulé
          </span>
        );
      case 'RETOURNE':
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
            <RotateCcw size={12} /> Retourné
          </span>
        );
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const handleSync = () => {
    const confirmed = window.confirm(
      'Synchroniser le stock "en livraison" (stockLocalReserve) avec la réalité des commandes en cours ?\n\n' +
      'Cela corrige les valeurs négatives/erronées et crée des mouvements de type CORRECTION.\n' +
      'Aucun stock magasin (stockActuel) ni EXPRESS ne sera modifié.'
    );
    if (confirmed) {
      syncMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="animate-spin" size={20} />
          Chargement des données...
        </div>
      </div>
    );
  }

  const filteredParLivreur = data?.parLivreur ? filterByDate(data.parLivreur, 'deliverer') : [];
  const filteredParProduit = data?.parProduit ? filterByDate(data.parProduit, 'product') : [];

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Livraisons en Cours</h1>
          <p className="text-gray-600 mt-1">Suivi du stock sorti avec les livreurs</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Actualiser
          </button>
          {canSync && (
            <button
              onClick={handleSync}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              disabled={syncMutation.isPending}
            >
              <RotateCcw size={18} className={syncMutation.isPending ? 'animate-spin' : ''} />
              {syncMutation.isPending ? 'Synchronisation...' : 'Synchroniser'}
            </button>
          )}
        </div>
      </div>

      {/* Filtres par date */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={18} className="text-gray-600" />
          <span className="font-medium text-gray-700">Filtrer par période</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'today' as DateFilter, label: "Aujourd'hui" },
            { value: 'week' as DateFilter, label: 'Cette semaine' },
            { value: 'month' as DateFilter, label: 'Ce mois' },
            { value: 'all' as DateFilter, label: 'Tout' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setDateFilter(filter.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateFilter === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showHistory}
              onChange={(e) => setShowHistory(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              📜 Inclure l'historique (commandes LIVREE)
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Afficher aussi les commandes déjà livrées pour voir l'historique complet
          </p>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Commandes</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{data?.summary.totalCommandes || 0}</p>
            </div>
            <Package size={32} className="text-blue-400" />
          </div>
          <p className="text-blue-600 text-xs mt-2">en livraison</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Quantité</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{data?.summary.totalQuantite || 0}</p>
            </div>
            <Package size={32} className="text-green-400" />
          </div>
          <p className="text-green-600 text-xs mt-2">produits totale</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Livreurs</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{data?.summary.totalLivreurs || 0}</p>
            </div>
            <Truck size={32} className="text-purple-400" />
          </div>
          <p className="text-purple-600 text-xs mt-2">actifs</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm font-medium">Produits</p>
              <p className="text-3xl font-bold text-amber-900 mt-1">{data?.summary.totalProduitsConcernes || 0}</p>
            </div>
            <AlertTriangle size={32} className="text-amber-400" />
          </div>
          <p className="text-amber-600 text-xs mt-2">concernés</p>
        </div>
      </div>

      {/* Produits chez chaque livreur */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Truck size={20} className="text-primary-600" />
          Produits chez chaque livreur
        </h2>
        
        {filteredParLivreur.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package size={48} className="mx-auto mb-2 opacity-50" />
            <p>Aucune livraison en cours pour cette période</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredParLivreur.map((item: any) => {
              const isExpanded = expandedDeliverer === item.deliverer.id;
              const produitsCount = Object.keys(item.produits).length;

              return (
                <div key={item.deliverer.id} className="border rounded-lg overflow-hidden">
                  {/* Header */}
                  <div
                    onClick={() => setExpandedDeliverer(isExpanded ? null : item.deliverer.id)}
                    className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 cursor-pointer hover:border-primary-300 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <User size={20} className="text-primary-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {item.deliverer.prenom} {item.deliverer.nom}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} />
                          {item.deliverer.telephone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600 space-x-3">
                          <span>📦 {item.totalQuantite} produits</span>
                          <span>📋 {item.commandes.length} commandes</span>
                          <span>🏷️ {produitsCount} types</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* Contenu expansé */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 bg-gray-50">
                      {/* Produits en possession */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">📦 Produits en possession</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.values(item.produits).map((produit: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-3"
                            >
                              <p className="font-medium text-gray-900">{produit.nom}</p>
                              <p className="text-2xl font-bold text-blue-600 mt-1">×{produit.quantite}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Détail des commandes */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          📋 Détail des commandes ({item.commandes.length})
                        </h4>
                        <div className="space-y-2">
                          {item.commandes.map((cmd: any) => (
                            <div
                              key={cmd.id}
                              className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-900">{cmd.orderReference}</span>
                                {getStatusBadge(cmd.status)}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>📦 {cmd.produitNom} <span className="font-medium">×{cmd.quantite}</span></p>
                                <p>👤 {cmd.clientNom}</p>
                                <p className="text-xs text-gray-500">
                                  📅 {new Date(cmd.deliveryDate || cmd.createdAt).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stock par produit */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package size={20} className="text-primary-600" />
          Stock en livraison par produit
        </h2>

        {filteredParProduit.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package size={48} className="mx-auto mb-2 opacity-50" />
            <p>Aucun produit en livraison pour cette période</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredParProduit.map((item: any) => {
              const isExpanded = expandedProduct === item.product.id;

              return (
                <div key={item.product.id} className="border rounded-lg overflow-hidden">
                  {/* Header */}
                  <div
                    onClick={() => setExpandedProduct(isExpanded ? null : item.product.id)}
                    className="bg-gradient-to-r from-green-50 to-blue-50 p-4 cursor-pointer hover:border-primary-300 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {item.product.nom}{' '}
                        <span className="text-sm font-mono text-gray-500">[{item.product.code}]</span>
                      </h3>
                      <div className="text-sm text-gray-600 space-x-3 mt-1">
                        <span>Quantité: {item.quantiteReelle}</span>
                        <span>| Commandes: {item.commandes.length}</span>
                        <span>| Livreurs: {item.nombreLivreurs}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>

                  {/* Contenu expansé */}
                  {isExpanded && (
                    <div className="p-4 bg-gray-50 space-y-2">
                      {item.commandes.map((cmd: any) => (
                        <div
                          key={cmd.id}
                          className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">{cmd.orderReference}</span>
                            {getStatusBadge(cmd.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>👤 {cmd.clientNom}</p>
                            <p>📞 {cmd.clientTelephone}</p>
                            <p>📍 {cmd.clientVille}</p>
                            <p>📦 Quantité: <span className="font-medium">×{cmd.quantite}</span></p>
                            {cmd.deliverer && (
                              <p>🚚 Livreur: {cmd.deliverer.prenom} {cmd.deliverer.nom}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              📅 {new Date(cmd.deliveryDate || cmd.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message informatif */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <AlertTriangle size={18} />
          ℹ️ Informations
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
          <li>Affiche TOUS les produits avec les livreurs</li>
          <li>Inclut: En livraison, Refusé, Annulé, Retourné</li>
          <li>Utilisez "Synchroniser" pour corriger les écarts (Admin uniquement)</li>
          <li>Les commandes livrées sont automatiquement retirées</li>
        </ul>
      </div>
    </div>
  );
};

export default LiveraisonEnCours;


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar, Package, MapPin, Phone, TrendingUp, TrendingDown, DollarSign, Eye } from 'lucide-react';
import { deliveryApi } from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import type { Order } from '@/types';

export default function History() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [period, setPeriod] = useState('month'); // today, week, month, year, all
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Récupérer toutes les commandes terminées du livreur
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['livreur-history', period],
    queryFn: () => deliveryApi.getMyOrders({ date: undefined }), // Toutes les dates
  });

  // Filtrer les commandes par période
  const getFilteredByPeriod = (orders: Order[]) => {
    if (!orders) return [];
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return orders.filter(order => {
      const orderDate = new Date(order.updatedAt || order.createdAt);
      
      switch (period) {
        case 'today':
          return orderDate >= startOfDay;
        case 'week':
          return orderDate >= startOfWeek;
        case 'month':
          return orderDate >= startOfMonth;
        case 'year':
          return orderDate >= startOfYear;
        case 'all':
        default:
          return true;
      }
    });
  };

  // Filtrer uniquement les commandes terminées
  const completedOrders = ordersData?.orders?.filter((o: Order) => 
    ['LIVREE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'].includes(o.status)
  ) || [];

  const filteredByPeriod = getFilteredByPeriod(completedOrders);

  // Filtrer par recherche et statut
  const filteredOrders = filteredByPeriod
    .filter((order: Order) => {
      const matchesSearch = !searchTerm || 
        order.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientTelephone.includes(searchTerm) ||
        order.orderReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientVille?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  // Calculer les statistiques de la période
  const stats = {
    total: filteredByPeriod.length,
    livrees: filteredByPeriod.filter(o => o.status === 'LIVREE').length,
    refusees: filteredByPeriod.filter(o => o.status === 'REFUSEE').length,
    annulees: filteredByPeriod.filter(o => o.status === 'ANNULEE_LIVRAISON').length,
    retournees: filteredByPeriod.filter(o => o.status === 'RETOURNE').length,
    montantTotal: filteredByPeriod
      .filter(o => o.status === 'LIVREE')
      .reduce((sum, o) => sum + (o.prixTotal || 0), 0),
    tauxReussite: filteredByPeriod.length > 0 
      ? ((filteredByPeriod.filter(o => o.status === 'LIVREE').length / filteredByPeriod.length) * 100).toFixed(1)
      : '0.0'
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Historique</h1>
          <p className="text-gray-600 mt-1">Toutes mes livraisons passées</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="input w-auto"
        >
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="year">Cette année</option>
          <option value="all">Tout l'historique</option>
        </select>
      </div>

      {/* Statistiques de la période */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">✅ Livrées</p>
              <p className="text-3xl font-bold text-green-800">{stats.livrees}</p>
              <p className="text-xs text-green-600 mt-1">{stats.tauxReussite}% de réussite</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
              <TrendingUp className="text-green-700" size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium mb-1">❌ Refusées</p>
              <p className="text-3xl font-bold text-red-800">{stats.refusees}</p>
              <p className="text-xs text-red-600 mt-1">
                {stats.total > 0 ? ((stats.refusees / stats.total) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center">
              <TrendingDown className="text-red-700" size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium mb-1">🔙 Retours</p>
              <p className="text-3xl font-bold text-orange-800">
                {stats.annulees + stats.retournees}
              </p>
              <p className="text-xs text-orange-600 mt-1">Annulées + Retournées</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
              <Package className="text-orange-700" size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">💰 Encaissé</p>
              <p className="text-2xl font-bold text-purple-800">{formatCurrency(stats.montantTotal)}</p>
              <p className="text-xs text-purple-600 mt-1">Total période</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center">
              <DollarSign className="text-purple-700" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par client, téléphone, référence, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full md:w-auto"
          >
            <option value="">Tous les statuts</option>
            <option value="LIVREE">✅ Livrée</option>
            <option value="REFUSEE">❌ Refusée</option>
            <option value="ANNULEE_LIVRAISON">🚫 Annulée</option>
            <option value="RETOURNE">🔙 Retournée</option>
          </select>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement de l'historique...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">Aucune livraison trouvée pour cette période</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Référence</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Téléphone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ville</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: Order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium">{order.orderReference}</td>
                    <td className="py-3 px-4 text-sm">{order.clientNom}</td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Phone size={14} className="text-gray-400" />
                        {order.clientTelephone}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        {order.clientVille || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{order.produitNom || '-'}</td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {order.status === 'LIVREE' ? (
                        <span className="text-green-600">{formatCurrency(order.prixTotal || 0)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(order.updatedAt || order.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-primary-600 hover:text-primary-800 transition-colors"
                        title="Voir les détails"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Détails de la livraison</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Informations client */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">👤 Client</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Nom</p>
                      <p className="font-medium">{selectedOrder.clientNom}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <p className="font-medium">{selectedOrder.clientTelephone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Adresse</p>
                      <p className="font-medium">{selectedOrder.clientAdresse || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ville</p>
                      <p className="font-medium">{selectedOrder.clientVille || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Informations commande */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">📦 Commande</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Référence</p>
                      <p className="font-medium">{selectedOrder.orderReference}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Produit</p>
                      <p className="font-medium">{selectedOrder.produitNom || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quantité</p>
                      <p className="font-medium">{selectedOrder.quantite || 1}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Prix total</p>
                      <p className="font-medium text-lg">{formatCurrency(selectedOrder.prixTotal || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Statut et dates */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">📊 Statut</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Statut actuel</span>
                      <span className={`badge ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Date de création</span>
                      <span className="font-medium">{formatDateTime(selectedOrder.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Dernière mise à jour</span>
                      <span className="font-medium">{formatDateTime(selectedOrder.updatedAt || selectedOrder.createdAt)}</span>
                    </div>
                    {selectedOrder.deliveryDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Date de livraison</span>
                        <span className="font-medium">
                          {new Date(selectedOrder.deliveryDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {(selectedOrder.noteLivreur || selectedOrder.noteGestionnaire || selectedOrder.noteAppelant) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">📝 Notes</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      {selectedOrder.noteLivreur && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Ma note (Livreur)</p>
                          <p className="text-sm bg-white p-2 rounded border border-gray-200">
                            {selectedOrder.noteLivreur}
                          </p>
                        </div>
                      )}
                      {selectedOrder.noteGestionnaire && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Note gestionnaire</p>
                          <p className="text-sm bg-white p-2 rounded border border-gray-200">
                            {selectedOrder.noteGestionnaire}
                          </p>
                        </div>
                      )}
                      {selectedOrder.noteAppelant && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Note appelant</p>
                          <p className="text-sm bg-white p-2 rounded border border-gray-200">
                            {selectedOrder.noteAppelant}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="btn btn-secondary"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

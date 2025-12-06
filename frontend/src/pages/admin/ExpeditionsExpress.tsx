import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { Truck, Zap, Package, CheckCircle, Phone, MapPin, DollarSign, Calendar, Users } from 'lucide-react';
import { ordersApi, usersApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/utils/statusHelpers';
import toast from 'react-hot-toast';
import type { Order } from '@/types';

export default function ExpeditionsExpress() {
  const [activeTab, setActiveTab] = useState<'expeditions' | 'express-pending' | 'express-arrived' | 'history'>('expeditions');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [showArriveModal, setShowArriveModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDelivererId, setSelectedDelivererId] = useState<number | null>(null);
  const [finalizeData, setFinalizeData] = useState({
    montantPaye: 0,
    modePaiement: '',
    referencePayment: '',
  });

  const queryClient = useQueryClient();

  // Récupérer les livreurs
  const { data: deliverersData } = useQuery({
    queryKey: ['deliverers'],
    queryFn: () => usersApi.getAll({ role: 'LIVREUR', actif: true }),
  });

  const deliverers = deliverersData?.users || [];

  // Récupérer toutes les commandes EXPÉDITION
  const { data: expeditionsData, isLoading: loadingExpeditions } = useQuery({
    queryKey: ['expeditions'],
    queryFn: () => ordersApi.getAll({ status: 'EXPEDITION', limit: 100 }),
    refetchInterval: 30000,
  });

  // Récupérer les commandes EXPÉDITION assignées
  const { data: assignedData, isLoading: loadingAssigned } = useQuery({
    queryKey: ['expeditions-assigned'],
    queryFn: () => ordersApi.getAll({ status: 'ASSIGNEE', deliveryType: 'EXPEDITION', limit: 100 }),
    refetchInterval: 30000,
  });

  // Fusionner les expéditions non assignées et assignées
  const allExpeditions = [
    ...(expeditionsData?.orders || []),
    ...(assignedData?.orders || [])
  ];

  const { data: expressData, isLoading: loadingExpress } = useQuery({
    queryKey: ['express-pending'],
    queryFn: () => ordersApi.getAll({ status: 'EXPRESS', limit: 100 }),
    refetchInterval: 30000,
  });

  const { data: expressArrivedData, isLoading: loadingArrived } = useQuery({
    queryKey: ['express-arrived'],
    queryFn: () => ordersApi.getAll({ status: 'EXPRESS_ARRIVE', limit: 100 }),
    refetchInterval: 30000,
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['express-history'],
    queryFn: () => ordersApi.getAll({ status: 'EXPRESS_LIVRE', limit: 100 }),
  });

  // Mutation pour marquer EXPRESS comme arrivé
  const arriveExpressMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.markExpressArrived(orderId),
    onSuccess: () => {
      toast.success('✅ Colis marqué comme arrivé en agence');
      queryClient.invalidateQueries({ queryKey: ['express-pending'] });
      queryClient.invalidateQueries({ queryKey: ['express-arrived'] });
      setShowArriveModal(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur');
    },
  });

  // Mutation pour notifier le client
  const notifyClientMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.notifyExpressClient(orderId),
    onSuccess: () => {
      toast.success('✅ Client notifié avec succès');
      queryClient.invalidateQueries({ queryKey: ['express-arrived'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur');
    },
  });

  // Mutation pour finaliser EXPRESS
  const finalizeExpressMutation = useMutation({
    mutationFn: ({ orderId, data }: { orderId: number; data: any }) => 
      ordersApi.finalizeExpress(orderId, data),
    onSuccess: () => {
      toast.success('✅ EXPRESS finalisé avec succès');
      queryClient.invalidateQueries({ queryKey: ['express-arrived'] });
      queryClient.invalidateQueries({ queryKey: ['express-history'] });
      setShowFinalizeModal(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur');
    },
  });

  // Mutation pour assigner un livreur à une EXPÉDITION
  const assignDelivererMutation = useMutation({
    mutationFn: ({ orderId, delivererId }: { orderId: number; delivererId: number }) => 
      ordersApi.assignExpeditionDeliverer(orderId, delivererId),
    onSuccess: () => {
      toast.success('✅ Livreur assigné avec succès');
      queryClient.invalidateQueries({ queryKey: ['expeditions'] });
      queryClient.invalidateQueries({ queryKey: ['expeditions-assigned'] });
      setShowAssignModal(false);
      setSelectedOrder(null);
      setSelectedDelivererId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'assignation');
    },
  });

  const handleFinalizeExpress = () => {
    if (!selectedOrder) return;
    finalizeExpressMutation.mutate({
      orderId: selectedOrder.id,
      data: finalizeData,
    });
  };

  const handleAssignDeliverer = () => {
    if (!selectedOrder || !selectedDelivererId) {
      toast.error('Veuillez sélectionner un livreur');
      return;
    }
    assignDelivererMutation.mutate({
      orderId: selectedOrder.id,
      delivererId: selectedDelivererId,
    });
  };

  const tabs = [
    { id: 'expeditions', label: 'Expéditions', icon: Truck, count: expeditionsData?.orders?.length || 0 },
    { id: 'express-pending', label: 'EXPRESS - À expédier', icon: Zap, count: expressData?.orders?.length || 0 },
    { id: 'express-arrived', label: 'EXPRESS - En agence', icon: Package, count: expressArrivedData?.orders?.length || 0 },
    { id: 'history', label: 'Historique', icon: CheckCircle, count: historyData?.orders?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Expéditions & EXPRESS</h1>
        <p className="text-gray-600 mt-1">Gestion des livraisons vers les villes éloignées</p>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon size={20} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`
                    ml-2 py-0.5 px-2 rounded-full text-xs font-bold
                    ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div className="card">
        {/* ONGLET 1 : EXPÉDITIONS */}
        {activeTab === 'expeditions' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Truck className="text-blue-600" />
              Expéditions en cours ({allExpeditions.length})
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Commandes avec paiement 100% effectué, en attente de livraison
            </p>

            {(loadingExpeditions || loadingAssigned) ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : allExpeditions.length === 0 ? (
              <div className="text-center py-12">
                <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Aucune expédition en cours</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Référence</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ville</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant payé</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Paiement</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Livreur</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allExpeditions.map((order: Order) => {
                      const deliverer = order.delivererId 
                        ? deliverers.find((d: any) => d.id === order.delivererId)
                        : null;
                      
                      return (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium">{order.orderReference}</td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium">{order.clientNom}</div>
                            <div className="text-xs text-gray-500">{order.clientTelephone}</div>
                          </td>
                          <td className="py-3 px-4 text-sm">{order.clientVille}</td>
                          <td className="py-3 px-4 text-sm">{order.produitNom} (x{order.quantite})</td>
                          <td className="py-3 px-4 text-sm font-bold text-green-600">
                            {formatCurrency(order.montantPaye || order.montant)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div>{order.modePaiement}</div>
                            {order.referencePayment && (
                              <div className="text-xs text-gray-500">{order.referencePayment}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {deliverer ? (
                              <div className="text-sm">
                                <div className="font-medium">{deliverer.prenom} {deliverer.nom}</div>
                                <div className="text-xs text-gray-500">{deliverer.telephone}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Non assigné</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {!order.delivererId && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowAssignModal(true);
                                }}
                                className="btn btn-sm btn-primary flex items-center gap-1"
                              >
                                <Users size={16} />
                                Assigner livreur
                              </button>
                            )}
                            {order.delivererId && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                ✓ Assignée
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ONGLET 2 : EXPRESS À EXPÉDIER */}
        {activeTab === 'express-pending' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="text-amber-600" />
              EXPRESS - À expédier ({expressData?.orders?.length || 0})
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Commandes avec acompte 10% payé, en attente d'expédition vers l'agence
            </p>

            {loadingExpress ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
              </div>
            ) : expressData?.orders?.length === 0 ? (
              <div className="text-center py-12">
                <Zap size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Aucun EXPRESS en attente</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Référence</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Acompte (10%)</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Restant (90%)</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Agence</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expressData?.orders?.map((order: Order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium">{order.orderReference}</td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium">{order.clientNom}</div>
                          <div className="text-xs text-gray-500">{order.clientTelephone}</div>
                        </td>
                        <td className="py-3 px-4 text-sm">{order.produitNom} (x{order.quantite})</td>
                        <td className="py-3 px-4 text-sm font-bold text-green-600">
                          {formatCurrency(order.montantPaye || 0)}
                        </td>
                        <td className="py-3 px-4 text-sm font-bold text-amber-600">
                          {formatCurrency(order.montantRestant || 0)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} />
                            {order.agenceRetrait}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowArriveModal(true);
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            Marquer arrivé
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ONGLET 3 : EXPRESS EN AGENCE */}
        {activeTab === 'express-arrived' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="text-cyan-600" />
              EXPRESS - En agence ({expressArrivedData?.orders?.length || 0})
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Colis arrivés en agence, en attente du retrait par le client (paiement des 90% restants)
            </p>

            {loadingArrived ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
              </div>
            ) : expressArrivedData?.orders?.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Aucun colis en attente de retrait</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {expressArrivedData?.orders?.map((order: Order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{order.clientNom}</h3>
                          {order.clientNotifie ? (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              ✓ Notifié
                            </span>
                          ) : (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                              ⚠️ À notifier
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <Phone size={14} className="inline mr-1" />
                          {order.clientTelephone}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <MapPin size={14} className="inline mr-1" />
                          <strong>Agence :</strong> {order.agenceRetrait}
                        </p>
                        <p className="text-sm mb-1">
                          <strong>Produit :</strong> {order.produitNom} (x{order.quantite})
                        </p>
                        <p className="text-sm mb-1">
                          <strong>Référence :</strong> {order.orderReference}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Arrivé le</p>
                        <p className="text-sm font-medium">{order.arriveAt ? formatDateTime(order.arriveAt) : '-'}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Acompte payé</p>
                          <p className="font-bold text-green-600">{formatCurrency(order.montantPaye || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">À payer au retrait</p>
                          <p className="font-bold text-amber-600">{formatCurrency(order.montantRestant || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total</p>
                          <p className="font-bold">{formatCurrency(order.montant)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!order.clientNotifie && (
                        <button
                          onClick={() => notifyClientMutation.mutate(order.id)}
                          className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                          disabled={notifyClientMutation.isPending}
                        >
                          <Phone size={16} />
                          Notifier le client
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setFinalizeData({
                            montantPaye: order.montantRestant || 0,
                            modePaiement: '',
                            referencePayment: '',
                          });
                          setShowFinalizeModal(true);
                        }}
                        className="btn btn-success flex-1 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Client a retiré
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 4 : HISTORIQUE */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-600" />
              Historique EXPRESS livrés ({historyData?.orders?.length || 0})
            </h2>

            {loadingHistory ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : historyData?.orders?.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Aucun historique</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Référence</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Agence</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant total</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date retrait</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData?.orders?.map((order: Order) => (
                      <tr key={order.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm">{order.orderReference}</td>
                        <td className="py-3 px-4 text-sm">{order.clientNom}</td>
                        <td className="py-3 px-4 text-sm">{order.produitNom}</td>
                        <td className="py-3 px-4 text-sm">{order.agenceRetrait}</td>
                        <td className="py-3 px-4 text-sm font-bold">{formatCurrency(order.montant)}</td>
                        <td className="py-3 px-4 text-sm">{order.deliveredAt ? formatDateTime(order.deliveredAt) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Assigner un livreur */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Assigner un livreur</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-1">
                <strong>Référence :</strong> {selectedOrder.orderReference}
              </p>
              <p className="text-sm text-blue-800 mb-1">
                <strong>Client :</strong> {selectedOrder.clientNom}
              </p>
              <p className="text-sm text-blue-800 mb-1">
                <strong>Ville :</strong> {selectedOrder.clientVille}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Produit :</strong> {selectedOrder.produitNom} (x{selectedOrder.quantite})
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un livreur <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDelivererId || ''}
                onChange={(e) => setSelectedDelivererId(parseInt(e.target.value))}
                className="input"
                required
              >
                <option value="">Choisir un livreur...</option>
                {deliverers.map((deliverer: any) => (
                  <option key={deliverer.id} value={deliverer.id}>
                    {deliverer.prenom} {deliverer.nom} - {deliverer.telephone}
                  </option>
                ))}
              </select>
              {deliverers.length === 0 && (
                <p className="text-sm text-red-600 mt-2">
                  Aucun livreur disponible. Veuillez créer un compte livreur d'abord.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedOrder(null);
                  setSelectedDelivererId(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignDeliverer}
                className="btn btn-primary flex-1"
                disabled={assignDelivererMutation.isPending || !selectedDelivererId}
              >
                {assignDelivererMutation.isPending ? 'Assignation...' : 'Assigner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Marquer EXPRESS comme arrivé */}
      {showArriveModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmer l'arrivée en agence</h3>
            <p className="text-gray-600 mb-4">
              Le colis <strong>{selectedOrder.orderReference}</strong> pour <strong>{selectedOrder.clientNom}</strong> est bien arrivé à l'agence <strong>{selectedOrder.agenceRetrait}</strong> ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowArriveModal(false);
                  setSelectedOrder(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={() => arriveExpressMutation.mutate(selectedOrder.id)}
                className="btn btn-primary flex-1"
                disabled={arriveExpressMutation.isPending}
              >
                {arriveExpressMutation.isPending ? 'Confirmation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Finaliser EXPRESS */}
      {showFinalizeModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Finaliser le retrait EXPRESS</h3>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800 mb-1">
                <strong>Client :</strong> {selectedOrder.clientNom}
              </p>
              <p className="text-sm text-green-800 mb-1">
                <strong>Produit :</strong> {selectedOrder.produitNom}
              </p>
              <p className="text-sm text-green-800 mb-2">
                <strong>Agence :</strong> {selectedOrder.agenceRetrait}
              </p>
              <div className="border-t border-green-200 pt-2 mt-2">
                <p className="text-sm text-green-800">Le client doit payer :</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(selectedOrder.montantRestant || 0)}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant payé <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={finalizeData.montantPaye}
                  onChange={(e) => setFinalizeData({...finalizeData, montantPaye: parseFloat(e.target.value) || 0})}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de paiement <span className="text-red-500">*</span>
                </label>
                <select
                  value={finalizeData.modePaiement}
                  onChange={(e) => setFinalizeData({...finalizeData, modePaiement: e.target.value})}
                  className="input"
                  required
                >
                  <option value="">Sélectionnez...</option>
                  <option value="Cash">Cash</option>
                  <option value="Orange Money">Orange Money</option>
                  <option value="MTN Money">MTN Money</option>
                  <option value="Moov Money">Moov Money</option>
                  <option value="Wave">Wave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Référence de transaction (optionnel)
                </label>
                <input
                  type="text"
                  value={finalizeData.referencePayment}
                  onChange={(e) => setFinalizeData({...finalizeData, referencePayment: e.target.value})}
                  className="input"
                  placeholder="Ex: TRX123456789"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFinalizeModal(false);
                  setSelectedOrder(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleFinalizeExpress}
                className="btn btn-success flex-1"
                disabled={!finalizeData.modePaiement || finalizeExpressMutation.isPending}
              >
                {finalizeExpressMutation.isPending ? 'Finalisation...' : 'Finaliser'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


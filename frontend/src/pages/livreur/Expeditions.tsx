import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Phone, MapPin, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveryApi, ordersApi } from '@/lib/api';
import { formatCurrency, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';
import type { Order } from '@/types';

export default function Expeditions() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedExpedition, setSelectedExpedition] = useState<Order | null>(null);
  const [codeExpedition, setCodeExpedition] = useState('');
  const [photoRecuExpedition, setPhotoRecuExpedition] = useState('');
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['livreur-expeditions', selectedDate, selectedStatusFilter],
    queryFn: () => deliveryApi.getMyExpeditions({ 
      date: selectedDate || undefined,
      status: selectedStatusFilter || undefined
    }),
  });

  const markArriveMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => ordersApi.markExpressArrived(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livreur-expeditions'] });
      toast.success('✅ Commande marquée comme arrivée');
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  const markLivreeMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => ordersApi.finalizeExpress(id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livreur-expeditions'] });
      toast.success('✅ Commande livrée avec succès');
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  // Mutation pour confirmer une EXPÉDITION ou EXPRESS avec code + photo
  const deliverExpeditionMutation = useMutation({
    mutationFn: ({ orderId, codeExpedition, photoRecuExpedition, orderType }: { 
      orderId: number; 
      codeExpedition: string; 
      photoRecuExpedition: string;
      orderType: 'EXPEDITION' | 'EXPRESS';
    }) => {
      // Si c'est EXPRESS, utiliser la route markExpressArrived avec code + photo
      if (orderType === 'EXPRESS') {
        return ordersApi.markExpressArrivedWithCode(orderId, codeExpedition, photoRecuExpedition);
      }
      // Si c'est EXPEDITION, utiliser la route deliverExpedition
      return ordersApi.deliverExpedition(orderId, codeExpedition, undefined, photoRecuExpedition);
    },
    onSuccess: (data, variables) => {
      const message = variables.orderType === 'EXPRESS' 
        ? '✅ EXPRESS confirmé comme arrivé en agence'
        : '✅ Expédition confirmée comme expédiée';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['livreur-expeditions'] });
      setSelectedExpedition(null);
      setCodeExpedition('');
      setPhotoRecuExpedition('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la confirmation');
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 MB');
      return;
    }

    // Convertir en base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoRecuExpedition(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const confirmDeliverExpedition = () => {
    if (!codeExpedition.trim()) {
      toast.error('Veuillez saisir le code d\'expédition');
      return;
    }
    
    // Déterminer le type de commande
    const isExpressOrder = selectedExpedition!.deliveryType === 'EXPRESS' || 
                           selectedExpedition!.status.includes('EXPRESS');
    
    // Photo facultative
    deliverExpeditionMutation.mutate({
      orderId: selectedExpedition!.id,
      codeExpedition: codeExpedition.trim(),
      photoRecuExpedition: photoRecuExpedition.trim(),
      orderType: isExpressOrder ? 'EXPRESS' : 'EXPEDITION'
    });
  };

  const orders = ordersData?.orders || [];

  // Grouper les commandes par statut
  const enCoursOrders = orders.filter((o: Order) => 
    ['EXPRESS', 'EXPEDITION', 'ASSIGNEE', 'EN_LIVRAISON'].includes(o.status)
  );
  const arriveesOrders = orders.filter((o: Order) => 
    ['EXPRESS_ARRIVE'].includes(o.status)
  );
  const livreesOrders = orders.filter((o: Order) => 
    ['EXPRESS_LIVRE', 'LIVREE', 'RETOURNE'].includes(o.status)
  );

  const renderOrderCard = (order: Order, showActions: boolean = true) => {
    const isExpress = order.deliveryType === 'EXPRESS' || order.status.includes('EXPRESS');
    const isExpedition = order.deliveryType === 'EXPEDITION' || (order.status === 'EXPEDITION' || order.status === 'ASSIGNEE');
    const isArrived = order.status === 'EXPRESS_ARRIVE';
    const isDelivered = ['EXPRESS_LIVRE', 'LIVREE'].includes(order.status);

    return (
      <div 
        key={order.id} 
        className={`card border-2 ${
          isExpress ? 'border-purple-200 bg-purple-50' : 'border-blue-200 bg-blue-50'
        } hover:shadow-lg transition-shadow`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-gray-900">{order.clientNom}</h3>
              {isExpress && (
                <span className="badge bg-purple-600 text-white text-xs">EXPRESS</span>
              )}
            </div>
            <p className="text-sm text-gray-600">{order.clientVille}</p>
            {order.agenceRetrait && (
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <MapPin size={14} />
                <strong>Agence:</strong> {order.agenceRetrait}
              </p>
            )}
          </div>
          <span className={`badge ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Phone size={16} className="text-gray-400" />
            <a 
              href={`tel:${order.clientTelephone}`} 
              className="text-primary-600 hover:underline"
            >
              {order.clientTelephone}
            </a>
          </div>
          <div className="text-sm text-gray-600 pt-2 border-t">
            <strong>Produit:</strong> {order.produitNom} (x{order.quantite})
          </div>
          {order.codeExpedition && (
            <div className="text-sm font-mono bg-gray-100 p-2 rounded">
              <strong>Code:</strong> {order.codeExpedition}
            </div>
          )}
          {order.noteAppelant && (
            <div className="text-xs bg-blue-50 border border-blue-200 rounded p-2">
              <strong className="text-blue-800">📝 Note appelant:</strong>
              <p className="text-blue-700 mt-1">{order.noteAppelant}</p>
            </div>
          )}
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(order.montant)}
          </div>
        </div>

        {showActions && !isDelivered && (
          <div className="space-y-2">
            {/* Bouton "Confirmer l'expédition" pour EXPÉDITION (100%) et EXPRESS (10%) */}
            {!isArrived && (
              (isExpedition && !isExpress && (order.status === 'EXPEDITION' || order.status === 'ASSIGNEE')) ||
              (isExpress && (order.status === 'EXPRESS' || order.status === 'ASSIGNEE'))
            ) && (
              <button
                onClick={() => setSelectedExpedition(order)}
                className={`btn w-full flex items-center justify-center gap-2 ${
                  isExpress ? 'btn-primary' : 'btn-success'
                }`}
              >
                <CheckCircle size={16} />
                Confirmer l'expédition
              </button>
            )}
            
            {/* Bouton "Marquer livrée" pour EXPRESS déjà arrivé */}
            {isArrived && (
              <button
                onClick={() => {
                  if (window.confirm('Confirmer la livraison de cette commande EXPRESS ?')) {
                    markLivreeMutation.mutate({ id: order.id });
                  }
                }}
                className="btn btn-success w-full flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                Marquer livrée
              </button>
            )}
          </div>
        )}

        {order.clientAdresse && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              order.clientAdresse + ', ' + order.clientVille
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary w-full mt-2 flex items-center justify-center gap-2"
          >
            <MapPin size={16} />
            Voir sur Maps
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Expéditions</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos commandes EXPÉDITION et EXPRESS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">Tous les statuts</option>
            <option value="EXPRESS">EXPRESS</option>
            <option value="EXPEDITION">EXPÉDITION</option>
            <option value="EXPRESS_ARRIVE">EXPRESS Arrivées</option>
            <option value="EXPRESS_LIVRE">EXPRESS Livrées</option>
          </select>
          <select
            value={selectedDate ? 'custom' : 'all'}
            onChange={(e) => {
              if (e.target.value === 'all') {
                setSelectedDate('');
              } else if (e.target.value === 'today') {
                setSelectedDate(new Date().toISOString().split('T')[0]);
              }
            }}
            className="input w-auto"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="custom">Date personnalisée</option>
          </select>
          {selectedDate && selectedDate !== new Date().toISOString().split('T')[0] && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input w-auto"
            />
          )}
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <p className="text-sm text-gray-600">En cours</p>
          <p className="text-2xl font-bold text-purple-600">{enCoursOrders.length}</p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-sm text-gray-600">Arrivées</p>
          <p className="text-2xl font-bold text-blue-600">{arriveesOrders.length}</p>
        </div>
        <div className="card bg-green-50 border-green-200">
          <p className="text-sm text-gray-600">Livrées</p>
          <p className="text-2xl font-bold text-green-600">{livreesOrders.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* En cours */}
          {enCoursOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="text-purple-600" />
                En cours ({enCoursOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enCoursOrders.map((order: Order) => renderOrderCard(order))}
              </div>
            </div>
          )}

          {/* Arrivées */}
          {arriveesOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="text-blue-600" />
                Arrivées à l'agence ({arriveesOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {arriveesOrders.map((order: Order) => renderOrderCard(order))}
              </div>
            </div>
          )}

          {/* Livrées */}
          {livreesOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-600" />
                Livrées ({livreesOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {livreesOrders.map((order: Order) => renderOrderCard(order, false))}
              </div>
            </div>
          )}

          {orders.length === 0 && (
            <div className="card text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Aucune expédition pour le moment</p>
            </div>
          )}
        </>
      )}

      {/* Modal de confirmation arrivée EXPRESS */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Confirmer l'arrivée</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg">{selectedOrder.clientNom}</h3>
              <p className="text-gray-600">{selectedOrder.clientVille}</p>
              {selectedOrder.agenceRetrait && (
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Agence:</strong> {selectedOrder.agenceRetrait}
                </p>
              )}
              <p className="text-sm mt-2">
                <strong>Produit:</strong> {selectedOrder.produitNom} (x{selectedOrder.quantite})
              </p>
              {selectedOrder.codeExpedition && (
                <p className="text-sm font-mono bg-white p-2 rounded mt-2">
                  <strong>Code:</strong> {selectedOrder.codeExpedition}
                </p>
              )}
              {selectedOrder.noteAppelant && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-blue-800 mb-1 font-semibold">📝 Note de l'appelant :</p>
                  <p className="text-sm bg-blue-50 border border-blue-200 rounded p-2 text-blue-700">{selectedOrder.noteAppelant}</p>
                </div>
              )}
              <p className="text-xl font-bold text-gray-900 mt-2">
                {formatCurrency(selectedOrder.montant)}
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => markArriveMutation.mutate({ id: selectedOrder.id })}
                className="btn btn-primary w-full"
                disabled={markArriveMutation.isPending}
              >
                ✓ Confirmer l'arrivée à l'agence
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-secondary w-full"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation EXPÉDITION/EXPRESS avec code + photo */}
      {selectedExpedition && (() => {
        const isExpressModal = selectedExpedition.deliveryType === 'EXPRESS' || selectedExpedition.status.includes('EXPRESS');
        const montantPaye = selectedExpedition.montantPaye || 0;
        const isPaiement100 = montantPaye >= selectedExpedition.montant * 0.95;
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {isExpressModal ? '🚀 Confirmer l\'arrivée EXPRESS en agence' : '📦 Confirmer l\'expédition'}
              </h2>
              
              <div className={`mb-6 p-4 rounded-lg ${isExpressModal ? 'bg-purple-50 border-purple-200' : 'bg-gray-50'}`}>
                <h3 className="font-semibold text-lg">{selectedExpedition.clientNom}</h3>
                <p className="text-gray-600">{selectedExpedition.clientVille}</p>
                {selectedExpedition.agenceRetrait && isExpressModal && (
                  <p className="text-sm font-semibold text-purple-700 mt-1">
                    🏢 Agence: {selectedExpedition.agenceRetrait}
                  </p>
                )}
                {selectedExpedition.clientAdresse && !isExpressModal && (
                  <p className="text-sm text-gray-600 mt-1">{selectedExpedition.clientAdresse}</p>
                )}
                <a href={`tel:${selectedExpedition.clientTelephone}`} className="text-primary-600 text-sm block mt-2">
                  📞 {selectedExpedition.clientTelephone}
                </a>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm">
                    <strong>Produit:</strong> {selectedExpedition.produitNom} (x{selectedExpedition.quantite})
                  </p>
                  <p className="text-xl font-bold text-gray-900 mt-2">
                    {formatCurrency(selectedExpedition.montant)}
                    {isPaiement100 ? (
                      <span className="text-sm font-normal text-green-600 ml-2">✅ Payé 100%</span>
                    ) : (
                      <span className="text-sm font-normal text-orange-600 ml-2">
                        💰 Payé {montantPaye} FCFA (10%) - Reste {selectedExpedition.montant - montantPaye} FCFA
                      </span>
                    )}
                  </p>
                </div>
                {selectedExpedition.noteAppelant && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-blue-800 mb-1 font-semibold">📝 Note de l'appelant :</p>
                    <p className="text-sm bg-blue-50 border border-blue-200 rounded p-2 text-blue-700">
                      {selectedExpedition.noteAppelant}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code d'expédition * <span className="text-red-500">(Obligatoire)</span>
                  </label>
                  <input
                    type="text"
                    placeholder={isExpressModal ? "Ex: EXP-EXPRESS-2024-12345" : "Ex: EXP-2024-12345"}
                    value={codeExpedition}
                    onChange={(e) => setCodeExpedition(e.target.value)}
                    className="input w-full"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {isExpressModal 
                      ? "Code de tracking fourni lors du dépôt à l'agence"
                      : "Code de tracking fourni par l'agence de transport"
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo du reçu (optionnel)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100
                      cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum 5 MB - Formats : JPG, PNG, GIF
                  </p>
                </div>

                {photoRecuExpedition && (
                  <div className="border-2 border-gray-200 rounded-lg p-2">
                    <p className="text-xs font-medium text-gray-700 mb-2">Aperçu :</p>
                    <img 
                      src={photoRecuExpedition} 
                      alt="Aperçu du reçu" 
                      className="max-w-full h-auto rounded"
                    />
                    <button
                      onClick={() => setPhotoRecuExpedition('')}
                      className="text-xs text-red-600 hover:text-red-700 mt-2"
                    >
                      ✕ Supprimer la photo
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-6">
                <button
                  onClick={confirmDeliverExpedition}
                  className={`btn w-full ${isExpressModal ? 'btn-primary' : 'btn-success'}`}
                  disabled={!codeExpedition.trim() || deliverExpeditionMutation.isPending}
                >
                  {deliverExpeditionMutation.isPending 
                    ? 'Confirmation...' 
                    : isExpressModal 
                      ? '✅ Confirmer l\'arrivée en agence'
                      : '✅ Confirmer l\'expédition'
                  }
                </button>
                <button
                  onClick={() => {
                    setSelectedExpedition(null);
                    setCodeExpedition('');
                    setPhotoRecuExpedition('');
                  }}
                  className="btn btn-secondary w-full"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

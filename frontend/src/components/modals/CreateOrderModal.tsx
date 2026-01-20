import { useState, useEffect } from 'react';
import { X, Package, User, Phone, MapPin, Home, ShoppingCart, DollarSign } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersApi, productsApi } from '@/lib/api';

interface CreateOrderModalProps {
  onClose: () => void;
}

interface OrderFormData {
  clientNom: string;
  clientTelephone: string;
  clientVille: string;
  clientCommune: string;
  clientAdresse: string;
  produitNom: string;
  productId: number | null;
  quantite: number;
  montant: number;
  sourcePage?: string;
}

export default function CreateOrderModal({ onClose }: CreateOrderModalProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    clientNom: '',
    clientTelephone: '',
    clientVille: '',
    clientCommune: '',
    clientAdresse: '',
    produitNom: '',
    productId: null,
    quantite: 1,
    montant: 0,
    sourcePage: 'CREATION_MANUELLE',
  });

  const queryClient = useQueryClient();

  // Récupérer la liste des produits
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll({ actif: true }),
  });

  const products = productsData?.products || [];

  // Calculer automatiquement le montant basé sur le produit et la quantité
  useEffect(() => {
    if (formData.productId && formData.quantite > 0) {
      const selectedProduct = products.find((p: any) => p.id === formData.productId);
      if (selectedProduct) {
        let price = selectedProduct.prixUnitaire;
        
        // Calculer le prix selon la quantité (prix variantes)
        if (formData.quantite === 1 && selectedProduct.prix1) {
          price = selectedProduct.prix1;
        } else if (formData.quantite === 2 && selectedProduct.prix2) {
          price = selectedProduct.prix2;
        } else if (formData.quantite >= 3 && selectedProduct.prix3) {
          price = selectedProduct.prix3;
        } else {
          price = selectedProduct.prixUnitaire * formData.quantite;
        }
        
        setFormData(prev => ({ ...prev, montant: price }));
      }
    }
  }, [formData.productId, formData.quantite, products]);

  const mutation = useMutation({
    mutationFn: () => ordersApi.create({
      ...formData,
      status: 'A_APPELER', // Statut par défaut pour création manuelle
    }),
    onSuccess: () => {
      toast.success('✅ Commande créée avec succès');
      // Invalider tous les caches de commandes pour rafraîchir toutes les listes
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création de la commande');
    },
  });

  const handleProductChange = (productId: number) => {
    const selectedProduct = products.find((p: any) => p.id === productId);
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        productId,
        produitNom: selectedProduct.nom,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.clientNom.trim()) {
      toast.error('Veuillez saisir le nom du client');
      return;
    }
    if (!formData.clientTelephone.trim()) {
      toast.error('Veuillez saisir le téléphone du client');
      return;
    }
    if (!formData.clientVille.trim()) {
      toast.error('Veuillez saisir la ville');
      return;
    }
    if (!formData.produitNom.trim()) {
      toast.error('Veuillez sélectionner un produit');
      return;
    }
    if (formData.quantite < 1) {
      toast.error('La quantité doit être au moins 1');
      return;
    }
    if (formData.montant <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }

    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Créer une commande</h2>
              <p className="text-sm text-gray-500">Ajouter une commande manuelle dans le système</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section Client */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <User className="w-5 h-5" />
              <span>Informations Client</span>
            </div>

            {/* Nom du client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.clientNom}
                onChange={(e) => setFormData({ ...formData, clientNom: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Kouassi Jean"
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.clientTelephone}
                  onChange={(e) => setFormData({ ...formData, clientTelephone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 0712345678"
                />
              </div>
            </div>

            {/* Ville et Commune */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.clientVille}
                    onChange={(e) => setFormData({ ...formData, clientVille: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Abidjan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commune
                </label>
                <input
                  type="text"
                  value={formData.clientCommune}
                  onChange={(e) => setFormData({ ...formData, clientCommune: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Yopougon"
                />
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse complète
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={formData.clientAdresse}
                  onChange={(e) => setFormData({ ...formData, clientAdresse: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  placeholder="Ex: Quartier Sicogi, près de l'école primaire"
                />
              </div>
            </div>
          </div>

          {/* Section Produit */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <ShoppingCart className="w-5 h-5" />
              <span>Informations Produit</span>
            </div>

            {/* Sélection du produit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produit <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.productId || ''}
                onChange={(e) => handleProductChange(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un produit</option>
                {products.map((product: any) => (
                  <option key={product.id} value={product.id}>
                    {product.nom} - {product.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantité et Montant */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantite}
                  onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant Total (FCFA) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.montant}
                    onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Affichage du prix calculé */}
            {formData.productId && formData.quantite > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Prix calculé:</span> {formData.montant.toLocaleString()} FCFA pour {formData.quantite} unité(s)
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={mutation.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Création...' : 'Créer la commande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


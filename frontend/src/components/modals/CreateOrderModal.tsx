import { useState, useEffect } from 'react';
import { X, Package, User, Phone, MapPin, ShoppingCart } from 'lucide-react';
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
    if (!formData.productId) {
      toast.error('Veuillez sélectionner un produit');
      return;
    }
    if (formData.montant <= 0) {
      toast.error('Erreur de calcul du prix. Veuillez vérifier le produit sélectionné.');
      return;
    }

    mutation.mutate();
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content bg-white rounded-3xl shadow-elegant-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header avec gradient */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg animate-float">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">Créer une commande</h2>
              <p className="text-sm text-white/90">✨ Ajouter une nouvelle commande dans le système</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-gradient-to-br from-white to-gray-50">
          {/* Section Client */}
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center gap-3 text-gray-800 font-bold text-lg pb-2 border-b-2 border-primary-200">
              <div className="p-2 bg-gradient-to-br from-primary-100 to-purple-100 rounded-xl">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-gradient">Informations Client</span>
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

            {/* Ville/Commune */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville/Commune <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.clientVille}
                  onChange={(e) => setFormData({ ...formData, clientVille: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Abidjan - Yopougon"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Saisissez la ville et la commune (ex: Abidjan - Yopougon)</p>
            </div>
          </div>

          {/* Section Produit */}
          <div className="space-y-4 pt-4 border-t-2 border-gray-100 animate-slide-up">
            <div className="flex items-center gap-3 text-gray-800 font-bold text-lg pb-2 border-b-2 border-success-200">
              <div className="p-2 bg-gradient-to-br from-success-100 to-emerald-100 rounded-xl">
                <ShoppingCart className="w-5 h-5 text-success-600" />
              </div>
              <span className="text-gradient-success">Informations Produit</span>
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

            {/* Quantité */}
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

            {/* Affichage du prix calculé avec animation */}
            {formData.productId && formData.quantite > 0 && formData.montant > 0 && (
              <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 rounded-2xl p-5 shadow-lg glow-primary animate-scale-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-xl shadow-md">
                      <Package className="w-5 h-5 text-primary-600" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Montant Total</span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-gradient animate-pulse-soft">
                      {formData.montant.toLocaleString()}
                    </span>
                    <span className="text-xl font-bold text-primary-600 ml-1">FCFA</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-xl p-2">
                  <span className="text-xs font-medium text-gray-600">
                    ✨ Prix calculé automatiquement pour <span className="font-bold text-primary-600">{formData.quantite}</span> unité(s)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions avec gradient */}
          <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 shadow-md"
              disabled={mutation.isPending}
            >
              ❌ Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-success-500 to-success-600 text-white rounded-xl font-bold hover:from-success-600 hover:to-success-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-success-500/50 hover:shadow-xl hover:shadow-success-600/50"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Création...
                </span>
              ) : (
                '✨ Créer la commande'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


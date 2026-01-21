import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Truck, X } from 'lucide-react';
import type { Order, ExpeditionData } from '@/types';

interface ExpeditionModalProps {
  order: Order;
  onClose: () => void;
}

export default function ExpeditionModal({ order, onClose }: ExpeditionModalProps) {
  const [formData, setFormData] = useState<ExpeditionData>({
    montantPaye: order.montant,
    modePaiement: '',
    referencePayment: '',
    note: '',
  });
  
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: () => ordersApi.createExpedition(order.id, formData),
    onSuccess: () => {
      toast.success('✅ Commande transférée en EXPÉDITION');
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création de l\'expédition');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modePaiement) {
      toast.error('Veuillez sélectionner un mode de paiement');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-elegant-lg glass-effect transform animate-slide-down">
        <div className="flex items-center justify-between mb-4 sm:mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-3 sm:p-4 rounded-t-xl -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 shadow-md">
          <h2 className="text-base sm:text-xl font-bold flex items-center gap-2">
            <Truck className="animate-float" size={20} />
            <span className="hidden sm:inline">EXPÉDITION - Paiement complet</span>
            <span className="sm:hidden">EXPÉDITION</span>
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            disabled={mutation.isPending}
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <p className="text-xs sm:text-sm text-blue-800 mb-1">
            <strong>Client :</strong> {order.clientNom}
          </p>
          <p className="text-xs sm:text-sm text-blue-800 mb-1">
            <strong>Ville :</strong> {order.clientVille}
          </p>
          <p className="text-xs sm:text-sm text-blue-800 mb-2">
            <strong>Produit :</strong> {order.produitNom} (x{order.quantite})
          </p>
          <div className="border-t border-blue-200 pt-2 mt-2 text-center">
            <p className="text-xs sm:text-sm text-blue-800 mb-1">
              Le client a payé la totalité :
            </p>
            <p className="text-2xl sm:text-3xl font-black text-blue-900 animate-pulse-soft">
              {order.montant.toLocaleString()} FCFA
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Mode de paiement <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.modePaiement}
              onChange={(e) => setFormData({...formData, modePaiement: e.target.value})}
              className="input text-sm sm:text-base"
              required
            >
              <option value="">Sélectionnez...</option>
              <option value="Orange Money">Orange Money</option>
              <option value="MTN Money">MTN Money</option>
              <option value="Moov Money">Moov Money</option>
              <option value="Wave">Wave</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Référence de transaction
            </label>
            <input
              type="text"
              value={formData.referencePayment}
              onChange={(e) => setFormData({...formData, referencePayment: e.target.value})}
              className="input text-sm sm:text-base"
              placeholder="Ex: TRX123456789"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Note (optionnel)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              className="input text-sm sm:text-base"
              rows={3}
              placeholder="Informations complémentaires..."
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1 order-2 sm:order-1"
              disabled={mutation.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 order-1 sm:order-2 animate-bounce-soft"
              disabled={!formData.modePaiement || mutation.isPending}
            >
              {mutation.isPending ? '⏳ Traitement...' : '🚚 Confirmer EXPÉDITION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}








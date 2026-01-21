import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Zap, X } from 'lucide-react';
import type { Order, ExpressData } from '@/types';
import { VILLES_AGENCES_EXPRESS } from '@/constants/cities';

interface ExpressModalProps {
  order: Order;
  onClose: () => void;
}

export default function ExpressModal({ order, onClose }: ExpressModalProps) {
  const dixPourcent = Math.round(order.montant * 0.10);
  
  const [formData, setFormData] = useState<ExpressData>({
    montantPaye: dixPourcent,
    modePaiement: '',
    referencePayment: '',
    agenceRetrait: '',
    note: '',
  });
  
  const [montantRestant, setMontantRestant] = useState(order.montant - dixPourcent);
  
  useEffect(() => {
    setMontantRestant(order.montant - formData.montantPaye);
  }, [formData.montantPaye, order.montant]);
  
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: () => ordersApi.createExpress(order.id, formData),
    onSuccess: () => {
      toast.success('✅ Commande transférée en EXPRESS');
      queryClient.invalidateQueries({ queryKey: ['appelant-orders'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création de l\'express');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modePaiement) {
      toast.error('Veuillez sélectionner un mode de paiement');
      return;
    }
    if (!formData.agenceRetrait) {
      toast.error('Veuillez sélectionner une agence de retrait');
      return;
    }
    if (formData.montantPaye < dixPourcent * 0.8) {
      toast.error(`Le montant payé doit être au moins ${dixPourcent} FCFA (10% du total)`);
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-elegant-lg glass-effect transform animate-slide-down">
        <div className="flex items-center justify-between mb-4 sm:mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 sm:p-4 rounded-t-xl -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 shadow-md">
          <h2 className="text-base sm:text-xl font-bold flex items-center gap-2">
            <Zap className="animate-pulse" size={20} />
            <span className="hidden sm:inline">EXPRESS - Paiement partiel</span>
            <span className="sm:hidden">EXPRESS</span>
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            disabled={mutation.isPending}
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
        
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <p className="text-xs sm:text-sm text-amber-800 mb-1">
            <strong>Client :</strong> {order.clientNom}
          </p>
          <p className="text-xs sm:text-sm text-amber-800 mb-1">
            <strong>Ville :</strong> {order.clientVille}
          </p>
          <p className="text-xs sm:text-sm text-amber-800 mb-2">
            <strong>Produit :</strong> {order.produitNom} (x{order.quantite})
          </p>
          <div className="border-t border-amber-200 pt-2 mt-2">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-xs text-amber-700">Montant total</p>
                <p className="text-sm sm:text-base font-bold text-amber-900">
                  {order.montant.toLocaleString()} F
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-700">Acompte (10%)</p>
                <p className="text-sm sm:text-base font-bold text-amber-900">
                  {dixPourcent.toLocaleString()} F
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded p-2 sm:p-3 text-center">
              <p className="text-xs text-amber-700">À payer au retrait (90%)</p>
              <p className="text-xl sm:text-2xl font-black text-amber-900 animate-pulse-soft">
                {montantRestant.toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant payé (acompte) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.montantPaye}
              onChange={(e) => setFormData({...formData, montantPaye: parseFloat(e.target.value) || 0})}
              className="input"
              min={dixPourcent * 0.8}
              max={order.montant}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum : {dixPourcent.toLocaleString()} FCFA (10%)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode de paiement <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.modePaiement}
              onChange={(e) => setFormData({...formData, modePaiement: e.target.value})}
              className="input"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Référence de transaction
            </label>
            <input
              type="text"
              value={formData.referencePayment}
              onChange={(e) => setFormData({...formData, referencePayment: e.target.value})}
              className="input"
              placeholder="Ex: TRX123456789"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agence de retrait <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.agenceRetrait}
              onChange={(e) => setFormData({...formData, agenceRetrait: e.target.value})}
              className="input"
              required
            >
              <option value="">Sélectionnez...</option>
              {VILLES_AGENCES_EXPRESS.map((ville) => (
                <option key={ville} value={ville}>{ville}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note (optionnel)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              className="input"
              rows={3}
              placeholder="Informations complémentaires..."
            />
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-blue-800 shadow-sm">
            <p className="font-bold mb-1 flex items-center gap-1">
              <span className="text-base sm:text-lg">📌</span>
              Important :
            </p>
            <p>Le client devra payer <strong className="text-blue-900">{montantRestant.toLocaleString()} FCFA</strong> lors du retrait du colis à l'agence <strong className="text-blue-900">{formData.agenceRetrait || '...'}</strong>.</p>
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
              className="btn bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-amber-500/50 flex-1 order-1 sm:order-2 animate-bounce-soft"
              disabled={!formData.modePaiement || !formData.agenceRetrait || mutation.isPending}
            >
              {mutation.isPending ? '⏳ Traitement...' : '⚡ Confirmer EXPRESS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


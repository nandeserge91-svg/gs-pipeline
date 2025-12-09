import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { RefreshCw, CheckCircle, AlertCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

export default function FixStock() {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [correctionResult, setCorrectionResult] = useState<any>(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.get('/fix-stock/analyze');
      return data;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      if (data.toFix === 0) {
        toast.success('✅ Tous les stocks sont corrects !');
      } else {
        toast.success(`📊 ${data.toFix} correction(s) à appliquer`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'analyse');
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/fix-stock/apply');
      return data;
    },
    onSuccess: (data) => {
      setCorrectionResult(data);
      toast.success(`✅ ${data.corrected} stock(s) corrigé(s) !`);
      // Rafraîchir l'analyse
      analyzeMutation.mutate();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la correction');
    },
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🔧 Correction des Stocks</h1>
        <p className="text-gray-600 mt-1">
          Vérifier et corriger les stocks suite aux modifications de livraisons
        </p>
      </div>

      {/* Card d'explication */}
      <div className="card bg-blue-50 border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">À quoi sert cet outil ?</h3>
            <p className="text-sm text-blue-800 mb-2">
              Quand un livreur modifie une livraison de "LIVRÉE" vers "REFUSÉE" ou "ANNULÉE", 
              le stock doit être réajusté automatiquement.
            </p>
            <p className="text-sm text-blue-800">
              Cet outil vérifie si d'anciennes modifications n'ont pas été prises en compte 
              et corrige automatiquement les stocks.
            </p>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
          className="btn btn-primary flex items-center justify-center gap-2 py-4"
        >
          <RefreshCw size={20} className={analyzeMutation.isPending ? 'animate-spin' : ''} />
          {analyzeMutation.isPending ? 'Analyse en cours...' : '🔍 Analyser les stocks'}
        </button>

        <button
          onClick={() => applyMutation.mutate()}
          disabled={applyMutation.isPending || !analysisResult || analysisResult.toFix === 0}
          className="btn btn-success flex items-center justify-center gap-2 py-4"
        >
          <CheckCircle size={20} />
          {applyMutation.isPending ? 'Correction en cours...' : '🔧 Appliquer les corrections'}
        </button>
      </div>

      {/* Résultat de l'analyse */}
      {analysisResult && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package size={24} className="text-primary-600" />
            Résultat de l'analyse
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Modifications trouvées</p>
              <p className="text-3xl font-bold text-gray-900">{analysisResult.total}</p>
            </div>
            <div className={`p-4 rounded-lg text-center ${analysisResult.toFix > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
              <p className="text-sm text-gray-600 mb-1">À corriger</p>
              <p className={`text-3xl font-bold ${analysisResult.toFix > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {analysisResult.toFix}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Déjà corrects</p>
              <p className="text-3xl font-bold text-blue-600">
                {analysisResult.total - analysisResult.toFix}
              </p>
            </div>
          </div>

          {analysisResult.toFix === 0 ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <CheckCircle size={48} className="mx-auto text-green-600 mb-2" />
              <p className="text-green-800 font-semibold">✅ Tous les stocks sont corrects !</p>
              <p className="text-sm text-green-700 mt-1">Aucune correction nécessaire.</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                <p className="text-orange-800 font-semibold">
                  ⚠️ {analysisResult.toFix} stock(s) nécessitent une correction
                </p>
              </div>

              {/* Tableau des corrections à appliquer */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">Commande</th>
                      <th className="px-4 py-3 text-left">Client</th>
                      <th className="px-4 py-3 text-left">Produit</th>
                      <th className="px-4 py-3 text-center">Qté</th>
                      <th className="px-4 py-3 text-center">Stock actuel</th>
                      <th className="px-4 py-3 text-center">Stock après</th>
                      <th className="px-4 py-3 text-center">Changement</th>
                      <th className="px-4 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analysisResult.corrections.map((correction: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">
                          {correction.orderReference}
                        </td>
                        <td className="px-4 py-3">{correction.clientNom}</td>
                        <td className="px-4 py-3">{correction.productNom}</td>
                        <td className="px-4 py-3 text-center font-semibold">
                          {correction.quantite}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-red-600">
                            {correction.stockActuel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-green-600">
                            {correction.stockApresCorrection}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                            {correction.oldStatus} → {correction.newStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {new Date(correction.correctionDate).toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Résultat de la correction */}
      {correctionResult && (
        <div className="card bg-green-50 border-2 border-green-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-800">
            <CheckCircle size={24} />
            Correction appliquée avec succès !
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Stocks corrigés</p>
              <p className="text-3xl font-bold text-green-600">{correctionResult.corrected}</p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Erreurs</p>
              <p className="text-3xl font-bold text-gray-600">{correctionResult.errors}</p>
            </div>
          </div>

          {correctionResult.details.corrected.length > 0 && (
            <div className="overflow-x-auto">
              <h3 className="font-semibold mb-2 text-green-800">Détails des corrections :</h3>
              <table className="w-full text-sm">
                <thead className="bg-white border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Commande</th>
                    <th className="px-4 py-2 text-left">Produit</th>
                    <th className="px-4 py-2 text-center">Stock avant</th>
                    <th className="px-4 py-2 text-center">Stock après</th>
                    <th className="px-4 py-2 text-center">Correction</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {correctionResult.details.corrected.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-2 font-mono text-xs">{item.orderReference}</td>
                      <td className="px-4 py-2">{item.productNom}</td>
                      <td className="px-4 py-2 text-center text-red-600 font-semibold">
                        {item.stockAvant}
                      </td>
                      <td className="px-4 py-2 text-center text-green-600 font-semibold">
                        {item.stockApres}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded font-semibold">
                          +{item.quantite}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


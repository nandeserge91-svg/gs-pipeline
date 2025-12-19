import { useState, useEffect } from 'react';
import { Package, TrendingUp, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface ProductStat {
  productId: number | null;
  productCode: string;
  productName: string;
  stockActuel: number;
  stockExpress: number;
  totalRecus: number;
  totalValides: number;
  totalLivres: number;
  totalAnnules: number;
  totalExpeditionExpress: number;
  quantiteRecue: number;
  quantiteValidee: number;
  quantiteLivree: number;
  quantiteExpeditionExpress: number;
}

interface ProductStatsTotals {
  totalRecus: number;
  totalValides: number;
  totalLivres: number;
  totalAnnules: number;
  totalExpeditionExpress: number;
  quantiteRecue: number;
  quantiteValidee: number;
  quantiteLivree: number;
  quantiteExpeditionExpress: number;
}

export default function ProductStats() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [products, setProducts] = useState<ProductStat[]>([]);
  const [totals, setTotals] = useState<ProductStatsTotals>({
    totalRecus: 0,
    totalValides: 0,
    totalLivres: 0,
    totalAnnules: 0,
    totalExpeditionExpress: 0,
    quantiteRecue: 0,
    quantiteValidee: 0,
    quantiteLivree: 0,
    quantiteExpeditionExpress: 0
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchProductStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stats/products-by-date', {
        params: { date: selectedDate }
      });
      setProducts(response.data.products);
      setTotals(response.data.totals);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage et quand la date change
  useEffect(() => {
    fetchProductStats();
  }, [selectedDate]);

  // Auto-refresh toutes les 30 secondes si activé
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchProductStats();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [autoRefresh, selectedDate]);

  const getTauxValidation = (recus: number, valides: number): string => {
    if (recus === 0) return '0.00';
    return ((valides / (recus + valides)) * 100).toFixed(2);
  };

  const getTauxLivraison = (valides: number, livres: number): string => {
    if (valides === 0) return '0.00';
    return ((livres / valides) * 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques par Produit</h1>
          <p className="text-gray-600 mt-1">
            Suivi en temps réel des produits reçus et validés
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sélecteur de date */}
          <div className="flex items-center gap-2">
            <label htmlFor="date-picker" className="text-sm font-medium text-gray-700">
              Date :
            </label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input w-48"
            />
          </div>

          {/* Bouton de rafraîchissement manuel */}
          <button
            onClick={fetchProductStats}
            disabled={loading}
            className="btn btn-secondary flex items-center justify-center w-10 h-10 p-0"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Toggle auto-refresh */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn ${autoRefresh ? 'bg-green-600 text-white hover:bg-green-700 border-green-600' : 'btn-secondary'}`}
          >
            {autoRefresh ? '🔄 Auto ON' : '⏸️ Auto OFF'}
          </button>
        </div>
      </div>

      {/* Dernière mise à jour */}
      <div className="text-sm text-gray-500">
        Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
      </div>

      {/* Cartes de résumé */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produits Reçus</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totals.totalRecus}</p>
              <p className="text-xs text-gray-500 mt-1">
                Quantité : {totals.quantiteRecue}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Package size={24} className="text-gray-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produits Validés</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{totals.totalValides}</p>
              <p className="text-xs text-gray-500 mt-1">
                Quantité : {totals.quantiteValidee}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produits Livrés</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{totals.totalLivres}</p>
              <p className="text-xs text-gray-500 mt-1">
                Quantité : {totals.quantiteLivree}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expédition/Express</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{totals.totalExpeditionExpress}</p>
              <p className="text-xs text-gray-500 mt-1">
                Quantité : {totals.quantiteExpeditionExpress}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Package size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Annulations</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{totals.totalAnnules}</p>
              <p className="text-xs text-gray-500 mt-1">
                Taux : {getTauxValidation(totals.totalRecus, totals.totalValides)}%
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des produits */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Détails par Produit</h2>
          <p className="text-sm text-gray-600 mt-1">
            Statistiques détaillées pour chaque produit
          </p>
        </div>
        
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucune donnée pour cette date
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Stock Actuel</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Stock Express</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Reçus</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Validés</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Livrés</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 bg-purple-50">📦⚡ Expédition/Express</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Annulés</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Taux Validation</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Taux Livraison</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => {
                  const tauxValidation = getTauxValidation(product.totalRecus, product.totalValides);
                  const tauxLivraison = getTauxLivraison(product.totalValides, product.totalLivres);
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.productCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{product.productName}</td>
                      <td className="text-center py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.stockActuel <= 10 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.stockActuel}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {product.stockExpress}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="font-semibold text-sm">{product.totalRecus}</div>
                        <div className="text-xs text-gray-500">
                          Qté: {product.quantiteRecue}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="font-semibold text-sm text-green-600">{product.totalValides}</div>
                        <div className="text-xs text-gray-500">
                          Qté: {product.quantiteValidee}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="font-semibold text-sm text-blue-600">{product.totalLivres}</div>
                        <div className="text-xs text-gray-500">
                          Qté: {product.quantiteLivree}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 bg-purple-50">
                        <div className="font-semibold text-sm text-purple-600">{product.totalExpeditionExpress}</div>
                        <div className="text-xs text-gray-500">
                          Qté: {product.quantiteExpeditionExpress}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="font-semibold text-sm text-red-600">{product.totalAnnules}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[60px]">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                parseFloat(tauxValidation) >= 70 ? 'bg-green-500' :
                                parseFloat(tauxValidation) >= 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${tauxValidation}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            parseFloat(tauxValidation) >= 70 ? 'text-green-600' :
                            parseFloat(tauxValidation) >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {tauxValidation}%
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[60px]">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                parseFloat(tauxLivraison) >= 80 ? 'bg-green-500' :
                                parseFloat(tauxLivraison) >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${tauxLivraison}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            parseFloat(tauxLivraison) >= 80 ? 'text-green-600' :
                            parseFloat(tauxLivraison) >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {tauxLivraison}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

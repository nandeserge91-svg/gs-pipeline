import { useState, useEffect } from 'react';
import { Package, TrendingUp, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

type TrafficSourceFilter = 'all' | 'facebook' | 'tiktok';

interface SourceBreakdown {
  facebook: number;
  tiktok: number;
  other: number;
}

interface ProductStat {
  productId: number | null;
  productCode: string;
  productName: string;
  stockActuel: number;
  stockExpress: number;
  totalCommandes: number;
  totalFacebook: number;
  totalTikTok: number;
  totalAutresSources: number;
  totalEnAttente: number;
  totalValides: number;
  totalLivres: number;
  totalAnnules: number;
  totalExpeditionExpress: number;
  quantiteTotale: number;
  quantiteEnAttente: number;
  quantiteValidee: number;
  quantiteLivree: number;
  quantiteExpeditionExpress: number;
}

interface ProductStatsTotals {
  totalCommandes: number;
  totalFacebook: number;
  totalTikTok: number;
  totalAutresSources: number;
  totalEnAttente: number;
  totalValides: number;
  totalLivres: number;
  totalAnnules: number;
  totalExpeditionExpress: number;
  quantiteTotale: number;
  quantiteEnAttente: number;
  quantiteValidee: number;
  quantiteLivree: number;
  quantiteExpeditionExpress: number;
}

export default function ProductStats() {
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [products, setProducts] = useState<ProductStat[]>([]);
  const [totals, setTotals] = useState<ProductStatsTotals>({
    totalCommandes: 0,
    totalFacebook: 0,
    totalTikTok: 0,
    totalAutresSources: 0,
    totalEnAttente: 0,
    totalValides: 0,
    totalLivres: 0,
    totalAnnules: 0,
    totalExpeditionExpress: 0,
    quantiteTotale: 0,
    quantiteEnAttente: 0,
    quantiteValidee: 0,
    quantiteLivree: 0,
    quantiteExpeditionExpress: 0
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [trafficSource, setTrafficSource] = useState<TrafficSourceFilter>('all');
  const [sourceBreakdown, setSourceBreakdown] = useState<SourceBreakdown>({
    facebook: 0,
    tiktok: 0,
    other: 0
  });

  const fetchProductStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stats/products-by-date', {
        params: { 
          startDate: startDate,
          endDate: endDate,
          source: trafficSource
        }
      });
      setProducts(response.data.products);
      setTotals(response.data.totals);
      setSourceBreakdown(response.data.sourceBreakdown || {
        facebook: response.data.totals.totalFacebook,
        tiktok: response.data.totals.totalTikTok,
        other: response.data.totals.totalAutresSources
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage et quand les dates changent
  useEffect(() => {
    fetchProductStats();
  }, [startDate, endDate, trafficSource]);

  // Auto-refresh toutes les 30 secondes si activé
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchProductStats();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [autoRefresh, startDate, endDate, trafficSource]);

  const getTauxValidation = (totalCommandes: number, valides: number): string => {
    if (totalCommandes === 0) return '0.00';
    return ((valides / totalCommandes) * 100).toFixed(2);
  };

  const getTauxLivraison = (valides: number, livres: number): string => {
    if (valides === 0) return '0.00';
    return ((livres / valides) * 100).toFixed(2);
  };

  const activeSourceLabel = trafficSource === 'facebook'
    ? 'Facebook'
    : trafficSource === 'tiktok'
      ? 'TikTok'
      : 'Toutes les sources';

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques par Produit</h1>
          <p className="text-gray-600 mt-1">
            Suivi en temps réel des produits reçus et validés sur une période
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sélecteur de période */}
          <div className="flex items-center gap-2">
            <label htmlFor="start-date" className="text-sm font-medium text-gray-700">
              Du :
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-40"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="end-date" className="text-sm font-medium text-gray-700">
              Au :
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-40"
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

      {/* Filtre par source publicitaire */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Afficher les commandes de</h2>
            <p className="text-sm text-gray-600 mt-1">
              Le résumé et le tableau s'adaptent automatiquement à la source choisie.
            </p>
          </div>

          <div className="inline-flex flex-wrap gap-2 rounded-xl bg-gray-100 p-1.5" role="group" aria-label="Filtrer par source publicitaire">
            <button
              type="button"
              aria-pressed={trafficSource === 'all'}
              onClick={() => setTrafficSource('all')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                trafficSource === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
              }`}
            >
              Toutes
            </button>
            <button
              type="button"
              aria-pressed={trafficSource === 'facebook'}
              onClick={() => setTrafficSource('facebook')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                trafficSource === 'facebook'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              Facebook ({sourceBreakdown.facebook})
            </button>
            <button
              type="button"
              aria-pressed={trafficSource === 'tiktok'}
              onClick={() => setTrafficSource('tiktok')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                trafficSource === 'tiktok'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-pink-700 hover:bg-pink-50'
              }`}
            >
              TikTok ({sourceBreakdown.tiktok})
            </button>
          </div>
        </div>
      </div>

      {/* Raccourcis de période */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Raccourcis de période :</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setStartDate(today);
              setEndDate(today);
            }}
            className="btn btn-secondary text-sm"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];
              setStartDate(yesterdayStr);
              setEndDate(yesterdayStr);
            }}
            className="btn btn-secondary text-sm"
          >
            Hier
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay() + 1);
              setStartDate(weekStart.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="btn btn-secondary text-sm"
          >
            Cette semaine
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
              setStartDate(monthStart.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="btn btn-secondary text-sm"
          >
            Ce mois
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
              const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
              setStartDate(lastMonth.toISOString().split('T')[0]);
              setEndDate(lastMonthEnd.toISOString().split('T')[0]);
            }}
            className="btn btn-secondary text-sm"
          >
            Mois dernier
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const last7Days = new Date(today);
              last7Days.setDate(today.getDate() - 7);
              setStartDate(last7Days.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="btn btn-secondary text-sm"
          >
            7 derniers jours
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const last30Days = new Date(today);
              last30Days.setDate(today.getDate() - 30);
              setStartDate(last30Days.toISOString().split('T')[0]);
              setEndDate(today.toISOString().split('T')[0]);
            }}
            className="btn btn-secondary text-sm"
          >
            30 derniers jours
          </button>
        </div>
        
        {/* Période active */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <span className="font-medium text-blue-900">Période active : </span>
          <span className="text-blue-700">
            {new Date(startDate).toLocaleDateString('fr-FR')} 
            {' → '}
            {new Date(endDate).toLocaleDateString('fr-FR')}
          </span>
          <span className="text-gray-500 ml-2">
            • Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
          </span>
          <span className="ml-2 inline-flex rounded-full bg-white px-2.5 py-1 font-semibold text-blue-700">
            {activeSourceLabel}
          </span>
        </div>
      </div>

      {/* Cartes de résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {trafficSource === 'all' ? 'Total Commandes' : `Total ${activeSourceLabel}`}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totals.totalCommandes}</p>
              <p className="text-xs text-gray-500 mt-1">
                Qté : {totals.quantiteTotale}
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
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-3xl font-bold text-orange-500 mt-2">{totals.totalEnAttente}</p>
              <p className="text-xs text-gray-500 mt-1">
                Qté : {totals.quantiteEnAttente}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Package size={24} className="text-orange-500" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Validés</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{totals.totalValides}</p>
              <p className="text-xs text-gray-500 mt-1">
                Qté : {totals.quantiteValidee}
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
              <p className="text-sm text-gray-600">Livrés</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{totals.totalLivres}</p>
              <p className="text-xs text-gray-500 mt-1">
                Qté : {totals.quantiteLivree}
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
                Qté : {totals.quantiteExpeditionExpress}
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
                Taux val. : {getTauxValidation(totals.totalCommandes, totals.totalValides)}%
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Origine publicitaire des commandes */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Commandes par source publicitaire</h2>
          <p className="text-sm text-gray-600 mt-1">
            Répartition Facebook / TikTok sur la période sélectionnée
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Facebook</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{sourceBreakdown.facebook}</p>
                <p className="text-xs text-blue-600 mt-1">commandes</p>
              </div>
              <div className="h-11 w-11 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">f</div>
            </div>
          </div>

          <div className="rounded-xl border border-pink-200 bg-pink-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-700">TikTok</p>
                <p className="text-3xl font-bold text-pink-900 mt-2">{sourceBreakdown.tiktok}</p>
                <p className="text-xs text-pink-600 mt-1">commandes</p>
              </div>
              <div className="h-11 w-11 rounded-full bg-gray-900 text-white flex items-center justify-center text-2xl font-bold">♪</div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Autres sources</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{sourceBreakdown.other}</p>
                <p className="text-xs text-gray-500 mt-1">commandes non balisées</p>
              </div>
              <div className="h-11 w-11 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xl font-bold">…</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des produits */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Détails par Produit</h2>
          <p className="text-sm text-gray-600 mt-1">
            Statistiques détaillées pour chaque produit — {activeSourceLabel}
          </p>
        </div>
        
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucune commande {trafficSource === 'all' ? '' : activeSourceLabel} pour cette période
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Stock</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Stock Express</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">
                    {trafficSource === 'all' ? 'Total' : 'Commandes'}
                  </th>
                  {trafficSource === 'all' && (
                    <>
                      <th className="text-center py-3 px-4 text-sm font-medium text-blue-700 bg-blue-50">Facebook</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-pink-700 bg-pink-50">TikTok</th>
                    </>
                  )}
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 bg-orange-50">En attente</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Validés</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Livrés</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 bg-purple-50">Expéd./Express</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Annulés</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Taux Validation</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Taux Livraison</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => {
                  const tauxValidation = getTauxValidation(product.totalCommandes, product.totalValides);
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
                        <div className="font-semibold text-sm">{product.totalCommandes}</div>
                        <div className="text-xs text-gray-500">
                          Qté: {product.quantiteTotale}
                        </div>
                      </td>
                      {trafficSource === 'all' && (
                        <>
                          <td className="text-center py-3 px-4 bg-blue-50">
                            <span className="font-semibold text-sm text-blue-700">{product.totalFacebook}</span>
                          </td>
                          <td className="text-center py-3 px-4 bg-pink-50">
                            <span className="font-semibold text-sm text-pink-700">{product.totalTikTok}</span>
                          </td>
                        </>
                      )}
                      <td className="text-center py-3 px-4 bg-orange-50">
                        <div className="font-semibold text-sm text-orange-500">{product.totalEnAttente}</div>
                        <div className="text-xs text-gray-500">
                          Qté: {product.quantiteEnAttente}
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

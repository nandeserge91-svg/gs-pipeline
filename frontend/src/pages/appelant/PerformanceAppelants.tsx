import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowUpDown, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

export default function PerformanceAppelants() {
  const [searchCaller, setSearchCaller] = useState('');
  const [sortCallerBy, setSortCallerBy] = useState<'taux' | 'appels' | 'nom'>('taux');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Récupérer les stats des appelants
  const { data: callersData, isLoading: loadingCallers, refetch } = useQuery({
    queryKey: ['caller-stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats/callers');
      return data;
    },
    refetchInterval: 5000, // ✅ Actualisation toutes les 5 secondes (réduit de 10s)
    refetchOnWindowFocus: true, // ✅ Rafraîchir quand l'utilisateur revient sur l'onglet
    staleTime: 0, // ✅ Considérer les données comme obsolètes immédiatement
  });

  // Filtrer et trier les appelants
  const filteredCallers = callersData?.callers
    ?.filter((stat: any) => {
      const fullName = `${stat.user.prenom} ${stat.user.nom}`.toLowerCase();
      return fullName.includes(searchCaller.toLowerCase());
    })
    .sort((a: any, b: any) => {
      let comparison = 0;
      
      switch (sortCallerBy) {
        case 'taux':
          comparison = parseFloat(b.tauxValidation) - parseFloat(a.tauxValidation);
          break;
        case 'appels':
          comparison = b.totalAppels - a.totalAppels;
          break;
        case 'nom':
          comparison = `${a.user.prenom} ${a.user.nom}`.localeCompare(`${b.user.prenom} ${b.user.nom}`);
          break;
      }
      
      return sortDirection === 'asc' ? -comparison : comparison;
    }) || [];

  // Calculer les totaux
  const totalCallers = filteredCallers.length;
  const totalAppels = filteredCallers.reduce((sum: number, stat: any) => sum + stat.totalAppels, 0);
  const totalValides = filteredCallers.reduce((sum: number, stat: any) => sum + stat.totalValides, 0);
  const totalExpeditions = filteredCallers.reduce((sum: number, stat: any) => sum + (stat.totalExpeditions || 0), 0);
  const totalExpress = filteredCallers.reduce((sum: number, stat: any) => sum + (stat.totalExpress || 0), 0);
  const avgTauxValidation = totalAppels > 0 
    ? ((totalValides / totalAppels) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Performance des Appelants</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble des performances de l'équipe d'appelants</p>
      </div>

      {/* Statistiques Appelants */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Performance des Appelants</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={loadingCallers}
              className="btn btn-secondary flex items-center gap-2 text-sm"
              title="Rafraîchir les statistiques"
            >
              <RefreshCw size={16} className={loadingCallers ? 'animate-spin' : ''} />
              Rafraîchir
            </button>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-600">{totalCallers} appelant(s)</span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm font-medium text-green-600">
              Taux moyen: {avgTauxValidation}%
            </span>
          </div>
        </div>

        {/* Recherche et tri */}
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un appelant..."
              value={searchCaller}
              onChange={(e) => setSearchCaller(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={sortCallerBy}
            onChange={(e) => setSortCallerBy(e.target.value as any)}
            className="input md:w-48"
          >
            <option value="taux">Trier par taux</option>
            <option value="appels">Trier par appels</option>
            <option value="nom">Trier par nom</option>
          </select>
          <button
            onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ArrowUpDown size={18} />
            {sortDirection === 'asc' ? 'Croissant' : 'Décroissant'}
          </button>
        </div>

        {loadingCallers ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Indicateurs clés */}
            {filteredCallers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium mb-1">🏆 Meilleur taux</p>
                  <p className="text-xl font-bold text-green-900">
                    {filteredCallers.sort((a: any, b: any) => parseFloat(b.tauxValidation) - parseFloat(a.tauxValidation))[0]?.user.prenom}{' '}
                    {filteredCallers.sort((a: any, b: any) => parseFloat(b.tauxValidation) - parseFloat(a.tauxValidation))[0]?.user.nom}
                  </p>
                  <p className="text-sm text-green-600">
                    {filteredCallers.sort((a: any, b: any) => parseFloat(b.tauxValidation) - parseFloat(a.tauxValidation))[0]?.tauxValidation}% de validation
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium mb-1">📞 Plus d'appels</p>
                  <p className="text-xl font-bold text-blue-900">
                    {filteredCallers.sort((a: any, b: any) => b.totalAppels - a.totalAppels)[0]?.user.prenom}{' '}
                    {filteredCallers.sort((a: any, b: any) => b.totalAppels - a.totalAppels)[0]?.user.nom}
                  </p>
                  <p className="text-sm text-blue-600">
                    {filteredCallers.sort((a: any, b: any) => b.totalAppels - a.totalAppels)[0]?.totalAppels} appels
                  </p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700 font-medium mb-1">✅ Plus validées</p>
                  <p className="text-xl font-bold text-purple-900">
                    {filteredCallers.sort((a: any, b: any) => b.totalValides - a.totalValides)[0]?.user.prenom}{' '}
                    {filteredCallers.sort((a: any, b: any) => b.totalValides - a.totalValides)[0]?.user.nom}
                  </p>
                  <p className="text-sm text-purple-600">
                    {filteredCallers.sort((a: any, b: any) => b.totalValides - a.totalValides)[0]?.totalValides} validées
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Appelant</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total appels</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Validées</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Annulées</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Injoignables</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 bg-blue-50">📦 Expéditions</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 bg-amber-50">⚡ Express</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Taux de validation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCallers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        Aucun appelant trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredCallers.map((stat: any) => (
                      <tr key={stat.user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium">
                          {stat.user.prenom} {stat.user.nom}
                        </td>
                        <td className="py-3 px-4 text-sm">{stat.totalAppels}</td>
                        <td className="py-3 px-4 text-sm text-green-600 font-medium">{stat.totalValides}</td>
                        <td className="py-3 px-4 text-sm text-red-600">{stat.totalAnnules}</td>
                        <td className="py-3 px-4 text-sm text-orange-600">{stat.totalInjoignables}</td>
                        <td className="py-3 px-4 text-sm font-medium text-blue-600 bg-blue-50">
                          {stat.totalExpeditions || 0}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-amber-600 bg-amber-50">
                          {stat.totalExpress || 0}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  parseFloat(stat.tauxValidation) >= 70 ? 'bg-green-500' :
                                  parseFloat(stat.tauxValidation) >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(parseFloat(stat.tauxValidation), 100)}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${
                              parseFloat(stat.tauxValidation) >= 70 ? 'text-green-600' :
                              parseFloat(stat.tauxValidation) >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {stat.tauxValidation}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap justify-between gap-4 text-sm">
                <div className="font-medium text-gray-700">
                  Totaux: {totalAppels} appels
                </div>
                <div className="flex flex-wrap gap-4 text-gray-600">
                  <span className="text-green-600 font-medium">{totalValides} validées</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-blue-600 font-medium">📦 {totalExpeditions} expéditions</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-amber-600 font-medium">⚡ {totalExpress} express</span>
                  <span className="text-gray-300">•</span>
                  <span className="font-medium">Taux moyen: {avgTauxValidation}%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

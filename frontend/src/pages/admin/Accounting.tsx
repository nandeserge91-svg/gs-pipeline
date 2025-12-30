import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Truck, 
  Zap, 
  Calendar,
  Download,
  Users,
  MapPin
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { accountingApi } from '@/lib/api';
import { formatCurrency } from '@/utils/statusHelpers';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

export default function Accounting() {
  const today = new Date().toISOString().split('T')[0];
  const [dateDebut, setDateDebut] = useState(today);
  const [dateFin, setDateFin] = useState(today);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['accounting-stats', dateDebut, dateFin],
    queryFn: () => accountingApi.getStats({ dateDebut, dateFin }),
  });

  // Récupérer les données Express Retrait par ville
  const { data: expressRetraitParVille, isLoading: isLoadingVilles } = useQuery({
    queryKey: ['express-retrait-par-ville', dateDebut, dateFin],
    queryFn: () => accountingApi.getExpressRetraitParVille({ dateDebut, dateFin }),
  });

  const handleExport = () => {
    if (!stats) return;
    
    const csvContent = [
      ['Type', 'Montant', 'Nombre'],
      ['Livraisons Locales', stats.resume.livraisonsLocales.montant, stats.resume.livraisonsLocales.nombre],
      ['Expéditions', stats.resume.expeditions.montant, stats.resume.expeditions.nombre],
      ['Express Avance', stats.resume.expressAvance.montant, stats.resume.expressAvance.nombre],
      ['Express Retrait', stats.resume.expressRetrait.montant, stats.resume.expressRetrait.nombre],
      ['TOTAL', stats.resume.total.montant, stats.resume.total.nombre],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comptabilite_${dateDebut}_${dateFin}.csv`;
    a.click();
  };

  const pieData = stats ? [
    { name: 'Livraisons Locales', value: stats.resume.livraisonsLocales.montant },
    { name: 'Expéditions', value: stats.resume.expeditions.montant },
    { name: 'Express Avance', value: stats.resume.expressAvance.montant },
    { name: 'Express Retrait', value: stats.resume.expressRetrait.montant },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Comptabilité</h1>
          <p className="text-gray-600">Statistiques financières détaillées</p>
        </div>
        
        <button
          onClick={handleExport}
          disabled={!stats}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Download size={18} />
          Exporter CSV
        </button>
      </div>

      {/* Filtres de date */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-primary-600" size={20} />
          <h2 className="text-lg font-semibold">Filtrer par période</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => refetch()}
              className="btn btn-primary w-full"
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : stats ? (
        <>
          {/* Cartes KPI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="card bg-green-50 border-green-200">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="text-green-600" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Livraisons Locales</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.resume.livraisonsLocales.montant)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.resume.livraisonsLocales.nombre} commande(s)
              </p>
            </div>

            <div className="card bg-blue-50 border-blue-200">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="text-blue-600" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Expéditions</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.resume.expeditions.montant)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.resume.expeditions.nombre} commande(s)
              </p>
            </div>

            <div className="card bg-purple-50 border-purple-200">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="text-purple-600" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Express Avance (10%)</h3>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.resume.expressAvance.montant)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.resume.expressAvance.nombre} commande(s)
              </p>
            </div>

            <div className="card bg-amber-50 border-amber-200">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <DollarSign className="text-amber-600" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Express Retrait (90%)</h3>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(stats.resume.expressRetrait.montant)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.resume.expressRetrait.nombre} commande(s)
              </p>
            </div>

            <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-300">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-primary-200 rounded-lg">
                  <TrendingUp className="text-primary-700" size={24} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Total Général</h3>
              <p className="text-2xl font-bold text-primary-700">
                {formatCurrency(stats.resume.total.montant)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {stats.resume.total.nombre} commande(s)
              </p>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique circulaire - Répartition */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">📊 Répartition par type</h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-12">Aucune donnée disponible</p>
              )}
            </div>

            {/* Graphique en barres - Comparaison */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">📈 Comparaison des types</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[stats.resume]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="livraisonsLocales.montant" name="Livraisons" fill="#10B981" />
                  <Bar dataKey="expeditions.montant" name="Expéditions" fill="#3B82F6" />
                  <Bar dataKey="expressAvance.montant" name="Express Avance" fill="#8B5CF6" />
                  <Bar dataKey="expressRetrait.montant" name="Express Retrait" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Courbe d'évolution journalière */}
          {stats.evolutionJournaliere && stats.evolutionJournaliere.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">📉 Évolution journalière</h2>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={stats.evolutionJournaliere}>
                  <defs>
                    <linearGradient id="colorLocal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpedition" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpressAvance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpressRetrait" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="local" 
                    name="Livraisons Locales"
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#colorLocal)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expedition" 
                    name="Expéditions"
                    stroke="#3B82F6" 
                    fillOpacity={1} 
                    fill="url(#colorExpedition)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expressAvance" 
                    name="Express Avance"
                    stroke="#8B5CF6" 
                    fillOpacity={1} 
                    fill="url(#colorExpressAvance)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expressRetrait" 
                    name="Express Retrait"
                    stroke="#F59E0B" 
                    fillOpacity={1} 
                    fill="url(#colorExpressRetrait)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Livreurs */}
          {stats.topLivreurs && stats.topLivreurs.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="text-primary-600" size={24} />
                  <h2 className="text-xl font-bold">🚚 Performance des Livreurs</h2>
                </div>
                <div className="text-sm text-gray-600">
                  {stats.topLivreurs.length} livreur(s) actif(s)
                </div>
              </div>
              
              <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rang</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Livreur</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Livraisons</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Montant Total</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Moyenne/Livraison</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.topLivreurs.map((livreur, index) => {
                      const moyenneParLivraison = livreur.nombre > 0 ? livreur.montant / livreur.nombre : 0;
                      const isTop3 = index < 3;
                      
                      return (
                        <tr 
                          key={index} 
                          className={`hover:bg-gray-50 transition-colors ${
                            index === 0 ? 'bg-yellow-50' : 
                            index === 1 ? 'bg-gray-50' : 
                            index === 2 ? 'bg-orange-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium">
                            <span className="text-2xl">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                index === 0 ? 'bg-yellow-500' :
                                index === 1 ? 'bg-gray-400' :
                                index === 2 ? 'bg-orange-500' :
                                'bg-blue-500'
                              }`}>
                                {livreur.nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <span className="font-medium text-gray-900">{livreur.nom}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
                              {livreur.nombre}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold ${isTop3 ? 'text-green-600 text-lg' : 'text-gray-900'}`}>
                              {formatCurrency(livreur.montant)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-600">
                              {formatCurrency(moyenneParLivraison)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                                <div 
                                  className={`h-2 rounded-full ${
                                    index === 0 ? 'bg-yellow-500' :
                                    index === 1 ? 'bg-gray-400' :
                                    index === 2 ? 'bg-orange-500' :
                                    'bg-blue-500'
                                  }`}
                                  style={{ 
                                    width: `${Math.min(100, (livreur.montant / (stats.topLivreurs[0]?.montant || 1)) * 100)}%` 
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-12 text-right">
                                {Math.round((livreur.montant / (stats.topLivreurs[0]?.montant || 1)) * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL GÉNÉRAL</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary-100 text-primary-800 font-bold">
                          {stats.topLivreurs.reduce((sum, l) => sum + l.nombre, 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-green-600 text-lg">
                          {formatCurrency(stats.topLivreurs.reduce((sum, l) => sum + l.montant, 0))}
                        </span>
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Express Retrait par Ville */}
          {expressRetraitParVille && expressRetraitParVille.villes && expressRetraitParVille.villes.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="text-amber-600" size={24} />
                  <h2 className="text-xl font-bold">🏙️ Express Retrait (90%) par Ville</h2>
                </div>
                <div className="text-sm text-gray-600">
                  {expressRetraitParVille.villes.length} ville(s) • {expressRetraitParVille.totalGeneral.nombreCommandes} commande(s)
                </div>
              </div>

              {/* Carte résumé */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Villes</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {expressRetraitParVille.totalGeneral.nombreVilles}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Commandes</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {expressRetraitParVille.totalGeneral.nombreCommandes}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Montant Total (90%)</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {formatCurrency(expressRetraitParVille.totalGeneral.montant)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Tableau des villes */}
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50 sticky top-0">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rang</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ville</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Commandes</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Montant Total</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Retrait 90%</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">% du Total</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expressRetraitParVille.villes.map((ville: any, index: number) => {
                      const isTop3 = index < 3;
                      const percentageOfTotal = (ville.montantRetrait90 / expressRetraitParVille.totalGeneral.montant) * 100;
                      
                      return (
                        <tr 
                          key={index} 
                          className={`hover:bg-gray-50 transition-colors ${
                            index === 0 ? 'bg-yellow-50' : 
                            index === 1 ? 'bg-gray-50' : 
                            index === 2 ? 'bg-orange-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium">
                            <span className="text-2xl">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                index === 0 ? 'bg-yellow-500' :
                                index === 1 ? 'bg-gray-400' :
                                index === 2 ? 'bg-orange-500' :
                                'bg-amber-500'
                              }`}>
                                <MapPin size={20} />
                              </div>
                              <span className="font-medium text-gray-900">{ville.ville}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold">
                              {ville.nombreCommandes}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-600">
                              {formatCurrency(ville.montantTotal)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold ${isTop3 ? 'text-amber-600 text-lg' : 'text-gray-900'}`}>
                              {formatCurrency(ville.montantRetrait90)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                                <div 
                                  className={`h-2 rounded-full ${
                                    index === 0 ? 'bg-yellow-500' :
                                    index === 1 ? 'bg-gray-400' :
                                    index === 2 ? 'bg-orange-500' :
                                    'bg-amber-500'
                                  }`}
                                  style={{ 
                                    width: `${percentageOfTotal}%` 
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-12 text-right">
                                {percentageOfTotal.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                // Ouvrir modal avec détails des commandes de cette ville
                                const modal = document.createElement('div');
                                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                                modal.innerHTML = `
                                  <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                                    <div class="flex justify-between items-center mb-4">
                                      <h3 class="text-xl font-bold">Détails - ${ville.ville}</h3>
                                      <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                                        ✕
                                      </button>
                                    </div>
                                    <div class="overflow-x-auto">
                                      <table class="min-w-full divide-y divide-gray-200">
                                        <thead class="bg-gray-50">
                                          <tr>
                                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Référence</th>
                                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Client</th>
                                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Agence</th>
                                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Statut</th>
                                            <th class="px-3 py-2 text-center text-xs font-medium text-gray-500">Date Retrait</th>
                                            <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Retrait 90%</th>
                                          </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-200 bg-white">
                                          ${ville.commandes.map((cmd: any) => {
                                            const dateRetrait = cmd.dateRetrait 
                                              ? new Date(cmd.dateRetrait).toLocaleDateString('fr-FR', { 
                                                  day: '2-digit', 
                                                  month: '2-digit', 
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit'
                                                })
                                              : '<span class="text-gray-400 italic">En attente</span>';
                                            return `
                                            <tr>
                                              <td class="px-3 py-2 text-xs">${cmd.reference}</td>
                                              <td class="px-3 py-2 text-xs">${cmd.client}</td>
                                              <td class="px-3 py-2 text-xs">${cmd.agence || 'N/A'}</td>
                                              <td class="px-3 py-2 text-xs">
                                                <span class="px-2 py-1 rounded ${cmd.status === 'EXPRESS_LIVRE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                                  ${cmd.status === 'EXPRESS_LIVRE' ? 'Retiré' : 'En attente'}
                                                </span>
                                              </td>
                                              <td class="px-3 py-2 text-xs text-center">${dateRetrait}</td>
                                              <td class="px-3 py-2 text-xs text-right font-medium">${formatCurrency(cmd.montantRetrait)}</td>
                                            </tr>
                                            `;
                                          }).join('')}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                `;
                                document.body.appendChild(modal);
                              }}
                              className="text-xs px-3 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-md font-medium transition-colors"
                            >
                              Voir détails
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-300 bg-gray-50 sticky bottom-0">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL GÉNÉRAL</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-amber-200 text-amber-900 font-bold">
                          {expressRetraitParVille.totalGeneral.nombreCommandes}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-gray-900">
                          {formatCurrency(expressRetraitParVille.villes.reduce((sum: number, v: any) => sum + v.montantTotal, 0))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-amber-600 text-lg">
                          {formatCurrency(expressRetraitParVille.totalGeneral.montant)}
                        </span>
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Tableaux détaillés */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Livraisons Locales */}
            {stats.details.livraisonsLocales.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4 text-green-600">
                  📦 Détail Livraisons Locales
                </h2>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Réf</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Client</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {stats.details.livraisonsLocales.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-xs">{item.reference}</td>
                          <td className="px-3 py-2 text-xs">{item.client}</td>
                          <td className="px-3 py-2 text-xs text-right font-medium">
                            {formatCurrency(item.montant)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Expéditions */}
            {stats.details.expeditions.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4 text-blue-600">
                  🚚 Détail Expéditions
                </h2>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Réf</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Client</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {stats.details.expeditions.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-xs">{item.reference}</td>
                          <td className="px-3 py-2 text-xs">{item.client}</td>
                          <td className="px-3 py-2 text-xs text-right font-medium">
                            {formatCurrency(item.montant)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Express Avance */}
            {stats.details.expressAvance.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4 text-purple-600">
                  ⚡ Détail Express Avance (10%)
                </h2>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Réf</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Client</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Avance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {stats.details.expressAvance.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-xs">{item.reference}</td>
                          <td className="px-3 py-2 text-xs">{item.client}</td>
                          <td className="px-3 py-2 text-xs text-right font-medium">
                            {formatCurrency(item.avance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Express Retrait */}
            {stats.details.expressRetrait.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4 text-amber-600">
                  💵 Détail Express Retrait (90%)
                </h2>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Réf</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Client</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Retrait</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {stats.details.expressRetrait.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-xs">{item.reference}</td>
                          <td className="px-3 py-2 text-xs">{item.client}</td>
                          <td className="px-3 py-2 text-xs text-right font-medium">
                            {formatCurrency(item.retrait)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500">Aucune donnée disponible pour cette période</p>
        </div>
      )}
    </div>
  );
}


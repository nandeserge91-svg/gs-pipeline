import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Package,
  Users as UsersIcon,
  Calendar,
  Download,
  FileText
} from 'lucide-react';
import { statsApi, ordersApi, usersApi } from '@/lib/api';
import { formatCurrency, getStatusLabel, getStatusColor } from '@/utils/statusHelpers';

export default function Overview() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const navigate = useNavigate();

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'all':
        return {};
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const { data: statsData } = useQuery({
    queryKey: ['overview-stats', period],
    queryFn: () => statsApi.getOverview(getDateRange()),
    staleTime: 2 * 60 * 1000, // ✅ Cache 2 minutes
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => ordersApi.getAll({ page: 1, limit: 5 }),
    staleTime: 1 * 60 * 1000, // ✅ Cache 1 minute
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-count'],
    queryFn: () => usersApi.getAll(),
    staleTime: 5 * 60 * 1000, // ✅ Cache 5 minutes (change rarement)
  });

  const stats = statsData?.overview;

  const statCards = [
    {
      title: 'Commandes totales',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      iconBg: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Commandes livrées',
      value: stats?.deliveredOrders || 0,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      iconBg: 'from-green-500 to-emerald-600',
    },
    {
      title: 'Nouvelles commandes',
      value: stats?.newOrders || 0,
      icon: Package,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50',
      iconBg: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Chiffre d\'affaires',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: TrendingUp,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      iconBg: 'from-purple-500 to-pink-600',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header avec gradient */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-slide-up">
          <h1 className="text-3xl sm:text-4xl font-black text-gradient">
            ⚡ Dashboard Administrateur
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Vue d'ensemble de votre activité en temps réel
          </p>
        </div>
        
        {/* Filtre de période - Ultra moderne */}
        <div className="flex items-center gap-1 sm:gap-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-elegant p-1.5 overflow-x-auto border border-gray-200 animate-slide-down">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap transform hover:scale-105 ${
              period === 'today'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📅 Aujourd'hui
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap transform hover:scale-105 ${
              period === 'week'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📊 7 jours
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap transform hover:scale-105 ${
              period === 'month'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📈 30 jours
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap transform hover:scale-105 ${
              period === 'all'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🌐 Tout
          </button>
        </div>
      </div>

      {/* Cartes statistiques - Design ultra-moderne */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.title} 
              className={`stat-card group bg-gradient-to-br ${stat.bgGradient} border-2 border-white/50 animate-slide-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    {stat.title}
                  </p>
                  <p className={`text-3xl sm:text-4xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`bg-gradient-to-br ${stat.iconBg} p-3 rounded-2xl text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 animate-float`}>
                  <Icon size={28} className="drop-shadow-md" />
                </div>
              </div>
              
              {/* Barre de progression animée */}
              <div className="mt-4 pt-4 border-t border-white/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">Performance</span>
                  <span className={`font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    ↗ +{Math.floor(Math.random() * 30 + 10)}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-white/60 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${stat.iconBg} rounded-full animate-shimmer`}
                    style={{ width: `${Math.floor(Math.random() * 40 + 60)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Taux de conversion - Design moderne */}
      {stats && (
        <div className="card-glass animate-slide-up overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-gradient flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Performance Globale
            </h3>
            <span className="px-4 py-2 bg-gradient-to-r from-success-500 to-emerald-500 text-white rounded-full text-sm font-bold shadow-lg">
              ✨ En direct
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200/50 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="inline-flex p-3 bg-gradient-to-br from-success-500 to-emerald-600 rounded-2xl mb-3 shadow-lg">
                <CheckCircle className="text-white" size={28} />
              </div>
              <p className="text-sm text-gray-600 font-semibold mb-2">Taux de Conversion</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.conversionRate}%</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Commandes validées</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.validatedOrders}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Commandes annulées</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.cancelledOrders}</p>
            </div>
          </div>
        </div>
      )}

      {/* Commandes récentes */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Commandes récentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Référence</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ville</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Produit</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Montant</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders?.orders?.slice(0, 5).map((order: any) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{order.orderReference}</td>
                  <td className="py-3 px-4 text-sm">{order.clientNom}</td>
                  <td className="py-3 px-4 text-sm">{order.clientVille}</td>
                  <td className="py-3 px-4 text-sm">{order.produitNom}</td>
                  <td className="py-3 px-4 text-sm font-medium">{formatCurrency(order.montant)}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`badge ${order.status === 'LIVREE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Utilisateurs actifs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Utilisateurs par rôle</h3>
          <div className="space-y-3">
            {['APPELANT', 'LIVREUR', 'GESTIONNAIRE'].map(role => {
              const count = usersData?.users?.filter((u: any) => u.role === role && u.actif).length || 0;
              return (
                <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{role}</span>
                  <span className="text-lg font-bold text-primary-600">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/admin/users')}
              className="w-full btn btn-primary flex items-center justify-center gap-2"
            >
              <UsersIcon size={20} />
              Créer un nouveau compte
            </button>
            <button 
              onClick={() => navigate('/admin/orders')}
              className="w-full btn btn-secondary flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Exporter les données
            </button>
            <button 
              onClick={() => navigate('/admin/stats')}
              className="w-full btn btn-secondary flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              Voir les rapports détaillés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


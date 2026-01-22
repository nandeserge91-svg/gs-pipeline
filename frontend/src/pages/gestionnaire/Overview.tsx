import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle, Truck, Clock, ArrowRight, TrendingUp, MapPin } from 'lucide-react';
import { statsApi, deliveryApi } from '@/lib/api';
import AttendanceButton from '@/components/attendance/AttendanceButton';

export default function Overview() {
  const { data: statsData } = useQuery({
    queryKey: ['gestionnaire-overview'],
    queryFn: () => statsApi.getOverview(),
    staleTime: 2 * 60 * 1000, // ✅ Cache 2 minutes
  });

  const { data: validatedOrders } = useQuery({
    queryKey: ['validated-orders-count'],
    queryFn: () => deliveryApi.getValidatedOrders(),
    staleTime: 1 * 60 * 1000, // ✅ Cache 1 minute
  });

  const stats = statsData?.overview;

  const cards = [
    {
      title: 'Commandes validées',
      value: validatedOrders?.orders?.length || 0,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'from-green-600 to-emerald-600',
      description: 'En attente d\'assignation'
    },
    {
      title: 'Commandes assignées',
      value: stats?.validatedOrders || 0,
      icon: Truck,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'from-blue-600 to-cyan-600',
      description: 'Assignées aux livreurs'
    },
    {
      title: 'Commandes livrées',
      value: stats?.deliveredOrders || 0,
      icon: Package,
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'from-purple-600 to-pink-600',
      description: 'Aujourd\'hui'
    },
    {
      title: 'En attente',
      value: stats?.newOrders || 0,
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-500',
      iconBg: 'from-yellow-600 to-orange-600',
      description: 'À traiter'
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 text-gradient from-primary-600 to-purple-600 flex items-center gap-2">
          📦 Dashboard Gestionnaire
          <span className="relative flex h-3 w-3">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 animate-fade-in">
          Gestion des livraisons et assignations
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="stat-card bg-gradient-to-br from-white/80 to-white/60 border border-white/40 rounded-2xl p-4 sm:p-6 shadow-elegant
                         hover:shadow-elegant-lg transform hover:scale-105 transition-all duration-300 group animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">
                    {card.title}
                  </p>
                  <p className={`text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}>
                    {card.value}
                  </p>
                </div>
                <div className={`bg-gradient-to-br ${card.iconBg} p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 animate-float`}>
                  <Icon size={20} className="sm:w-7 sm:h-7 drop-shadow-md" />
                </div>
              </div>
              <p className="text-xs text-gray-500">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Pointage géolocalisé */}
      <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
        <AttendanceButton />
      </div>

      {/* Actions & Cities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Actions rapides */}
        <div className="card glass-effect backdrop-blur-md animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-gradient from-blue-600 to-cyan-600 flex items-center gap-2">
            <TrendingUp size={20} className="sm:w-6 sm:h-6" />
            Actions rapides
          </h2>
          <div className="space-y-3">
            <a href="/gestionnaire/validated" className="block group">
              <button className="w-full btn btn-primary text-left text-sm sm:text-base py-3 sm:py-4 animate-bounce-soft">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle size={18} className="sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Voir les commandes validées</span>
                    <span className="sm:hidden">Commandes validées</span>
                  </span>
                  <span className="badge bg-white text-primary-600 font-bold px-2 sm:px-3 py-1">
                    {validatedOrders?.orders?.length || 0}
                  </span>
                </div>
              </button>
            </a>
            <a href="/gestionnaire/deliveries" className="block group">
              <button className="w-full btn btn-secondary text-left text-sm sm:text-base py-3 group-hover:pl-4 transition-all">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Truck size={18} className="sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Gérer les listes de livraison</span>
                    <span className="sm:hidden">Listes livraison</span>
                  </span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </a>
            <a href="/gestionnaire/stats" className="block group">
              <button className="w-full btn btn-secondary text-left text-sm sm:text-base py-3 group-hover:pl-4 transition-all">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp size={18} className="sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Voir les statistiques détaillées</span>
                    <span className="sm:hidden">Statistiques</span>
                  </span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </a>
          </div>
        </div>

        {/* Commandes par ville */}
        <div className="card glass-effect backdrop-blur-md animate-slide-up" style={{ animationDelay: '500ms' }}>
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-gradient from-purple-600 to-pink-600 flex items-center gap-2">
            <MapPin size={20} className="sm:w-6 sm:h-6" />
            Commandes par ville
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {statsData?.topCities?.slice(0, 5).map((city: any, index: number) => (
              <div 
                key={city.clientVille} 
                className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-primary-50 hover:to-purple-50 transition-all duration-300 animate-slide-up group"
                style={{ animationDelay: `${600 + index * 50}ms` }}
              >
                <span className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2 group-hover:text-primary-700 transition-colors">
                  <MapPin size={14} className="sm:w-4 sm:h-4 text-primary-500" />
                  {city.clientVille}
                </span>
                <span className="badge bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold px-2 sm:px-3 py-1 shadow-md group-hover:scale-110 transition-transform">
                  {city._count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}











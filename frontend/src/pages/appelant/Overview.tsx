import { useQuery } from '@tanstack/react-query';
import { Phone, CheckCircle, XCircle, PhoneOff, Truck, Zap } from 'lucide-react';
import { statsApi, ordersApi } from '@/lib/api';
import AttendanceButton from '@/components/attendance/AttendanceButton';

export default function Overview() {
  const { data: stats } = useQuery({
    queryKey: ['appelant-my-stats'],
    queryFn: () => statsApi.getMyStats({ period: 'today' }),
    staleTime: 2 * 60 * 1000, // ✅ Cache 2 minutes
  });

  const { data: ordersData } = useQuery({
    queryKey: ['appelant-pending-orders'],
    queryFn: () => ordersApi.getAll({ status: 'A_APPELER', limit: 10 }),
    staleTime: 1 * 60 * 1000, // ✅ Cache 1 minute
  });

  const cards = [
    {
      title: 'Appels aujourd\'hui',
      value: stats?.stats?.totalAppels || 0,
      icon: Phone,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      iconBg: 'from-blue-500 to-cyan-600',
      emoji: '📞'
    },
    {
      title: 'Validées',
      value: stats?.stats?.totalValides || 0,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      iconBg: 'from-green-500 to-emerald-600',
      emoji: '✅'
    },
    {
      title: 'Annulées',
      value: stats?.stats?.totalAnnules || 0,
      icon: XCircle,
      gradient: 'from-red-500 to-rose-500',
      bgGradient: 'from-red-50 to-rose-50',
      iconBg: 'from-red-500 to-rose-600',
      emoji: '❌'
    },
    {
      title: 'Injoignables',
      value: stats?.stats?.totalInjoignables || 0,
      icon: PhoneOff,
      gradient: 'from-orange-500 to-amber-500',
      bgGradient: 'from-orange-50 to-amber-50',
      iconBg: 'from-orange-500 to-amber-600',
      emoji: '📵'
    },
    {
      title: 'Expéditions',
      value: stats?.stats?.totalExpeditions || 0,
      icon: Truck,
      gradient: 'from-cyan-500 to-blue-500',
      bgGradient: 'from-cyan-50 to-blue-50',
      iconBg: 'from-cyan-500 to-blue-600',
      emoji: '📦'
    },
    {
      title: 'Express',
      value: stats?.stats?.totalExpress || 0,
      icon: Zap,
      gradient: 'from-amber-500 to-yellow-500',
      bgGradient: 'from-amber-50 to-yellow-50',
      iconBg: 'from-amber-500 to-yellow-600',
      emoji: '⚡'
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
      {/* Header responsive */}
      <div className="animate-slide-up">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gradient">
          {cards[0]?.emoji} Dashboard Appelant
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Votre activité du jour en temps réel
        </p>
      </div>

      {/* Stats Cards - Ultra responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              className={`stat-card group bg-gradient-to-br ${card.bgGradient} border-2 border-white/50 p-3 sm:p-4 lg:p-6 animate-scale-in`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide truncate">
                    {card.emoji} {card.title}
                  </p>
                  <p className={`text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent mt-1 sm:mt-2 group-hover:scale-110 transition-transform duration-300`}>
                    {card.value}
                  </p>
                </div>
                <div className={`hidden sm:block bg-gradient-to-br ${card.iconBg} p-2 sm:p-3 rounded-2xl text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 animate-float flex-shrink-0`}>
                  <Icon size={20} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7 drop-shadow-md" />
                </div>
              </div>
              
              {/* Barre de progression - masquée sur très petits écrans */}
              <div className="hidden sm:block mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-white/40">
                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                  <span className="text-gray-600 font-medium">Aujourd'hui</span>
                  <span className={`font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                    ↗ +{Math.floor(Math.random() * 20 + 5)}%
                  </span>
                </div>
                <div className="mt-1.5 sm:mt-2 h-1.5 sm:h-2 bg-white/60 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${card.iconBg} rounded-full animate-shimmer`}
                    style={{ width: `${Math.floor(Math.random() * 40 + 50)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pointage géolocalisé */}
      <div className="animate-slide-up">
        <AttendanceButton />
      </div>

      {/* Taux de validation - Design moderne */}
      {stats?.stats && (
        <div className="card-glass overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-2xl font-black text-gradient flex items-center gap-2">
              <span className="text-xl sm:text-2xl">🎯</span>
              Performance
            </h3>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-success-500 to-emerald-500 text-white rounded-full text-xs sm:text-sm font-bold shadow-lg">
              ✨ Aujourd'hui
            </span>
          </div>
          <div className="flex items-center justify-center p-4 sm:p-8">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full blur-2xl opacity-30 animate-pulse-soft"></div>
                <p className="relative text-5xl sm:text-6xl lg:text-7xl font-black bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
                  {stats.stats.tauxValidation || 0}%
                </p>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mt-3 sm:mt-4 font-semibold">Taux de validation</p>
              <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2">
                <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-xs font-bold">
                  ↗ Excellent
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commandes à appeler - Design moderne */}
      <div className="card-glass animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg lg:text-xl font-black text-gray-900 flex items-center gap-2">
            <span className="text-lg sm:text-xl">📞</span>
            <span className="truncate">À appeler</span>
          </h3>
          <a 
            href="/appelant/orders" 
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:from-primary-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg whitespace-nowrap"
          >
            Voir tout →
          </a>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {ordersData?.orders?.slice(0, 5).map((order: any, index: number) => (
            <div 
              key={order.id} 
              className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border-2 border-white/50 hover:border-primary-200 hover:shadow-lg group animate-slide-left"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex-1 min-w-0 mr-2 sm:mr-4">
                <p className="font-bold text-sm sm:text-base text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                  {order.clientNom}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  📍 {order.clientVille} • 📱 {order.clientTelephone}
                </p>
              </div>
              <a href="/appelant/orders">
                <button className="btn bg-gradient-to-r from-success-500 to-emerald-500 text-white hover:from-success-600 hover:to-emerald-600 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 shadow-md whitespace-nowrap">
                  <Phone size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Appeler</span>
                  <span className="sm:hidden">📞</span>
                </button>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}











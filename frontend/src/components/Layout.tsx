import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LogOut, 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Truck, 
  BarChart3,
  Phone,
  Package,
  Warehouse,
  TrendingUp,
  History,
  Database,
  CheckCircle,
  Eye,
  Zap,
  Menu,
  X,
  DollarSign,
  Bell,
  Calendar,
  Settings,
  UserCheck
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavigationItems = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
          { icon: Phone, label: 'À appeler', path: '/admin/to-call' },
          { icon: Calendar, label: 'RDV Programmés', path: '/admin/rdv' },
          { icon: ShoppingCart, label: 'Commandes', path: '/admin/orders' },
          { icon: CheckCircle, label: 'Commandes validées', path: '/admin/validated' },
          { icon: Zap, label: 'Expéditions & EXPRESS', path: '/admin/expeditions' },
          { icon: Bell, label: 'EXPRESS - En agence', path: '/admin/express-agence' },
          { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
          { icon: UserCheck, label: 'Présences & Absences', path: '/admin/attendance' },
          { icon: Truck, label: 'Gestion des Tournées', path: '/admin/tournees' },
          { icon: TrendingUp, label: 'Listes de livraison', path: '/admin/deliveries' },
          { icon: Warehouse, label: 'Livraisons en Cours', path: '/admin/livraisons-en-cours' },
          { icon: Package, label: 'Gestion des Produits', path: '/admin/products' },
          { icon: History, label: 'Historique Mouvements', path: '/admin/movements' },
          { icon: Database, label: 'Base Clients', path: '/admin/database' },
          { icon: Eye, label: 'Supervision Appelants', path: '/admin/supervision' },
          { icon: BarChart3, label: 'Statistiques', path: '/admin/stats' },
          { icon: Package, label: 'Stats par Produit', path: '/admin/product-stats' },
          { icon: DollarSign, label: 'Comptabilité', path: '/admin/accounting' },
          { icon: Settings, label: 'Paramètres SMS', path: '/admin/sms-settings' },
        ];
      case 'GESTIONNAIRE':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/gestionnaire' },
          { icon: Phone, label: 'À appeler', path: '/gestionnaire/to-call' },
          { icon: Calendar, label: 'RDV Programmés', path: '/gestionnaire/rdv' },
          { icon: ShoppingCart, label: 'Toutes les commandes', path: '/gestionnaire/all-orders' },
          { icon: CheckCircle, label: 'Commandes validées', path: '/gestionnaire/validated' },
          { icon: Zap, label: 'Expéditions & EXPRESS', path: '/gestionnaire/expeditions' },
          { icon: Bell, label: 'EXPRESS - En agence', path: '/gestionnaire/express-agence' },
          { icon: Warehouse, label: 'Gestion des tournées', path: '/gestionnaire/tournees' },
          { icon: Truck, label: 'Livraisons', path: '/gestionnaire/deliveries' },
          { icon: Package, label: 'Livraisons en Cours', path: '/gestionnaire/livraisons-en-cours' },
          { icon: Users, label: 'Utilisateurs', path: '/gestionnaire/users' },
          { icon: UserCheck, label: 'Présences & Absences', path: '/gestionnaire/attendance' },
          { icon: Database, label: 'Base Clients', path: '/gestionnaire/database' },
          { icon: Eye, label: 'Supervision Appelants', path: '/gestionnaire/supervision' },
          { icon: BarChart3, label: 'Statistiques', path: '/gestionnaire/stats' },
        ];
      case 'GESTIONNAIRE_STOCK':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/stock' },
          { icon: Truck, label: 'Tournées', path: '/stock/tournees' },
          { icon: Zap, label: 'Expéditions & EXPRESS', path: '/stock/expeditions' },
          { icon: TrendingUp, label: 'Listes de livraison', path: '/stock/deliveries' },
          { icon: Warehouse, label: 'Livraisons en Cours', path: '/stock/livraisons-en-cours' },
          { icon: Package, label: 'Produits', path: '/stock/products' },
          { icon: History, label: 'Mouvements', path: '/stock/movements' },
          { icon: Database, label: 'Base Clients', path: '/stock/database' },
        ];
      case 'APPELANT':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/appelant' },
          { icon: Phone, label: 'À appeler', path: '/appelant/orders' },
          { icon: Calendar, label: 'RDV Programmés', path: '/appelant/rdv' },
          { icon: ShoppingCart, label: 'Toutes les commandes', path: '/appelant/all-orders' },
          { icon: Zap, label: 'Expéditions & EXPRESS', path: '/appelant/expeditions' },
          { icon: Bell, label: 'EXPRESS - En agence', path: '/appelant/express-agence' },
          { icon: TrendingUp, label: 'Listes de livraison', path: '/appelant/deliveries' },
          { icon: CheckCircle, label: 'Mes commandes traitées', path: '/appelant/processed' },
          { icon: Database, label: 'Base Clients', path: '/appelant/database' },
          { icon: Eye, label: 'Performance des Appelants', path: '/appelant/supervision' },
          { icon: BarChart3, label: 'Mes statistiques', path: '/appelant/stats' },
        ];
      case 'LIVREUR':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/livreur' },
          { icon: Package, label: 'Mes livraisons', path: '/livreur/deliveries' },
          { icon: Truck, label: 'Mes Expéditions', path: '/livreur/expeditions' },
          { icon: History, label: 'Mon Historique', path: '/livreur/history' },
          { icon: BarChart3, label: 'Mes statistiques', path: '/livreur/stats' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();
  const roleLabel =
    user?.role === 'ADMIN' ? 'Administration' :
    user?.role === 'GESTIONNAIRE' ? 'Gestion' :
    user?.role === 'GESTIONNAIRE_STOCK' ? 'Gestion de Stock' :
    user?.role === 'APPELANT' ? 'Appels' :
    user?.role === 'LIVREUR' ? 'Livraisons' : '';
  const navIconTones = [
    'from-sky-500/25 to-cyan-400/10 text-sky-300',
    'from-violet-500/25 to-fuchsia-400/10 text-violet-300',
    'from-amber-500/25 to-orange-400/10 text-amber-300',
    'from-emerald-500/25 to-teal-400/10 text-emerald-300',
    'from-rose-500/25 to-pink-400/10 text-rose-300',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-violet-100/70">
      {/* Mobile Header with Burger Menu */}
      <div className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 shadow-xl shadow-slate-950/15 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/30">
            <Zap size={18} fill="currentColor" />
          </span>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">GS Pipeline</h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-sky-300">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-xl border border-white/10 bg-white/10 p-2 text-white shadow-sm transition hover:bg-white/20"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 z-50 flex h-full w-64 flex-col overflow-hidden border-r border-white/10 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 shadow-2xl shadow-slate-950/30 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="relative border-b border-white/10 p-5">
          <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="flex items-center justify-between">
            <div className="relative flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-violet-600 text-white shadow-xl shadow-blue-500/25 ring-1 ring-white/25">
                <Zap size={21} fill="currentColor" />
              </span>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white">GS Pipeline</h1>
                <span className="mt-1 inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                  {roleLabel}
                </span>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto p-3">
          <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Navigation</p>
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 font-semibold text-white shadow-lg shadow-indigo-950/40 ring-1 ring-white/15'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isActive && <span className="absolute -right-4 -top-7 h-16 w-16 rounded-full bg-white/15 blur-xl" />}
                <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${isActive ? 'from-white/25 to-white/10 text-white' : navIconTones[index % navIconTones.length]} transition-transform duration-300 group-hover:scale-105`}>
                  <Icon size={18} />
                </span>
                <span className="relative text-[13px] leading-tight">{item.label}</span>
                {isActive && <span className="relative ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 bg-black/10 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-inner">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 font-bold text-white shadow-lg shadow-violet-950/30">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.prenom} {user?.nom}
              </p>
              <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-screen p-4 pt-20 sm:p-6 sm:pt-20 lg:ml-64 lg:p-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}


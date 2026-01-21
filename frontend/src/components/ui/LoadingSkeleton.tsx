// 🎨 Loading Skeletons Ultra-Modernes avec Animations
// Composants de chargement élégants avec effets shimmer et glass-morphism

interface SkeletonProps {
  className?: string;
}

// Skeleton de base avec effet shimmer
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div 
      className={`animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
      style={{ 
        backgroundSize: '200% 100%',
      }}
    />
  );
}

// Skeleton pour une Card de statistique
export function StatCardSkeleton() {
  return (
    <div className="stat-card bg-gradient-to-br from-white/80 to-white/60 border border-white/40 rounded-2xl p-4 sm:p-6 shadow-elegant animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// Skeleton pour une Order Card
export function OrderCardSkeleton() {
  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

// Skeleton pour une Table Row
export function TableRowSkeleton() {
  return (
    <tr className="animate-fade-in">
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-20 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </td>
    </tr>
  );
}

// Skeleton pour Dashboard complet (4 stats cards)
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="card space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton pour liste de commandes (grille)
export function OrdersGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(count)].map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-10 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Skeleton pour liste avec Table
export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {[...Array(6)].map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(rows)].map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Skeleton pour Modal
export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-elegant-lg p-6 max-w-md w-full animate-slide-down">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-px w-full" />
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton pour Chart/Graph
export function ChartSkeleton() {
  return (
    <div className="card space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="h-64 flex items-end justify-around gap-2">
        {[...Array(7)].map((_, i) => (
          <Skeleton 
            key={i} 
            className="w-full rounded-t-lg" 
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
      <div className="flex justify-around">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}

// Skeleton minimaliste pour texte/contenu
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-fade-in">
      {[...Array(lines)].map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4" 
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

// Export tout
export default {
  Skeleton,
  StatCardSkeleton,
  OrderCardSkeleton,
  TableRowSkeleton,
  DashboardSkeleton,
  OrdersGridSkeleton,
  TableSkeleton,
  ModalSkeleton,
  ChartSkeleton,
  TextSkeleton,
};


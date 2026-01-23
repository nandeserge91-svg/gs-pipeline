import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertTriangle, Download, Search, UserX, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

// Types
interface AttendanceRecord {
  id: number;
  date: string;
  heureArrivee: string;
  heureDepart: string | null;
  distanceArrivee: number;
  validee: boolean;
  validation: string;
  user: {
    id: number;
    nom: string;
    prenom: string;
    role: string;
  };
}

// Fonction utilitaire en dehors du composant
const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function AttendanceV2() {
  // État
  const todayDate = useMemo(() => getTodayDate(), []);
  const [dateFilter, setDateFilter] = useState(todayDate);
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'retard' | 'parti'>('all');
  
  const queryClient = useQueryClient();

  // Calculer les dates selon la période
  const getDateRange = useMemo(() => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (periodFilter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setDate(today.getDate() - 30);
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
        }
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, [periodFilter, startDate, endDate]);

  // Chargement des données
  const { data: attendanceData, isLoading, isError } = useQuery({
    queryKey: ['attendance-v2', periodFilter, getDateRange.startDate, getDateRange.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (periodFilter === 'today') {
        params.append('date', dateFilter);
      } else {
        params.append('startDate', getDateRange.startDate);
        params.append('endDate', getDateRange.endDate);
      }
      const { data } = await api.get(`/attendance/history?${params.toString()}`);
      return data;
    },
    retry: 1,
  });

  // Mutation pour générer les absences
  const generateAbsencesMutation = useMutation({
    mutationFn: async (targetDate?: string) => {
      const { data } = await api.post('/attendance/generate-absences', {
        date: targetDate || dateFilter
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-v2'] });
      toast.success(`✅ ${data.created} absence(s) générée(s)`, {
        duration: 4000,
        icon: '📋'
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la génération des absences', {
        duration: 5000
      });
    }
  });

  const attendances: AttendanceRecord[] = attendanceData?.attendances || [];

  // Filtrage
  const filteredAttendances = useMemo(() => {
    return attendances.filter(att => {
      // Filtre par nom
      if (searchTerm) {
        const fullName = `${att.user.prenom} ${att.user.nom}`.toLowerCase();
        if (!fullName.includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      // Filtre par statut
      if (statusFilter !== 'all') {
        if (statusFilter === 'present' && (!att.validee || att.validation === 'RETARD')) {
          return false;
        }
        if (statusFilter === 'absent' && att.validee) {
          return false;
        }
        if (statusFilter === 'retard' && att.validation !== 'RETARD') {
          return false;
        }
        if (statusFilter === 'parti' && !att.heureDepart) {
          return false;
        }
      }

      return true;
    });
  }, [attendances, searchTerm, statusFilter]);

  // Statistiques
  const stats = useMemo(() => ({
    total: filteredAttendances.length,
    present: filteredAttendances.filter(a => a.validee && a.validation !== 'RETARD').length,
    absent: filteredAttendances.filter(a => !a.validee).length,
    retard: filteredAttendances.filter(a => a.validation === 'RETARD').length,
  }), [filteredAttendances]);

  // Fonctions utilitaires
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const getStatusBadge = (attendance: AttendanceRecord) => {
    if (!attendance.validee) {
      return <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full">❌ ABSENT</span>;
    }
    if (attendance.validation === 'RETARD') {
      return <span className="px-2 py-1 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">⚠️ RETARD</span>;
    }
    if (attendance.heureDepart) {
      return <span className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">👋 PARTI</span>;
    }
    return <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full">✅ PRÉSENT</span>;
  };

  // Export CSV
  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Employé', 'Rôle', 'Arrivée', 'Départ', 'Statut', 'Distance'];
      const rows = filteredAttendances.map(att => [
        formatDate(att.date),
        `${att.user.prenom} ${att.user.nom}`,
        att.user.role,
        formatTime(att.heureArrivee),
        att.heureDepart ? formatTime(att.heureDepart) : '-',
        att.validee ? (att.validation === 'RETARD' ? 'RETARD' : 'PRÉSENT') : 'ABSENT',
        `${Math.round(att.distanceArrivee)}m`
      ]);

      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `presences_${dateFilter}.csv`;
      link.click();
    } catch (error) {
      console.error('Erreur export CSV:', error);
      alert('Erreur lors de l\'export CSV');
    }
  };

  // Gestion des erreurs
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="text-red-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">Impossible de charger les présences</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Rendu principal
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">📊 Présences & Absences</h1>
          <p className="text-gray-600 mt-1">
            Pointages du {formatDate(dateFilter)}
            {dateFilter !== todayDate && (
              <button
                onClick={() => setDateFilter(todayDate)}
                className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Aujourd'hui
              </button>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => generateAbsencesMutation.mutate()}
            disabled={generateAbsencesMutation.isPending}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Générer automatiquement les absences pour les employés qui n'ont pas pointé"
          >
            {generateAbsencesMutation.isPending ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <UserX size={18} />
            )}
            <span className="hidden sm:inline">Générer absences</span>
            <span className="sm:hidden">Absents</span>
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" size={24} />
            <div>
              <p className="text-xs text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <p className="text-xs text-green-600 font-medium">Présents</p>
              <p className="text-2xl font-bold text-green-700">{stats.present}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
          <div className="flex items-center gap-2">
            <XCircle className="text-red-600" size={24} />
            <div>
              <p className="text-xs text-red-600 font-medium">Absents</p>
              <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-orange-600" size={24} />
            <div>
              <p className="text-xs text-orange-600 font-medium">Retards</p>
              <p className="text-2xl font-bold text-orange-700">{stats.retard}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {/* Filtre par période */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPeriodFilter('today')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                periodFilter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setPeriodFilter('week')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                periodFilter === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 derniers jours
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                periodFilter === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 derniers jours
            </button>
            <button
              onClick={() => setPeriodFilter('custom')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                periodFilter === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Personnalisé
            </button>
          </div>
        </div>

        {/* Dates personnalisées */}
        {periodFilter === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Recherche */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher un employé</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nom de l'employé..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filtre par statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par statut</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Tous
            </button>
            <button
              onClick={() => setStatusFilter('present')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                statusFilter === 'present'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              ✅ Présents
            </button>
            <button
              onClick={() => setStatusFilter('absent')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                statusFilter === 'absent'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              ❌ Absents
            </button>
            <button
              onClick={() => setStatusFilter('retard')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                statusFilter === 'retard'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
            >
              ⚠️ Retards
            </button>
            <button
              onClick={() => setStatusFilter('parti')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                statusFilter === 'parti'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              👋 Partis
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Employé</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Arrivée</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Départ</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Aucune donnée</p>
                    <p className="text-sm mt-1">Modifiez les filtres pour voir plus de résultats</p>
                  </td>
                </tr>
              ) : (
                filteredAttendances.map((att) => (
                  <tr key={att.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 text-sm">{formatDate(att.date)}</td>
                    <td className="px-4 py-3 text-sm font-medium">{att.user.prenom} {att.user.nom}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">{att.user.role}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-700">{formatTime(att.heureArrivee)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-700">
                      {att.heureDepart ? formatTime(att.heureDepart) : '-'}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(att)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{Math.round(att.distanceArrivee)}m</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


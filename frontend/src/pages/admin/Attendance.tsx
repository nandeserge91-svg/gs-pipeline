import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertTriangle, Download, Filter, Search } from 'lucide-react';
import { api } from '@/lib/api';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

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

export default function Attendance() {
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'retard' | 'hors_zone'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Récupérer l'historique des présences
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-history', dateFilter, userFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFilter) params.append('date', dateFilter);
      if (userFilter) params.append('userId', userFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const { data } = await api.get(`/attendance/history?${params.toString()}`);
      return data;
    }
  });

  // Récupérer la liste des utilisateurs pour le filtre
  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    }
  });

  const attendances: AttendanceRecord[] = attendanceData?.attendances || [];
  const users = usersData?.users || [];

  // Filtrer par recherche
  const filteredAttendances = attendances.filter(att => {
    const fullName = `${att.user.prenom} ${att.user.nom}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Calculer les statistiques
  const stats = {
    total: filteredAttendances.length,
    present: filteredAttendances.filter(a => a.validee && !a.validation?.includes('RETARD')).length,
    absent: filteredAttendances.filter(a => !a.validee).length,
    retard: filteredAttendances.filter(a => a.validation === 'RETARD').length,
    horsZone: filteredAttendances.filter(a => a.validation === 'HORS_ZONE').length
  };

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (attendance: AttendanceRecord) => {
    if (!attendance.validee) {
      return (
        <span className="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-700 rounded-full flex items-center gap-1">
          <XCircle size={14} />
          ABSENT
        </span>
      );
    }

    if (attendance.validation === 'HORS_ZONE') {
      return (
        <span className="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-700 rounded-full flex items-center gap-1">
          <XCircle size={14} />
          HORS ZONE
        </span>
      );
    }

    if (attendance.validation === 'RETARD') {
      return (
        <span className="px-3 py-1.5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
          <AlertTriangle size={14} />
          RETARD
        </span>
      );
    }

    if (attendance.heureDepart) {
      return (
        <span className="px-3 py-1.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
          <CheckCircle size={14} />
          PARTI
        </span>
      );
    }

    return (
      <span className="px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700 rounded-full flex items-center gap-1">
        <CheckCircle size={14} />
        PRÉSENT
      </span>
    );
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short',
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Fonction pour formater l'heure
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Fonction pour exporter en CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Employé', 'Rôle', 'Arrivée', 'Départ', 'Statut', 'Distance (m)'];
    const rows = filteredAttendances.map(att => [
      formatDate(att.date),
      `${att.user.prenom} ${att.user.nom}`,
      att.user.role,
      formatTime(att.heureArrivee),
      att.heureDepart ? formatTime(att.heureDepart) : '-',
      att.validee ? (att.validation === 'RETARD' ? 'RETARD' : 'PRÉSENT') : 'ABSENT',
      Math.round(att.distanceArrivee).toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `presences_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return <LoadingSkeleton type="table" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            📊 Présences & Absences
          </h1>
          <p className="text-gray-600 mt-1">Historique complet des pointages</p>
        </div>
        <button
          onClick={exportToCSV}
          className="btn btn-primary flex items-center gap-2"
        >
          <Download size={18} />
          <span className="hidden sm:inline">Exporter CSV</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="card p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <Users className="text-blue-600" size={24} />
            <div>
              <p className="text-xs text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <p className="text-xs text-green-600 font-medium">Présents</p>
              <p className="text-2xl font-bold text-green-700">{stats.present}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="text-red-600" size={24} />
            <div>
              <p className="text-xs text-red-600 font-medium">Absents</p>
              <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-600" size={24} />
            <div>
              <p className="text-xs text-orange-600 font-medium">Retards</p>
              <p className="text-2xl font-bold text-orange-700">{stats.retard}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-purple-600" size={24} />
            <div>
              <p className="text-xs text-purple-600 font-medium">Hors zone</p>
              <p className="text-2xl font-bold text-purple-700">{stats.horsZone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Recherche par nom */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Filtre par date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={18} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input pl-10 w-full relative bg-white"
            />
          </div>

          {/* Filtre par utilisateur */}
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={18} />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="input pl-10 w-full relative bg-white appearance-none"
            >
              <option value="">Tous les employés</option>
              {users
                .filter((u: any) => ['APPELANT', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'].includes(u.role))
                .map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.prenom} {user.nom} ({user.role})
                  </option>
                ))}
            </select>
          </div>

          {/* Filtre par statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input pl-10 w-full relative bg-white appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="present">Présents</option>
              <option value="absent">Absents</option>
              <option value="retard">Retards</option>
              <option value="hors_zone">Hors zone</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des présences */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Employé</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase hidden sm:table-cell">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Arrivée</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase hidden md:table-cell">Départ</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase hidden lg:table-cell">Distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Aucune donnée disponible</p>
                    <p className="text-sm mt-1">Modifiez vos filtres pour voir plus de résultats</p>
                  </td>
                </tr>
              ) : (
                filteredAttendances.map((attendance) => (
                  <tr 
                    key={attendance.id} 
                    className="hover:bg-blue-50 transition-colors duration-150"
                  >
                    {/* Date */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(attendance.date)}
                        </span>
                      </div>
                    </td>

                    {/* Employé */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {attendance.user.prenom} {attendance.user.nom}
                        </p>
                      </div>
                    </td>

                    {/* Rôle */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {attendance.user.role}
                      </span>
                    </td>

                    {/* Heure d'arrivée */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-green-600" />
                        <span className="text-sm font-bold text-green-700">
                          {formatTime(attendance.heureArrivee)}
                        </span>
                      </div>
                    </td>

                    {/* Heure de départ */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {attendance.heureDepart ? (
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-blue-600" />
                          <span className="text-sm font-bold text-blue-700">
                            {formatTime(attendance.heureDepart)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3">
                      {getStatusBadge(attendance)}
                    </td>

                    {/* Distance */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">
                        {Math.round(attendance.distanceArrivee)}m
                      </span>
                    </td>
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


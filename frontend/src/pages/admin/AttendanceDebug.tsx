import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AttendanceDebug() {
  const [step, setStep] = useState(1);

  // Test 1 : Page basique
  if (step === 1) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-blue-600">
          🔍 Test 1 : Page Basique
        </h1>
        <p className="mt-4">✅ Si vous voyez ceci, le composant fonctionne.</p>
        <button
          onClick={() => setStep(2)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Passer au Test 2 (useState)
        </button>
      </div>
    );
  }

  // Test 2 : Avec useState
  if (step === 2) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-green-600">
          ✅ Test 2 : useState fonctionne
        </h1>
        <p className="mt-4">Le state React fonctionne correctement.</p>
        <button
          onClick={() => setStep(3)}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Passer au Test 3 (React Query)
        </button>
        <button
          onClick={() => setStep(1)}
          className="mt-4 ml-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Retour
        </button>
      </div>
    );
  }

  // Test 3 : Avec React Query
  return <Test3ReactQuery onBack={() => setStep(2)} />;
}

function Test3ReactQuery({ onBack }: { onBack: () => void }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['test-attendance'],
    queryFn: async () => {
      console.log('🔍 Test: Appel API /attendance/history...');
      try {
        const { data } = await api.get('/attendance/history');
        console.log('✅ Réponse API:', data);
        return data;
      } catch (err: any) {
        console.error('❌ Erreur API:', err);
        console.error('❌ Status:', err.response?.status);
        console.error('❌ Data:', err.response?.data);
        throw err;
      }
    },
    retry: false
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-yellow-600">
          ⏳ Test 3 : Chargement...
        </h1>
        <p className="mt-4">React Query charge les données...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-red-600">
          ❌ Test 3 : Erreur Détectée !
        </h1>
        <div className="mt-4 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
          <p className="font-bold text-red-800">Erreur:</p>
          <pre className="mt-2 text-sm text-red-700 overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg">
          <p className="font-bold text-yellow-800">📋 Vérifications à faire :</p>
          <ul className="mt-2 text-yellow-700 space-y-1">
            <li>✓ Backend démarré ?</li>
            <li>✓ Route /api/attendance/history existe ?</li>
            <li>✓ Token JWT valide ?</li>
            <li>✓ Rôle ADMIN ou GESTIONNAIRE ?</li>
            <li>✓ CORS configuré ?</li>
          </ul>
        </div>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-green-600">
        ✅ Test 3 : React Query fonctionne !
      </h1>
      <div className="mt-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
        <p className="font-bold text-green-800">Données reçues :</p>
        <pre className="mt-2 text-sm text-green-700 overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
      <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
        <p className="font-bold text-blue-800">✨ Conclusion :</p>
        <p className="text-blue-700 mt-2">
          Tous les tests passent ! Le problème vient probablement du rendu
          du tableau ou des filtres dans la page complète.
        </p>
      </div>
      <button
        onClick={onBack}
        className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Retour
      </button>
    </div>
  );
}


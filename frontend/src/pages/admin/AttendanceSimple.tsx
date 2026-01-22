// Version simplifiée pour diagnostic
export default function AttendanceSimple() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600">
        ✅ Page Présences & Absences - Version Simplifiée
      </h1>
      <p className="mt-4 text-gray-700">
        Si vous voyez ce message, le problème vient du code de la page complète.
      </p>
      <div className="mt-8 p-4 bg-green-100 border-2 border-green-500 rounded-lg">
        <p className="font-bold text-green-800">
          ✅ Le routing fonctionne correctement
        </p>
        <p className="text-green-700 mt-2">
          La page est bien accessible, mais le composant complet a un problème.
        </p>
      </div>
    </div>
  );
}


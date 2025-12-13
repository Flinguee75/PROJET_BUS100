/**
 * Page CSVImportPage - Import en masse des données (MVP Barbarian Mode)
 * Permet d'importer: Élèves, Parents, Bus, Chauffeurs
 */

import { useState } from 'react';
import { Users, User, Bus, UserCheck, FileText, AlertCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { CSVUploaderCard } from '@/components/CSVUploaderCard';

interface ImportRecord {
  id: string;
  entity: 'students' | 'parents' | 'buses' | 'drivers';
  fileName: string;
  totalRows: number;
  imported: number;
  failed: number;
  timestamp: number;
  status: 'success' | 'partial' | 'failed';
}

export const CSVImportPage = () => {
  const [importHistory, setImportHistory] = useState<ImportRecord[]>([]);

  // Fonction d'upload mockée (sera remplacée par l'API)
  const handleUpload = async (entity: string, file: File): Promise<void> => {
    console.log(`Uploading ${entity}:`, file.name);

    // Simuler un délai d'upload
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // TODO: Remplacer par le vrai appel API
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('entity', entity);
    // await axios.post('/api/import/csv', formData);

    // Simuler un résultat d'import
    const mockResult: ImportRecord = {
      id: `import_${Date.now()}`,
      entity: entity as any,
      fileName: file.name,
      totalRows: 100,
      imported: 98,
      failed: 2,
      timestamp: Date.now(),
      status: 'partial',
    };

    setImportHistory((prev) => [mockResult, ...prev]);
  };

  const getEntityLabel = (entity: string): string => {
    const labels: Record<string, string> = {
      students: 'Élèves',
      parents: 'Parents',
      buses: 'Bus',
      drivers: 'Chauffeurs',
    };
    return labels[entity] || entity;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 bg-neutral-50 min-h-screen">
      <Header
        title="Import CSV"
        subtitle="Importez vos données en masse - Mode Barbare activé"
      />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Instructions */}
        <div className="bg-primary-50 border-l-4 border-primary-600 p-6 rounded-lg mb-8">
          <div className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <h3 className="font-bold text-lg text-primary-900 mb-2">
                Comment ça marche ?
              </h3>
              <ol className="text-sm text-primary-800 space-y-2 list-decimal list-inside">
                <li>Téléchargez le modèle CSV correspondant à vos données</li>
                <li>Remplissez le fichier Excel avec vos données (respectez le format)</li>
                <li>Sauvegardez en format CSV</li>
                <li>Importez le fichier ici</li>
              </ol>
              <p className="text-xs text-primary-700 mt-3 bg-primary-100 p-2 rounded">
                💡 <strong>Astuce:</strong> Importez d'abord les Parents et Chauffeurs, puis les Bus, et enfin les Élèves
              </p>
            </div>
          </div>
        </div>

        {/* Grid des uploaders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <CSVUploaderCard
            title="Élèves"
            icon={Users}
            description="Importer la liste des élèves"
            templateUrl="/templates/students.csv"
            onUpload={(file) => handleUpload('students', file)}
          />

          <CSVUploaderCard
            title="Parents"
            icon={User}
            description="Importer la liste des parents"
            templateUrl="/templates/parents.csv"
            onUpload={(file) => handleUpload('parents', file)}
          />

          <CSVUploaderCard
            title="Bus"
            icon={Bus}
            description="Importer la flotte de bus"
            templateUrl="/templates/buses.csv"
            onUpload={(file) => handleUpload('buses', file)}
          />

          <CSVUploaderCard
            title="Chauffeurs"
            icon={UserCheck}
            description="Importer la liste des chauffeurs"
            templateUrl="/templates/drivers.csv"
            onUpload={(file) => handleUpload('drivers', file)}
          />
        </div>

        {/* Historique des imports */}
        {importHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
              <h3 className="text-lg font-bold text-slate-900 font-display">
                Historique des Imports
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Les {importHistory.length} derniers imports
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Fichier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Résultat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {importHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-md">
                          {getEntityLabel(record.entity)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {record.fileName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-success-600 font-semibold">
                            {record.imported} importés
                          </span>
                          {record.failed > 0 && (
                            <span className="text-danger-600 font-semibold">
                              {record.failed} erreurs
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatTimestamp(record.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.status === 'success' && (
                          <span className="px-2 py-1 bg-success-100 text-success-700 text-xs font-semibold rounded-md">
                            ✓ Succès
                          </span>
                        )}
                        {record.status === 'partial' && (
                          <span className="px-2 py-1 bg-warning-100 text-warning-700 text-xs font-semibold rounded-md">
                            ⚠ Partiel
                          </span>
                        )}
                        {record.status === 'failed' && (
                          <span className="px-2 py-1 bg-danger-100 text-danger-700 text-xs font-semibold rounded-md">
                            ✗ Échec
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Message si aucun import */}
        {importHistory.length === 0 && (
          <div className="bg-white rounded-xl shadow-card border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-slate-400" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Aucun import pour l'instant
            </h3>
            <p className="text-sm text-slate-600">
              Importez vos premiers fichiers CSV pour démarrer
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

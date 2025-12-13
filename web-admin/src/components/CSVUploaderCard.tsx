/**
 * Composant CSVUploaderCard - Carte d'upload CSV pour une entité
 * Permet de télécharger le template et d'uploader un fichier CSV
 */

import { useState } from 'react';
import { Upload, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface CSVUploaderCardProps {
  title: string;
  icon: LucideIcon;
  templateUrl: string;
  onUpload: (file: File) => Promise<void>;
  description?: string;
}

export const CSVUploaderCard = ({
  title,
  icon: Icon,
  templateUrl,
  onUpload,
  description,
}: CSVUploaderCardProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier que c'est un fichier CSV
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Veuillez sélectionner un fichier CSV');
        setFile(null);
        return;
      }

      // Vérifier la taille (max 10 MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Le fichier est trop volumineux (max 10 MB)');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await onUpload(file);
      setSuccess(true);
      setFile(null);

      // Réinitialiser l'input file
      const input = document.getElementById(`file-input-${title}`) as HTMLInputElement;
      if (input) input.value = '';

      // Cacher le message de succès après 3 secondes
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-card border border-slate-200 hover:shadow-card-hover transition-all duration-200">
      {/* Header avec icône */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-primary-600" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-900">{title}</h3>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {/* Download template */}
      <a
        href={templateUrl}
        download
        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mb-4 group"
      >
        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" strokeWidth={2} />
        <span>Télécharger le modèle CSV</span>
      </a>

      {/* File input */}
      <div className="mb-4">
        <label
          htmlFor={`file-input-${title}`}
          className="block mb-2 text-sm font-medium text-slate-700"
        >
          Sélectionner un fichier
        </label>
        <input
          id={`file-input-${title}`}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-primary-50 file:text-primary-700
            hover:file:bg-primary-100
            cursor-pointer
            border border-slate-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {file && (
          <p className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success-600" />
            {file.name} ({(file.size / 1024).toFixed(0)} Ko)
          </p>
        )}
      </div>

      {/* Messages d'erreur/succès */}
      {error && (
        <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-sm text-success-700">Import réussi !</p>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleSubmit}
        disabled={!file || uploading}
        className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-semibold
          hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
            <span>Import en cours...</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" strokeWidth={2} />
            <span>Importer</span>
          </>
        )}
      </button>
    </div>
  );
};

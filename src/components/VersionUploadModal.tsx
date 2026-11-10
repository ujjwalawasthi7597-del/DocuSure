import React, { useState } from 'react';
import { documentsApi } from '../services/api';
import {
  X,
  UploadCloud,
  FileCheck2,
  AlertCircle,
  Sparkles,
  Loader2,
  Layers,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  currentVersion: number;
  onSuccess: () => void;
}

export const VersionUploadModal: React.FC<Props> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  currentVersion,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [changeSummary, setChangeSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const nextVersionNumber = currentVersion + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a revised document file.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('changeSummary', changeSummary || `Version ${nextVersionNumber} revision`);

      await documentsApi.uploadNewVersion(documentId, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload new version.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Upload Version {nextVersionNumber}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-xs">{documentTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Revised Document File (PDF, PNG, JPG) <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            {file && (
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5" />
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Summary of Changes / Response to Reviewer
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Corrected signer dates, attached updated certificate Annex B, revised indemnity limits as requested..."
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Version Management Notice:</span> Version {currentVersion} will be preserved in the archive. The new version will be re-analyzed by Gemini AI and queued for reviewer sign-off.
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading &amp; Analyzing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Submit Version {nextVersionNumber}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { aiApi } from '../services/api';
import { X, Check, Edit3, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  initialFields: Record<string, any>;
  onSuccess: (updatedFields: Record<string, any>) => void;
}

export const EditFieldsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  documentId,
  initialFields,
  onSuccess,
}) => {
  const [fields, setFields] = useState<Record<string, any>>({ ...initialFields });
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFieldChange = (key: string, val: string) => {
    setFields((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleAddField = () => {
    if (!newKey.trim()) return;
    setFields((prev) => ({
      ...prev,
      [newKey.trim()]: newValue.trim(),
    }));
    setNewKey('');
    setNewValue('');
  };

  const handleRemoveField = (key: string) => {
    const updated = { ...fields };
    delete updated[key];
    setFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await aiApi.updateExtractedFields(documentId, fields);
      onSuccess(fields);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update fields.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Correct Extracted Metadata</h3>
              <p className="text-xs text-slate-500">
                Human-in-the-loop review: override AI-extracted values
              </p>
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

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            {Object.entries(fields).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-1/3">
                  <span className="text-xs font-semibold text-slate-700 truncate block capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveField(key)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md"
                  title="Remove field"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add custom field */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-700 mb-2">Add Missing Field</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Field name (e.g. VAT Number)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-1/3 px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
              <input
                type="text"
                placeholder="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddField}
                disabled={!newKey.trim()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
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
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Corrections</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

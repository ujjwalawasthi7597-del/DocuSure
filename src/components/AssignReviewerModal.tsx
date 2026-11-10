import React, { useState, useEffect } from 'react';
import { IUser } from '../types';
import { reviewApi, usersApi } from '../services/api';
import { X, UserCheck, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  currentReviewerId?: string;
  onSuccess: () => void;
}

export const AssignReviewerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  currentReviewerId,
  onSuccess,
}) => {
  const [reviewers, setReviewers] = useState<IUser[]>([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState(currentReviewerId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      usersApi
        .getUsers()
        .then((res) => {
          const revs = (res.users || []).filter(
            (u) => u.role === 'reviewer' || u.role === 'admin'
          );
          setReviewers(revs);
          if (!selectedReviewerId && revs.length > 0) {
            setSelectedReviewerId(revs[0]._id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewerId) {
      setError('Please select a reviewer.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await reviewApi.assignReviewer(documentId, selectedReviewerId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign reviewer.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Assign Compliance Reviewer</h3>
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
              Select Designated Reviewer
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {reviewers.map((rev) => (
                <label
                  key={rev._id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedReviewerId === rev._id
                      ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="reviewer"
                      value={rev._id}
                      checked={selectedReviewerId === rev._id}
                      onChange={() => setSelectedReviewerId(rev._id)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{rev.name}</p>
                      <p className="text-[11px] text-slate-500">{rev.email} • {rev.title || rev.role}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium capitalize">
                    {rev.role}
                  </span>
                </label>
              ))}
            </div>
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
                  <span>Assigning...</span>
                </>
              ) : (
                <span>Confirm Assignment</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

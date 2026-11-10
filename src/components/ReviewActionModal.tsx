import React, { useState } from 'react';
import { reviewApi } from '../services/api';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  MessageSquare,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  initialAction?: 'approve' | 'reject' | 'changes';
  onSuccess: () => void;
}

export const ReviewActionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  initialAction = 'approve',
  onSuccess,
}) => {
  const [action, setAction] = useState<'approve' | 'reject' | 'changes'>(initialAction);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (action === 'approve') {
        await reviewApi.approveDocument(documentId, comments);
      } else if (action === 'reject') {
        if (!rejectionReason.trim()) {
          setError('A mandatory rejection reason must be provided.');
          setIsSubmitting(false);
          return;
        }
        await reviewApi.rejectDocument(documentId, rejectionReason.trim());
      } else if (action === 'changes') {
        if (!comments.trim()) {
          setError('Please detail the required corrections so the uploader knows what to fix.');
          setIsSubmitting(false);
          return;
        }
        await reviewApi.requestChanges(documentId, comments.trim());
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Action failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-800">Compliance Decision</h3>
            <p className="text-xs text-slate-500 truncate max-w-xs">{documentTitle}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Selector */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setAction('approve');
                setError(null);
              }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                action === 'approve'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Approve</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAction('changes');
                setError(null);
              }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                action === 'changes'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-indigo-600" />
              <span>Request Changes</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAction('reject');
                setError(null);
              }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                action === 'reject'
                  ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>Reject</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {action === 'approve' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  Review Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Verified against standard guidelines. Certificate terms valid and signed by authorized officer."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            )}

            {action === 'changes' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-indigo-500" />
                  Correction Instructions (Mandatory)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Specify exactly what is missing, inconsistent, or invalid so the uploader can upload an updated version..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}

            {action === 'reject' && (
              <div>
                <label className="block text-xs font-semibold text-rose-700 mb-1 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  Reason for Rejection (Mandatory)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="State the compliance policy breach, expired timeframe, or fundamental disqualification reason..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            )}

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
                className={`px-5 py-2 text-sm font-semibold text-white rounded-lg flex items-center gap-2 transition-all ${
                  action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                    : action === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-sm'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Decision...</span>
                  </>
                ) : (
                  <span>
                    Confirm {action === 'approve' ? 'Approval' : action === 'reject' ? 'Rejection' : 'Change Request'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

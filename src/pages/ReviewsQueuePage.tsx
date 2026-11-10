import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IDocument } from '../types';
import { reviewApi, documentsApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { ReviewActionModal } from '../components/ReviewActionModal';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  FileText,
  Filter,
} from 'lucide-react';

interface Props {
  onSelectDocument: (docId: string) => void;
}

export const ReviewsQueuePage: React.FC<Props> = ({ onSelectDocument }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'changes'>('pending');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Review modal state
  const [selectedDocForReview, setSelectedDocForReview] = useState<IDocument | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'changes'>('approve');

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      if (user?.role === 'reviewer') {
        const res = await reviewApi.getAssignedReviews();
        setDocuments(res.documents || []);
      } else {
        // Admin or uploader viewing organization review queue
        const res = await documentsApi.getDocuments();
        setDocuments(res.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user?.role]);

  const filteredDocs = documents.filter((doc) => {
    if (filter === 'pending') {
      return doc.status === 'Pending Review' || doc.status === 'Under Review' || doc.status === 'Uploaded';
    }
    if (filter === 'approved') return doc.status === 'Approved';
    if (filter === 'changes') return doc.status === 'Changes Requested';
    return true;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance Review Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            {user?.role === 'reviewer'
              ? 'Documents assigned directly to you for formal verification and approval'
              : 'Organization verification queue and status tracking'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'pending'
                ? 'bg-amber-100 text-amber-800'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilter('changes')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'changes'
                ? 'bg-indigo-100 text-indigo-800'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Changes Requested
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'approved'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({documents.length})
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading review queue...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Queue is Clear</h4>
            <p className="text-xs text-slate-400 mt-1">No documents matching this filter status.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDocs.map((doc) => (
              <div
                key={doc._id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div
                  onClick={() => onSelectDocument(doc._id)}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                      {doc.title}
                    </span>
                    <CategoryBadge category={doc.category} />
                    <StatusBadge status={doc.status} />
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                      v{doc.currentVersion}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                    <span>Uploaded by: <strong className="text-slate-700">{doc.uploaderName || 'Procurement'}</strong></span>
                    <span>•</span>
                    <span>Reviewer: <strong className="text-slate-700">{doc.reviewerName || 'Unassigned'}</strong></span>
                    {doc.expiryDate && (
                      <>
                        <span>•</span>
                        <span>Expires: <strong className="text-slate-700">{doc.expiryDate}</strong></span>
                      </>
                    )}
                  </div>

                  {doc.reviewerComments && (
                    <p className="mt-2 text-xs text-indigo-700 bg-indigo-50/60 p-2 rounded-lg border border-indigo-100 max-w-2xl">
                      <strong>Last Feedback:</strong> &ldquo;{doc.reviewerComments}&rdquo;
                    </p>
                  )}
                </div>

                {/* Quick Decision Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectDocument(doc._id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>

                  {(user?.role === 'reviewer' || user?.role === 'admin') && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedDocForReview(doc);
                          setReviewAction('approve');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDocForReview(doc);
                          setReviewAction('changes');
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Request Changes</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDocForReview && (
        <ReviewActionModal
          isOpen={Boolean(selectedDocForReview)}
          onClose={() => setSelectedDocForReview(null)}
          documentId={selectedDocForReview._id}
          documentTitle={selectedDocForReview.title}
          initialAction={reviewAction}
          onSuccess={fetchReviews}
        />
      )}
    </div>
  );
};

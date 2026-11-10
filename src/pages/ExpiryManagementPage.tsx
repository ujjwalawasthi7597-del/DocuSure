import React, { useState, useEffect } from 'react';
import { IDocument } from '../types';
import { documentsApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  CalendarClock,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Eye,
  Bell,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface Props {
  onSelectDocument: (docId: string) => void;
}

export const ExpiryManagementPage: React.FC<Props> = ({ onSelectDocument }) => {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [filter, setFilter] = useState<'all' | 'expired' | '7days' | '30days' | 'no_expiry'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await documentsApi.getDocuments();
      setDocuments(res.documents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const now = new Date();

  // Categorize documents by expiry status
  const expiredDocs: IDocument[] = [];
  const within7DaysDocs: IDocument[] = [];
  const within30DaysDocs: IDocument[] = [];
  const noExpiryDocs: IDocument[] = [];

  documents.forEach((doc) => {
    if (!doc.expiryDate) {
      noExpiryDocs.push(doc);
      return;
    }
    const exp = new Date(doc.expiryDate);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) {
      expiredDocs.push(doc);
    } else if (diffDays <= 7) {
      within7DaysDocs.push(doc);
    } else if (diffDays <= 30) {
      within30DaysDocs.push(doc);
    }
  });

  const getFilteredDocs = () => {
    if (filter === 'expired') return expiredDocs;
    if (filter === '7days') return within7DaysDocs;
    if (filter === '30days') return within30DaysDocs;
    if (filter === 'no_expiry') return noExpiryDocs;
    return documents.filter((d) => d.expiryDate);
  };

  const displayedDocs = getFilteredDocs();

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expiry &amp; Renewal Tracker</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor certificate expiration schedules, contract renewal windows, and prevent compliance lapses
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setFilter('expired')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filter === 'expired'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase">Expired</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-rose-950">{expiredDocs.length}</p>
          <span className="text-[10px] text-rose-600 font-medium">Critical attention</span>
        </div>

        <div
          onClick={() => setFilter('7days')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filter === '7days'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase">&le; 7 Days</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-amber-950">{within7DaysDocs.length}</p>
          <span className="text-[10px] text-amber-600 font-medium">Urgent renewal</span>
        </div>

        <div
          onClick={() => setFilter('30days')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filter === '30days'
              ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-500/20'
              : 'bg-white border-slate-200 hover:border-yellow-200'
          }`}
        >
          <div className="flex items-center justify-between text-yellow-600 mb-1">
            <span className="text-[11px] font-bold uppercase">&le; 30 Days</span>
            <CalendarClock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-yellow-950">{within30DaysDocs.length}</p>
          <span className="text-[10px] text-yellow-700 font-medium">Upcoming cycle</span>
        </div>

        <div
          onClick={() => setFilter('no_expiry')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filter === 'no_expiry'
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-500/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">No Expiry Date</span>
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{noExpiryDocs.length}</p>
          <span className="text-[10px] text-slate-400 font-medium">Perpetual / ongoing</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg border ${
              filter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Scheduled Documents
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 py-1.5 rounded-lg border ${
              filter === 'expired'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Expired ({expiredDocs.length})
          </button>
          <button
            onClick={() => setFilter('7days')}
            className={`px-3 py-1.5 rounded-lg border ${
              filter === '7days'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Expiring &le; 7 Days ({within7DaysDocs.length})
          </button>
          <button
            onClick={() => setFilter('30days')}
            className={`px-3 py-1.5 rounded-lg border ${
              filter === '30days'
                ? 'bg-yellow-600 text-white border-yellow-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Expiring &le; 30 Days ({within30DaysDocs.length})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {displayedDocs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No documents matching the selected expiry criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedDocs.map((doc) => {
              let diffDays = 0;
              let isExpired = false;
              if (doc.expiryDate) {
                const exp = new Date(doc.expiryDate);
                diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
                isExpired = diffDays < 0;
              }

              return (
                <div
                  key={doc._id}
                  onClick={() => onSelectDocument(doc._id)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{doc.title}</span>
                      <CategoryBadge category={doc.category} />
                      <StatusBadge status={doc.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                      <span>Uploaded by: <strong className="text-slate-700">{doc.uploaderName || 'Procurement'}</strong></span>
                      <span>•</span>
                      <span>
                        Expiry Date: <strong className="text-slate-800">{doc.expiryDate || 'No Expiry'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {doc.expiryDate && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          isExpired
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : diffDays <= 7
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                        }`}
                      >
                        {isExpired ? `EXPIRED (${Math.abs(diffDays)}d ago)` : `In ${diffDays} days`}
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDocument(doc._id);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

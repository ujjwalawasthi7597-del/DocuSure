import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IDocument, DocumentCategory, DocumentStatus } from '../types';
import { documentsApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  FileText,
  Search,
  Filter,
  Upload,
  Calendar,
  Sparkles,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  CalendarClock,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

interface Props {
  onOpenUpload: () => void;
  onSelectDocument: (docId: string) => void;
  searchFilter: string;
}

const CATEGORIES: (DocumentCategory | 'all')[] = [
  'all',
  'Contracts',
  'Invoices',
  'Compliance Certificates',
  'Business Agreements',
  'Identity Documents',
  'Tax Documents',
  'Licenses',
  'Other',
];

const STATUSES: (DocumentStatus | 'all')[] = [
  'all',
  'Pending Review',
  'Under Review',
  'Approved',
  'Changes Requested',
  'Rejected',
  'Uploaded',
];

export const DocumentsPage: React.FC<Props> = ({
  onOpenUpload,
  onSelectDocument,
  searchFilter,
}) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>(searchFilter);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await documentsApi.getDocuments({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        expiryFilter: expiryFilter !== 'all' ? expiryFilter : undefined,
        search: localSearch || undefined,
      });
      setDocuments(data.documents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setLocalSearch(searchFilter);
  }, [searchFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [categoryFilter, statusFilter, expiryFilter, localSearch]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this document and its compliance records?')) {
      return;
    }
    try {
      await documentsApi.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleDownload = (e: React.MouseEvent, doc: IDocument) => {
    e.stopPropagation();
    const downloadUrl = documentsApi.getDownloadUrl(doc._id);
    const token = localStorage.getItem('docusure_token');
    
    // Trigger download with token header via fetch & blob
    fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => console.error('Download error:', err));
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Document Library</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise document archive with automated Gemini intelligence extraction and multi-stage verification
          </p>
        </div>
        <button
          onClick={onOpenUpload}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.filter((c) => c !== 'all').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              {STATUSES.filter((s) => s !== 'all').map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Expiry Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Expiry:</span>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Expirations</option>
              <option value="expired">Expired Only</option>
              <option value="7days">Expiring &le; 7 Days</option>
              <option value="30days">Expiring &le; 30 Days</option>
              <option value="no_expiry">No Expiry Date</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="font-bold text-slate-700">{documents.length}</span> documents
        </div>
      </div>

      {/* Documents Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No documents found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No matching documents for the current search or filters. Try adjusting filters or upload a new document.
            </p>
            <button
              onClick={onOpenUpload}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
            >
              Upload Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {documents.map((doc) => {
                  let expiryLabel: React.ReactNode = <span className="text-slate-400">N/A</span>;
                  if (doc.expiryDate) {
                    const now = new Date();
                    const exp = new Date(doc.expiryDate);
                    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
                    if (diffDays < 0) {
                      expiryLabel = (
                        <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Expired
                        </span>
                      );
                    } else if (diffDays <= 7) {
                      expiryLabel = (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {diffDays}d left
                        </span>
                      );
                    } else if (diffDays <= 30) {
                      expiryLabel = (
                        <span className="text-yellow-700 font-medium bg-yellow-50 px-2 py-0.5 rounded">
                          {diffDays}d left
                        </span>
                      );
                    } else {
                      expiryLabel = <span className="text-slate-600 font-medium">{doc.expiryDate}</span>;
                    }
                  }

                  return (
                    <tr
                      key={doc._id}
                      onClick={() => onSelectDocument(doc._id)}
                      className="hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-2.5 max-w-xs md:max-w-md">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-slate-800 truncate">{doc.title}</p>
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex gap-1 mt-0.5">
                                {doc.tags.slice(0, 2).map((t) => (
                                  <span key={t} className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <CategoryBadge category={doc.category} />
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <p className="font-medium text-slate-800">{doc.uploaderName || 'Procurement'}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {doc.reviewerName ? (
                          <span className="font-medium text-slate-700">{doc.reviewerName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">{expiryLabel}</td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={doc.status} />
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          <Layers className="w-3 h-3 text-slate-400" />
                          v{doc.currentVersion}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectDocument(doc._id)}
                            title="Inspect & AI Findings"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDownload(e, doc)}
                            title="Download Document"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              onClick={(e) => handleDelete(e, doc._id)}
                              title="Delete Document"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

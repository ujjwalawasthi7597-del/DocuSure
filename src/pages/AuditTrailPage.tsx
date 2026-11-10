import React, { useState, useEffect } from 'react';
import { IAuditLog } from '../types';
import { auditApi } from '../services/api';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  FileText,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Props {
  onSelectDocument: (docId: string) => void;
}

export const AuditTrailPage: React.FC<Props> = ({ onSelectDocument }) => {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await auditApi.getAuditLogs(150);
      setLogs(res.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      (log.documentTitle && log.documentTitle.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Governance &amp; Regulatory Compliance</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Audit Trail</h1>
        <p className="text-xs text-slate-500 mt-1">
          Chronological, tamper-evident log of all document mutations, access events, reviewer sign-offs, and automated AI verifications
        </p>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, user, or document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Total Recorded Events: <span className="font-bold text-slate-700">{filtered.length}</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No matching audit events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Document Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{log.userName}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">{log.userRole}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 max-w-md">
                      {log.description}
                    </td>

                    <td className="py-3 px-4">
                      {log.documentId ? (
                        <button
                          onClick={() => onSelectDocument(log.documentId!)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 text-left"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[200px]">{log.documentTitle || log.documentId}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Organization System</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

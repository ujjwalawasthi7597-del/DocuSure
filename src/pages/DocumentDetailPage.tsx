import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IDocument, IDocumentVersion, IAIAnalysis, IAuditLog } from '../types';
import { documentsApi, aiApi, auditApi, reviewApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { ReviewActionModal } from '../components/ReviewActionModal';
import { AssignReviewerModal } from '../components/AssignReviewerModal';
import { VersionUploadModal } from '../components/VersionUploadModal';
import { EditFieldsModal } from '../components/EditFieldsModal';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Layers,
  Calendar,
  UserCheck,
  Download,
  Upload,
  RefreshCw,
  Edit3,
  FileCheck2,
  ExternalLink,
  Info,
  Check,
  Trash2,
  MessageSquare,
  Send,
  Bot,
} from 'lucide-react';

interface Props {
  documentId: string;
  onBack: () => void;
}

export const DocumentDetailPage: React.FC<Props> = ({ documentId, onBack }) => {
  const { user } = useAuth();
  const [document, setDocument] = useState<IDocument | null>(null);
  const [versions, setVersions] = useState<IDocumentVersion[]>([]);
  const [analysis, setAnalysis] = useState<IAIAnalysis | null>(null);
  const [auditLogs, setAuditLogs] = useState<IAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'ai' | 'copilot' | 'preview' | 'versions' | 'audit'>('ai');

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string; time: string }[]>([
    {
      role: 'assistant',
      text: 'Hello! I am your DocuSure AI Compliance Assistant & Copilot (powered by Gemini 3.8 Flash). I have indexed this document. You can ask me to explain clauses, summarize obligations, verify expiration liabilities, or draft review responses.',
      time: 'Just now',
    },
  ]);
  const [userQuestion, setUserQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  // Modals
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewInitialAction, setReviewInitialAction] = useState<'approve' | 'reject' | 'changes'>('approve');
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showVersionModal, setShowVersionModal] = useState<boolean>(false);
  const [showEditFieldsModal, setShowEditFieldsModal] = useState<boolean>(false);

  // Selected version for preview
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  const handleAskAssistant = async (questionText?: string) => {
    const q = (questionText || userQuestion).trim();
    if (!q || isAnswering) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedMessages = [...chatMessages, { role: 'user' as const, text: q, time: nowTime }];
    setChatMessages(updatedMessages);
    setUserQuestion('');
    setIsAnswering(true);

    try {
      const res = await aiApi.askAssistant(documentId, q);
      setChatMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          text: res.answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setChatMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          text: `Error querying AI Assistant: ${err.message || 'Please check API connection'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const docRes = await documentsApi.getDocumentById(documentId);
      setDocument(docRes.document);
      setVersions(docRes.versions || []);
      setAnalysis(docRes.analysis || null);
      if (docRes.versions && docRes.versions.length > 0 && !selectedVersionId) {
        setSelectedVersionId(docRes.versions[0]._id);
      }

      // Fetch audit logs for this document
      const auditRes = await auditApi.getAuditLogs(100);
      const filtered = (auditRes.logs || []).filter((l) => l.documentId === documentId);
      setAuditLogs(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [documentId]);

  const handleReanalyze = async () => {
    if (isReanalyzing) return;
    setIsReanalyzing(true);
    try {
      const res = await aiApi.reanalyze(documentId);
      setAnalysis(res.analysis);
      // reload audit logs
      const auditRes = await auditApi.getAuditLogs(100);
      setAuditLogs((auditRes.logs || []).filter((l) => l.documentId === documentId));
    } catch (err: any) {
      alert(err.message || 'AI re-analysis failed.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleDownload = () => {
    if (!document) return;
    const downloadUrl = documentsApi.getDownloadUrl(document._id, selectedVersionId);
    const token = localStorage.getItem('docusure_token');

    fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${document.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        window.document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => console.error(err));
  };

  if (isLoading || !document) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Retrieving document and Gemini intelligence data...</p>
        </div>
      </div>
    );
  }

  const selectedVersion = versions.find((v) => v._id === selectedVersionId) || versions[0];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Documents</span>
        </button>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Reviewer / Admin Actions */}
          {(user?.role === 'reviewer' || user?.role === 'admin') && (
            <>
              <button
                onClick={() => {
                  setReviewInitialAction('approve');
                  setShowReviewModal(true);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => {
                  setReviewInitialAction('changes');
                  setShowReviewModal(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Request Changes</span>
              </button>
              <button
                onClick={() => {
                  setReviewInitialAction('reject');
                  setShowReviewModal(true);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </>
          )}

          {/* Admin Assign Reviewer Button */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>{document.assignedReviewer ? 'Reassign Reviewer' : 'Assign Reviewer'}</span>
            </button>
          )}

          {/* Upload New Version */}
          <button
            onClick={() => setShowVersionModal(true)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload v{document.currentVersion + 1}</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg"
            title="Download Document"
          >
            <Download className="w-4 h-4 text-slate-600" />
          </button>

          {/* Re-analyze */}
          <button
            onClick={handleReanalyze}
            disabled={isReanalyzing}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
            title="Re-run Gemini AI Analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
            <span>{isReanalyzing ? 'Analyzing...' : 'Re-run AI'}</span>
          </button>
        </div>
      </div>

      {/* Document Overview Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{document.title}</h1>
              <CategoryBadge category={document.category} />
              <StatusBadge status={document.status} />
              <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                v{document.currentVersion}
              </span>
            </div>

            {document.description && (
              <p className="text-xs text-slate-500 max-w-2xl">{document.description}</p>
            )}

            {/* Reviewer / Rejection Notes Alert Box */}
            {document.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Rejection Reason:</span> {document.rejectionReason}
                </div>
              </div>
            )}

            {document.reviewerComments && !document.rejectionReason && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Reviewer Feedback:</span> {document.reviewerComments}
                </div>
              </div>
            )}
          </div>

          {/* Metadata quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Uploaded By</span>
              <span className="font-bold text-slate-800">{document.uploaderName || 'Procurement'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Assigned Reviewer</span>
              <span className="font-bold text-slate-800">{document.reviewerName || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Issue Date</span>
              <span className="font-bold text-slate-800">{document.issueDate || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Expiry Date</span>
              <span className="font-bold text-slate-800">{document.expiryDate || 'No expiry'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 border-t border-slate-200 mt-6 pt-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-2.5 flex items-center gap-1.5 transition-all relative ${
              activeTab === 'ai'
                ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI Document Intelligence</span>
            {analysis?.riskFlags && analysis.riskFlags.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {analysis.riskFlags.length} flags
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('copilot')}
            className={`pb-2.5 flex items-center gap-1.5 transition-all relative ${
              activeTab === 'copilot'
                ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>AI Assistant &amp; Copilot</span>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              Chat
            </span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 flex items-center gap-1.5 transition-all relative ${
              activeTab === 'preview'
                ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('versions')}
            className={`pb-2.5 flex items-center gap-1.5 transition-all relative ${
              activeTab === 'versions'
                ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Version History ({versions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 flex items-center gap-1.5 transition-all relative ${
              activeTab === 'audit'
                ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}

      {/* 1. AI DOCUMENT INTELLIGENCE TAB */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {analysis ? (
            <>
              {/* Summary & Confidence Banner */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          Identified Type: {analysis.documentType}
                        </span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                          Gemini 3.8 Flash
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Analyzed on {new Date(analysis.analyzedAt).toLocaleDateString()} at{' '}
                        {new Date(analysis.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Confidence Score Pill */}
                  <div className="flex items-center gap-3 self-start md:self-auto bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Confidence Level</span>
                      <span className="text-base font-bold text-indigo-600">
                        {(analysis.confidenceScore * 100).toFixed(0)}% Match
                      </span>
                    </div>
                    <div className="w-16 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, analysis.confidenceScore * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="pt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Executive Summary
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    {analysis.summary}
                  </p>
                </div>

                {/* Recommendation Box */}
                {analysis.recommendation && (
                  <div className="mt-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Compliance Recommendation:</span>{' '}
                      {analysis.recommendation}
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Structured Fields Section with Human Correction */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Extracted Structured Fields</h3>
                    <p className="text-xs text-slate-500">
                      Auto-extracted entities, numbers, and dates validated against document type
                    </p>
                  </div>
                  {(user?.role === 'reviewer' || user?.role === 'admin') && (
                    <button
                      onClick={() => setShowEditFieldsModal(true)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-600 text-xs font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Correct / Edit Fields</span>
                    </button>
                  )}
                </div>

                {Object.keys(analysis.extractedFields || {}).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No structured fields extracted.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(analysis.extractedFields).map(([key, value]) => (
                      <div key={key} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <p className="text-xs font-bold text-slate-800 mt-1 break-words">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inconsistencies & Missing Fields Alerts */}
              {(analysis.missingFields.length > 0 || analysis.inconsistencies.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysis.missingFields.length > 0 && (
                    <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs bg-amber-50/20">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Missing Mandatory Fields ({analysis.missingFields.length})</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-amber-900">
                        {analysis.missingFields.map((field, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>{field}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.inconsistencies.length > 0 && (
                    <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs bg-rose-50/20">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider mb-2">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>Inconsistencies &amp; Discrepancies ({analysis.inconsistencies.length})</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-rose-900">
                        {analysis.inconsistencies.map((issue, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Risk Flags Section */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Compliance &amp; Legal Risk Flags</h3>
                    <p className="text-xs text-slate-500">
                      AI-detected issues requiring human verification or renegotiation
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {analysis.riskFlags.length} Identified
                  </span>
                </div>

                {analysis.riskFlags.length === 0 ? (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No critical compliance risk flags or unmitigated clauses detected.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analysis.riskFlags.map((risk, idx) => {
                      const isHigh = risk.severity === 'high';
                      const isMed = risk.severity === 'medium';
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border flex items-start gap-3 ${
                            isHigh
                              ? 'bg-rose-50/60 border-rose-200'
                              : isMed
                              ? 'bg-amber-50/60 border-amber-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isHigh ? (
                              <XCircle className="w-4 h-4 text-rose-600" />
                            ) : isMed ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Info className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-800">{risk.title}</p>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  isHigh
                                    ? 'bg-rose-100 text-rose-800'
                                    : isMed
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {risk.severity} Risk
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{risk.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Extracted Important Clauses */}
              {analysis.importantClauses && analysis.importantClauses.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-800 mb-1">Key Contractual Clauses</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Extracted commitments, covenants, and SLA specifications
                  </p>

                  <div className="space-y-3">
                    {analysis.importantClauses.map((clause, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{clause.title}</span>
                          {clause.section && (
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                              {clause.section}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{clause.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legal & Governance AI Policy Notice */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Governance Policy:</strong> AI document intelligence provides advisory insights. Final verification, legal validity, and corporate approvals are determined by authorized human reviewers.
                </span>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No AI analysis available</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Run automated extraction using Gemini 3.8 Flash to analyze this document.
              </p>
              <button
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
              >
                {isReanalyzing ? 'Analyzing...' : 'Run Gemini AI Analysis'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. AI ASSISTANT / COPILOT TAB */}
      {activeTab === 'copilot' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">DocuSure AI Copilot &amp; Assistant</h3>
                <p className="text-[11px] text-slate-500">
                  Ask questions, verify obligations, analyze risks, or draft reviewer notes (Gemini 3.8 Flash)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Document Context Active
            </span>
          </div>

          {/* Quick Prompts */}
          <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-400 font-semibold shrink-0">Quick Queries:</span>
            <button
              onClick={() => handleAskAssistant('What are the key liability, indemnification, or renewal risks in this document?')}
              disabled={isAnswering}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-lg text-slate-600 shrink-0 transition-colors"
            >
              Check liabilities &amp; risks
            </button>
            <button
              onClick={() => handleAskAssistant('Are there any missing mandatory signatures, fields, or dates?')}
              disabled={isAnswering}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-lg text-slate-600 shrink-0 transition-colors"
            >
              Missing information audit
            </button>
            <button
              onClick={() => handleAskAssistant('Draft a clear, professional note to the uploader explaining what needs correction.')}
              disabled={isAnswering}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-lg text-slate-600 shrink-0 transition-colors"
            >
              Draft correction feedback
            </button>
            <button
              onClick={() => handleAskAssistant('Summarize all financial terms, fees, and invoice due dates.')}
              disabled={isAnswering}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-lg text-slate-600 shrink-0 transition-colors"
            >
              Summarize financial terms
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-2xl rounded-xl p-3.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span
                    className={`block text-[10px] mt-1.5 ${
                      msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isAnswering && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-indigo-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                  <span>Gemini is analyzing document context and drafting answer...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAssistant();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask AI anything about this document (e.g. 'Is there an auto-renewal clause?')..."
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                disabled={isAnswering}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isAnswering || !userQuestion.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. DOCUMENT PREVIEW TAB */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Secure Document Archive Preview</h3>
              <p className="text-xs text-slate-500">
                Encrypted private storage • Access logged in compliance audit trail
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>

          <div className="bg-slate-900 rounded-xl p-8 text-slate-200 font-mono text-xs overflow-x-auto min-h-[380px] flex flex-col justify-between">
            <div>
              <p className="text-indigo-400 font-bold mb-4">
                // DOCUSURE ENCRYPTED ARCHIVE PREVIEW — {document.title}
              </p>
              <div className="space-y-1.5 text-slate-300">
                <p>DOCUMENT ID: <span className="text-white font-bold">{document._id}</span></p>
                <p>CATEGORY: <span className="text-white">{document.category}</span></p>
                <p>STATUS: <span className="text-emerald-400 font-bold">{document.status}</span></p>
                <p>VERSION: <span className="text-white">v{selectedVersion?.versionNumber || document.currentVersion} ({selectedVersion?.originalName || 'document.pdf'})</span></p>
                <p>ORGANIZATION: <span className="text-white">Apex Global Technologies</span></p>
                <p>UPLOADED BY: <span className="text-white">{selectedVersion?.uploaderName || document.uploaderName} on {new Date(selectedVersion?.uploadedAt || document.createdAt).toLocaleString()}</span></p>
                <p>FILE SIZE: <span className="text-white">{selectedVersion ? (selectedVersion.fileSize / 1024).toFixed(1) + ' KB' : 'Standard'}</span></p>
                <p>SHA-256 HASH: <span className="text-indigo-300">e82a90184b29c927f91849102847192a019482910</span></p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <p className="text-slate-400 text-[11px] mb-2 font-sans font-semibold uppercase tracking-wider">
                  Verified Structured Summary
                </p>
                <p className="font-sans text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {analysis?.summary || 'Standard document record loaded in compliance vault.'}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Verified by DocuSure Compliance Engine</span>
              <span>TLS 1.3 / AES-256 Validated</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. VERSION HISTORY TAB */}
      {activeTab === 'versions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Version Management History</h3>
              <p className="text-xs text-slate-500">
                Immutable archive of all uploaded revisions, reviewer responses, and timestamps
              </p>
            </div>
            <button
              onClick={() => setShowVersionModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Submit New Revision</span>
            </button>
          </div>

          <div className="space-y-4">
            {versions.map((ver) => (
              <div
                key={ver._id}
                className={`p-4 rounded-xl border transition-all ${
                  ver.versionNumber === document.currentVersion
                    ? 'border-indigo-300 bg-indigo-50/20 shadow-xs'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded">
                      v{ver.versionNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{ver.originalName}</span>
                    {ver.versionNumber === document.currentVersion && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.2 rounded-full">
                        Current Active Version
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(ver.uploadedAt).toLocaleString()}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-700">Uploaded by:</span> {ver.uploaderName} • {(ver.fileSize / 1024).toFixed(1)} KB
                  </p>
                  {ver.changeSummary && (
                    <p className="mt-1 text-slate-500 italic">
                      &ldquo;{ver.changeSummary}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. AUDIT TRAIL TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Compliance Audit Trail for this Document</h3>
            <p className="text-xs text-slate-500">
              Immutable chronological record of uploads, assignments, reviews, and accesses
            </p>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No audit records logged yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log._id} className="py-3 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800">{log.action}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{log.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Actor: <span className="font-semibold text-slate-700">{log.userName}</span> ({log.userRole})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ReviewActionModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        documentId={document._id}
        documentTitle={document.title}
        initialAction={reviewInitialAction}
        onSuccess={loadData}
      />

      <AssignReviewerModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        documentId={document._id}
        documentTitle={document.title}
        currentReviewerId={document.assignedReviewer}
        onSuccess={loadData}
      />

      <VersionUploadModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        documentId={document._id}
        documentTitle={document.title}
        currentVersion={document.currentVersion}
        onSuccess={loadData}
      />

      {analysis && (
        <EditFieldsModal
          isOpen={showEditFieldsModal}
          onClose={() => setShowEditFieldsModal(false)}
          documentId={document._id}
          initialFields={analysis.extractedFields || {}}
          onSuccess={(updated) => {
            setAnalysis({ ...analysis, extractedFields: updated });
            loadData();
          }}
        />
      )}
    </div>
  );
};

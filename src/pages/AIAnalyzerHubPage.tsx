import React, { useState, useEffect } from 'react';
import { IDocument, IAIAnalysis } from '../types';
import { documentsApi, aiApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  UploadCloud,
  ChevronRight,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface Props {
  onOpenUpload: () => void;
  onSelectDocument: (docId: string) => void;
}

export const AIAnalyzerHubPage: React.FC<Props> = ({ onOpenUpload, onSelectDocument }) => {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [analysis, setAnalysis] = useState<IAIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  useEffect(() => {
    documentsApi
      .getDocuments()
      .then((res) => {
        const docs = res.documents || [];
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDocId(docs[0]._id);
          loadAnalysis(docs[0]._id);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const loadAnalysis = async (docId: string) => {
    try {
      const res = await documentsApi.getDocumentById(docId);
      setAnalysis(res.analysis || null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectDoc = (id: string) => {
    setSelectedDocId(id);
    loadAnalysis(id);
  };

  const handleReanalyze = async () => {
    if (!selectedDocId || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const res = await aiApi.reanalyze(selectedDocId);
      setAnalysis(res.analysis);
    } catch (e: any) {
      alert(e.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeDoc = documents.find((d) => d._id === selectedDocId);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Gemini 3.8 Flash Multimodal Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Document Intelligence Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated structured field extraction, clause risk scoring, inconsistency detection, and missing field analysis
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New for Analysis</span>
        </button>
      </div>

      {/* Main Split Layout: Document Selector on Left, AI Deep Dive on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Selector Column */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col h-[750px]">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Analyzed Repository ({documents.length})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {documents.map((doc) => {
              const isSelected = doc._id === selectedDocId;
              return (
                <div
                  key={doc._id}
                  onClick={() => handleSelectDoc(doc._id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <CategoryBadge category={doc.category} />
                    <StatusBadge status={doc.status} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Intelligence Report */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs h-[750px] overflow-y-auto space-y-6">
          {activeDoc && analysis ? (
            <>
              {/* Header inside report */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{activeDoc.title}</h2>
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                      {analysis.documentType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Document Category: {activeDoc.category} • Version: v{activeDoc.currentVersion}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectDocument(activeDoc._id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open Workspace</span>
                  </button>
                  <button
                    onClick={handleReanalyze}
                    disabled={isAnalyzing}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzing ? 'Re-analyzing...' : 'Re-run Gemini'}</span>
                  </button>
                </div>
              </div>

              {/* Confidence & Recommendation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Confidence Assessment</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xl font-bold text-indigo-600">
                      {(analysis.confidenceScore * 100).toFixed(0)}% Score
                    </span>
                    <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, analysis.confidenceScore * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
                  <span className="text-[10px] text-blue-700 uppercase font-bold block mb-1">
                    Compliance Recommendation
                  </span>
                  <p>{analysis.recommendation}</p>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Automated Extraction Summary
                </h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>

              {/* Extracted Fields */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Extracted Structured Entities
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.entries(analysis.extractedFields || {}).map(([key, val]) => (
                    <div key={key} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block truncate capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Flags */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Risk &amp; Vulnerability Flags ({analysis.riskFlags?.length || 0})
                </h4>
                {(!analysis.riskFlags || analysis.riskFlags.length === 0) ? (
                  <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    No active compliance risk flags detected.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {analysis.riskFlags.map((risk, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
                          risk.severity === 'high'
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : risk.severity === 'medium'
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">{risk.title}</p>
                          <p className="text-[11px] mt-0.5 opacity-90">{risk.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Sparkles className="w-10 h-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Select a Document</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Choose a document from the left panel or upload a new file to run full Gemini intelligence analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

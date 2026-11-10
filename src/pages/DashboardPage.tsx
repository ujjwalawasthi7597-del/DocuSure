import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  CalendarClock,
  Users,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  Upload,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Props {
  onOpenUpload: () => void;
  onSelectDocument: (docId: string) => void;
  onNavigateTab: (tab: string) => void;
}

const PIE_COLORS = ['#6366F1', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#64748B'];

export const DashboardPage: React.FC<Props> = ({
  onOpenUpload,
  onSelectDocument,
  onNavigateTab,
}) => {
  const { user, organization } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      if (user?.role === 'admin') {
        const res = await dashboardApi.getAdminDashboard();
        setData(res);
      } else if (user?.role === 'reviewer') {
        const res = await dashboardApi.getReviewerDashboard();
        setData(res);
      } else {
        const res = await dashboardApi.getUploaderDashboard();
        setData(res);
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Aggregating compliance analytics...</p>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  if (user?.role === 'admin') {
    const { metrics, charts, recentActivity, expiringDocs } = data || {};

    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance &amp; Governance Center</h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time audit telemetry, AI verification metrics, and lifecycle tracking for {organization?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('expiry')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-2"
            >
              <CalendarClock className="w-4 h-4 text-amber-500" />
              <span>Expiry Alerts ({metrics?.expiring30Days || 0})</span>
            </button>
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Docs</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{metrics?.totalDocuments || 0}</p>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> Active repository
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
            <div className="flex items-center justify-between text-amber-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Pending</span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-amber-900">{metrics?.pendingReviews || 0}</p>
            <span className="text-[10px] text-amber-600 font-medium mt-1 block">Awaiting reviewer</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between text-emerald-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Approved</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-emerald-900">{metrics?.approved || 0}</p>
            <span className="text-[10px] text-emerald-600 font-medium mt-1 block">Verified &amp; compliant</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs">
            <div className="flex items-center justify-between text-indigo-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">Changes</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-indigo-900">{metrics?.changesRequested || 0}</p>
            <span className="text-[10px] text-indigo-600 font-medium mt-1 block">Corrections needed</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between text-rose-500 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Rejected</span>
              <XCircle className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-rose-900">{metrics?.rejected || 0}</p>
            <span className="text-[10px] text-rose-600 font-medium mt-1 block">Non-compliant</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Expiring</span>
              <CalendarClock className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-amber-900">{metrics?.expiring30Days || 0}</p>
            <span className="text-[10px] text-amber-700 font-medium mt-1 block">&le; 30 days renewal</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Team Users</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{metrics?.totalUsers || 0}</p>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">Active members</span>
          </div>
        </div>

        {/* Interactive Recharts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Document Uploads & Verification Velocity */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Document Volume &amp; Verification Trend</h3>
                <p className="text-xs text-slate-500">Monthly upload frequency vs completed compliance checks</p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Gemini Automated
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts?.uploadTrends || []}>
                  <defs>
                    <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="uploads"
                    name="Uploaded"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUploads)"
                  />
                  <Area
                    type="monotone"
                    dataKey="verified"
                    name="Verified"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVerified)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Category Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
            <h3 className="text-sm font-bold text-slate-800">Documents by Category</h3>
            <p className="text-xs text-slate-500 mb-2">Portfolio classification breakdown</p>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.categoryData || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {(charts?.categoryData || []).map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-1.5 pt-2 text-[11px] text-slate-600">
              {(charts?.categoryData || []).slice(0, 6).map((c: any, i: number) => (
                <div key={c.name} className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  ></span>
                  <span className="truncate">{c.name}: {c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity & Upcoming Expiry Two-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Expiry Alert Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800">Critical Expirations &amp; Renewals</h3>
              </div>
              <button
                onClick={() => onNavigateTab('expiry')}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {(!expiringDocs || expiringDocs.length === 0) ? (
                <p className="text-xs text-slate-400 py-4 text-center">No documents currently approaching expiration.</p>
              ) : (
                expiringDocs.map((doc: any) => {
                  const now = new Date();
                  const expDate = new Date(doc.expiryDate);
                  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                  const isExpired = diffDays < 0;

                  return (
                    <div
                      key={doc._id}
                      onClick={() => onSelectDocument(doc._id)}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 rounded-lg px-2 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-bold text-slate-800 truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <CategoryBadge category={doc.category} />
                          <span className="text-[10px] text-slate-400">Expires: {doc.expiryDate}</span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          isExpired
                            ? 'bg-rose-100 text-rose-700'
                            : diffDays <= 7
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-yellow-50 text-yellow-800'
                        }`}
                      >
                        {isExpired ? 'EXPIRED' : `${diffDays} days left`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Audit Activity */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">Compliance Audit Log Activity</h3>
              </div>
              <button
                onClick={() => onNavigateTab('audit')}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Audit trail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {(!recentActivity || recentActivity.length === 0) ? (
                <p className="text-xs text-slate-400 py-4 text-center">No audit records recorded yet.</p>
              ) : (
                recentActivity.map((log: any) => (
                  <div key={log._id} className="py-2.5 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800">{log.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-600">{log.userName} ({log.userRole})</span>
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- REVIEWER DASHBOARD ---
  if (user?.role === 'reviewer') {
    const { metrics, assignedDocuments, unassignedPending } = data || {};

    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reviewer Workspace</h1>
            <p className="text-xs text-slate-500 mt-1">
              Verify extracted data, inspect AI risk flags, and issue formal compliance decisions
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('reviews')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Open Review Queue
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">Assigned to Me</span>
            <p className="text-2xl font-bold text-slate-900">{metrics?.totalAssigned || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20">
            <span className="text-[11px] font-semibold uppercase text-amber-700 block mb-1">Awaiting Review</span>
            <p className="text-2xl font-bold text-amber-900">{metrics?.pendingAction || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20">
            <span className="text-[11px] font-semibold uppercase text-emerald-700 block mb-1">Approved by Me</span>
            <p className="text-2xl font-bold text-emerald-900">{metrics?.approvedCount || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20">
            <span className="text-[11px] font-semibold uppercase text-indigo-700 block mb-1">Changes Requested</span>
            <p className="text-2xl font-bold text-indigo-900">{metrics?.changesRequestedCount || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20">
            <span className="text-[11px] font-semibold uppercase text-rose-700 block mb-1">Rejected</span>
            <p className="text-2xl font-bold text-rose-900">{metrics?.rejectedCount || 0}</p>
          </div>
        </div>

        {/* Assigned Documents Ready for Review */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">My Assigned Documents</h3>
          <div className="divide-y divide-slate-100">
            {(!assignedDocuments || assignedDocuments.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No documents currently assigned to you.</p>
            ) : (
              assignedDocuments.map((doc: any) => (
                <div
                  key={doc._id}
                  onClick={() => onSelectDocument(doc._id)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-3 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{doc.title}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">v{doc.currentVersion}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={doc.category} />
                      <span className="text-[11px] text-slate-400">Uploaded by {doc.uploaderName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={doc.status} />
                    <button className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md transition-colors">
                      Inspect &amp; Verify
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- UPLOADER DASHBOARD ---
  const { metrics, recentUploads, actionRequiredList } = data || {};

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Document Uploader Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit files for automated Gemini verification, track review approvals, and upload revised versions
          </p>
        </div>
        <button
          onClick={onOpenUpload}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Document</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">My Uploads</span>
          <p className="text-2xl font-bold text-slate-900">{metrics?.totalUploaded || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20">
          <span className="text-[11px] font-semibold uppercase text-amber-700 block mb-1">Under Review</span>
          <p className="text-2xl font-bold text-amber-900">{metrics?.pendingCount || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20">
          <span className="text-[11px] font-semibold uppercase text-indigo-700 block mb-1">Corrections Needed</span>
          <p className="text-2xl font-bold text-indigo-900">{metrics?.actionRequiredCount || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20">
          <span className="text-[11px] font-semibold uppercase text-emerald-700 block mb-1">Approved</span>
          <p className="text-2xl font-bold text-emerald-900">{metrics?.approvedCount || 0}</p>
        </div>
      </div>

      {/* Action Required Banner if changes requested */}
      {actionRequiredList && actionRequiredList.length > 0 && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-2">
            <AlertTriangle className="w-4 h-4 text-indigo-600" />
            <span>Action Required: Reviewer requested corrections on {actionRequiredList.length} document(s)</span>
          </div>
          <div className="space-y-2">
            {actionRequiredList.map((doc: any) => (
              <div
                key={doc._id}
                onClick={() => onSelectDocument(doc._id)}
                className="bg-white p-3 rounded-lg border border-indigo-100 flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{doc.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Feedback: &ldquo;{doc.reviewerComments || 'Please provide corrected version'}&rdquo;
                  </p>
                </div>
                <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md">
                  Upload Revision
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Recent Submissions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-4">My Submitted Documents</h3>
        <div className="divide-y divide-slate-100">
          {(!recentUploads || recentUploads.length === 0) ? (
            <p className="text-xs text-slate-400 py-6 text-center">No documents uploaded yet.</p>
          ) : (
            recentUploads.map((doc: any) => (
              <div
                key={doc._id}
                onClick={() => onSelectDocument(doc._id)}
                className="py-3 flex items-center justify-between hover:bg-slate-50 px-3 rounded-lg cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-4">
                  <p className="text-xs font-bold text-slate-800 truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CategoryBadge category={doc.category} />
                    <span className="text-[11px] text-slate-400">
                      Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={doc.status} />
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

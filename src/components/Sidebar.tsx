import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  LayoutDashboard,
  FileText,
  Sparkles,
  ClipboardCheck,
  CalendarClock,
  History,
  Users,
  Building2,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingReviewCount?: number;
  expiringCount?: number;
}

export const Sidebar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  pendingReviewCount = 0,
  expiringCount = 0,
}) => {
  const { user, organization, logout } = useAuth();

  const roleBadge = () => {
    switch (user?.role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Admin</span>;
      case 'reviewer':
        return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Reviewer</span>;
      case 'uploader':
      default:
        return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Uploader</span>;
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'reviewer', 'uploader'],
    },
    {
      id: 'documents',
      label: 'Document Library',
      icon: FileText,
      roles: ['admin', 'reviewer', 'uploader'],
    },
    {
      id: 'reviews',
      label: user?.role === 'uploader' ? 'Review Status' : 'Review Queue',
      icon: ClipboardCheck,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
      roles: ['admin', 'reviewer', 'uploader'],
    },
    {
      id: 'ai-analyzer',
      label: 'AI Document Intelligence',
      icon: Sparkles,
      highlight: true,
      roles: ['admin', 'reviewer', 'uploader'],
    },
    {
      id: 'expiry',
      label: 'Expiry Management',
      icon: CalendarClock,
      badge: expiringCount > 0 ? expiringCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
      roles: ['admin', 'reviewer', 'uploader'],
    },
    {
      id: 'audit',
      label: 'Compliance Audit Trail',
      icon: History,
      roles: ['admin'],
    },
    {
      id: 'team',
      label: 'Team & Organization',
      icon: Users,
      roles: ['admin'],
    },
  ];

  const visibleNav = navItems.filter((item) => !item.roles || item.roles.includes(user?.role || 'uploader'));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <ShieldCheck className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">DocuSure</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold px-1.5 py-0.2 rounded">
                AI Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Verification & Compliance</p>
          </div>
        </div>

        {/* Organization Card */}
        <div className="mt-4 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {organization?.name || 'Apex Global Technologies'}
              </p>
              <p className="text-[10px] text-slate-400">Enterprise Standard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Workspace Navigation
        </div>

        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-white'
                      : item.highlight
                      ? 'text-indigo-400 group-hover:text-indigo-300'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeColor || (isActive ? 'bg-indigo-800 text-white' : 'bg-slate-700 text-slate-300')
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90">
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {roleBadge()}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

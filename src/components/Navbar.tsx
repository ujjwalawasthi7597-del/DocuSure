import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { INotification, UserRole } from '../types';
import { notificationsApi } from '../services/api';
import {
  Bell,
  Search,
  Upload,
  Check,
  CheckCheck,
  AlertCircle,
  FileCheck,
  Clock,
  Sparkles,
  ChevronDown,
  UserCheck,
} from 'lucide-react';

interface Props {
  onOpenUpload: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectDocument?: (docId: string) => void;
}

export const Navbar: React.FC<Props> = ({
  onOpenUpload,
  searchQuery,
  onSearchChange,
  onSelectDocument,
}) => {
  const { user, organization, quickSwitchRole } = useAuth();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [switchingRole, setSwitchingRole] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      // ignore silently
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [user?._id]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, docId?: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (docId && onSelectDocument) {
        setShowNotifications(false);
        onSelectDocument(docId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === user?.role || switchingRole) return;
    setSwitchingRole(true);
    try {
      await quickSwitchRole(newRole);
    } finally {
      setSwitchingRole(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents, entities, clauses, tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 placeholder-slate-400 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Center/Right Action Bar */}
      <div className="flex items-center gap-3.5">
        {/* Instant Role Switcher Bar */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-lg border border-slate-200 text-xs font-medium">
          <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            Switch View:
          </span>
          <button
            onClick={() => handleRoleChange('admin')}
            disabled={switchingRole}
            className={`px-2.5 py-1 rounded-md transition-all ${
              user?.role === 'admin'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => handleRoleChange('reviewer')}
            disabled={switchingRole}
            className={`px-2.5 py-1 rounded-md transition-all ${
              user?.role === 'reviewer'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Reviewer
          </button>
          <button
            onClick={() => handleRoleChange('uploader')}
            disabled={switchingRole}
            className={`px-2.5 py-1 rounded-md transition-all ${
              user?.role === 'uploader'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Uploader
          </button>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleMarkAsRead(n._id, n.documentId)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                        !n.isRead ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'expiry' ? (
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </div>
                        ) : n.type === 'assignment' ? (
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <FileCheck className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold ${!n.isRead ? 'text-indigo-950 font-bold' : 'text-slate-700'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleDateString()} at{' '}
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upload Document Primary Action Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>
    </header>
  );
};

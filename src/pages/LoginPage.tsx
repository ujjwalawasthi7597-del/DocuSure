import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';

interface Props {
  onNavigateRegister: () => void;
}

export const LoginPage: React.FC<Props> = ({ onNavigateRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await login(demoEmail, 'Password123!');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-4">
          <ShieldCheck className="w-7 h-7 text-indigo-100" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">DocuSure</h2>
        <p className="mt-1 text-xs text-indigo-300 font-medium tracking-wide uppercase">
          AI Document Verification &amp; Compliance Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-100">
          {/* Quick Demo Switcher Card */}
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>One-Click Role Demo Sign-in:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@apexglobal.com')}
                disabled={isSubmitting}
                className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-center transition-all group"
              >
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Admin</p>
                <p className="text-[10px] text-slate-400">Elena R.</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('reviewer@apexglobal.com')}
                disabled={isSubmitting}
                className="p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-center transition-all group"
              >
                <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Reviewer</p>
                <p className="text-[10px] text-slate-400">Marcus V.</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('uploader@apexglobal.com')}
                disabled={isSubmitting}
                className="p-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-center transition-all group"
              >
                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600">Uploader</p>
                <p className="text-[10px] text-slate-400">Sarah C.</p>
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-slate-400">Or sign in with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Organization</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Need to register a new organization?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Register Organization
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

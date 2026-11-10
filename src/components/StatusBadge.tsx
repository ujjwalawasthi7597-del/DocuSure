import React from 'react';
import { DocumentStatus } from '../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Loader2,
  FileText,
} from 'lucide-react';

interface Props {
  status: DocumentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'Approved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Approved
        </span>
      );
    case 'Rejected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          <XCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Rejected
        </span>
      );
    case 'Changes Requested':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}
        >
          <AlertTriangle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Changes Requested
        </span>
      );
    case 'Under Review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}
        >
          <Eye className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Under Review
        </span>
      );
    case 'Pending Review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}
        >
          <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Pending Review
        </span>
      );
    case 'Processing':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses}`}
        >
          <Loader2 className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-spin`} />
          AI Processing
        </span>
      );
    case 'Uploaded':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          <FileText className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Uploaded
        </span>
      );
  }
};

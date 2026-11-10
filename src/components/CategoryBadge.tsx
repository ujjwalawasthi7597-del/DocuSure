import React from 'react';
import { DocumentCategory } from '../types';

interface Props {
  category: DocumentCategory;
}

export const CategoryBadge: React.FC<Props> = ({ category }) => {
  const colorMap: Record<DocumentCategory, string> = {
    Contracts: 'bg-violet-50 text-violet-700 border-violet-200',
    Invoices: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Compliance Certificates': 'bg-blue-50 text-blue-700 border-blue-200',
    'Identity Documents': 'bg-amber-50 text-amber-700 border-amber-200',
    'Business Agreements': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Tax Documents': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    Licenses: 'bg-teal-50 text-teal-700 border-teal-200',
    Other: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const styleClass = colorMap[category] || colorMap.Other;

  return (
    <span className={`inline-block font-medium text-xs px-2.5 py-0.5 rounded-md border ${styleClass}`}>
      {category}
    </span>
  );
};

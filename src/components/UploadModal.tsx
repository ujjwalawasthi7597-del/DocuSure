import React, { useState, useEffect } from 'react';
import { DocumentCategory, IUser } from '../types';
import { documentsApi, usersApi } from '../services/api';
import {
  X,
  UploadCloud,
  FileCheck2,
  AlertCircle,
  Sparkles,
  Calendar,
  UserCheck,
  Tag,
  Loader2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDocId?: string) => void;
}

const CATEGORIES: DocumentCategory[] = [
  'Contracts',
  'Invoices',
  'Compliance Certificates',
  'Business Agreements',
  'Identity Documents',
  'Tax Documents',
  'Licenses',
  'Other',
];

export const UploadModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Contracts');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [assignedReviewer, setAssignedReviewer] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [reviewers, setReviewers] = useState<IUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch reviewers in organization
      usersApi
        .getUsers()
        .then((res) => {
          const revs = (res.users || []).filter(
            (u) => u.role === 'reviewer' || u.role === 'admin'
          );
          setReviewers(revs);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const validMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];

    if (!validMimes.includes(selectedFile.type)) {
      setError('Please upload a PDF or PNG/JPEG image document.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(nameWithoutExt);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drop a document file.');
      return;
    }

    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setProcessingStep('1/3 Encrypting & uploading file to private vault...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('description', description);
      if (issueDate) formData.append('issueDate', issueDate);
      if (expiryDate) formData.append('expiryDate', expiryDate);
      if (assignedReviewer) formData.append('assignedReviewer', assignedReviewer);
      if (tags) formData.append('tags', tags);

      // Simulate realistic step transition while backend processes with Gemini
      const stepTimer1 = setTimeout(() => {
        setProcessingStep('2/3 Gemini 3.8 Flash analyzing document intelligence & clauses...');
      }, 900);

      const stepTimer2 = setTimeout(() => {
        setProcessingStep('3/3 Validating extracted fields & generating compliance report...');
      }, 2200);

      const result = await documentsApi.uploadDocument(formData);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      onSuccess(result.document._id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please check file format and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Upload Document for AI Verification</h3>
              <p className="text-xs text-slate-500">
                Automated information extraction, risk flagging &amp; expiry tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Document File <span className="text-rose-500">*</span>
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : file
                  ? 'border-emerald-400 bg-emerald-50/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileInput}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Document'}
                    </p>
                  </div>
                  <label
                    htmlFor="file-upload"
                    className="ml-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer underline"
                  >
                    Change file
                  </label>
                </div>
              ) : (
                <div>
                  <UploadCloud className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    Drag and drop your document here, or{' '}
                    <label
                      htmlFor="file-upload"
                      className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                    >
                      browse files
                    </label>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PDF, PNG, JPG, JPEG (Max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Title & Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Master Services Agreement 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Business Context
            </label>
            <textarea
              rows={2}
              placeholder="Brief context regarding parties, scope, or specific compliance considerations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Dates & Reviewer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-400">Gemini will auto-detect if left blank</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                Assign Reviewer
              </label>
              <select
                value={assignedReviewer}
                onChange={(e) => setAssignedReviewer(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">Select Reviewer (Optional)</option>
                {reviewers.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. SLA, High-Value, Vendor2026, GDPR"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Live Processing Indicator */}
          {isSubmitting && (
            <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center gap-3 animate-in fade-in">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs font-bold text-indigo-950">AI Document Processing Active</p>
                </div>
                <p className="text-xs text-indigo-700 mt-0.5">{processingStep}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze &amp; Upload</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

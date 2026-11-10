export type UserRole = 'admin' | 'reviewer' | 'uploader';

export type DocumentStatus =
  | 'Uploaded'
  | 'Processing'
  | 'Pending Review'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Changes Requested';

export type DocumentCategory =
  | 'Contracts'
  | 'Invoices'
  | 'Identity Documents'
  | 'Compliance Certificates'
  | 'Business Agreements'
  | 'Tax Documents'
  | 'Licenses'
  | 'Other';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  organizationId: string;
  department?: string;
  title?: string;
  createdAt: string;
}

export interface IOrganization {
  _id: string;
  name: string;
  industry: string;
  contactEmail: string;
  createdAt: string;
  plan?: string;
}

export interface IDocument {
  _id: string;
  title: string;
  category: DocumentCategory;
  description: string;
  organizationId: string;
  uploadedBy: string; // userId
  uploaderName?: string;
  assignedReviewer?: string; // userId
  reviewerName?: string;
  currentVersion: number;
  status: DocumentStatus;
  issueDate?: string;
  expiryDate?: string;
  rejectionReason?: string;
  reviewerComments?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IDocumentVersion {
  _id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  uploaderName?: string;
  changeSummary?: string;
  uploadedAt: string;
}

export interface IRiskFlag {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface IClause {
  title: string;
  summary: string;
  riskLevel: 'standard' | 'attention' | 'high_risk';
  section?: string;
}

export interface IAIAnalysis {
  _id: string;
  documentId: string;
  versionId: string;
  organizationId: string;
  documentType: string;
  extractedFields: Record<string, any>;
  missingFields: string[];
  inconsistencies: string[];
  riskFlags: IRiskFlag[];
  importantClauses: IClause[];
  summary: string;
  recommendation: string;
  confidenceScore: number;
  analyzedAt: string;
  error?: string;
}

export interface IAuditLog {
  _id: string;
  organizationId: string;
  documentId?: string;
  documentTitle?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface INotification {
  _id: string;
  organizationId: string;
  userId: string;
  title: string;
  message: string;
  documentId?: string;
  type?: 'upload' | 'assignment' | 'status_change' | 'expiry' | 'system';
  isRead: boolean;
  createdAt: string;
}

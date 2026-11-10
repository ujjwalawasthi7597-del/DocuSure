import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'reviewer', 'uploader'], default: 'uploader' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  department: { type: String },
  title: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const OrganizationSchema = new Schema({
  name: { type: String, required: true },
  industry: { type: String, default: 'General' },
  contactEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  plan: { type: String, default: 'Enterprise Standard' },
});

const DocumentSchema = new Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'Contracts',
      'Invoices',
      'Identity Documents',
      'Compliance Certificates',
      'Business Agreements',
      'Tax Documents',
      'Licenses',
      'Other',
    ],
    required: true,
  },
  description: { type: String, default: '' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedReviewer: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  currentVersion: { type: Number, default: 1 },
  status: {
    type: String,
    enum: [
      'Uploaded',
      'Processing',
      'Pending Review',
      'Under Review',
      'Approved',
      'Rejected',
      'Changes Requested',
    ],
    default: 'Uploaded',
    index: true,
  },
  issueDate: { type: String },
  expiryDate: { type: String, index: true },
  rejectionReason: { type: String },
  reviewerComments: { type: String },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const DocumentVersionSchema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  versionNumber: { type: Number, required: true },
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changeSummary: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const AIAnalysisSchema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  versionId: { type: Schema.Types.ObjectId, ref: 'DocumentVersion', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  documentType: { type: String, default: 'General' },
  extractedFields: { type: Schema.Types.Mixed, default: {} },
  missingFields: [{ type: String }],
  inconsistencies: [{ type: String }],
  riskFlags: [
    {
      title: { type: String },
      description: { type: String },
      severity: { type: String, enum: ['low', 'medium', 'high'] },
    },
  ],
  importantClauses: [
    {
      title: { type: String },
      summary: { type: String },
      riskLevel: { type: String, enum: ['standard', 'attention', 'high_risk'] },
      section: { type: String },
    },
  ],
  summary: { type: String },
  recommendation: { type: String },
  confidenceScore: { type: Number, default: 0.85 },
  analyzedAt: { type: Date, default: Date.now },
  error: { type: String },
});

const AuditLogSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', default: null, index: true },
  documentTitle: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true },
  description: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
});

const NotificationSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', default: null },
  type: { type: String, default: 'system' },
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const OrganizationModel = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
export const DocumentModel = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
export const DocumentVersionModel = mongoose.models.DocumentVersion || mongoose.model('DocumentVersion', DocumentVersionSchema);
export const AIAnalysisModel = mongoose.models.AIAnalysis || mongoose.model('AIAnalysis', AIAnalysisSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

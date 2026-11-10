import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  IUser,
  IOrganization,
  IDocument,
  IDocumentVersion,
  IAIAnalysis,
  IAuditLog,
  INotification,
} from '../models/types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'docusure_store.json');

export interface IStoreData {
  users: IUser[];
  organizations: IOrganization[];
  documents: IDocument[];
  documentVersions: IDocumentVersion[];
  aiAnalyses: IAIAnalysis[];
  auditLogs: IAuditLog[];
  notifications: INotification[];
}

class Store {
  private data: IStoreData = {
    users: [],
    organizations: [],
    documents: [],
    documentVersions: [],
    aiAnalyses: [],
    auditLogs: [],
    notifications: [],
  };

  private initialized = false;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        this.initialized = true;
      } else {
        this.seedInitialData();
      }
    } catch (e) {
      console.error('[Store] Failed to load from disk, seeding initial data', e);
      this.seedInitialData();
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Store] Failed to save to disk', e);
    }
  }

  public seedInitialData() {
    console.log('[Store] Seeding initial enterprise data...');
    const orgId = 'org_apex_global_01';
    const adminId = 'usr_admin_01';
    const reviewerId = 'usr_reviewer_01';
    const uploaderId = 'usr_uploader_01';

    const hashedPassword = bcrypt.hashSync('Password123!', 10);

    const organization: IOrganization = {
      _id: orgId,
      name: 'Apex Global Technologies',
      industry: 'Enterprise Software & Cloud Services',
      contactEmail: 'compliance@apexglobal.com',
      createdAt: new Date('2025-01-10T08:00:00.000Z').toISOString(),
      plan: 'Enterprise Pro (Compliance & AI Plus)',
    };

    const users: IUser[] = [
      {
        _id: adminId,
        name: 'Elena Rostova',
        email: 'admin@apexglobal.com',
        password: hashedPassword,
        role: 'admin',
        organizationId: orgId,
        department: 'Corporate Governance & Legal',
        title: 'Chief Compliance Officer',
        createdAt: new Date('2025-01-10T09:00:00.000Z').toISOString(),
      },
      {
        _id: reviewerId,
        name: 'Marcus Vance',
        email: 'reviewer@apexglobal.com',
        password: hashedPassword,
        role: 'reviewer',
        organizationId: orgId,
        department: 'Legal Compliance Audit',
        title: 'Senior Compliance Specialist',
        createdAt: new Date('2025-01-12T10:00:00.000Z').toISOString(),
      },
      {
        _id: uploaderId,
        name: 'Sarah Chen',
        email: 'uploader@apexglobal.com',
        password: hashedPassword,
        role: 'uploader',
        organizationId: orgId,
        department: 'Operations & Procurement',
        title: 'Procurement Specialist',
        createdAt: new Date('2025-01-15T11:00:00.000Z').toISOString(),
      },
    ];

    const doc1Id = 'doc_iso27001_cert';
    const doc2Id = 'doc_master_service_agrmt';
    const doc3Id = 'doc_cloud_invoice_q4';
    const doc4Id = 'doc_vendor_tax_form';
    const doc5Id = 'doc_eu_gdpr_dpa';

    const now = new Date();
    const iso27001Date = new Date();
    iso27001Date.setDate(now.getDate() + 18); // Expiring soon in 18 days!

    const taxExpiryDate = new Date();
    taxExpiryDate.setDate(now.getDate() - 10); // Expired!

    const documents: IDocument[] = [
      {
        _id: doc1Id,
        title: 'ISO/IEC 27001:2022 Security Compliance Certificate',
        category: 'Compliance Certificates',
        description: 'Annual ISO 27001 information security certification issued by BSI Assurance UK.',
        organizationId: orgId,
        uploadedBy: uploaderId,
        uploaderName: 'Sarah Chen',
        assignedReviewer: reviewerId,
        reviewerName: 'Marcus Vance',
        currentVersion: 1,
        status: 'Pending Review',
        issueDate: '2024-03-20',
        expiryDate: iso27001Date.toISOString().split('T')[0],
        reviewerComments: 'Pending final sign-off on scope Annex A controls.',
        tags: ['ISO 27001', 'InfoSec', 'BSI', 'Expiring Soon'],
        createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      },
      {
        _id: doc2Id,
        title: 'Master Cloud Infrastructure Agreement - Nexus Cloud',
        category: 'Contracts',
        description: 'Multi-year multi-region cloud hosting and SLA contract with automated failover provisions.',
        organizationId: orgId,
        uploadedBy: uploaderId,
        uploaderName: 'Sarah Chen',
        assignedReviewer: reviewerId,
        reviewerName: 'Marcus Vance',
        currentVersion: 2,
        status: 'Approved',
        issueDate: '2025-06-01',
        expiryDate: '2028-06-01',
        reviewerComments: 'Clause 9.3 indemnification limit verified and approved by legal counsel.',
        tags: ['Cloud', 'SLA', 'High-Value', 'Indemnity'],
        createdAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      },
      {
        _id: doc3Id,
        title: 'Nexus Data Services - Q4 Enterprise License Invoice',
        category: 'Invoices',
        description: 'Quarterly billing statement for high-throughput compute clusters and storage pools.',
        organizationId: orgId,
        uploadedBy: uploaderId,
        uploaderName: 'Sarah Chen',
        assignedReviewer: reviewerId,
        reviewerName: 'Marcus Vance',
        currentVersion: 1,
        status: 'Under Review',
        issueDate: '2026-10-01',
        expiryDate: '2026-11-30',
        reviewerComments: 'Cross-checking unit rate discounts against Master Agreement schedule B.',
        tags: ['Finance', 'Invoice', 'Q4'],
        createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        _id: doc4Id,
        title: 'IRS Form W-9 Request for Taxpayer ID Certification',
        category: 'Tax Documents',
        description: 'Vendor federal taxpayer identification and withholding exemption documentation.',
        organizationId: orgId,
        uploadedBy: uploaderId,
        uploaderName: 'Sarah Chen',
        assignedReviewer: reviewerId,
        reviewerName: 'Marcus Vance',
        currentVersion: 1,
        status: 'Changes Requested',
        issueDate: '2024-01-10',
        expiryDate: taxExpiryDate.toISOString().split('T')[0],
        reviewerComments: 'The submitted W-9 form is dated over 12 months ago and TIN box 3 check is missing. Please provide a newly executed 2026 form.',
        tags: ['Tax', 'W-9', 'IRS', 'Expired'],
        createdAt: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
      },
      {
        _id: doc5Id,
        title: 'EU GDPR Data Processing Addendum (DPA) & Standard Clauses',
        category: 'Business Agreements',
        description: 'Cross-border international data transfer safeguards and sub-processor audit mechanisms.',
        organizationId: orgId,
        uploadedBy: uploaderId,
        uploaderName: 'Sarah Chen',
        assignedReviewer: reviewerId,
        reviewerName: 'Marcus Vance',
        currentVersion: 1,
        status: 'Approved',
        issueDate: '2025-02-15',
        expiryDate: '2027-02-15',
        reviewerComments: 'Complies fully with standard contractual clauses (SCC) module 2.',
        tags: ['GDPR', 'Privacy', 'DPA', 'EU'],
        createdAt: new Date(Date.now() - 3600000 * 24 * 18).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
      },
    ];

    const versions: IDocumentVersion[] = [
      {
        _id: 'ver_01_iso',
        documentId: doc1Id,
        versionNumber: 1,
        fileName: 'sample_iso27001_cert.pdf',
        originalName: 'BSI_ISO27001_Certificate_ApexGlobal.pdf',
        filePath: 'sample_iso27001_cert.pdf',
        mimeType: 'application/pdf',
        fileSize: 482910,
        uploadedBy: uploaderId,
        uploaderName: 'Sarah Chen',
        changeSummary: 'Initial certificate submission for annual audit cycle.',
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      },
      {
        _id: 'ver_02_nexus',
        documentId: doc2Id,
        versionNumber: 2,
        fileName: 'nexus_cloud_agreement_v2.pdf',
        originalName: 'Nexus_Cloud_MSA_Executed_v2.pdf',
        filePath: 'nexus_cloud_agreement_v2.pdf',
        mimeType: 'application/pdf',
        fileSize: 1258400,
        uploadedBy: uploaderId,
        uploaderName: 'Sarah Chen',
        changeSummary: 'Updated with revised SLA credit table and legal indemnification cap.',
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      },
      {
        _id: 'ver_03_invoice',
        documentId: doc3Id,
        versionNumber: 1,
        fileName: 'nexus_invoice_q4_2026.pdf',
        originalName: 'INV-2026-Q4-8849.pdf',
        filePath: 'nexus_invoice_q4_2026.pdf',
        mimeType: 'application/pdf',
        fileSize: 312000,
        uploadedBy: uploaderId,
        uploaderName: 'Sarah Chen',
        changeSummary: 'Q4 regular billing invoice.',
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      },
    ];

    const aiAnalyses: IAIAnalysis[] = [
      {
        _id: 'ai_01_iso',
        documentId: doc1Id,
        versionId: 'ver_01_iso',
        organizationId: orgId,
        documentType: 'Compliance Certificate',
        extractedFields: {
          organizationName: 'Apex Global Technologies UK Ltd',
          accreditationBody: 'BSI Assurance UK Limited',
          certificateStandard: 'ISO/IEC 27001:2022',
          certificateNumber: 'IS-774920-REV3',
          issueDate: '2024-03-20',
          expiryDate: iso27001Date.toISOString().split('T')[0],
          scopeOfRegistration: 'Design, development, hosting, and operational maintenance of multi-tenant cloud enterprise workflow applications.',
          leadAuditor: 'Dr. Alistair Finch (Lead IRCA Auditor)',
        },
        missingFields: [],
        inconsistencies: [],
        riskFlags: [
          {
            title: 'Certificate Expiry Approaching (< 30 days)',
            description: 'The validity period expires in approximately 18 days. Renewal audit documentation or extension letter must be uploaded immediately.',
            severity: 'high',
          },
          {
            title: 'Subsidiary Scope Limitation',
            description: 'Section 4 mentions UK entity only; APAC data center operates under independent affiliate certificate.',
            severity: 'medium',
          },
        ],
        importantClauses: [
          {
            title: 'Scope Clause 4.1',
            summary: 'Information security management system covers SaaS platform and customer database replication clusters.',
            riskLevel: 'standard',
            section: 'Certification Scope',
          },
          {
            title: 'Mandatory Surveillance Audit',
            summary: 'Requires bi-annual continuous assessment visits to retain accredited badge status.',
            riskLevel: 'attention',
            section: 'Accreditation Conditions',
          },
        ],
        summary: 'Official ISO/IEC 27001:2022 security accreditation issued by BSI UK. The certificate is authentic and verifiable, but requires urgent recertification review due to approaching expiration.',
        recommendation: 'Request updated renewal audit schedule from BSI before final status approval.',
        confidenceScore: 0.94,
        analyzedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      },
      {
        _id: 'ai_02_nexus',
        documentId: doc2Id,
        versionId: 'ver_02_nexus',
        organizationId: orgId,
        documentType: 'Master Service Agreement / Cloud Contract',
        extractedFields: {
          vendorName: 'Nexus Cloud Systems Corp',
          clientName: 'Apex Global Technologies Inc',
          contractValue: '$480,000 USD Annual Minimum Commitment',
          governingLaw: 'State of Delaware, United States',
          slaUptime: '99.95% Guaranteed Monthly Availability',
          effectiveDate: '2025-06-01',
          termDuration: '36 Months (Auto-renewal unless 60 days written notice)',
        },
        missingFields: [],
        inconsistencies: [],
        riskFlags: [
          {
            title: 'Automatic Renewal Provision',
            description: 'Contract auto-renews for 12 months unless cancelled 60 days prior to term end date.',
            severity: 'medium',
          },
          {
            title: 'Uncapped Liability Exception for IP Claims',
            description: 'Section 11.2 excludes third-party intellectual property indemnity from aggregate liability cap.',
            severity: 'low',
          },
        ],
        importantClauses: [
          {
            title: 'SLA Credit Remedy (Clause 7.2)',
            summary: 'Customer receives 15% billing credit for outages exceeding 22 minutes within any calendar month.',
            riskLevel: 'standard',
            section: 'Service Level Agreement',
          },
          {
            title: 'Data Portability on Termination (Clause 14.4)',
            summary: 'Provider must supply full JSON/SQL database dump within 14 business days of termination at no additional fee.',
            riskLevel: 'standard',
            section: 'Exit & Transition',
          },
        ],
        summary: 'Fully negotiated enterprise cloud infrastructure agreement with high-standard SLA commitments and clear data egress warranties.',
        recommendation: 'Approved for legal compliance. Verified that revised version 2 incorporates counsel redlines.',
        confidenceScore: 0.96,
        analyzedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      },
      {
        _id: 'ai_03_invoice',
        documentId: doc3Id,
        versionId: 'ver_03_invoice',
        organizationId: orgId,
        documentType: 'Commercial Invoice',
        extractedFields: {
          vendorName: 'Nexus Cloud Systems Corp',
          invoiceNumber: 'INV-2026-Q4-8849',
          subtotal: '$118,500.00 USD',
          taxAmount: '$0.00 (Exempt under enterprise reseller cert)',
          totalAmount: '$118,500.00 USD',
          paymentTerms: 'Net 30 Days (Due 2026-11-30)',
          billingPeriod: '2026-10-01 to 2026-12-31',
        },
        missingFields: ['Purchase Order Reference (PO# missing from invoice header)'],
        inconsistencies: [
          'Billing unit price for GPU memory clusters exceeds contracted volume discount by 2.4%',
        ],
        riskFlags: [
          {
            title: 'Pricing Variance Detected',
            description: 'GPU cluster tier-2 usage rate does not reflect the 10% volume discount agreed in Master Contract Clause 5.1.',
            severity: 'medium',
          },
          {
            title: 'Missing Enterprise PO Number',
            description: 'Corporate accounting requires mandatory PO reference number before wire transfer release.',
            severity: 'low',
          },
        ],
        importantClauses: [],
        summary: 'Enterprise quarterly cloud computing invoice. AI detected a minor rate discrepancy against the master cloud agreement and a missing purchase order number.',
        recommendation: 'Reviewer should request credit memo or revised billing adjustment before approving payment release.',
        confidenceScore: 0.91,
        analyzedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ];

    const auditLogs: IAuditLog[] = [
      {
        _id: 'aud_01',
        organizationId: orgId,
        documentId: doc1Id,
        documentTitle: 'ISO/IEC 27001:2022 Security Compliance Certificate',
        userId: uploaderId,
        userName: 'Sarah Chen',
        userRole: 'uploader',
        action: 'DOCUMENT_UPLOADED',
        description: 'Uploaded document version 1 (BSI_ISO27001_Certificate_ApexGlobal.pdf)',
        timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      },
      {
        _id: 'aud_02',
        organizationId: orgId,
        documentId: doc1Id,
        documentTitle: 'ISO/IEC 27001:2022 Security Compliance Certificate',
        userId: adminId,
        userName: 'Elena Rostova',
        userRole: 'admin',
        action: 'REVIEWER_ASSIGNED',
        description: 'Assigned document review to Marcus Vance',
        timestamp: new Date(Date.now() - 3600000 * 24 * 2.8).toISOString(),
      },
      {
        _id: 'aud_03',
        organizationId: orgId,
        documentId: doc1Id,
        documentTitle: 'ISO/IEC 27001:2022 Security Compliance Certificate',
        userId: 'system',
        userName: 'Gemini AI Engine',
        userRole: 'admin',
        action: 'AI_ANALYSIS_COMPLETED',
        description: 'Automated document extraction completed with 94% confidence score; 2 risk flags raised.',
        timestamp: new Date(Date.now() - 3600000 * 24 * 2.7).toISOString(),
      },
      {
        _id: 'aud_04',
        organizationId: orgId,
        documentId: doc2Id,
        documentTitle: 'Master Cloud Infrastructure Agreement - Nexus Cloud',
        userId: reviewerId,
        userName: 'Marcus Vance',
        userRole: 'reviewer',
        action: 'DOCUMENT_APPROVED',
        description: 'Approved version 2 of contract following indemnification clause review.',
        timestamp: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      },
      {
        _id: 'aud_05',
        organizationId: orgId,
        documentId: doc4Id,
        documentTitle: 'IRS Form W-9 Request for Taxpayer ID Certification',
        userId: reviewerId,
        userName: 'Marcus Vance',
        userRole: 'reviewer',
        action: 'CHANGES_REQUESTED',
        description: 'Requested updated 2026 W-9 submission due to expired signature date.',
        timestamp: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
      },
    ];

    const notifications: INotification[] = [
      {
        _id: 'notif_01',
        organizationId: orgId,
        userId: reviewerId,
        title: 'New Document Assigned',
        message: 'Elena Rostova assigned ISO/IEC 27001:2022 Certificate to you for review.',
        documentId: doc1Id,
        type: 'assignment',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 24 * 2.8).toISOString(),
      },
      {
        _id: 'notif_02',
        organizationId: orgId,
        userId: uploaderId,
        title: 'Changes Requested on IRS Form W-9',
        message: 'Marcus Vance requested corrections: "Please submit updated 2026 form with active TIN checkbox."',
        documentId: doc4Id,
        type: 'status_change',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
      },
      {
        _id: 'notif_03',
        organizationId: orgId,
        userId: adminId,
        title: 'Document Expiring in 18 Days',
        message: 'ISO/IEC 27001 Certificate is scheduled to expire soon. Renewal action required.',
        documentId: doc1Id,
        type: 'expiry',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        _id: 'notif_04',
        organizationId: orgId,
        userId: uploaderId,
        title: 'Document Approved',
        message: 'Nexus Cloud Master Agreement has been formally approved by Marcus Vance.',
        documentId: doc2Id,
        type: 'status_change',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      },
    ];

    this.data = {
      organizations: [organization],
      users,
      documents,
      documentVersions: versions,
      aiAnalyses,
      auditLogs,
      notifications,
    };

    this.saveToDisk();
  }

  // --- Users ---
  public findUserById(id: string): IUser | undefined {
    return this.data.users.find((u) => u._id === id);
  }

  public findUserByEmail(email: string): IUser | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUsersByOrg(organizationId: string): IUser[] {
    return this.data.users.filter((u) => u.organizationId === organizationId);
  }

  public createUser(user: Omit<IUser, '_id' | 'createdAt'>): IUser {
    const newUser: IUser = {
      ...user,
      _id: 'usr_' + crypto.randomBytes(6).toString('hex'),
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.saveToDisk();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<IUser>): IUser | null {
    const idx = this.data.users.findIndex((u) => u._id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.saveToDisk();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u._id !== id);
    if (this.data.users.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // --- Organization ---
  public findOrganizationById(id: string): IOrganization | undefined {
    return this.data.organizations.find((o) => o._id === id);
  }

  public createOrganization(org: Omit<IOrganization, '_id' | 'createdAt'>): IOrganization {
    const newOrg: IOrganization = {
      ...org,
      _id: 'org_' + crypto.randomBytes(6).toString('hex'),
      createdAt: new Date().toISOString(),
    };
    this.data.organizations.push(newOrg);
    this.saveToDisk();
    return newOrg;
  }

  // --- Documents ---
  public findDocumentById(id: string): IDocument | undefined {
    return this.data.documents.find((d) => d._id === id);
  }

  public findDocumentsByOrg(
    organizationId: string,
    filters?: {
      category?: string;
      status?: string;
      assignedReviewer?: string;
      uploadedBy?: string;
      search?: string;
      expiryFilter?: 'expired' | '7days' | '30days' | 'no_expiry';
    }
  ): IDocument[] {
    let list = this.data.documents.filter((d) => d.organizationId === organizationId);

    if (filters?.category && filters.category !== 'all') {
      list = list.filter((d) => d.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((d) => d.status.toLowerCase() === filters.status!.toLowerCase());
    }

    if (filters?.assignedReviewer) {
      list = list.filter((d) => d.assignedReviewer === filters.assignedReviewer);
    }

    if (filters?.uploadedBy) {
      list = list.filter((d) => d.uploadedBy === filters.uploadedBy);
    }

    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filters?.expiryFilter) {
      const now = new Date();
      list = list.filter((d) => {
        if (!d.expiryDate) {
          return filters.expiryFilter === 'no_expiry';
        }
        const exp = new Date(d.expiryDate);
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (filters.expiryFilter === 'expired') return diffDays < 0;
        if (filters.expiryFilter === '7days') return diffDays >= 0 && diffDays <= 7;
        if (filters.expiryFilter === '30days') return diffDays >= 0 && diffDays <= 30;
        return true;
      });
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createDocument(doc: Omit<IDocument, '_id' | 'createdAt' | 'updatedAt'>): IDocument {
    const newDoc: IDocument = {
      ...doc,
      _id: 'doc_' + crypto.randomBytes(6).toString('hex'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.documents.unshift(newDoc);
    this.saveToDisk();
    return newDoc;
  }

  public updateDocument(id: string, updates: Partial<IDocument>): IDocument | null {
    const idx = this.data.documents.findIndex((d) => d._id === id);
    if (idx === -1) return null;
    this.data.documents[idx] = {
      ...this.data.documents[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToDisk();
    return this.data.documents[idx];
  }

  public deleteDocument(id: string): boolean {
    const initialLen = this.data.documents.length;
    this.data.documents = this.data.documents.filter((d) => d._id !== id);
    this.data.documentVersions = this.data.documentVersions.filter((v) => v.documentId !== id);
    this.data.aiAnalyses = this.data.aiAnalyses.filter((a) => a.documentId !== id);
    if (this.data.documents.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // --- Document Versions ---
  public findVersionsByDocId(documentId: string): IDocumentVersion[] {
    return this.data.documentVersions
      .filter((v) => v.documentId === documentId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  public findVersionById(versionId: string): IDocumentVersion | undefined {
    return this.data.documentVersions.find((v) => v._id === versionId);
  }

  public createDocumentVersion(ver: Omit<IDocumentVersion, '_id' | 'uploadedAt'>): IDocumentVersion {
    const newVer: IDocumentVersion = {
      ...ver,
      _id: 'ver_' + crypto.randomBytes(6).toString('hex'),
      uploadedAt: new Date().toISOString(),
    };
    this.data.documentVersions.push(newVer);
    this.saveToDisk();
    return newVer;
  }

  // --- AI Analysis ---
  public findAIAnalysisByDocId(documentId: string): IAIAnalysis | undefined {
    return this.data.aiAnalyses
      .filter((a) => a.documentId === documentId)
      .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())[0];
  }

  public createOrUpdateAIAnalysis(analysis: Omit<IAIAnalysis, '_id' | 'analyzedAt'>): IAIAnalysis {
    const existingIdx = this.data.aiAnalyses.findIndex(
      (a) => a.documentId === analysis.documentId && a.versionId === analysis.versionId
    );
    const newRecord: IAIAnalysis = {
      ...analysis,
      _id: 'ai_' + crypto.randomBytes(6).toString('hex'),
      analyzedAt: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      this.data.aiAnalyses[existingIdx] = newRecord;
    } else {
      this.data.aiAnalyses.push(newRecord);
    }
    this.saveToDisk();
    return newRecord;
  }

  // --- Audit Logs ---
  public createAuditLog(log: Omit<IAuditLog, '_id' | 'timestamp'>): IAuditLog {
    const record: IAuditLog = {
      ...log,
      _id: 'aud_' + crypto.randomBytes(6).toString('hex'),
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(record);
    this.saveToDisk();
    return record;
  }

  public findAuditLogs(organizationId: string, limit = 100): IAuditLog[] {
    return this.data.auditLogs
      .filter((l) => l.organizationId === organizationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // --- Notifications ---
  public createNotification(n: Omit<INotification, '_id' | 'createdAt' | 'isRead'>): INotification {
    const record: INotification = {
      ...n,
      _id: 'notif_' + crypto.randomBytes(6).toString('hex'),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(record);
    this.saveToDisk();
    return record;
  }

  public findNotifications(userId: string): INotification[] {
    return this.data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public markNotificationAsRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n._id === id);
    if (notif) {
      notif.isRead = true;
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public markAllNotificationsAsRead(userId: string): void {
    let changed = false;
    this.data.notifications.forEach((n) => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        changed = true;
      }
    });
    if (changed) this.saveToDisk();
  }

  public getRawData() {
    return this.data;
  }
}

export const store = new Store();

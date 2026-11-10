import {
  IUser,
  IOrganization,
  IDocument,
  IDocumentVersion,
  IAIAnalysis,
  IAuditLog,
  INotification,
} from '../types';

const BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('docusure_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

// --- Auth APIs ---
export const authApi = {
  async registerOrg(payload: {
    orgName: string;
    industry: string;
    adminName: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: IUser; organization: IOrganization }> {
    const res = await fetch(`${BASE_URL}/auth/register-organization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async login(payload: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: IUser; organization: IOrganization }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: IUser; organization: IOrganization }> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },
};

// --- Users APIs ---
export const usersApi = {
  async getUsers(): Promise<{ users: IUser[] }> {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async createUser(data: Partial<IUser> & { password: string }): Promise<{ user: IUser }> {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateUser(id: string, data: Partial<IUser>): Promise<{ user: IUser }> {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },
};

// --- Documents APIs ---
export const documentsApi = {
  async getDocuments(params?: {
    category?: string;
    status?: string;
    search?: string;
    assignedReviewer?: string;
    uploadedBy?: string;
    expiryFilter?: string;
  }): Promise<{ count: number; documents: IDocument[] }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val) query.append(key, val);
      });
    }
    const res = await fetch(`${BASE_URL}/documents?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getDocumentById(id: string): Promise<{
    document: IDocument;
    versions: IDocumentVersion[];
    analysis: IAIAnalysis;
    uploader: { name: string; email: string; role: string } | null;
    reviewer: { name: string; email: string; role: string } | null;
  }> {
    const res = await fetch(`${BASE_URL}/documents/${id}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async uploadDocument(formData: FormData): Promise<{
    document: IDocument;
    version: IDocumentVersion;
    analysis: IAIAnalysis;
  }> {
    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    return handleResponse(res);
  },

  async uploadNewVersion(
    docId: string,
    formData: FormData
  ): Promise<{
    document: IDocument;
    version: IDocumentVersion;
    analysis: IAIAnalysis;
  }> {
    const res = await fetch(`${BASE_URL}/documents/${docId}/versions`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    return handleResponse(res);
  },

  async deleteDocument(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  getDownloadUrl(id: string, versionId?: string): string {
    const token = localStorage.getItem('docusure_token') || '';
    return `${BASE_URL}/documents/${id}/download${versionId ? `?versionId=${versionId}` : ''}`;
  },
};

// --- Review Workflow APIs ---
export const reviewApi = {
  async assignReviewer(documentId: string, reviewerId: string): Promise<{ document: IDocument }> {
    const res = await fetch(`${BASE_URL}/reviews/${documentId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ reviewerId }),
    });
    return handleResponse(res);
  },

  async approveDocument(documentId: string, comments?: string): Promise<{ document: IDocument }> {
    const res = await fetch(`${BASE_URL}/reviews/${documentId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ comments }),
    });
    return handleResponse(res);
  },

  async rejectDocument(documentId: string, reason: string): Promise<{ document: IDocument }> {
    const res = await fetch(`${BASE_URL}/reviews/${documentId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  async requestChanges(documentId: string, comments: string): Promise<{ document: IDocument }> {
    const res = await fetch(`${BASE_URL}/reviews/${documentId}/request-changes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ comments }),
    });
    return handleResponse(res);
  },

  async setUnderReview(documentId: string): Promise<{ document: IDocument }> {
    const res = await fetch(`${BASE_URL}/reviews/${documentId}/under-review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getAssignedReviews(): Promise<{ count: number; documents: IDocument[] }> {
    const res = await fetch(`${BASE_URL}/reviews/assigned`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },
};

// --- AI APIs ---
export const aiApi = {
  async reanalyze(documentId: string): Promise<{ analysis: IAIAnalysis }> {
    const res = await fetch(`${BASE_URL}/ai/reanalyze/${documentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async updateExtractedFields(
    documentId: string,
    extractedFields: Record<string, any>
  ): Promise<{ analysis: IAIAnalysis }> {
    const res = await fetch(`${BASE_URL}/ai/fields/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ extractedFields }),
    });
    return handleResponse(res);
  },

  async askAssistant(
    documentId: string,
    question: string
  ): Promise<{ answer: string }> {
    const res = await fetch(`${BASE_URL}/ai/ask/${documentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ question }),
    });
    return handleResponse(res);
  },
};

// --- Audit & Dashboard APIs ---
export const auditApi = {
  async getAuditLogs(limit = 100): Promise<{ count: number; logs: IAuditLog[] }> {
    const res = await fetch(`${BASE_URL}/audit-logs?limit=${limit}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },
};

export const notificationsApi = {
  async getNotifications(): Promise<{
    count: number;
    unreadCount: number;
    notifications: INotification[];
  }> {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async markAsRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async markAllAsRead(): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },
};

export const dashboardApi = {
  async getAdminDashboard(): Promise<any> {
    const res = await fetch(`${BASE_URL}/dashboard/admin`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getReviewerDashboard(): Promise<any> {
    const res = await fetch(`${BASE_URL}/dashboard/reviewer`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getUploaderDashboard(): Promise<any> {
    const res = await fetch(`${BASE_URL}/dashboard/uploader`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },
};

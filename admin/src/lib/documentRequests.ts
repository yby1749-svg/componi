// 문서 요청 관리 유틸리티 (LocalStorage 기반)

export interface DocumentRequest {
  id: string;           // 고유 토큰 (UUID)
  employeeId: number;
  employeeName: string;
  documentType: string; // 'resume', 'coverLetter', etc.
  documentName: string;
  status: 'PENDING' | 'SUBMITTED';
  createdAt: string;
  submittedAt?: string;
  submittedData?: Record<string, string>; // 작성된 폼 데이터
}

const STORAGE_KEY = 'componi_document_requests';

// UUID 생성
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 모든 요청 가져오기
export function getAllRequests(): DocumentRequest[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// 모든 요청 저장
function saveAllRequests(requests: DocumentRequest[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

// 문서 요청 생성
export function createDocumentRequest(
  employeeId: number,
  employeeName: string,
  documentType: string,
  documentName: string
): DocumentRequest {
  const request: DocumentRequest = {
    id: generateUUID(),
    employeeId,
    employeeName,
    documentType,
    documentName,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  const requests = getAllRequests();
  requests.push(request);
  saveAllRequests(requests);

  return request;
}

// 토큰으로 요청 조회
export function getDocumentRequest(token: string): DocumentRequest | null {
  const requests = getAllRequests();
  return requests.find(r => r.id === token) || null;
}

// 문서 제출
export function submitDocument(token: string, data: Record<string, string>): boolean {
  const requests = getAllRequests();
  const index = requests.findIndex(r => r.id === token);

  if (index === -1) return false;

  requests[index] = {
    ...requests[index],
    status: 'SUBMITTED',
    submittedAt: new Date().toISOString(),
    submittedData: data,
  };

  saveAllRequests(requests);
  return true;
}

// 직원별 제출 문서 조회
export function getEmployeeSubmissions(employeeId: number): DocumentRequest[] {
  const requests = getAllRequests();
  return requests.filter(r => r.employeeId === employeeId && r.status === 'SUBMITTED');
}

// 직원별 대기 중인 요청 조회
export function getEmployeePendingRequests(employeeId: number): DocumentRequest[] {
  const requests = getAllRequests();
  return requests.filter(r => r.employeeId === employeeId && r.status === 'PENDING');
}

// 요청 삭제
export function deleteDocumentRequest(token: string): boolean {
  const requests = getAllRequests();
  const filtered = requests.filter(r => r.id !== token);

  if (filtered.length === requests.length) return false;

  saveAllRequests(filtered);
  return true;
}

// 제출 링크 생성
export function getSubmitUrl(token: string): string {
  if (typeof window === 'undefined') return `/submit/${token}`;
  return `${window.location.origin}/submit/${token}`;
}

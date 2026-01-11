// 문서 템플릿 및 서류 관리 라이브러리
import { PDFGenerator, CompanyInfo } from './pdfGenerator';

export type DocumentCategory = 'CONTRACT' | 'CERTIFICATE' | 'RESUME' | 'OTHER';
export type DocumentStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  category: DocumentCategory;
  fileType: string;
  fileName: string;
  fileData: string; // Base64
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRequest {
  id: string;
  templateId?: string;
  templateName?: string;
  employeeId: number;
  employeeName: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  status: DocumentStatus;
  dueDate?: string;
  sentAt: string;
  submittedAt?: string;
}

export interface DocumentSubmission {
  id: string;
  requestId: string;
  templateId?: string;
  employeeId: number;
  employeeName: string;
  title: string;
  category: DocumentCategory;
  fileName?: string;
  fileData?: string; // Base64
  fileType?: string;
  formData?: Record<string, string>;
  signature?: string;
  submittedAt: string;
  // For backward compatibility with old data
  documentName?: string;
  documentType?: string;
  submittedData?: Record<string, string>;
}

const TEMPLATES_KEY = 'componi_document_templates';
const REQUESTS_KEY = 'componi_doc_requests';
const SUBMISSIONS_KEY = 'componi_doc_submissions';

// 유틸리티 함수
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== 템플릿 관리 ====================

export function getTemplates(): DocumentTemplate[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(TEMPLATES_KEY);
  return data ? JSON.parse(data) : [];
}

export function getTemplatesByCategory(category: DocumentCategory): DocumentTemplate[] {
  return getTemplates().filter(t => t.category === category);
}

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return getTemplates().find(t => t.id === id);
}

export function saveTemplate(template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): DocumentTemplate {
  const templates = getTemplates();
  const now = new Date().toISOString();
  const newTemplate: DocumentTemplate = {
    ...template,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  templates.unshift(newTemplate);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  return newTemplate;
}

export function deleteTemplate(id: string): boolean {
  const templates = getTemplates();
  const filtered = templates.filter(t => t.id !== id);
  if (filtered.length === templates.length) return false;
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
  return true;
}

// ==================== 서류 요청 관리 ====================

export function getRequests(): DocumentRequest[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(REQUESTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getRequestsByEmployee(employeeId: number): DocumentRequest[] {
  return getRequests().filter(r => r.employeeId === employeeId);
}

export function getRequestsByStatus(status: DocumentStatus): DocumentRequest[] {
  return getRequests().filter(r => r.status === status);
}

export function getRequestById(id: string): DocumentRequest | undefined {
  return getRequests().find(r => r.id === id);
}

export function createRequest(request: Omit<DocumentRequest, 'id' | 'status' | 'sentAt'>): DocumentRequest {
  const requests = getRequests();
  const newRequest: DocumentRequest = {
    ...request,
    id: generateId(),
    status: 'PENDING',
    sentAt: new Date().toISOString(),
  };
  requests.unshift(newRequest);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  return newRequest;
}

export function updateRequestStatus(id: string, status: DocumentStatus): boolean {
  const requests = getRequests();
  const index = requests.findIndex(r => r.id === id);
  if (index === -1) return false;

  requests[index].status = status;
  if (status === 'SUBMITTED') {
    requests[index].submittedAt = new Date().toISOString();
  }
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  return true;
}

export function deleteRequest(id: string): boolean {
  const requests = getRequests();
  const filtered = requests.filter(r => r.id !== id);
  if (filtered.length === requests.length) return false;
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(filtered));
  return true;
}

// ==================== 제출물 관리 ====================

export function getSubmissions(): DocumentSubmission[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(SUBMISSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getSubmissionsByEmployee(employeeId: number): DocumentSubmission[] {
  return getSubmissions().filter(s => s.employeeId === employeeId);
}

export function getSubmissionByRequestId(requestId: string): DocumentSubmission | undefined {
  return getSubmissions().find(s => s.requestId === requestId);
}

export function createSubmission(
  submission: Omit<DocumentSubmission, 'id' | 'submittedAt'>
): DocumentSubmission {
  const submissions = getSubmissions();
  const newSubmission: DocumentSubmission = {
    ...submission,
    id: generateId(),
    submittedAt: new Date().toISOString(),
  };
  submissions.unshift(newSubmission);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));

  // 요청 상태도 업데이트
  if (submission.requestId) {
    updateRequestStatus(submission.requestId, 'SUBMITTED');
  }

  return newSubmission;
}

// Alias for saveSubmission
export const saveSubmission = createSubmission;

// ==================== 카테고리 라벨 ====================

export const categoryLabels: Record<DocumentCategory, string> = {
  CONTRACT: '계약서',
  CERTIFICATE: '증명서',
  RESUME: '이력서/자기소개서',
  OTHER: '기타',
};

export const statusLabels: Record<DocumentStatus, string> = {
  PENDING: '대기중',
  SUBMITTED: '제출완료',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

export const statusColors: Record<DocumentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

// ==================== 파일 타입 아이콘 ====================

export function getFileIcon(fileType: string): string {
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return '📕';
  if (type.includes('doc') || type.includes('word')) return '📘';
  if (type.includes('xls') || type.includes('excel') || type.includes('spreadsheet')) return '📗';
  return '📄';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ==================== 데모 데이터 초기화 ====================

// 회사 정보 (데모용)
const defaultCompanyInfo: CompanyInfo = {
  name: '(주)컴포니',
  address: '서울특별시 강남구 테헤란로 123, 컴포니빌딩 15층',
  phone: '02-1234-5678',
  email: 'hr@componi.co.kr',
  ceoName: '김대표',
};

// PDF를 Base64로 변환하는 헬퍼
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return 'data:application/pdf;base64,' + btoa(binary);
}

// 생성 중 플래그 (무한 루프 방지)
let isGenerating = false;

// 비동기 템플릿 생성
export async function generateDemoTemplates(): Promise<void> {
  // 이미 생성 중이면 스킵
  if (isGenerating) {
    console.log('템플릿 생성 중... 스킵');
    return;
  }

  const templates = getTemplates();

  // 템플릿이 1개 이상 있으면 충분 (무한 재생성 방지)
  if (templates.length > 0) {
    console.log(`${templates.length}개 템플릿 존재 - 스킵`);
    return;
  }

  isGenerating = true;
  console.log('템플릿 생성 시작...');

  console.log('PDF 템플릿 생성 시작...');

  try {
    const generator = new PDFGenerator();

    // 1. 이력서 양식
    const resumePdf = await generator.generateResume(defaultCompanyInfo);
    saveTemplate({
      name: '이력서 양식',
      description: '회사 공식 이력서 양식 (PDF 작성 가능)',
      category: 'RESUME',
      fileType: 'pdf',
      fileName: '이력서_양식.pdf',
      fileData: arrayBufferToBase64(resumePdf),
      fileSize: resumePdf.length,
    });
    console.log('✓ 이력서 양식 생성 완료');

    // 2. 자기소개서 양식
    const coverLetterPdf = await generator.generateCoverLetter(defaultCompanyInfo);
    saveTemplate({
      name: '자기소개서 양식',
      description: '회사 표준 자기소개서 양식',
      category: 'RESUME',
      fileType: 'pdf',
      fileName: '자기소개서_양식.pdf',
      fileData: arrayBufferToBase64(coverLetterPdf),
      fileSize: coverLetterPdf.length,
    });
    console.log('✓ 자기소개서 양식 생성 완료');

    // 3. 비밀유지서약서
    const pledgePdf = await generator.generatePledge(defaultCompanyInfo);
    saveTemplate({
      name: '비밀유지서약서',
      description: 'NDA 서약서 양식',
      category: 'CONTRACT',
      fileType: 'pdf',
      fileName: '비밀유지서약서.pdf',
      fileData: arrayBufferToBase64(pledgePdf),
      fileSize: pledgePdf.length,
    });
    console.log('✓ 비밀유지서약서 생성 완료');

    // 4. 사직서 양식
    const resignationPdf = await generator.generateResignation(defaultCompanyInfo);
    saveTemplate({
      name: '사직서 양식',
      description: '퇴직 시 제출하는 사직서',
      category: 'OTHER',
      fileType: 'pdf',
      fileName: '사직서_양식.pdf',
      fileData: arrayBufferToBase64(resignationPdf),
      fileSize: resignationPdf.length,
    });
    console.log('✓ 사직서 양식 생성 완료');

    // 5. 경위서 양식
    const explanationPdf = await generator.generateExplanation(defaultCompanyInfo);
    saveTemplate({
      name: '경위서 양식',
      description: '사건 경위 설명을 위한 양식',
      category: 'OTHER',
      fileType: 'pdf',
      fileName: '경위서_양식.pdf',
      fileData: arrayBufferToBase64(explanationPdf),
      fileSize: explanationPdf.length,
    });
    console.log('✓ 경위서 양식 생성 완료');

    // 6. 개인정보 동의서
    const consentPdf = await generator.generateConsent(defaultCompanyInfo);
    saveTemplate({
      name: '개인정보 동의서',
      description: '개인정보 수집 및 이용 동의서',
      category: 'CONTRACT',
      fileType: 'pdf',
      fileName: '개인정보_동의서.pdf',
      fileData: arrayBufferToBase64(consentPdf),
      fileSize: consentPdf.length,
    });
    console.log('✓ 개인정보 동의서 생성 완료');

    // 7. 확인서 양식
    const testimonyPdf = await generator.generateTestimony(defaultCompanyInfo);
    saveTemplate({
      name: '확인서 양식',
      description: '각종 확인 용도로 사용하는 서류',
      category: 'CERTIFICATE',
      fileType: 'pdf',
      fileName: '확인서_양식.pdf',
      fileData: arrayBufferToBase64(testimonyPdf),
      fileSize: testimonyPdf.length,
    });
    console.log('✓ 확인서 양식 생성 완료');

    // 8. 회의록 양식
    const minutesPdf = await generator.generateMeetingMinutes(defaultCompanyInfo);
    saveTemplate({
      name: '회의록 양식',
      description: '회의 내용 기록 양식',
      category: 'OTHER',
      fileType: 'pdf',
      fileName: '회의록_양식.pdf',
      fileData: arrayBufferToBase64(minutesPdf),
      fileSize: minutesPdf.length,
    });
    console.log('✓ 회의록 양식 생성 완료');

    console.log('✅ 모든 템플릿 생성 완료!');
  } catch (error) {
    console.error('템플릿 생성 중 오류 - 가벼운 버전으로 대체:', error);
    // 실패 시 가벼운 PDF로 대체
    try {
      await createFallbackTemplates();
    } catch (fallbackError) {
      console.error('Fallback 템플릿 생성도 실패:', fallbackError);
    }
  } finally {
    isGenerating = false;
  }
}

// 가벼운 fallback 템플릿 생성
async function createFallbackTemplates(): Promise<void> {
  const templates = [
    { name: '이력서 양식', title: 'Resume Form', category: 'RESUME' as DocumentCategory, desc: '이력서 양식' },
    { name: '자기소개서 양식', title: 'Cover Letter', category: 'RESUME' as DocumentCategory, desc: '자기소개서 양식' },
    { name: '비밀유지서약서', title: 'NDA Agreement', category: 'CONTRACT' as DocumentCategory, desc: 'NDA 서약서' },
    { name: '사직서 양식', title: 'Resignation', category: 'OTHER' as DocumentCategory, desc: '사직서 양식' },
  ];

  for (const t of templates) {
    const pdf = await createSimplePdf(t.title);
    saveTemplate({
      name: t.name,
      description: t.desc,
      category: t.category,
      fileType: 'pdf',
      fileName: `${t.name}.pdf`,
      fileData: arrayBufferToBase64(pdf),
      fileSize: pdf.length,
    });
    console.log(`✓ ${t.name} (fallback) 생성 완료`);
  }
}

// 동기 초기화 (기본값만)
export function initDemoData() {
  // 아무것도 하지 않음 - generateDemoTemplates()를 별도로 호출해야 함
  // 이렇게 하면 비동기 PDF 생성이 완료될 때까지 대기할 수 있음
}

// 간단한 PDF 생성 (폰트 임베딩 없이 가벼운 버전)
async function createSimplePdf(title: string): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]); // A4

  // 제목
  page.drawText(title, {
    x: 50,
    y: 780,
    size: 24,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  // 회사명
  page.drawText('(Componi Co., Ltd.)', {
    x: 50,
    y: 750,
    size: 12,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // 구분선
  page.drawLine({
    start: { x: 50, y: 740 },
    end: { x: 545, y: 740 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  // 안내 텍스트
  page.drawText('This is an official document template.', {
    x: 50,
    y: 700,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText('Please fill in the required information.', {
    x: 50,
    y: 680,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // 입력 필드 라인들
  const fields = ['Name:', 'Department:', 'Position:', 'Date:', 'Signature:'];
  let y = 620;
  for (const field of fields) {
    page.drawText(field, { x: 50, y, size: 11, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawLine({
      start: { x: 150, y: y - 2 },
      end: { x: 400, y: y - 2 },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    });
    y -= 40;
  }

  return pdfDoc.save();
}

// 강제 템플릿 재생성 (기존 템플릿 모두 삭제 후 재생성)
// localStorage 용량 제한으로 가벼운 PDF 사용
export async function forceRegenerateTemplates(): Promise<void> {
  console.log('강제 템플릿 재생성 시작...');

  // localStorage 직접 삭제 (완전 초기화)
  if (typeof window !== 'undefined') {
    localStorage.removeItem('componi_document_templates');
  }

  try {
    // 가벼운 PDF 템플릿 생성 (폰트 임베딩 없음)
    const templates = [
      { name: '이력서 양식', title: 'Resume Form', category: 'RESUME' as DocumentCategory, desc: '회사 공식 이력서 양식' },
      { name: '자기소개서 양식', title: 'Cover Letter', category: 'RESUME' as DocumentCategory, desc: '자기소개서 양식' },
      { name: '비밀유지서약서', title: 'NDA Agreement', category: 'CONTRACT' as DocumentCategory, desc: 'NDA 서약서' },
      { name: '사직서 양식', title: 'Resignation Letter', category: 'OTHER' as DocumentCategory, desc: '퇴직 시 제출하는 사직서' },
    ];

    for (const t of templates) {
      console.log(`${t.name} 생성 중...`);
      const pdf = await createSimplePdf(t.title);
      saveTemplate({
        name: t.name,
        description: t.desc,
        category: t.category,
        fileType: 'pdf',
        fileName: `${t.name}.pdf`,
        fileData: arrayBufferToBase64(pdf),
        fileSize: pdf.length,
      });
      console.log(`✓ ${t.name} 생성 완료 (${Math.round(pdf.length / 1024)}KB)`);
    }

    console.log('✅ 4개 템플릿 재생성 완료!');
  } catch (error) {
    console.error('템플릿 재생성 중 오류:', error);
    throw error;
  }
}

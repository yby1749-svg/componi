// 앱 내 메시지 시스템 (LocalStorage 기반)

export interface Message {
  id: string;
  fromId: number | 'admin';      // 발신자 (admin 또는 직원 ID)
  fromName: string;
  toId: number | 'admin';        // 수신자
  toName: string;
  type: 'document_request' | 'document_submitted' | 'general';
  title: string;
  content: string;
  link?: string;                  // 관련 링크 (문서 작성 페이지 등)
  documentRequestId?: string;     // 관련 문서 요청 ID
  read: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'componi_messages';

// UUID 생성
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 모든 메시지 가져오기
export function getAllMessages(): Message[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// 메시지 저장
function saveAllMessages(messages: Message[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

// 메시지 보내기
export function sendMessage(
  fromId: number | 'admin',
  fromName: string,
  toId: number | 'admin',
  toName: string,
  type: Message['type'],
  title: string,
  content: string,
  link?: string,
  documentRequestId?: string
): Message {
  const message: Message = {
    id: generateUUID(),
    fromId,
    fromName,
    toId,
    toName,
    type,
    title,
    content,
    link,
    documentRequestId,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const messages = getAllMessages();
  messages.unshift(message); // 최신 메시지가 앞에
  saveAllMessages(messages);

  return message;
}

// 직원에게 문서 요청 메시지 보내기
export function sendDocumentRequestMessage(
  employeeId: number,
  employeeName: string,
  documentName: string,
  submitLink: string,
  documentRequestId: string
): Message {
  return sendMessage(
    'admin',
    '인사팀',
    employeeId,
    employeeName,
    'document_request',
    `${documentName} 작성 요청`,
    `안녕하세요, ${employeeName}님.\n\n${documentName} 작성을 요청드립니다.\n아래 버튼을 클릭하여 작성해 주세요.`,
    submitLink,
    documentRequestId
  );
}

// 관리자에게 문서 제출 알림 보내기
export function sendDocumentSubmittedMessage(
  employeeId: number,
  employeeName: string,
  documentName: string
): Message {
  return sendMessage(
    employeeId,
    employeeName,
    'admin',
    '인사팀',
    'document_submitted',
    `${documentName} 제출 완료`,
    `${employeeName}님이 ${documentName}를 제출했습니다.`,
    `/employees/${employeeId}?tab=submissions`
  );
}

// 특정 사용자의 메시지 가져오기
export function getMessagesForUser(userId: number | 'admin'): Message[] {
  const messages = getAllMessages();
  return messages.filter(m => m.toId === userId);
}

// 읽지 않은 메시지 수
export function getUnreadCount(userId: number | 'admin'): number {
  const messages = getMessagesForUser(userId);
  return messages.filter(m => !m.read).length;
}

// 메시지 읽음 처리
export function markAsRead(messageId: string): void {
  const messages = getAllMessages();
  const index = messages.findIndex(m => m.id === messageId);
  if (index !== -1) {
    messages[index].read = true;
    saveAllMessages(messages);
  }
}

// 모든 메시지 읽음 처리
export function markAllAsRead(userId: number | 'admin'): void {
  const messages = getAllMessages();
  messages.forEach(m => {
    if (m.toId === userId) {
      m.read = true;
    }
  });
  saveAllMessages(messages);
}

// 메시지 삭제
export function deleteMessage(messageId: string): void {
  const messages = getAllMessages();
  const filtered = messages.filter(m => m.id !== messageId);
  saveAllMessages(filtered);
}

// 시간 포맷팅
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });
}

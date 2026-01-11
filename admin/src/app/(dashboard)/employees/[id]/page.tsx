'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DocumentTemplate,
  DocumentSubmission,
  getTemplates,
  getSubmissionsByEmployee,
  getRequestsByEmployee,
  createRequest,
  categoryLabels,
  statusLabels,
  statusColors,
  getFileIcon,
  generateDemoTemplates,
  saveSubmission,
} from '@/lib/documentTemplates';
// sendDocumentRequestMessage is now handled via chatMessages.sendMessage
import {
  ChatMessage,
  getMessagesByEmployee,
  sendMessage,
  markMessagesAsRead,
  initDemoChatMessages,
  getUnreadCount,
} from '@/lib/chatMessages';

// Demo employee data
const demoEmployees: Record<number, typeof demoEmployeeBase> = {
  1: {
    id: 1,
    name: '김영희',
    email: 'younghee@componi.app',
    phone: '010-1234-5678',
    department: '개발팀',
    position: '선임',
    status: 'ACTIVE',
    hireDate: '2023-03-15',
    birthDate: '1992-05-20',
    address: '서울특별시 강남구 테헤란로 123',
    emergencyContact: '010-9876-5432 (모)',
    annualLeave: { total: 15, used: 5, remaining: 10 },
    salary: { base: 4000000, bonus: 0, deductions: 520000, net: 3480000 },
    attendance: [
      { date: '2024-01-10', checkIn: '09:02', checkOut: '18:30', status: 'NORMAL' },
      { date: '2024-01-09', checkIn: '08:55', checkOut: '19:15', status: 'NORMAL' },
      { date: '2024-01-08', checkIn: '10:15', checkOut: '18:45', status: 'LATE' },
      { date: '2024-01-05', checkIn: '09:00', checkOut: '18:00', status: 'NORMAL' },
      { date: '2024-01-04', checkIn: '08:45', checkOut: '18:30', status: 'NORMAL' },
    ],
    contracts: [
      { id: 1, title: '2024년 근로계약서', status: 'SIGNED', date: '2024-01-02' },
      { id: 2, title: '비밀유지서약서', status: 'SIGNED', date: '2023-03-15' },
    ],
  },
  5: {
    id: 5,
    name: '김컴포니',
    email: 'componi@componi.app',
    phone: '010-5555-1234',
    department: '인사팀',
    position: '사원',
    status: 'ACTIVE',
    hireDate: '2024-01-15',
    birthDate: '1995-08-10',
    address: '서울특별시 서초구 반포대로 45',
    emergencyContact: '010-5555-5678 (부)',
    annualLeave: { total: 15, used: 0, remaining: 15 },
    salary: { base: 3500000, bonus: 0, deductions: 450000, net: 3050000 },
    attendance: [
      { date: '2024-01-15', checkIn: '08:50', checkOut: '18:00', status: 'NORMAL' },
      { date: '2024-01-16', checkIn: '09:00', checkOut: '18:30', status: 'NORMAL' },
    ],
    contracts: [],
  },
};

const demoEmployeeBase = {
  id: 1,
  name: '김영희',
  email: 'younghee@componi.app',
  phone: '010-1234-5678',
  department: '개발팀',
  position: '선임',
  status: 'ACTIVE',
  hireDate: '2023-03-15',
  birthDate: '1992-05-20',
  address: '서울특별시 강남구 테헤란로 123',
  emergencyContact: '010-9876-5432 (모)',
  annualLeave: { total: 15, used: 5, remaining: 10 },
  salary: { base: 4000000, bonus: 0, deductions: 520000, net: 3480000 },
  attendance: [] as { date: string; checkIn: string; checkOut: string; status: string }[],
  contracts: [] as { id: number; title: string; status: string; date: string }[],
};

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('info');
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<DocumentSubmission | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const prevMessageCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 알림음 재생
  const playNotificationSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkpiZlZGLg3lxbXF3goqRlpiXk42HeXFqZ2t0gIqSmpmXkouCd21oaW54hI+XnJqWkId7cWlnbHSAi5SbmpiSioF2bGdqcHuGj5ednpiSiYB1bGdqcXyGkJiemJSMg3lva2twd4OLkpidl5OLgXdtamtweIWOlpudl5KJgHZsaWtweYWPlpydlpGIf3Vsamt');
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const employeeId = Number(params.id);
  const demoEmployee = demoEmployees[employeeId] || demoEmployees[1];

  // 서류 요청 발송
  const handleSendRequest = async () => {
    if (!selectedTemplateId) return;

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    // 문서 요청 생성
    const request = createRequest({
      templateId: template.id,
      templateName: template.name,
      employeeId: employeeId,
      employeeName: demoEmployee.name,
      title: template.name,
      category: template.category,
    });

    // 백엔드 API로 채팅 메시지 전송 (파일 데이터 포함)
    const messageContent = `${template.name} 작성을 요청드립니다.\n\n아래 첨부된 양식을 작성해 주세요.`;
    const fileData = template.fileData?.split(',')[1] || '';

    await sendMessage({
      senderId: 'admin',
      senderName: '인사팀',
      senderType: 'ADMIN',
      recipientId: employeeId,
      content: messageContent,
      type: 'FILE',
      file: {
        name: template.fileName || `${template.name}.pdf`,
        type: 'application/pdf',
        size: template.fileSize || 0,
        data: fileData,
      },
    });

    setRequestSent(true);
    setTimeout(() => {
      setShowRequestModal(false);
      setSelectedTemplateId(null);
      setRequestSent(false);
    }, 1500);
  };

  useEffect(() => {
    initDemoChatMessages(employeeId, demoEmployee.name);
    // 직원의 제출된 문서 로드
    const loadData = async () => {
      // 템플릿 생성 (비동기)
      await generateDemoTemplates();
      const subs = getSubmissionsByEmployee(employeeId);
      setSubmissions(subs);
      setTemplates(getTemplates());
      const msgs = await getMessagesByEmployee(employeeId);
      setChatMessages(msgs);
      prevMessageCountRef.current = msgs.length;

      // API로 읽지 않은 메시지 수 조회
      const count = await getUnreadCount(employeeId);
      setUnreadCount(count);
    };
    loadData();

    // Poll for new messages every 2 seconds
    const interval = setInterval(async () => {
      const msgs = await getMessagesByEmployee(employeeId);
      const count = await getUnreadCount(employeeId);

      // 새 메시지 감지 (직원이 보낸 메시지만)
      const newEmployeeMsgs = msgs.filter(m => m.senderType === 'EMPLOYEE');
      const prevEmployeeMsgCount = chatMessages.filter(m => m.senderType === 'EMPLOYEE').length;

      if (newEmployeeMsgs.length > prevEmployeeMsgCount) {
        if (activeTab !== 'chat') {
          playNotificationSound();
        }

        // 새로 받은 직원의 파일 메시지 자동 저장
        const prevIds = new Set(chatMessages.filter(m => m.senderType === 'EMPLOYEE').map(m => m.id));
        const newFileMsgs = newEmployeeMsgs.filter(m => m.type === 'FILE' && m.file && !prevIds.has(m.id));

        newFileMsgs.forEach(msg => {
          if (msg.file) {
            saveSubmission({
              requestId: '',
              templateId: '',
              employeeId: employeeId,
              employeeName: demoEmployee.name,
              title: msg.file.name,
              category: 'OTHER',
              fileName: msg.file.name,
              fileData: msg.file.data,
              fileType: msg.file.type,
            });
          }
        });

        // 새 파일이 저장되었으면 제출 서류 목록 갱신
        if (newFileMsgs.length > 0) {
          const subs = getSubmissionsByEmployee(employeeId);
          setSubmissions(subs);
        }
      }

      setUnreadCount(count);
      setChatMessages(msgs);
      prevMessageCountRef.current = msgs.length;
    }, 2000);

    return () => clearInterval(interval);
  }, [employeeId, demoEmployee.name, activeTab, playNotificationSound, chatMessages]);

  const tabs = [
    { id: 'info', label: '기본 정보' },
    { id: 'attendance', label: '출퇴근 기록' },
    { id: 'leave', label: '휴가 현황' },
    { id: 'salary', label: '급여 정보' },
    { id: 'submissions', label: '제출 서류' },
    { id: 'chat', label: '채팅' },
  ];

  // 문서 타입을 한글로 변환
  const getDocumentTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      resume: '이력서',
      coverLetter: '자기소개서',
      pledge: '서약서',
      incident: '경위서',
      apology: '시말서',
      consent: '동의서',
      statement: '진술서',
      explanation: '소명서',
      resignation: '사직서',
    };
    return typeMap[type] || type;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  // 채팅 메시지 전송
  const handleSendChatMessage = async () => {
    if (!newMessage.trim() && !chatFile) return;

    setSendingMessage(true);

    try {
      // 파일이 있는 경우
      if (chatFile) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          await sendMessage({
            senderId: 'admin',
            senderName: '인사팀',
            senderType: 'ADMIN',
            recipientId: employeeId,
            content: newMessage.trim() || `${chatFile.name} 파일을 전송했습니다.`,
            type: 'FILE',
            file: {
              name: chatFile.name,
              type: chatFile.type,
              size: chatFile.size,
              data: base64,
            },
          });

          const msgs = await getMessagesByEmployee(employeeId);
          setChatMessages(msgs);
          setNewMessage('');
          setChatFile(null);
          setSendingMessage(false);
        };
        reader.readAsDataURL(chatFile);
      } else {
        // 텍스트만 전송
        await sendMessage({
          senderId: 'admin',
          senderName: '인사팀',
          senderType: 'ADMIN',
          recipientId: employeeId,
          content: newMessage.trim(),
          type: 'TEXT',
        });

        const msgs = await getMessagesByEmployee(employeeId);
        setChatMessages(msgs);
        setNewMessage('');
        setSendingMessage(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setSendingMessage(false);
    }
  };

  // 채팅 파일 첨부
  const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setChatFile(file);
    }
  };

  // 템플릿 선택해서 보내기
  const handleSelectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setShowTemplatePicker(false);
  };

  // 템플릿 전송
  const handleSendTemplate = async () => {
    if (!selectedTemplate) return;

    // 파일 데이터가 없으면 경고
    if (!selectedTemplate.fileData || selectedTemplate.fileData.length === 0) {
      alert('이 템플릿에 파일이 업로드되지 않았습니다.\n\n필요서류 관리에서 실제 파일을 업로드한 후 다시 시도해주세요.');
      setSelectedTemplate(null);
      return;
    }

    setSendingMessage(true);
    try {
      // Strip data URL prefix if present (e.g., "data:application/pdf;base64,")
      const fileData = selectedTemplate.fileData.includes(',')
        ? selectedTemplate.fileData.split(',')[1]
        : selectedTemplate.fileData;

      await sendMessage({
        senderId: 'admin',
        senderName: '인사팀',
        senderType: 'ADMIN',
        recipientId: employeeId,
        content: `📋 ${selectedTemplate.name} 서류를 보냅니다.`,
        type: 'FILE',
        file: {
          name: selectedTemplate.fileName,
          type: selectedTemplate.fileType === 'pdf' ? 'application/pdf' :
                selectedTemplate.fileType === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                selectedTemplate.fileType === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                'application/octet-stream',
          size: fileData ? Math.ceil(fileData.length * 0.75) : 0,
          data: fileData,
        },
      });

      // 서류 요청도 함께 생성
      createRequest({
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        employeeId: employeeId,
        employeeName: demoEmployee.name,
        title: selectedTemplate.name,
        category: selectedTemplate.category,
      });

      const msgs = await getMessagesByEmployee(employeeId);
      setChatMessages(msgs);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to send template:', error);
    }
    setSendingMessage(false);
  };

  // 받은 파일을 제출서류로 저장
  const saveToSubmissions = (message: ChatMessage) => {
    if (!message || message.type !== 'FILE' || !message.file) {
      alert('오류: 파일이 없습니다');
      return;
    }

    try {
      // 파일 데이터는 저장하지 않음 (용량 문제) - 메시지 ID만 참조
      const submissionData = {
        requestId: '',
        templateId: '',
        employeeId: employeeId,
        employeeName: demoEmployee.name,
        title: message.file.name.replace(/\.[^/.]+$/, ''),
        category: (message.file.name.includes('이력서') ? 'RESUME' :
                  message.file.name.includes('계약') ? 'CONTRACT' :
                  message.file.name.includes('증명') ? 'CERTIFICATE' : 'OTHER') as 'RESUME' | 'CONTRACT' | 'CERTIFICATE' | 'OTHER',
        fileName: message.file.name,
        fileData: '', // 용량 문제로 파일 데이터는 저장하지 않음
        fileType: message.file.type,
        messageId: message.id, // 원본 메시지 참조용
      };

      const result = saveSubmission(submissionData);

      // 제출 서류 목록 갱신
      const subs = getSubmissionsByEmployee(employeeId);
      setSubmissions(subs);

      alert(`제출 서류에 저장되었습니다!\n\n파일명: ${message.file.name}`);
    } catch (error) {
      console.error('Save error:', error);
      // localStorage 용량 초과 시 오래된 데이터 정리 시도
      if ((error as Error).message.includes('quota')) {
        const clearOld = confirm('저장 공간이 부족합니다. 오래된 데이터를 정리할까요?');
        if (clearOld) {
          localStorage.removeItem('componi_document_templates');
          alert('오래된 데이터를 정리했습니다. 다시 시도해주세요.');
        }
      } else {
        alert('저장 중 오류가 발생했습니다: ' + (error as Error).message);
      }
    }
  };

  // 파일 다운로드
  const downloadFile = (file: ChatMessage['file']) => {
    if (!file) return;

    const link = document.createElement('a');
    link.href = `data:${file.type};base64,${file.data}`;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 채팅 시간 포맷
  const formatChatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{demoEmployee.name.charAt(0)}</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-6 h-6 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5 animate-pulse border-2 border-white dark:border-gray-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{demoEmployee.name}</h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-full animate-pulse">
                    {unreadCount}개 새 메시지
                  </span>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400">{demoEmployee.email} · {demoEmployee.department} · {demoEmployee.position}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            수정
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-4">
        <span className={`px-3 py-1 text-sm rounded-full ${
          demoEmployee.status === 'ACTIVE'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        }`}>
          {demoEmployee.status === 'ACTIVE' ? '재직중' : '대기'}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          입사일: {demoEmployee.hireDate}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'chat') {
                  setUnreadCount(0);
                  markMessagesAsRead(employeeId);
                }
              }}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors relative ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'chat' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">개인 정보</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">이메일</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">연락처</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">생년월일</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.birthDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">주소</span>
                <span className="text-gray-900 dark:text-white text-right max-w-[200px]">{demoEmployee.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">비상연락처</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.emergencyContact}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">근무 정보</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">부서</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">직급</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">입사일</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.hireDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">근속 기간</span>
                <span className="text-gray-900 dark:text-white">10개월</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">날짜</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">출근</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">퇴근</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {demoEmployee.attendance.map((record) => (
                  <tr key={record.date} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{record.date}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{record.checkIn}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{record.checkOut}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        record.status === 'NORMAL'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {record.status === 'NORMAL' ? '정상' : '지각'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">총 연차</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{demoEmployee.annualLeave.total}일</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">사용 연차</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{demoEmployee.annualLeave.used}일</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">잔여 연차</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{demoEmployee.annualLeave.remaining}일</p>
          </div>
        </div>
      )}

      {activeTab === 'salary' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">2024년 1월 급여</h3>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">기본급</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(demoEmployee.salary.base)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">상여금</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(demoEmployee.salary.bonus)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">공제액</span>
              <span className="text-red-600 dark:text-red-400 font-medium">-{formatCurrency(demoEmployee.salary.deductions)}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-900 dark:text-white font-semibold">실수령액</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">{formatCurrency(demoEmployee.salary.net)}</span>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              급여 명세서 발송
            </button>
            <button className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              PDF 다운로드
            </button>
          </div>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {submissions.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">제출된 서류가 없습니다</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                위의 "서류 요청" 버튼으로 서류를 요청할 수 있습니다
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">카테고리</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">서류명</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">파일</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">제출일</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {categoryLabels[sub.category]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">{sub.title}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {sub.fileName || (sub.formData ? '양식 데이터' : '-')}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {formatDate(sub.submittedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 채팅 탭 */}
      {activeTab === 'chat' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col relative" style={{ height: '600px' }}>
          {/* 채팅 헤더 */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
              {demoEmployee.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{demoEmployee.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{demoEmployee.department} · {demoEmployee.position}</p>
            </div>
          </div>

          {/* 채팅 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>대화를 시작하세요</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${msg.senderType === 'ADMIN' ? 'order-2' : ''}`}>
                    {msg.senderType === 'EMPLOYEE' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">{msg.senderName}</p>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        msg.senderType === 'ADMIN'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md shadow-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.type === 'FILE' && msg.file && (
                        <div className={`mt-2 p-2 rounded-lg flex items-center gap-2 ${
                          msg.senderType === 'ADMIN' ? 'bg-blue-500/30' : 'bg-gray-100 dark:bg-gray-600'
                        }`}>
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-xs truncate flex-1">{msg.file.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              downloadFile(msg.file);
                            }}
                            className={`p-1.5 rounded hover:bg-black/10 flex flex-col items-center gap-0.5 ${msg.senderType === 'ADMIN' ? 'text-white' : 'text-blue-600'}`}
                            title="컴퓨터에 저장"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="text-[9px] whitespace-nowrap">저장</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log('Button clicked!', msg);
                              alert('버튼 클릭됨! 파일명: ' + (msg.file?.name || 'unknown'));
                              saveToSubmissions(msg);
                            }}
                            className={`p-1.5 rounded hover:bg-black/10 flex flex-col items-center gap-0.5 cursor-pointer ${msg.senderType === 'ADMIN' ? 'text-green-300 hover:text-green-200' : 'text-green-600 hover:text-green-500'}`}
                            title="제출서류에 저장"
                            style={{ zIndex: 100 }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span className="text-[9px] whitespace-nowrap">제출함</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <p className={`text-xs text-gray-400 mt-1 ${msg.senderType === 'ADMIN' ? 'text-right mr-1' : 'ml-1'}`}>
                      {formatChatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 첨부 파일 미리보기 */}
          {chatFile && (
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-sm text-blue-600 truncate flex-1">{chatFile.name}</span>
              <button
                onClick={() => setChatFile(null)}
                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
              >
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* 선택된 템플릿 미리보기 */}
          {selectedTemplate && (
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 flex items-center gap-2">
              <span className="text-lg">{getFileIcon(selectedTemplate.fileType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 truncate">{selectedTemplate.name}</p>
                <p className="text-xs text-green-600 dark:text-green-500">{categoryLabels[selectedTemplate.category]}</p>
              </div>
              <button
                onClick={handleSendTemplate}
                disabled={sendingMessage}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                전송
              </button>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded"
              >
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* 템플릿 선택 드롭다운 */}
          {showTemplatePicker && (
            <div className="absolute bottom-20 left-4 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-hidden">
              <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h4 className="font-semibold text-gray-900 dark:text-white">📋 필요서류 선택</h4>
                <button
                  onClick={() => setShowTemplatePicker(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto max-h-48">
                {templates.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500 text-center">등록된 서류 템플릿이 없습니다.</p>
                ) : (
                  templates.map((template) => {
                    const hasFile = template.fileData && template.fileData.length > 0;
                    return (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${!hasFile ? 'opacity-60' : ''}`}
                      >
                        <span className="text-xl">{getFileIcon(template.fileType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{template.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {categoryLabels[template.category]}
                            {!hasFile && <span className="text-red-500 ml-1">(파일 없음)</span>}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 입력 영역 */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 relative">
            <div className="relative">
              <button
                onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                className={`p-2 rounded-lg transition-colors ${showTemplatePicker ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'}`}
                title="필요서류 선택"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
            <label className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
              <input
                type="file"
                className="hidden"
                onChange={handleChatFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp,.jpg,.jpeg,.png"
              />
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </label>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChatMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendChatMessage}
              disabled={sendingMessage || (!newMessage.trim() && !chatFile)}
              className={`p-2 rounded-full transition-colors ${
                sendingMessage || (!newMessage.trim() && !chatFile)
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {sendingMessage ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 제출 문서 상세보기 모달 */}
      {selectedSubmission && (() => {
        // Find file from chat messages
        const fileMsg = chatMessages.find(m =>
          m.type === 'FILE' && m.file?.name === selectedSubmission.fileName
        );
        const fileData = fileMsg?.file?.data;
        const fileType = selectedSubmission.fileType || fileMsg?.file?.type || '';
        const isPdf = fileType.includes('pdf');
        const isImage = fileType.includes('image');

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedSubmission.title || selectedSubmission.fileName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {categoryLabels[selectedSubmission.category]} · 제출일: {formatDate(selectedSubmission.submittedAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* File Preview */}
              <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
                {fileData ? (
                  isPdf ? (
                    <iframe
                      src={`data:application/pdf;base64,${fileData}`}
                      className="w-full h-full min-h-[500px]"
                      title={selectedSubmission.fileName}
                    />
                  ) : isImage ? (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <img
                        src={`data:${fileType};base64,${fileData}`}
                        alt={selectedSubmission.fileName}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-gray-500">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">{selectedSubmission.fileName}</p>
                      <p className="text-sm mt-1">미리보기를 지원하지 않는 파일 형식입니다</p>
                      <button
                        onClick={() => fileMsg?.file && downloadFile(fileMsg.file)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        다운로드
                      </button>
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-gray-500 min-h-[300px]">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-lg font-medium">파일을 찾을 수 없습니다</p>
                    <p className="text-sm mt-1">채팅 탭에서 원본 파일을 확인하세요</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
                {fileData && (
                  <button
                    onClick={() => fileMsg?.file && downloadFile(fileMsg.file)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    다운로드
                  </button>
                )}
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 서류 요청 모달 */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md overflow-hidden shadow-xl max-h-[80vh] flex flex-col">
            {requestSent ? (
              // 발송 완료 상태
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">전송 완료!</h3>
                <p className="text-sm text-gray-500 mt-1">{demoEmployee.name}님에게 요청을 보냈습니다</p>
              </div>
            ) : (
              // 서류 선택 상태
              <>
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">서류 요청</h3>
                  <p className="text-sm text-gray-500 mt-1">{demoEmployee.name}님에게 요청할 서류 템플릿을 선택하세요</p>
                </div>
                <div className="p-4 space-y-2 overflow-y-auto flex-1">
                  {templates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>등록된 템플릿이 없습니다.</p>
                      <Link href="/documents" className="text-blue-600 text-sm mt-2 inline-block">
                        필요서류 관리에서 템플릿 추가하기
                      </Link>
                    </div>
                  ) : (
                    templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplateId(template.id)}
                        className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
                          selectedTemplateId === template.id
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                            : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                        }`}
                      >
                        <span className="text-2xl">{getFileIcon(template.fileType)}</span>
                        <div className="flex-1 min-w-0">
                          <span className={`font-medium block ${selectedTemplateId === template.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                            {template.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {categoryLabels[template.category]} · {template.fileType.toUpperCase()}
                          </span>
                        </div>
                        {selectedTemplateId === template.id && (
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setSelectedTemplateId(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSendRequest}
                    disabled={!selectedTemplateId || templates.length === 0}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                      selectedTemplateId
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    요청 보내기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

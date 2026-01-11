'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DocumentTemplate,
  DocumentRequest,
  DocumentSubmission,
  DocumentCategory,
  getTemplates,
  saveTemplate,
  deleteTemplate,
  getRequests,
  createRequest,
  getSubmissions,
  getSubmissionsByEmployee,
  categoryLabels,
  statusLabels,
  statusColors,
  getFileIcon,
  formatFileSize,
  generateDemoTemplates,
  forceRegenerateTemplates,
} from '@/lib/documentTemplates';
import { sendMessage as sendChatMessage } from '@/lib/chatMessages';

type TabType = 'templates' | 'contracts' | 'certificates' | 'submissions';

// 데모 직원 데이터 (모바일 앱과 ID 일치 필요: 김영희 = id 1)
const demoEmployees = [
  { id: 1, name: '김영희', department: '개발팀', position: '선임' },
  { id: 2, name: '이영희', department: '디자인팀', position: '팀장' },
  { id: 3, name: '박지훈', department: '마케팅팀', position: '대리' },
  { id: 4, name: '정수진', department: '인사팀', position: '사원' },
  { id: 5, name: '최동욱', department: '개발팀', position: '주임' },
];

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 업로드 관련
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('CONTRACT');
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // 서류 전송 모달
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [sendDueDate, setSendDueDate] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    const init = async () => {
      try {
        // 템플릿 생성 (비동기) - 타임아웃 10초
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Template generation timeout')), 10000)
        );
        await Promise.race([generateDemoTemplates(), timeoutPromise]);
      } catch (error) {
        console.error('템플릿 생성 오류:', error);
      }
      loadData();
    };
    init();
  }, []);

  const loadData = () => {
    setIsLoading(true);
    setTemplates(getTemplates());
    setRequests(getRequests());
    setSubmissions(getSubmissions());
    setIsLoading(false);
  };

  // 템플릿 강제 재생성
  const handleRegenerate = async () => {
    if (isRegenerating) return;

    if (!confirm('모든 템플릿을 삭제하고 새로 생성합니다. 계속하시겠습니까?')) {
      return;
    }

    setIsRegenerating(true);
    try {
      await forceRegenerateTemplates();
      loadData();
      alert('템플릿이 성공적으로 재생성되었습니다!');
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      alert(`템플릿 생성 중 오류가 발생했습니다.\n\n오류: ${errorMessage}`);
      console.error('템플릿 재생성 오류:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = async (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('지원하지 않는 파일 형식입니다. (PDF, Word, Excel만 가능)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const fileType = file.name.split('.').pop() || '';

      saveTemplate({
        name: uploadName || file.name.replace(/\.[^/.]+$/, ''),
        description: uploadDescription,
        category: uploadCategory,
        fileType,
        fileName: file.name,
        fileData: base64,
        fileSize: file.size,
      });

      loadData();
      setUploadName('');
      setUploadDescription('');
      alert('템플릿이 업로드되었습니다.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('이 템플릿을 삭제하시겠습니까?')) {
      deleteTemplate(id);
      loadData();
    }
  };

  // 서류 전송
  const handleSendDocument = async () => {
    if (!selectedTemplate || !selectedEmployeeId) {
      alert('템플릿과 직원을 선택해주세요.');
      return;
    }

    const employee = demoEmployees.find(e => e.id === selectedEmployeeId);
    if (!employee) return;

    const request = createRequest({
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      employeeId: employee.id,
      employeeName: employee.name,
      title: selectedTemplate.name,
      description: sendMessage,
      category: selectedTemplate.category,
      dueDate: sendDueDate || undefined,
    });

    // 백엔드 API로 채팅 메시지 전송 (파일 데이터 포함)
    const messageContent = `${selectedTemplate.name} 작성을 요청드립니다.\n\n${sendMessage || '아래 첨부된 양식을 작성해 주세요.'}`;

    // 파일 데이터 추출 (base64 데이터 부분만)
    const fileData = selectedTemplate.fileData?.split(',')[1] || '';

    await sendChatMessage({
      senderId: 'admin',
      senderName: '인사팀',
      senderType: 'ADMIN',
      recipientId: employee.id,
      content: messageContent,
      type: 'FILE',
      file: {
        name: selectedTemplate.fileName || `${selectedTemplate.name}.pdf`,
        type: 'application/pdf',
        size: selectedTemplate.fileSize || 0,
        data: fileData,
      },
    });

    loadData();
    setShowSendModal(false);
    setSelectedTemplate(null);
    setSelectedEmployeeId(null);
    setSendDueDate('');
    setSendMessage('');
    alert(`${employee.name}님에게 서류 요청을 보냈습니다.`);
  };

  // 필터링된 직원 목록
  const filteredEmployees = demoEmployees.filter(e =>
    e.name.includes(employeeSearch) || e.department.includes(employeeSearch)
  );

  // 카테고리별 필터링
  const contractTemplates = templates.filter(t => t.category === 'CONTRACT');
  const certificateTemplates = templates.filter(t => t.category === 'CERTIFICATE');
  const contractRequests = requests.filter(r => r.category === 'CONTRACT');
  const certificateRequests = requests.filter(r => r.category === 'CERTIFICATE');

  const tabs = [
    { id: 'templates' as TabType, label: '서류 템플릿', count: templates.length },
    { id: 'contracts' as TabType, label: '계약서', count: contractRequests.length },
    { id: 'certificates' as TabType, label: '증명서', count: certificateRequests.length },
    { id: 'submissions' as TabType, label: '제출현황', count: submissions.length },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">필요서류 관리</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            서류 템플릿 업로드, 계약서/증명서 관리, 제출현황 확인
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRegenerating ? (
            <>
              <span className="animate-spin">⏳</span>
              생성 중...
            </>
          ) : (
            <>
              🔄 템플릿 재생성
            </>
          )}
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* 템플릿 탭 */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* 업로드 영역 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">서류 템플릿 업로드</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  카테고리
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  템플릿 이름 (선택)
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="파일명이 기본값"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명 (선택)
                </label>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="템플릿 설명"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* 드래그 앤 드롭 영역 */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <div className="text-4xl mb-2">📁</div>
              <p className="text-gray-600 dark:text-gray-400">
                파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                PDF, Word, Excel 파일 지원
              </p>
            </div>
          </div>

          {/* 템플릿 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">등록된 템플릿</h2>
            </div>

            {templates.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                등록된 템플릿이 없습니다. 위에서 파일을 업로드해주세요.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      템플릿명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      카테고리
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      파일형식
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      크기
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      등록일
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {templates.map(template => (
                    <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(template.fileType)}</span>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{template.name}</p>
                            {template.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-300">
                          {categoryLabels[template.category]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 uppercase">
                        {template.fileType}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {formatFileSize(template.fileSize)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {new Date(template.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowSendModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 mr-3"
                        >
                          전송
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 계약서 탭 */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">계약서 관리</h2>
              <button
                onClick={() => {
                  setUploadCategory('CONTRACT');
                  setActiveTab('templates');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                계약서 템플릿 추가
              </button>
            </div>

            {/* 계약서 템플릿 목록 */}
            <div className="p-6">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">등록된 계약서 템플릿</h3>
              {contractTemplates.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">등록된 계약서 템플릿이 없습니다.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contractTemplates.map(template => (
                    <div
                      key={template.id}
                      className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getFileIcon(template.fileType)}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{template.name}</p>
                          <p className="text-sm text-gray-500">{template.fileType.toUpperCase()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowSendModal(true);
                        }}
                        className="w-full mt-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        직원에게 전송
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 계약서 요청 현황 */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">계약서 전송 현황</h3>
              {contractRequests.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">전송된 계약서가 없습니다.</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">직원명</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">서류명</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">전송일</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">마감일</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {contractRequests.map(req => (
                      <tr key={req.id}>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{req.employeeName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{req.title}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {new Date(req.sentAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {req.dueDate ? new Date(req.dueDate).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[req.status]}`}>
                            {statusLabels[req.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 증명서 탭 */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">증명서 관리</h2>
              <button
                onClick={() => {
                  setUploadCategory('CERTIFICATE');
                  setActiveTab('templates');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                증명서 템플릿 추가
              </button>
            </div>

            {/* 증명서 템플릿 목록 */}
            <div className="p-6">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">등록된 증명서 템플릿</h3>
              {certificateTemplates.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">등록된 증명서 템플릿이 없습니다.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certificateTemplates.map(template => (
                    <div
                      key={template.id}
                      className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getFileIcon(template.fileType)}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{template.name}</p>
                          <p className="text-sm text-gray-500">{template.fileType.toUpperCase()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowSendModal(true);
                        }}
                        className="w-full mt-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        직원에게 전송
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 증명서 요청 현황 */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">증명서 전송 현황</h3>
              {certificateRequests.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">전송된 증명서 요청이 없습니다.</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">직원명</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">서류명</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">전송일</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">마감일</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {certificateRequests.map(req => (
                      <tr key={req.id}>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{req.employeeName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{req.title}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {new Date(req.sentAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {req.dueDate ? new Date(req.dueDate).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[req.status]}`}>
                            {statusLabels[req.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 제출현황 탭 */}
      {activeTab === 'submissions' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">전체 제출 현황</h2>
          </div>

          {submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              제출된 서류가 없습니다.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    직원명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    서류명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    제출일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    파일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {submissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{sub.employeeName}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{sub.title}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-300">
                        {categoryLabels[sub.category]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {new Date(sub.submittedAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {sub.fileName || (sub.formData ? '양식 데이터' : '-')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                        보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 서류 전송 모달 */}
      {showSendModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">서류 전송</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                "{selectedTemplate.name}" 서류를 직원에게 전송합니다.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* 직원 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  직원 선택 *
                </label>
                <input
                  type="text"
                  placeholder="이름 또는 부서 검색..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
                />
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                  {filteredEmployees.map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center ${
                        selectedEmployeeId === emp.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                    >
                      <span className="text-gray-900 dark:text-white">{emp.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{emp.department}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 마감일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  마감일 (선택)
                </label>
                <input
                  type="date"
                  value={sendDueDate}
                  onChange={(e) => setSendDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* 메시지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  메시지 (선택)
                </label>
                <textarea
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  placeholder="직원에게 전달할 메시지..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setSelectedTemplate(null);
                  setSelectedEmployeeId(null);
                  setSendDueDate('');
                  setSendMessage('');
                  setEmployeeSearch('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleSendDocument}
                disabled={!selectedEmployeeId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

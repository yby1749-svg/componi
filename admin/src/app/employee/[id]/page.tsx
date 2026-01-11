'use client';

import { useState, useEffect, use } from 'react';
import { getMessagesForUser, markAsRead, formatMessageTime, type Message } from '@/lib/messages';

// 직원 정보 (데모)
const employees: Record<number, { name: string; department: string }> = {
  1: { name: '김영희', department: '개발팀' },
  2: { name: '이철수', department: '개발팀' },
  3: { name: '박지민', department: '디자인팀' },
  4: { name: '임재현', department: '마케팅팀' },
  5: { name: '김컴포니', department: '인사팀' },
};

export default function EmployeePortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const employeeId = Number(id);
  const employee = employees[employeeId];

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    const loadMessages = () => {
      const msgs = getMessagesForUser(employeeId);
      setMessages(msgs);
    };
    loadMessages();

    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [employeeId]);

  const unreadMessages = messages.filter(m => !m.read);
  const pendingRequests = messages.filter(m => m.type === 'document_request' && !m.read);

  const handleOpenMessage = (message: Message) => {
    markAsRead(message.id);
    setMessages(messages.map(m => m.id === message.id ? { ...m, read: true } : m));
    setSelectedMessage(message);
  };

  const handleStartForm = (link: string) => {
    window.location.href = link;
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">직원을 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Componi</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">직원 포털</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">{employee.name.charAt(0)}</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{employee.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{employee.department}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* 대기 중인 서류 요청 - 가장 눈에 띄게 */}
        {pendingRequests.length > 0 && (
          <div className="bg-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold">서류 작성 요청</h2>
                <p className="text-blue-100 text-sm">{pendingRequests.length}개의 서류를 작성해 주세요</p>
              </div>
            </div>
            <div className="space-y-3">
              {pendingRequests.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => msg.link && handleStartForm(msg.link)}
                  className="w-full bg-white text-gray-900 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <p className="font-medium">{msg.title.replace(' 작성 요청', '')}</p>
                    <p className="text-sm text-gray-500">{formatMessageTime(msg.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <span className="font-medium">작성하기</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 알림 없을 때 */}
        {pendingRequests.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">모든 서류 완료!</h3>
            <p className="text-gray-500 dark:text-gray-400">현재 작성할 서류가 없습니다</p>
          </div>
        )}

        {/* 최근 메시지 */}
        {messages.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">최근 알림</h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
              {messages.slice(0, 5).map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!msg.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => handleOpenMessage(msg)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.type === 'document_request' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      }`}>
                        {msg.type === 'document_request' ? '📋' : '✅'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${!msg.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {msg.title}
                          </p>
                          {!msg.read && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{msg.fromName}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatMessageTime(msg.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 메시지 상세 모달 */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedMessage.title}</h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedMessage.fromName} · {formatMessageTime(selectedMessage.createdAt)}
              </p>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{selectedMessage.content}</p>
            </div>
            {selectedMessage.link && (
              <div className="p-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => selectedMessage.link && handleStartForm(selectedMessage.link)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  서류 작성하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

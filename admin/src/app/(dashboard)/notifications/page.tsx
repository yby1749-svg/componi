'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllMessages,
  getMessagesForUser,
  markAsRead,
  markAllAsRead,
  formatMessageTime,
  type Message
} from '@/lib/messages';

// 직원 목록 (데모)
const employees = [
  { id: 5, name: '김컴포니', department: '인사팀' },
  { id: 1, name: '김영희', department: '개발팀' },
  { id: 2, name: '이철수', department: '개발팀' },
  { id: 3, name: '박지민', department: '디자인팀' },
  { id: 4, name: '임재현', department: '마케팅팀' },
];

type ViewMode = 'admin' | number; // admin 또는 직원 ID

export default function NotificationsPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('admin');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // 메시지 로드
  useEffect(() => {
    const loadMessages = () => {
      const msgs = getMessagesForUser(viewMode);
      setMessages(msgs);
    };
    loadMessages();

    // 3초마다 새로고침
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [viewMode]);

  const filteredMessages = messages.filter(m => {
    if (selectedFilter === 'unread') return !m.read;
    return true;
  });

  const unreadCount = messages.filter(m => !m.read).length;

  const handleMarkAsRead = (messageId: string) => {
    markAsRead(messageId);
    setMessages(messages.map(m =>
      m.id === messageId ? { ...m, read: true } : m
    ));
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead(viewMode);
    setMessages(messages.map(m => ({ ...m, read: true })));
  };

  const handleOpenMessage = (message: Message) => {
    handleMarkAsRead(message.id);
    setSelectedMessage(message);
  };

  const handleAction = (message: Message) => {
    if (message.link) {
      if (message.link.startsWith('http')) {
        window.open(message.link, '_blank');
      } else {
        router.push(message.link);
      }
    }
    setSelectedMessage(null);
  };

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'document_request':
        return { icon: '📋', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' };
      case 'document_submitted':
        return { icon: '✅', color: 'bg-green-100 dark:bg-green-900/30 text-green-600' };
      default:
        return { icon: '💬', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">메시지함</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 메시지` : '모든 메시지를 확인했습니다'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
          >
            모두 읽음 처리
          </button>
        )}
      </div>

      {/* View Mode Selector - 관리자/직원 시점 전환 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">메시지함 보기</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode('admin')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            관리자 (인사팀)
          </button>
          {employees.map(emp => (
            <button
              key={emp.id}
              onClick={() => setViewMode(emp.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === emp.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {emp.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {viewMode === 'admin' ? '직원들이 보낸 메시지를 확인합니다' : `${employees.find(e => e.id === viewMode)?.name}님의 받은 메시지를 확인합니다`}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          전체 ({messages.length})
        </button>
        <button
          onClick={() => setSelectedFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedFilter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          읽지 않음 ({unreadCount})
        </button>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {filteredMessages.map((message) => {
          const { icon, color } = getMessageIcon(message.type);
          return (
            <div
              key={message.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border transition-all cursor-pointer hover:shadow-md ${
                message.read
                  ? 'border-gray-100 dark:border-gray-700'
                  : 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
              }`}
              onClick={() => handleOpenMessage(message)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                  <span className="text-lg">{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${message.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                          {message.title}
                        </h3>
                        {!message.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {message.fromName} → {message.toName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                  {message.type === 'document_request' && message.link && (
                    <div className="mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (message.link) {
                            window.open(message.link, '_blank');
                          }
                        }}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        서류 작성하기
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredMessages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              {viewMode === 'admin' ? '받은 메시지가 없습니다' : '메시지가 없습니다'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {viewMode === 'admin'
                ? '직원이 서류를 제출하면 여기에 알림이 표시됩니다'
                : '인사팀에서 서류 요청을 보내면 여기에 표시됩니다'}
            </p>
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedMessage.title}
                </h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {selectedMessage.fromName} → {selectedMessage.toName} · {formatMessageTime(selectedMessage.createdAt)}
              </p>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {selectedMessage.content}
              </p>
            </div>
            {selectedMessage.link && (
              <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                <button
                  onClick={() => handleAction(selectedMessage)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {selectedMessage.type === 'document_request' ? '서류 작성하기' : '확인하기'}
                </button>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200"
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

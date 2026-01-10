'use client';

import { useState } from 'react';

// Demo notifications data
const demoNotifications = [
  { id: 1, type: 'leave', title: '휴가 신청', message: '김영희님이 연차를 신청했습니다.', time: '10분 전', read: false, actionRequired: true },
  { id: 2, type: 'attendance', title: '지각 알림', message: '박지민님이 10:15에 출근하였습니다. (지각)', time: '30분 전', read: false, actionRequired: false },
  { id: 3, type: 'contract', title: '계약서 서명 완료', message: '윤서연님이 2024년 근로계약서에 서명했습니다.', time: '1시간 전', read: true, actionRequired: false },
  { id: 4, type: 'certificate', title: '증명서 신청', message: '최민수님이 재직증명서를 신청했습니다.', time: '2시간 전', read: true, actionRequired: true },
  { id: 5, type: 'leave', title: '휴가 승인 필요', message: '이철수님의 반차 신청이 대기 중입니다.', time: '3시간 전', read: true, actionRequired: true },
  { id: 6, type: 'system', title: '시스템 알림', message: '급여 지급일이 3일 남았습니다.', time: '5시간 전', read: true, actionRequired: false },
  { id: 7, type: 'attendance', title: '결근 알림', message: '임재현님이 오늘 출근하지 않았습니다.', time: '어제', read: true, actionRequired: true },
  { id: 8, type: 'leave', title: '휴가 신청', message: '정수진님이 연차를 신청했습니다. (1/22~1/24)', time: '어제', read: true, actionRequired: false },
];

const notificationTypes = [
  { id: 'all', label: '전체', count: demoNotifications.length },
  { id: 'unread', label: '읽지 않음', count: demoNotifications.filter(n => !n.read).length },
  { id: 'action', label: '조치 필요', count: demoNotifications.filter(n => n.actionRequired).length },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'leave': return { icon: '📅', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' };
    case 'attendance': return { icon: '⏰', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' };
    case 'contract': return { icon: '📝', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' };
    case 'certificate': return { icon: '📄', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' };
    case 'system': return { icon: '⚙️', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' };
    default: return { icon: '🔔', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' };
  }
};

export default function NotificationsPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [notifications, setNotifications] = useState(demoNotifications);

  const filteredNotifications = notifications.filter(n => {
    if (selectedFilter === 'unread') return !n.read;
    if (selectedFilter === 'action') return n.actionRequired;
    return true;
  });

  const handleMarkAsRead = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">알림 센터</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림` : '모든 알림을 확인했습니다'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            모두 읽음 처리
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {notificationTypes.map((type) => {
          const count = type.id === 'all' ? notifications.length :
                       type.id === 'unread' ? notifications.filter(n => !n.read).length :
                       notifications.filter(n => n.actionRequired).length;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedFilter(type.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedFilter === type.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type.label}
              {count > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  selectedFilter === type.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => {
          const { icon, color } = getNotificationIcon(notification.type);
          return (
            <div
              key={notification.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border transition-all cursor-pointer hover:shadow-md ${
                notification.read
                  ? 'border-gray-100 dark:border-gray-700'
                  : 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
              }`}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                  <span className="text-lg">{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                        {notification.actionRequired && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                            조치 필요
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{notification.time}</span>
                  </div>
                  {notification.actionRequired && (
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        확인하기
                      </button>
                      <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        나중에
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔔</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">해당하는 알림이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

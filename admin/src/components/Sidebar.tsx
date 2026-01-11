'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { getUnreadCount as getChatUnreadCount } from '@/lib/chatMessages';

// Demo employees for getting total unread chat counts
const employeeIds = [1, 2, 3, 4, 5, 6, 7, 8];

// Demo pending leave requests (would come from API in production)
const getPendingLeaveCount = () => {
  // 대기 중인 휴가 신청 수 (데모용)
  const stored = localStorage.getItem('pendingLeaveCount');
  return stored ? parseInt(stored, 10) : 2;
};

// Demo new attendance records (would come from API in production)
const getNewAttendanceCount = () => {
  // 새로운 출퇴근 기록 수 (데모용)
  const stored = localStorage.getItem('newAttendanceCount');
  return stored ? parseInt(stored, 10) : 3;
};

const menuItems = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/employees', label: '직원 관리', icon: '👥', badgeType: 'chat' },
  { href: '/attendance', label: '근태 관리', icon: '⏰', badgeType: 'attendance' },
  { href: '/leave', label: '휴가 승인', icon: '📅', badgeType: 'leave' },
  { href: '/payroll', label: '급여 관리', icon: '💰' },
  { href: '/documents', label: '필요서류 관리', icon: '📋' },
  { href: '/statistics', label: '통계 분석', icon: '📈' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [leaveCount, setLeaveCount] = useState(0);
  const [attendanceCount, setAttendanceCount] = useState(0);

  // 휴가/출퇴근 알림 수 업데이트
  useEffect(() => {
    const updateCounts = () => {
      setLeaveCount(getPendingLeaveCount());
      setAttendanceCount(getNewAttendanceCount());
    };

    updateCounts();
    const interval = setInterval(updateCounts, 3000);
    return () => clearInterval(interval);
  }, []);

  // 채팅 읽지 않은 메시지 수 (모든 직원)
  useEffect(() => {
    const fetchChatUnread = async () => {
      let total = 0;
      await Promise.all(
        employeeIds.map(async (id) => {
          const count = await getChatUnreadCount(id);
          total += count;
        })
      );
      setChatUnreadCount(total);
    };

    fetchChatUnread();
    const interval = setInterval(fetchChatUnread, 3000);
    return () => clearInterval(interval);
  }, []);

  // 배지 수 가져오기
  const getBadgeCount = (badgeType?: string): number => {
    switch (badgeType) {
      case 'chat':
        return chatUnreadCount;
      case 'leave':
        return leaveCount;
      case 'attendance':
        return attendanceCount;
      default:
        return 0;
    }
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen flex flex-col transition-all duration-300`}>
      {/* Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold text-blue-600">Componi</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Company Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.company?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const badgeCount = getBadgeCount(item.badgeType);
            const showBadge = badgeCount > 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="text-xl flex-shrink-0 relative">
                    {item.icon}
                    {showBadge && isCollapsed && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="font-medium text-sm flex-1">{item.label}</span>
                      {showBadge && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      )}
                    </>
                  )}
                  {isActive && !isCollapsed && !showBadge && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-white">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role === 'SUPER_ADMIN' ? '최고관리자' : user?.role === 'ADMIN' ? '관리자' : '매니저'}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="로그아웃"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="로그아웃"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';

const menuItems = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/employees', label: '직원 관리', icon: '👥' },
  { href: '/attendance', label: '근태 관리', icon: '⏰' },
  { href: '/leave', label: '휴가 승인', icon: '📅' },
  { href: '/payroll', label: '급여 관리', icon: '💰' },
  { href: '/contracts', label: '계약 관리', icon: '📝' },
  { href: '/certificates', label: '증명서 관리', icon: '📄' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">Componi</h1>
        <p className="text-sm text-gray-500">관리자 대시보드</p>
      </div>

      {/* Company Info */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <p className="text-sm font-medium text-gray-900">{user?.company?.name}</p>
        <p className="text-xs text-gray-500">{user?.name}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}

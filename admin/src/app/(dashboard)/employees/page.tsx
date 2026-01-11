'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getUnreadCount } from '@/lib/chatMessages';

// Demo employees data
const demoEmployees = [
  { id: 1, name: '김영희', email: 'younghee@componi.app', department: '개발팀', position: '선임', status: 'ACTIVE', hireDate: '2023-03-15' },
  { id: 2, name: '이철수', email: 'chulsoo@componi.app', department: '개발팀', position: '주임', status: 'ACTIVE', hireDate: '2023-06-01' },
  { id: 3, name: '박지민', email: 'jimin@componi.app', department: '디자인팀', position: '선임', status: 'ACTIVE', hireDate: '2022-11-20' },
  { id: 4, name: '최민수', email: 'minsu@componi.app', department: '마케팅팀', position: '팀장', status: 'ACTIVE', hireDate: '2021-05-10' },
  { id: 5, name: '정수진', email: 'sujin@componi.app', department: '인사팀', position: '선임', status: 'ACTIVE', hireDate: '2022-08-25' },
  { id: 6, name: '강민호', email: 'minho@componi.app', department: '개발팀', position: '팀장', status: 'ACTIVE', hireDate: '2020-02-01' },
  { id: 7, name: '윤서연', email: 'seoyeon@componi.app', department: '디자인팀', position: '주임', status: 'ACTIVE', hireDate: '2024-01-02' },
  { id: 8, name: '임재현', email: 'jaehyun@componi.app', department: '마케팅팀', position: '사원', status: 'PENDING', hireDate: '2024-01-08' },
];

const departments = ['전체', '개발팀', '디자인팀', '마케팅팀', '인사팀'];

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('전체');
  const [showModal, setShowModal] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

  // Fetch unread counts for all employees
  const fetchUnreadCounts = useCallback(async () => {
    const counts: Record<number, number> = {};
    await Promise.all(
      demoEmployees.map(async (emp) => {
        const count = await getUnreadCount(emp.id);
        counts[emp.id] = count;
      })
    );
    setUnreadCounts(counts);
  }, []);

  useEffect(() => {
    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 3000);
    return () => clearInterval(interval);
  }, [fetchUnreadCounts]);

  const filteredEmployees = demoEmployees.filter((emp) => {
    const matchesSearch = emp.name.includes(search) || emp.email.includes(search);
    const matchesDept = selectedDept === '전체' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleExportExcel = () => {
    // Generate CSV content
    const headers = ['이름', '이메일', '부서', '직급', '입사일', '상태'];
    const rows = filteredEmployees.map(emp => [
      emp.name,
      emp.email,
      emp.department,
      emp.position,
      emp.hireDate,
      emp.status === 'ACTIVE' ? '재직중' : '대기'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `직원목록_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">직원 관리</h1>
          <p className="text-gray-500 dark:text-gray-400">총 {demoEmployees.length}명의 직원</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            엑셀 다운로드
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            + 직원 추가
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="이름 또는 이메일 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">이름</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">이메일</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">부서</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">직급</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">입사일</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">상태</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {employee.name.charAt(0)}
                        </span>
                        {unreadCounts[employee.id] > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                            {unreadCounts[employee.id] > 9 ? '9+' : unreadCounts[employee.id]}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{employee.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">{employee.email}</span>
                      {unreadCounts[employee.id] > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded">
                          {unreadCounts[employee.id]}개 메시지
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{employee.department}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{employee.position}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{employee.hireDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      employee.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {employee.status === 'ACTIVE' ? '재직중' : '대기'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/employees/${employee.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">직원 추가</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이름</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이메일</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="email@componi.app"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">부서</label>
                <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  {departments.filter(d => d !== '전체').map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">직급</label>
                <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option>사원</option>
                  <option>주임</option>
                  <option>선임</option>
                  <option>팀장</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

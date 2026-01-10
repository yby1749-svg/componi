'use client';

import { useState } from 'react';

// Demo attendance data
const demoAttendance = [
  { id: 1, user: '김영희', department: '개발팀', checkIn: '09:02', checkOut: '18:30', workHours: '8h 28m', status: 'NORMAL' },
  { id: 2, user: '이철수', department: '개발팀', checkIn: '08:55', checkOut: '19:15', workHours: '9h 20m', status: 'NORMAL' },
  { id: 3, user: '박지민', department: '디자인팀', checkIn: '10:15', checkOut: '18:45', workHours: '7h 30m', status: 'LATE' },
  { id: 4, user: '최민수', department: '마케팅팀', checkIn: '09:00', checkOut: '18:00', workHours: '8h 0m', status: 'NORMAL' },
  { id: 5, user: '정수진', department: '인사팀', checkIn: null, checkOut: null, workHours: '-', status: 'LEAVE' },
  { id: 6, user: '강민호', department: '개발팀', checkIn: '08:45', checkOut: null, workHours: '진행중', status: 'WORKING' },
  { id: 7, user: '윤서연', department: '디자인팀', checkIn: '09:10', checkOut: '18:20', workHours: '8h 10m', status: 'NORMAL' },
  { id: 8, user: '임재현', department: '마케팅팀', checkIn: null, checkOut: null, workHours: '-', status: 'ABSENT' },
];

const statusLabels: Record<string, { label: string; style: string; darkStyle: string }> = {
  NORMAL: { label: '정상', style: 'bg-green-100 text-green-700', darkStyle: 'dark:bg-green-900/30 dark:text-green-400' },
  LATE: { label: '지각', style: 'bg-yellow-100 text-yellow-700', darkStyle: 'dark:bg-yellow-900/30 dark:text-yellow-400' },
  LEAVE: { label: '휴가', style: 'bg-blue-100 text-blue-700', darkStyle: 'dark:bg-blue-900/30 dark:text-blue-400' },
  WORKING: { label: '근무중', style: 'bg-purple-100 text-purple-700', darkStyle: 'dark:bg-purple-900/30 dark:text-purple-400' },
  ABSENT: { label: '결근', style: 'bg-red-100 text-red-700', darkStyle: 'dark:bg-red-900/30 dark:text-red-400' },
};

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const stats = {
    total: demoAttendance.length,
    present: demoAttendance.filter(a => ['NORMAL', 'LATE', 'WORKING'].includes(a.status)).length,
    late: demoAttendance.filter(a => a.status === 'LATE').length,
    leave: demoAttendance.filter(a => a.status === 'LEAVE').length,
    absent: demoAttendance.filter(a => a.status === 'ABSENT').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">근태 관리</h1>
          <p className="text-gray-500 dark:text-gray-400">일별 출퇴근 현황</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">전체</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">출근</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.late}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">지각</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.leave}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">휴가</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">결근</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">직원</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">부서</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">출근</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">퇴근</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">근무시간</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {demoAttendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {record.user.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{record.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{record.department}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{record.checkIn || '-'}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{record.checkOut || '-'}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{record.workHours}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusLabels[record.status].style} ${statusLabels[record.status].darkStyle}`}>
                      {statusLabels[record.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

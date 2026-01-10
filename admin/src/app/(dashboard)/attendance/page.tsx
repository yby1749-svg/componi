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

const statusLabels: Record<string, { label: string; style: string }> = {
  NORMAL: { label: '정상', style: 'bg-green-100 text-green-700' },
  LATE: { label: '지각', style: 'bg-yellow-100 text-yellow-700' },
  LEAVE: { label: '휴가', style: 'bg-blue-100 text-blue-700' },
  WORKING: { label: '근무중', style: 'bg-purple-100 text-purple-700' },
  ABSENT: { label: '결근', style: 'bg-red-100 text-red-700' },
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">근태 관리</h1>
          <p className="text-gray-500">일별 출퇴근 현황</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">전체</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
          <p className="text-sm text-gray-500">출근</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
          <p className="text-sm text-gray-500">지각</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.leave}</p>
          <p className="text-sm text-gray-500">휴가</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
          <p className="text-sm text-gray-500">결근</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">직원</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">부서</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">출근</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">퇴근</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">근무시간</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {demoAttendance.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {record.user.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{record.user}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">{record.department}</td>
                <td className="px-6 py-4 text-gray-900">{record.checkIn || '-'}</td>
                <td className="px-6 py-4 text-gray-900">{record.checkOut || '-'}</td>
                <td className="px-6 py-4 text-gray-900">{record.workHours}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${statusLabels[record.status].style}`}>
                    {statusLabels[record.status].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

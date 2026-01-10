'use client';

import { useState } from 'react';

// Demo stats data
const stats = [
  { label: '전체 직원', value: 45, change: '+2', color: 'blue' },
  { label: '오늘 출근', value: 38, change: '84%', color: 'green' },
  { label: '휴가 신청', value: 5, change: '대기중', color: 'yellow' },
  { label: '계약 대기', value: 3, change: '서명대기', color: 'purple' },
];

// Demo recent activities
const recentActivities = [
  { id: 1, type: 'leave', user: '김영희', action: '연차 신청', time: '10분 전' },
  { id: 2, type: 'attendance', user: '이철수', action: '출근 체크', time: '30분 전' },
  { id: 3, type: 'contract', user: '박지민', action: '계약서 서명', time: '1시간 전' },
  { id: 4, type: 'certificate', user: '최민수', action: '재직증명서 신청', time: '2시간 전' },
  { id: 5, type: 'leave', user: '정수진', action: '휴가 승인됨', time: '3시간 전' },
];

// Demo pending approvals
const pendingApprovals = [
  { id: 1, type: '연차', user: '김영희', dates: '1/15 - 1/16', days: 2 },
  { id: 2, type: '반차', user: '이철수', dates: '1/17 오전', days: 0.5 },
  { id: 3, type: '병가', user: '박지민', dates: '1/18', days: 1 },
];

// Demo attendance data for chart
const weeklyAttendance = [
  { day: '월', present: 42, absent: 3 },
  { day: '화', present: 40, absent: 5 },
  { day: '수', present: 43, absent: 2 },
  { day: '목', present: 38, absent: 7 },
  { day: '금', present: 41, absent: 4 },
];

export default function DashboardPage() {
  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-500">{formattedDate}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className={`text-sm mt-2 ${
              stat.color === 'green' ? 'text-green-600' :
              stat.color === 'yellow' ? 'text-yellow-600' :
              stat.color === 'purple' ? 'text-purple-600' :
              'text-blue-600'
            }`}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Attendance Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">주간 출근 현황</h2>
          <div className="flex items-end justify-between h-48 gap-4">
            {weeklyAttendance.map((data) => (
              <div key={data.day} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col gap-1 mb-2">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${(data.present / 45) * 120}px` }}
                  ></div>
                  <div
                    className="w-full bg-red-300 rounded-b"
                    style={{ height: `${(data.absent / 45) * 120}px` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500">{data.day}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-500">출근</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-300 rounded"></div>
              <span className="text-sm text-gray-500">결근/휴가</span>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">승인 대기</h2>
          <div className="space-y-3">
            {pendingApprovals.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.user}</p>
                  <p className="text-sm text-gray-500">
                    {item.type} · {item.dates}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    승인
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                    반려
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
            전체 보기 →
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'leave' ? 'bg-yellow-100' :
                  activity.type === 'attendance' ? 'bg-green-100' :
                  activity.type === 'contract' ? 'bg-purple-100' :
                  'bg-blue-100'
                }`}>
                  <span className="text-lg">
                    {activity.type === 'leave' ? '📅' :
                     activity.type === 'attendance' ? '⏰' :
                     activity.type === 'contract' ? '📝' : '📄'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{activity.user}</p>
                  <p className="text-sm text-gray-500">{activity.action}</p>
                </div>
              </div>
              <span className="text-sm text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

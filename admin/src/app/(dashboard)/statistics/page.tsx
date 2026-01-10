'use client';

import { useState } from 'react';

// Demo monthly attendance data
const monthlyAttendance = [
  { month: '7월', total: 22, present: 20, late: 1, absent: 1, leave: 0 },
  { month: '8월', total: 23, present: 21, late: 2, absent: 0, leave: 0 },
  { month: '9월', total: 21, present: 19, late: 1, absent: 1, leave: 0 },
  { month: '10월', total: 22, present: 20, late: 1, absent: 0, leave: 1 },
  { month: '11월', total: 22, present: 21, late: 1, absent: 0, leave: 0 },
  { month: '12월', total: 20, present: 18, late: 1, absent: 0, leave: 1 },
];

// Demo department data
const departmentStats = [
  { name: '개발팀', employees: 15, avgAttendance: 95.2, avgLeave: 1.2, avgOvertime: 12.5 },
  { name: '디자인팀', employees: 8, avgAttendance: 93.8, avgLeave: 1.5, avgOvertime: 8.3 },
  { name: '마케팅팀', employees: 12, avgAttendance: 96.1, avgLeave: 0.8, avgOvertime: 5.2 },
  { name: '인사팀', employees: 5, avgAttendance: 98.5, avgLeave: 0.5, avgOvertime: 3.1 },
  { name: '경영지원팀', employees: 5, avgAttendance: 97.2, avgLeave: 0.7, avgOvertime: 4.5 },
];

// Demo salary distribution
const salaryDistribution = [
  { range: '300만원 이하', count: 5, percentage: 11 },
  { range: '300~400만원', count: 15, percentage: 33 },
  { range: '400~500만원', count: 12, percentage: 27 },
  { range: '500~600만원', count: 8, percentage: 18 },
  { range: '600만원 이상', count: 5, percentage: 11 },
];

// Demo leave usage
const leaveUsageByType = [
  { type: '연차', used: 45, color: 'bg-blue-500' },
  { type: '반차', used: 22, color: 'bg-green-500' },
  { type: '병가', used: 8, color: 'bg-yellow-500' },
  { type: '경조사', used: 3, color: 'bg-purple-500' },
  { type: '특별휴가', used: 2, color: 'bg-pink-500' },
];

export default function StatisticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('6개월');
  const totalLeave = leaveUsageByType.reduce((sum, l) => sum + l.used, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">통계 및 분석</h1>
          <p className="text-gray-500 dark:text-gray-400">인사 데이터 종합 분석</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option>1개월</option>
          <option>3개월</option>
          <option>6개월</option>
          <option>1년</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">👥</span>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">+2</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">45</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">전체 직원</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📊</span>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">+1.2%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">95.8%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">평균 출근율</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📅</span>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">이번 달</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">12.5일</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">평균 잔여 연차</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">💰</span>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">평균</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">420만원</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">월 평균 급여</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Attendance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">월별 출근 현황</h2>
          <div className="flex items-end justify-between h-48 gap-2">
            {monthlyAttendance.map((data) => {
              const maxDays = Math.max(...monthlyAttendance.map(d => d.total));
              const height = (data.present / maxDays) * 100;
              return (
                <div key={data.month} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round((data.present / data.total) * 100)}%</span>
                    <div
                      className="w-full max-w-10 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all hover:from-blue-700 hover:to-blue-500"
                      style={{ height: `${height * 1.5}px` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{data.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-gray-500 dark:text-gray-400">출근율</span>
            </div>
          </div>
        </div>

        {/* Leave Usage Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">휴가 유형별 사용 현황</h2>
          <div className="flex items-center gap-8">
            {/* Simple Donut Chart */}
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" className="dark:stroke-gray-700" />
                {leaveUsageByType.reduce((acc, item, index) => {
                  const percentage = (item.used / totalLeave) * 100;
                  const circumference = 2 * Math.PI * 40;
                  const offset = acc.offset;
                  const colors = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'];
                  acc.elements.push(
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={colors[index]}
                      strokeWidth="12"
                      strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
                      strokeDashoffset={-offset}
                      className="transition-all"
                    />
                  );
                  acc.offset += (percentage / 100) * circumference;
                  return acc;
                }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalLeave}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">총 사용</p>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex-1 space-y-3">
              {leaveUsageByType.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${item.color}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{item.type}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.used}일</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Department Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">부서별 분석</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">부서</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">인원</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">출근율</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">평균 휴가</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">평균 초과근무</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">출근율 그래프</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {departmentStats.map((dept) => (
                <tr key={dept.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-white">{dept.name}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900 dark:text-white">{dept.employees}명</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-medium ${
                      dept.avgAttendance >= 97 ? 'text-green-600 dark:text-green-400' :
                      dept.avgAttendance >= 95 ? 'text-blue-600 dark:text-blue-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {dept.avgAttendance}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900 dark:text-white">{dept.avgLeave}일/월</td>
                  <td className="px-6 py-4 text-center text-gray-900 dark:text-white">{dept.avgOvertime}시간</td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          dept.avgAttendance >= 97 ? 'bg-green-500' :
                          dept.avgAttendance >= 95 ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${dept.avgAttendance}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">급여 분포</h2>
        <div className="space-y-4">
          {salaryDistribution.map((item) => (
            <div key={item.range} className="flex items-center gap-4">
              <span className="w-32 text-sm text-gray-600 dark:text-gray-300 flex-shrink-0">{item.range}</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all flex items-center justify-end pr-2"
                  style={{ width: `${item.percentage}%` }}
                >
                  {item.percentage >= 15 && (
                    <span className="text-xs font-medium text-white">{item.count}명</span>
                  )}
                </div>
                {item.percentage < 15 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600 dark:text-gray-400">{item.count}명</span>
                )}
              </div>
              <span className="w-12 text-sm text-gray-500 dark:text-gray-400 text-right">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

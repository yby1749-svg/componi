'use client';

import Link from 'next/link';

// Demo stats data
const stats = [
  { label: '전체 직원', value: 45, change: '+2 이번 달', color: 'blue', icon: '👥' },
  { label: '오늘 출근', value: 38, change: '84% 출근율', color: 'green', icon: '✅' },
  { label: '휴가 신청', value: 5, change: '승인 대기', color: 'yellow', icon: '📅' },
  { label: '계약 대기', value: 3, change: '서명 대기', color: 'purple', icon: '📝' },
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
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${days[today.getDay()]}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">대시보드</h1>
          <p className="text-gray-500 dark:text-gray-400">{formattedDate}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            리포트 다운로드
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            새로고침
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                stat.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                stat.color === 'purple' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Attendance Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">주간 출근 현황</h2>
            <Link href="/attendance" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              상세 보기 →
            </Link>
          </div>
          <div className="flex items-end justify-between h-48 gap-4 px-4">
            {weeklyAttendance.map((data) => (
              <div key={data.day} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col gap-1 mb-2">
                  <div
                    className="w-full bg-blue-500 dark:bg-blue-600 rounded-t transition-all hover:bg-blue-600 dark:hover:bg-blue-500"
                    style={{ height: `${(data.present / 45) * 120}px` }}
                    title={`출근: ${data.present}명`}
                  ></div>
                  <div
                    className="w-full bg-red-300 dark:bg-red-400/50 rounded-b"
                    style={{ height: `${(data.absent / 45) * 120}px` }}
                    title={`결근/휴가: ${data.absent}명`}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{data.day}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">출근</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-300 dark:bg-red-400/50 rounded"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">결근/휴가</span>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">승인 대기</h2>
            <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
              {pendingApprovals.length}건
            </span>
          </div>
          <div className="space-y-3">
            {pendingApprovals.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {item.user.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{item.user}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.type} · {item.dates}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    승인
                  </button>
                  <button className="px-2.5 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                    반려
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/leave"
            className="block w-full mt-4 text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            전체 보기 →
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">최근 활동</h2>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            모두 보기
          </button>
        </div>
        <div className="space-y-1">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'leave' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                  activity.type === 'attendance' ? 'bg-green-100 dark:bg-green-900/30' :
                  activity.type === 'contract' ? 'bg-purple-100 dark:bg-purple-900/30' :
                  'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  <span className="text-lg">
                    {activity.type === 'leave' ? '📅' :
                     activity.type === 'attendance' ? '⏰' :
                     activity.type === 'contract' ? '📝' : '📄'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{activity.user}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{activity.action}</p>
                </div>
              </div>
              <span className="text-sm text-gray-400 dark:text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

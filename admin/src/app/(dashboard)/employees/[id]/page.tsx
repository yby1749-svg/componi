'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Demo employee data
const demoEmployee = {
  id: 1,
  name: '김영희',
  email: 'younghee@componi.app',
  phone: '010-1234-5678',
  department: '개발팀',
  position: '선임',
  status: 'ACTIVE',
  hireDate: '2023-03-15',
  birthDate: '1992-05-20',
  address: '서울특별시 강남구 테헤란로 123',
  emergencyContact: '010-9876-5432 (모)',
  annualLeave: { total: 15, used: 5, remaining: 10 },
  salary: {
    base: 4000000,
    bonus: 0,
    deductions: 520000,
    net: 3480000,
  },
  attendance: [
    { date: '2024-01-10', checkIn: '09:02', checkOut: '18:30', status: 'NORMAL' },
    { date: '2024-01-09', checkIn: '08:55', checkOut: '19:15', status: 'NORMAL' },
    { date: '2024-01-08', checkIn: '10:15', checkOut: '18:45', status: 'LATE' },
    { date: '2024-01-05', checkIn: '09:00', checkOut: '18:00', status: 'NORMAL' },
    { date: '2024-01-04', checkIn: '08:45', checkOut: '18:30', status: 'NORMAL' },
  ],
  contracts: [
    { id: 1, title: '2024년 근로계약서', status: 'SIGNED', date: '2024-01-02' },
    { id: 2, title: '비밀유지서약서', status: 'SIGNED', date: '2023-03-15' },
  ],
};

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('info');

  const tabs = [
    { id: 'info', label: '기본 정보' },
    { id: 'attendance', label: '출퇴근 기록' },
    { id: 'leave', label: '휴가 현황' },
    { id: 'salary', label: '급여 정보' },
    { id: 'contracts', label: '계약서' },
  ];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{demoEmployee.name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{demoEmployee.name}</h1>
              <p className="text-gray-500 dark:text-gray-400">{demoEmployee.department} · {demoEmployee.position}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            수정
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            메시지 보내기
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-4">
        <span className={`px-3 py-1 text-sm rounded-full ${
          demoEmployee.status === 'ACTIVE'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        }`}>
          {demoEmployee.status === 'ACTIVE' ? '재직중' : '대기'}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          입사일: {demoEmployee.hireDate}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">개인 정보</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">이메일</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">연락처</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">생년월일</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.birthDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">주소</span>
                <span className="text-gray-900 dark:text-white text-right max-w-[200px]">{demoEmployee.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">비상연락처</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.emergencyContact}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">근무 정보</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">부서</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">직급</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">입사일</span>
                <span className="text-gray-900 dark:text-white">{demoEmployee.hireDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">근속 기간</span>
                <span className="text-gray-900 dark:text-white">10개월</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">날짜</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">출근</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">퇴근</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {demoEmployee.attendance.map((record) => (
                  <tr key={record.date} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{record.date}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{record.checkIn}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{record.checkOut}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        record.status === 'NORMAL'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {record.status === 'NORMAL' ? '정상' : '지각'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">총 연차</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{demoEmployee.annualLeave.total}일</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">사용 연차</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{demoEmployee.annualLeave.used}일</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">잔여 연차</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{demoEmployee.annualLeave.remaining}일</p>
          </div>
        </div>
      )}

      {activeTab === 'salary' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">2024년 1월 급여</h3>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">기본급</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(demoEmployee.salary.base)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">상여금</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(demoEmployee.salary.bonus)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">공제액</span>
              <span className="text-red-600 dark:text-red-400 font-medium">-{formatCurrency(demoEmployee.salary.deductions)}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-900 dark:text-white font-semibold">실수령액</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">{formatCurrency(demoEmployee.salary.net)}</span>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              급여 명세서 발송
            </button>
            <button className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              PDF 다운로드
            </button>
          </div>
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">계약서</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">상태</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">서명일</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {demoEmployee.contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{contract.title}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        서명완료
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{contract.date}</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                        보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

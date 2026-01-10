'use client';

import { useState } from 'react';

// Demo payroll data
const demoPayroll = [
  { id: 1, user: '김영희', department: '개발팀', baseSalary: 4000000, bonus: 0, deductions: 520000, netPay: 3480000, status: 'PAID' },
  { id: 2, user: '이철수', department: '개발팀', baseSalary: 3500000, bonus: 200000, deductions: 481000, netPay: 3219000, status: 'PAID' },
  { id: 3, user: '박지민', department: '디자인팀', baseSalary: 4200000, bonus: 0, deductions: 546000, netPay: 3654000, status: 'PENDING' },
  { id: 4, user: '최민수', department: '마케팅팀', baseSalary: 5500000, bonus: 500000, deductions: 780000, netPay: 5220000, status: 'PENDING' },
  { id: 5, user: '정수진', department: '인사팀', baseSalary: 4000000, bonus: 0, deductions: 520000, netPay: 3480000, status: 'PENDING' },
  { id: 6, user: '강민호', department: '개발팀', baseSalary: 6000000, bonus: 1000000, deductions: 910000, netPay: 6090000, status: 'PAID' },
];

const months = ['2024년 1월', '2023년 12월', '2023년 11월', '2023년 10월'];

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState(months[0]);

  const totalNetPay = demoPayroll.reduce((sum, p) => sum + p.netPay, 0);
  const paidCount = demoPayroll.filter(p => p.status === 'PAID').length;
  const pendingCount = demoPayroll.filter(p => p.status === 'PENDING').length;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">급여 관리</h1>
          <p className="text-gray-500">월별 급여 현황</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {months.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            급여 명세서 생성
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">총 지급액</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalNetPay)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">지급 완료</p>
          <p className="text-2xl font-bold text-green-600">{paidCount}명</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">지급 대기</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}명</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">직원</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">부서</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">기본급</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">상여금</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">공제액</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">실수령액</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {demoPayroll.map((record) => (
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
                <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(record.baseSalary)}</td>
                <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(record.bonus)}</td>
                <td className="px-6 py-4 text-right text-red-600">-{formatCurrency(record.deductions)}</td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(record.netPay)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    record.status === 'PAID'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {record.status === 'PAID' ? '지급완료' : '대기'}
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

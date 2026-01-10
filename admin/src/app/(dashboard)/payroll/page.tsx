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
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<typeof demoPayroll[0] | null>(null);

  const totalNetPay = demoPayroll.reduce((sum, p) => sum + p.netPay, 0);
  const paidCount = demoPayroll.filter(p => p.status === 'PAID').length;
  const pendingCount = demoPayroll.filter(p => p.status === 'PENDING').length;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  const handleGeneratePayslip = (employee: typeof demoPayroll[0]) => {
    setSelectedEmployee(employee);
    setShowPayslipModal(true);
  };

  const handleExportExcel = () => {
    const headers = ['이름', '부서', '기본급', '상여금', '공제액', '실수령액', '상태'];
    const rows = demoPayroll.map(p => [
      p.user,
      p.department,
      p.baseSalary.toString(),
      p.bonus.toString(),
      p.deductions.toString(),
      p.netPay.toString(),
      p.status === 'PAID' ? '지급완료' : '대기'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `급여내역_${selectedMonth.replace(' ', '_')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">급여 관리</h1>
          <p className="text-gray-500 dark:text-gray-400">월별 급여 현황</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {months.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            엑셀
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">총 지급액</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalNetPay)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">지급 완료</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{paidCount}명</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">지급 대기</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}명</p>
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
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">기본급</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">상여금</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">공제액</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">실수령액</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">상태</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {demoPayroll.map((record) => (
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
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white">{formatCurrency(record.baseSalary)}</td>
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white">{formatCurrency(record.bonus)}</td>
                  <td className="px-6 py-4 text-right text-red-600 dark:text-red-400">-{formatCurrency(record.deductions)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(record.netPay)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      record.status === 'PAID'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {record.status === 'PAID' ? '지급완료' : '대기'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleGeneratePayslip(record)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      명세서
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal */}
      {showPayslipModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">급여 명세서</h2>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Company & Employee Info */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-blue-600">Componi Inc.</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">서울특별시 강남구 테헤란로 123</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedMonth}</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{selectedEmployee.user.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedEmployee.user}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedEmployee.department}</p>
                  </div>
                </div>
              </div>

              {/* Salary Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">기본급</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedEmployee.baseSalary)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">상여금</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedEmployee.bonus)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">총 지급액</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedEmployee.baseSalary + selectedEmployee.bonus)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">공제액 (4대보험 등)</span>
                  <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(selectedEmployee.deductions)}</span>
                </div>
                <div className="flex justify-between py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 -mx-3">
                  <span className="font-semibold text-gray-900 dark:text-white">실수령액</span>
                  <span className="font-bold text-xl text-blue-600 dark:text-blue-400">{formatCurrency(selectedEmployee.netPay)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowPayslipModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                닫기
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                이메일 발송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

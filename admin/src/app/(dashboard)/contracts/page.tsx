'use client';

import { useState } from 'react';

// Demo contracts data
const demoContracts = [
  { id: 1, user: '김영희', type: 'EMPLOYMENT', title: '2024년 근로계약서', status: 'SIGNED', sentAt: '2024-01-02', signedAt: '2024-01-03' },
  { id: 2, user: '이철수', type: 'EMPLOYMENT', title: '2024년 근로계약서', status: 'PENDING', sentAt: '2024-01-05', signedAt: null },
  { id: 3, user: '박지민', type: 'NDA', title: '비밀유지서약서', status: 'SIGNED', sentAt: '2024-01-01', signedAt: '2024-01-01' },
  { id: 4, user: '임재현', type: 'EMPLOYMENT', title: '2024년 근로계약서', status: 'PENDING', sentAt: '2024-01-08', signedAt: null },
  { id: 5, user: '임재현', type: 'NDA', title: '비밀유지서약서', status: 'PENDING', sentAt: '2024-01-08', signedAt: null },
  { id: 6, user: '윤서연', type: 'EMPLOYMENT', title: '2024년 근로계약서', status: 'SIGNED', sentAt: '2024-01-02', signedAt: '2024-01-02' },
];

const typeLabels: Record<string, string> = {
  EMPLOYMENT: '근로계약서',
  NDA: '비밀유지서약서',
  CONFIDENTIALITY: '개인정보동의서',
};

export default function ContractsPage() {
  const [selectedStatus, setSelectedStatus] = useState('전체');

  const filteredContracts = demoContracts.filter((c) => {
    if (selectedStatus === '전체') return true;
    if (selectedStatus === '서명대기') return c.status === 'PENDING';
    if (selectedStatus === '서명완료') return c.status === 'SIGNED';
    return true;
  });

  const pendingCount = demoContracts.filter(c => c.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">계약 관리</h1>
          <p className="text-gray-500 dark:text-gray-400">{pendingCount}건의 서명 대기 중</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
          + 계약서 발송
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {['전체', '서명대기', '서명완료'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">직원</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">계약서 종류</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">제목</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">발송일</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">서명일</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">상태</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {contract.user.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{contract.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                      {typeLabels[contract.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{contract.title}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{contract.sentAt}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{contract.signedAt || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      contract.status === 'SIGNED'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {contract.status === 'SIGNED' ? '서명완료' : '대기'}
                    </span>
                  </td>
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
    </div>
  );
}

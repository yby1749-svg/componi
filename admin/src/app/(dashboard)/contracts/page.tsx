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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">계약 관리</h1>
          <p className="text-gray-500">{pendingCount}건의 서명 대기 중</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          + 계약서 발송
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2">
        {['전체', '서명대기', '서명완료'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">직원</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">계약서 종류</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">제목</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">발송일</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">서명일</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">상태</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredContracts.map((contract) => (
              <tr key={contract.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {contract.user.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{contract.user}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                    {typeLabels[contract.type]}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-900">{contract.title}</td>
                <td className="px-6 py-4 text-gray-500">{contract.sentAt}</td>
                <td className="px-6 py-4 text-gray-500">{contract.signedAt || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    contract.status === 'SIGNED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {contract.status === 'SIGNED' ? '서명완료' : '대기'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

// Demo certificate requests
const demoCertificates = [
  { id: 1, user: '김영희', department: '개발팀', type: 'EMPLOYMENT', purpose: '금융기관 제출용', status: 'PENDING', createdAt: '2024-01-10' },
  { id: 2, user: '이철수', department: '개발팀', type: 'CAREER', purpose: '이직용', status: 'ISSUED', createdAt: '2024-01-08', issuedAt: '2024-01-09' },
  { id: 3, user: '박지민', department: '디자인팀', type: 'INCOME', purpose: '비자 신청용', status: 'PENDING', createdAt: '2024-01-11' },
  { id: 4, user: '최민수', department: '마케팅팀', type: 'EMPLOYMENT', purpose: '관공서 제출용', status: 'ISSUED', createdAt: '2024-01-05', issuedAt: '2024-01-06' },
];

const typeLabels: Record<string, string> = {
  EMPLOYMENT: '재직증명서',
  CAREER: '경력증명서',
  INCOME: '소득금액증명원',
};

export default function CertificatesPage() {
  const [requests, setRequests] = useState(demoCertificates);
  const [selectedStatus, setSelectedStatus] = useState('전체');

  const filteredRequests = requests.filter((r) => {
    if (selectedStatus === '전체') return true;
    if (selectedStatus === '처리대기') return r.status === 'PENDING';
    if (selectedStatus === '발급완료') return r.status === 'ISSUED';
    return true;
  });

  const handleIssue = (id: number) => {
    setRequests(requests.map(r =>
      r.id === id ? { ...r, status: 'ISSUED', issuedAt: new Date().toISOString().split('T')[0] } : r
    ));
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">증명서 관리</h1>
        <p className="text-gray-500 dark:text-gray-400">{pendingCount}건의 발급 대기 중</p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {['전체', '처리대기', '발급완료'].map((status) => (
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
            {status === '처리대기' && pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <div
            key={request.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-medium text-blue-600 dark:text-blue-400">
                    {request.user.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{request.user}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{request.department}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                      {typeLabels[request.type]}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{request.purpose}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">신청일: {request.createdAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <span className={`px-3 py-1 text-sm rounded-full ${
                  request.status === 'ISSUED'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {request.status === 'ISSUED' ? '발급완료' : '대기'}
                </span>
                {request.status === 'PENDING' && (
                  <button
                    onClick={() => handleIssue(request.id)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    발급하기
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            해당하는 증명서 신청이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

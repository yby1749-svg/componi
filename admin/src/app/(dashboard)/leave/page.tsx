'use client';

import { useState } from 'react';

// Demo leave requests
const demoLeaveRequests = [
  { id: 1, user: '김영희', department: '개발팀', type: 'ANNUAL', startDate: '2024-01-15', endDate: '2024-01-16', days: 2, reason: '개인 사유', status: 'PENDING', createdAt: '2024-01-10' },
  { id: 2, user: '이철수', department: '개발팀', type: 'HALF_AM', startDate: '2024-01-17', endDate: '2024-01-17', days: 0.5, reason: '병원 예약', status: 'PENDING', createdAt: '2024-01-11' },
  { id: 3, user: '박지민', department: '디자인팀', type: 'SICK', startDate: '2024-01-18', endDate: '2024-01-18', days: 1, reason: '감기', status: 'PENDING', createdAt: '2024-01-12' },
  { id: 4, user: '최민수', department: '마케팅팀', type: 'ANNUAL', startDate: '2024-01-08', endDate: '2024-01-09', days: 2, reason: '가족 행사', status: 'APPROVED', createdAt: '2024-01-05' },
  { id: 5, user: '정수진', department: '인사팀', type: 'ANNUAL', startDate: '2024-01-22', endDate: '2024-01-24', days: 3, reason: '해외 여행', status: 'APPROVED', createdAt: '2024-01-08' },
  { id: 6, user: '강민호', department: '개발팀', type: 'HALF_PM', startDate: '2024-01-05', endDate: '2024-01-05', days: 0.5, reason: '개인 사유', status: 'REJECTED', createdAt: '2024-01-03' },
];

const typeLabels: Record<string, string> = {
  ANNUAL: '연차',
  HALF_AM: '오전 반차',
  HALF_PM: '오후 반차',
  SICK: '병가',
  SPECIAL: '특별휴가',
};

const statusFilters = ['전체', '대기', '승인', '반려'];

export default function LeavePage() {
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [requests, setRequests] = useState(demoLeaveRequests);

  const filteredRequests = requests.filter((req) => {
    if (selectedStatus === '전체') return true;
    if (selectedStatus === '대기') return req.status === 'PENDING';
    if (selectedStatus === '승인') return req.status === 'APPROVED';
    if (selectedStatus === '반려') return req.status === 'REJECTED';
    return true;
  });

  const handleApprove = (id: number) => {
    setRequests(requests.map(r =>
      r.id === id ? { ...r, status: 'APPROVED' } : r
    ));
  };

  const handleReject = (id: number) => {
    setRequests(requests.map(r =>
      r.id === id ? { ...r, status: 'REJECTED' } : r
    ));
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '승인';
      case 'REJECTED':
        return '반려';
      default:
        return '대기';
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">휴가 승인</h1>
        <p className="text-gray-500 dark:text-gray-400">{pendingCount}건의 승인 대기 중</p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((status) => (
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
            {status === '대기' && pendingCount > 0 && (
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
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {request.startDate} {request.startDate !== request.endDate && `~ ${request.endDate}`}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({request.days}일)</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">사유: {request.reason}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">신청일: {request.createdAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusStyle(request.status)}`}>
                  {getStatusLabel(request.status)}
                </span>
                {request.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      반려
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            해당하는 휴가 신청이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

// Demo employees data
const demoEmployees = [
  { id: 1, name: '김영희', email: 'younghee@componi.app', department: '개발팀', position: '선임', status: 'ACTIVE', hireDate: '2023-03-15' },
  { id: 2, name: '이철수', email: 'chulsoo@componi.app', department: '개발팀', position: '주임', status: 'ACTIVE', hireDate: '2023-06-01' },
  { id: 3, name: '박지민', email: 'jimin@componi.app', department: '디자인팀', position: '선임', status: 'ACTIVE', hireDate: '2022-11-20' },
  { id: 4, name: '최민수', email: 'minsu@componi.app', department: '마케팅팀', position: '팀장', status: 'ACTIVE', hireDate: '2021-05-10' },
  { id: 5, name: '정수진', email: 'sujin@componi.app', department: '인사팀', position: '선임', status: 'ACTIVE', hireDate: '2022-08-25' },
  { id: 6, name: '강민호', email: 'minho@componi.app', department: '개발팀', position: '팀장', status: 'ACTIVE', hireDate: '2020-02-01' },
  { id: 7, name: '윤서연', email: 'seoyeon@componi.app', department: '디자인팀', position: '주임', status: 'ACTIVE', hireDate: '2024-01-02' },
  { id: 8, name: '임재현', email: 'jaehyun@componi.app', department: '마케팅팀', position: '사원', status: 'PENDING', hireDate: '2024-01-08' },
];

const departments = ['전체', '개발팀', '디자인팀', '마케팅팀', '인사팀'];

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('전체');
  const [showModal, setShowModal] = useState(false);

  const filteredEmployees = demoEmployees.filter((emp) => {
    const matchesSearch = emp.name.includes(search) || emp.email.includes(search);
    const matchesDept = selectedDept === '전체' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">직원 관리</h1>
          <p className="text-gray-500">총 {demoEmployees.length}명의 직원</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + 직원 추가
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="이름 또는 이메일 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">이름</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">이메일</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">부서</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">직급</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">입사일</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">상태</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {employee.name.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{employee.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">{employee.email}</td>
                <td className="px-6 py-4 text-gray-500">{employee.department}</td>
                <td className="px-6 py-4 text-gray-500">{employee.position}</td>
                <td className="px-6 py-4 text-gray-500">{employee.hireDate}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    employee.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {employee.status === 'ACTIVE' ? '재직중' : '대기'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    상세
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">직원 추가</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="email@componi.app"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  {departments.filter(d => d !== '전체').map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">직급</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option>사원</option>
                  <option>주임</option>
                  <option>선임</option>
                  <option>팀장</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

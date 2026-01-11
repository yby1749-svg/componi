'use client';

import { useState, useEffect, use } from 'react';
import { getRequestById, updateRequestStatus, createSubmission, DocumentRequest } from '@/lib/documentTemplates';
import { sendDocumentSubmittedMessage } from '@/lib/messages';

interface ResumeFormData {
  // 기본정보
  name: string;
  nameHanja: string;
  birthdate: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  // 학력 (4개)
  edu: Array<{ period: string; school: string; major: string; status: string }>;
  // 경력 (3개)
  career: Array<{ period: string; company: string; position: string; task: string; reason: string }>;
  // 자격 (3개)
  cert: Array<{ date: string; name: string; issuer: string }>;
  // 어학 (2개)
  lang: Array<{ type: string; test: string; score: string; date: string }>;
}

const initialFormData: ResumeFormData = {
  name: '',
  nameHanja: '',
  birthdate: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  edu: Array(4).fill(null).map(() => ({ period: '', school: '', major: '', status: '' })),
  career: Array(3).fill(null).map(() => ({ period: '', company: '', position: '', task: '', reason: '' })),
  cert: Array(3).fill(null).map(() => ({ date: '', name: '', issuer: '' })),
  lang: Array(2).fill(null).map(() => ({ type: '', test: '', score: '', date: '' })),
};

export default function SubmitPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [request, setRequest] = useState<DocumentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<ResumeFormData>(initialFormData);

  useEffect(() => {
    const req = getRequestById(token);
    setRequest(req || null);
    setLoading(false);

    if (req?.status === 'SUBMITTED') {
      setSubmitted(true);
    }
  }, [token]);

  const handleInputChange = (field: keyof ResumeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (
    arrayField: 'edu' | 'career' | 'cert' | 'lang',
    index: number,
    field: string,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [arrayField]: prev[arrayField].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!request) return;

    // 폼 데이터를 flat 객체로 변환
    const flatData: Record<string, string> = {
      name: formData.name,
      nameHanja: formData.nameHanja,
      birthdate: formData.birthdate,
      gender: formData.gender,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
    };

    // 배열 데이터 변환
    formData.edu.forEach((item, i) => {
      flatData[`edu_period_${i + 1}`] = item.period;
      flatData[`edu_school_${i + 1}`] = item.school;
      flatData[`edu_major_${i + 1}`] = item.major;
      flatData[`edu_status_${i + 1}`] = item.status;
    });

    formData.career.forEach((item, i) => {
      flatData[`career_period_${i + 1}`] = item.period;
      flatData[`career_company_${i + 1}`] = item.company;
      flatData[`career_position_${i + 1}`] = item.position;
      flatData[`career_task_${i + 1}`] = item.task;
      flatData[`career_reason_${i + 1}`] = item.reason;
    });

    formData.cert.forEach((item, i) => {
      flatData[`cert_date_${i + 1}`] = item.date;
      flatData[`cert_name_${i + 1}`] = item.name;
      flatData[`cert_issuer_${i + 1}`] = item.issuer;
    });

    formData.lang.forEach((item, i) => {
      flatData[`lang_type_${i + 1}`] = item.type;
      flatData[`lang_test_${i + 1}`] = item.test;
      flatData[`lang_score_${i + 1}`] = item.score;
      flatData[`lang_date_${i + 1}`] = item.date;
    });

    try {
      // 제출물 저장
      createSubmission({
        requestId: token,
        templateId: request.templateId,
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        title: request.title,
        category: request.category,
        formData: flatData,
      });

      // 관리자에게 제출 알림 전송
      sendDocumentSubmittedMessage(
        request.employeeId,
        request.employeeName,
        request.title
      );
      setSubmitted(true);
    } catch (error) {
      alert('제출 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">404</div>
          <div className="text-xl text-gray-600 dark:text-gray-400">
            유효하지 않은 링크입니다.
          </div>
          <p className="mt-2 text-gray-500">
            링크가 만료되었거나 존재하지 않습니다.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            제출 완료
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {request.title}이(가) 성공적으로 제출되었습니다.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            담당자가 확인 후 연락드리겠습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {request.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {request.employeeName}님, 아래 양식을 작성해 주세요.
        </p>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 기본 정보 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b">
            기본 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                성명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                한자
              </label>
              <input
                type="text"
                value={formData.nameHanja}
                onChange={(e) => handleInputChange('nameHanja', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                생년월일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.birthdate}
                onChange={(e) => handleInputChange('birthdate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                성별 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택</option>
                <option value="남">남</option>
                <option value="여">여</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="010-0000-0000"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                주소 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* 학력 사항 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b">
            학력 사항
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-3 py-2 text-left">기간</th>
                  <th className="px-3 py-2 text-left">학교명</th>
                  <th className="px-3 py-2 text-left">전공/계열</th>
                  <th className="px-3 py-2 text-left">졸업구분</th>
                </tr>
              </thead>
              <tbody>
                {formData.edu.map((item, index) => (
                  <tr key={index} className="border-b dark:border-gray-700">
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="2015.03 ~ 2019.02"
                        value={item.period}
                        onChange={(e) => handleArrayChange('edu', index, 'period', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="OO대학교"
                        value={item.school}
                        onChange={(e) => handleArrayChange('edu', index, 'school', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="컴퓨터공학"
                        value={item.major}
                        onChange={(e) => handleArrayChange('edu', index, 'major', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={item.status}
                        onChange={(e) => handleArrayChange('edu', index, 'status', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">선택</option>
                        <option value="졸업">졸업</option>
                        <option value="재학">재학</option>
                        <option value="휴학">휴학</option>
                        <option value="중퇴">중퇴</option>
                        <option value="졸업예정">졸업예정</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 경력 사항 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b">
            경력 사항
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-3 py-2 text-left">근무기간</th>
                  <th className="px-3 py-2 text-left">회사명</th>
                  <th className="px-3 py-2 text-left">부서/직급</th>
                  <th className="px-3 py-2 text-left">담당업무</th>
                  <th className="px-3 py-2 text-left">퇴사사유</th>
                </tr>
              </thead>
              <tbody>
                {formData.career.map((item, index) => (
                  <tr key={index} className="border-b dark:border-gray-700">
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="2019.03 ~ 2022.12"
                        value={item.period}
                        onChange={(e) => handleArrayChange('career', index, 'period', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="(주)OO"
                        value={item.company}
                        onChange={(e) => handleArrayChange('career', index, 'company', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="개발팀/대리"
                        value={item.position}
                        onChange={(e) => handleArrayChange('career', index, 'position', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="웹 개발"
                        value={item.task}
                        onChange={(e) => handleArrayChange('career', index, 'task', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="이직"
                        value={item.reason}
                        onChange={(e) => handleArrayChange('career', index, 'reason', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 자격 및 면허 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b">
            자격 및 면허
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-3 py-2 text-left">취득일</th>
                  <th className="px-3 py-2 text-left">자격/면허명</th>
                  <th className="px-3 py-2 text-left">발급기관</th>
                </tr>
              </thead>
              <tbody>
                {formData.cert.map((item, index) => (
                  <tr key={index} className="border-b dark:border-gray-700">
                    <td className="px-2 py-2">
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => handleArrayChange('cert', index, 'date', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="정보처리기사"
                        value={item.name}
                        onChange={(e) => handleArrayChange('cert', index, 'name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="한국산업인력공단"
                        value={item.issuer}
                        onChange={(e) => handleArrayChange('cert', index, 'issuer', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 어학 능력 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b">
            어학 능력
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-3 py-2 text-left">언어</th>
                  <th className="px-3 py-2 text-left">시험명/자격명</th>
                  <th className="px-3 py-2 text-left">점수/등급</th>
                  <th className="px-3 py-2 text-left">취득일</th>
                </tr>
              </thead>
              <tbody>
                {formData.lang.map((item, index) => (
                  <tr key={index} className="border-b dark:border-gray-700">
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="영어"
                        value={item.type}
                        onChange={(e) => handleArrayChange('lang', index, 'type', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="TOEIC"
                        value={item.test}
                        onChange={(e) => handleArrayChange('lang', index, 'test', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="900"
                        value={item.score}
                        onChange={(e) => handleArrayChange('lang', index, 'score', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => handleArrayChange('lang', index, 'date', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 제출 버튼 */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            제출하기
          </button>
        </div>
      </form>
    </div>
  );
}

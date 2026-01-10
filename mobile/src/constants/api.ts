// API Configuration
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.componi.app/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me',
  CHANGE_PASSWORD: '/auth/password',

  // Attendance
  CHECK_IN: '/attendance/check-in',
  CHECK_OUT: '/attendance/check-out',
  ATTENDANCE_TODAY: '/attendance/today',
  ATTENDANCE_HISTORY: '/attendance/history',
  WEEKLY_HOURS: '/attendance/weekly-hours',

  // Leave
  LEAVE_BALANCE: '/leave/balance',
  LEAVE_REQUEST: '/leave/request',
  MY_LEAVE_REQUESTS: '/leave/my-requests',

  // Contract
  MY_CONTRACTS: '/contracts/my',
  PENDING_CONTRACTS: '/contracts/pending',
  SIGN_CONTRACT: (id: string) => `/contracts/${id}/sign`,

  // Payroll
  MY_PAYROLLS: '/payroll/my',
  PAYROLL_DETAIL: (year: number, month: number) => `/payroll/my/${year}/${month}`,

  // Certificate
  REQUEST_CERTIFICATE: '/certificates/request',
  MY_CERTIFICATES: '/certificates/my',
  DOWNLOAD_CERTIFICATE: (id: string) => `/certificates/${id}/download`,

  // User
  PROFILE: '/users/profile',
  WORKPLACES: '/users/workplaces',
};

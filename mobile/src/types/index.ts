export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  employeeNo?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  status: 'PENDING' | 'ACTIVE' | 'RESIGNED';
  annualLeave: number;
  usedLeave: number;
  hireDate?: string;
  company?: Company;
  department?: Department;
  position?: Position;
}

export interface Company {
  id: string;
  name: string;
  bizNumber: string;
  address?: string;
  phone?: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Position {
  id: string;
  name: string;
  level: number;
}

export interface Workplace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  wifiSsid?: string;
}

export interface Attendance {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workMinutes?: number;
  overtimeMin?: number;
  status: 'NORMAL' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' | 'LEAVE' | 'HALF_LEAVE';
  workplace?: Workplace;
}

export interface LeaveRequest {
  id: string;
  type: 'ANNUAL' | 'HALF_AM' | 'HALF_PM' | 'SICK' | 'SPECIAL' | 'UNPAID';
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
}

export interface Contract {
  id: string;
  type: 'EMPLOYMENT' | 'NDA' | 'CONFIDENTIALITY' | 'OTHER';
  title: string;
  content: string;
  status: 'DRAFT' | 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
  sentAt?: string;
  signedAt?: string;
}

export interface Payroll {
  id: string;
  year: number;
  month: number;
  baseSalary: number;
  overtimePay: number;
  bonus: number;
  totalAllowance: number;
  nationalPension: number;
  healthInsurance: number;
  longTermCare: number;
  employmentIns: number;
  incomeTax: number;
  localIncomeTax: number;
  totalDeduction: number;
  netPay: number;
  paidAt?: string;
}

export interface Certificate {
  id: string;
  type: 'EMPLOYMENT' | 'CAREER' | 'INCOME';
  purpose?: string;
  status: 'PENDING' | 'ISSUED' | 'REJECTED';
  filePath?: string;
  issuedAt?: string;
  createdAt: string;
}

export interface WeeklyHours {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  remainingHours: number;
  isOverLimit: boolean;
  dailyRecords: Attendance[];
}

export interface LeaveBalance {
  total: number;
  used: number;
  remaining: number;
}

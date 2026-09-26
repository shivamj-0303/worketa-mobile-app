export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId?: string;
  email?: string;
  employeeId?: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: 'EMPLOYEE';
}

export interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
  monthlySalary: number;
  absentDeductionPerDay: number;
  absenceDeduction?: number;
  presentDays: number;
  doubledDays: number;
  absentDays: number;
  requestedPresentDays?: number;
  requestedDoubledDays?: number;
  requestedAbsentDays?: number;
  grossAmount: number;
  bonusAmount: number;
  advanceDeduction: number;
  netAmount: number;
  requestedAdvanceAmount?: number;
  requestedBonusAmount?: number;
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AttendanceType = 'PRESENT' | 'ABSENT' | 'WORKED_DOUBLE';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  attendanceDate: string;
  type: AttendanceType;
  status: RequestStatus;
}

export interface AdvanceRecord {
  id: string;
  employeeId: string;
  amount: number;
  advanceDate: string;
  status: RequestStatus;
  settled?: boolean;
}

export interface PayrollRecord {
  id: string;
  month?: string;
  periodStart?: string;
  periodEnd?: string;
  netAmount?: number;
  settledAt?: string;
}

export interface EmployeeProfile {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  employeeCode?: string;
  type?: string;
  joiningDate?: string;
  monthlySalary?: number;
  absentDeductionPerDay?: number;
  active?: boolean;
}

export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

# Componi - 주요 기능 로직 설계

## 1. GPS 기반 출퇴근 체크 로직

### 1.1 Haversine 거리 계산 알고리즘

```typescript
// utils/geoUtils.ts

interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * 두 GPS 좌표 간의 거리를 미터 단위로 계산 (Haversine 공식)
 */
export function calculateDistance(
  point1: Coordinate,
  point2: Coordinate
): number {
  const R = 6371000; // 지구 반지름 (미터)

  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLat = toRadians(point2.latitude - point1.latitude);
  const deltaLng = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 결과: 미터
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
```

### 1.2 출근 체크 서비스

```typescript
// services/attendanceService.ts

interface CheckInRequest {
  userId: string;
  latitude: number;
  longitude: number;
  method: 'gps' | 'wifi';
  wifiSSID?: string;
}

interface CheckInResult {
  success: boolean;
  message: string;
  attendance?: Attendance;
}

export async function checkIn(request: CheckInRequest): Promise<CheckInResult> {
  const { userId, latitude, longitude, method } = request;

  // 1. 사용자의 회사 근무지 목록 조회
  const user = await getUserById(userId);
  const workLocations = await getWorkLocations(user.companyId);

  // 2. GPS 방식: 허용 반경 내 근무지 확인
  if (method === 'gps') {
    const validLocation = workLocations.find((location) => {
      const distance = calculateDistance(
        { latitude, longitude },
        { latitude: location.latitude, longitude: location.longitude }
      );
      return distance <= location.radiusMeters;
    });

    if (!validLocation) {
      return {
        success: false,
        message: '근무지 범위(반경 100m) 밖입니다. 위치를 확인해주세요.',
      };
    }
  }

  // 3. Wi-Fi 방식: SSID 매칭 확인
  if (method === 'wifi' && request.wifiSSID) {
    const validWifi = workLocations.find(
      (loc) => loc.wifiSSID === request.wifiSSID
    );
    if (!validWifi) {
      return {
        success: false,
        message: '등록된 회사 Wi-Fi가 아닙니다.',
      };
    }
  }

  // 4. 중복 출근 체크
  const today = new Date().toISOString().split('T')[0];
  const existingAttendance = await getAttendanceByDate(userId, today);

  if (existingAttendance?.checkInTime) {
    return {
      success: false,
      message: '오늘 이미 출근 처리되었습니다.',
    };
  }

  // 5. 출근 기록 생성
  const now = new Date();
  const attendance = await createAttendance({
    userId,
    workDate: today,
    checkInTime: now,
    checkInLat: latitude,
    checkInLng: longitude,
    checkInMethod: method,
    status: isLate(now) ? 'late' : 'normal',
  });

  return {
    success: true,
    message: `출근 완료 (${now.toLocaleTimeString('ko-KR')})`,
    attendance,
  };
}

// 지각 판단 (09:00 이후)
function isLate(checkInTime: Date): boolean {
  const hours = checkInTime.getHours();
  const minutes = checkInTime.getMinutes();
  return hours > 9 || (hours === 9 && minutes > 0);
}
```

### 1.3 부정 출근 방지 추가 로직

```typescript
// 위치 스푸핑 방지를 위한 추가 검증
interface LocationValidation {
  accuracy: number;        // GPS 정확도 (미터)
  timestamp: number;       // 위치 측정 시간
  isMocked: boolean;       // Mock Location 감지 (Android)
}

export function validateLocation(validation: LocationValidation): boolean {
  // 1. GPS 정확도 체크 (100m 이상이면 거부)
  if (validation.accuracy > 100) {
    throw new Error('GPS 정확도가 낮습니다. 실외에서 다시 시도해주세요.');
  }

  // 2. Mock Location 감지 (Android)
  if (validation.isMocked) {
    throw new Error('위치 조작이 감지되었습니다.');
  }

  // 3. 위치 측정 시간 검증 (30초 이내)
  const now = Date.now();
  if (now - validation.timestamp > 30000) {
    throw new Error('위치 정보가 오래되었습니다. 다시 시도해주세요.');
  }

  return true;
}
```

---

## 2. 전자서명 구현 로직

### 2.1 React Native 서명 캔버스

```typescript
// components/SignatureCanvas.tsx
import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';

interface SignatureCanvasProps {
  onSave: (signature: string) => void;
  onClear: () => void;
}

export function SignatureCanvas({ onSave, onClear }: SignatureCanvasProps) {
  const signatureRef = useRef<SignatureScreen>(null);

  const handleSignature = (signature: string) => {
    // signature = "data:image/png;base64,iVBORw0KGgo..."
    onSave(signature);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    onClear();
  };

  return (
    <View style={styles.container}>
      <SignatureScreen
        ref={signatureRef}
        onOK={handleSignature}
        onClear={handleClear}
        descriptionText="서명해주세요"
        clearText="지우기"
        confirmText="완료"
        webStyle={signatureWebStyle}
      />
    </View>
  );
}

const signatureWebStyle = `
  .m-signature-pad { box-shadow: none; border: 1px solid #e0e0e0; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { display: none; }
`;
```

### 2.2 서명 → PDF 합성 백엔드

```typescript
// services/contractSignService.ts
import { PDFDocument } from 'pdf-lib';
import crypto from 'crypto';
import fs from 'fs/promises';

interface SignContractRequest {
  contractId: string;
  userId: string;
  signatureBase64: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: object;
}

export async function signContract(request: SignContractRequest) {
  const { contractId, userId, signatureBase64, ipAddress, userAgent, deviceInfo } = request;

  // 1. 계약서 조회
  const contract = await getContractById(contractId);
  if (contract.status !== 'sent') {
    throw new Error('서명 가능한 상태가 아닙니다.');
  }

  // 2. 서명 이미지 저장
  const signatureBuffer = Buffer.from(
    signatureBase64.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  );
  const signaturePath = `signatures/${new Date().getFullYear()}/${contractId}_signature.png`;
  await uploadToStorage(signaturePath, signatureBuffer);

  // 3. 해시값 생성 (무결성 검증용)
  const signatureHash = crypto
    .createHash('sha256')
    .update(signatureBuffer)
    .digest('hex');

  // 4. 원본 PDF 로드 및 서명 삽입
  const pdfBytes = await fs.readFile(contract.documentUrl);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // 서명 이미지 삽입
  const signatureImage = await pdfDoc.embedPng(signatureBuffer);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];

  // 서명 위치 (하단 중앙)
  lastPage.drawImage(signatureImage, {
    x: 200,
    y: 100,
    width: 150,
    height: 50,
  });

  // 서명 일시 텍스트 추가
  const signedAt = new Date();
  lastPage.drawText(`서명일시: ${signedAt.toLocaleString('ko-KR')}`, {
    x: 200,
    y: 80,
    size: 10,
  });

  // 5. 서명 완료된 PDF 저장
  const signedPdfBytes = await pdfDoc.save();
  const signedDocPath = `contracts/signed/${contractId}_signed.pdf`;
  await uploadToStorage(signedDocPath, Buffer.from(signedPdfBytes));

  // 6. 전자서명 기록 저장
  await createDigitalSignature({
    contractId,
    userId,
    signatureImagePath: signaturePath,
    signatureHash,
    ipAddress,
    userAgent,
    deviceInfo,
    signedAt,
  });

  // 7. 계약 상태 업데이트
  await updateContract(contractId, {
    status: 'signed',
    signedDocumentUrl: signedDocPath,
    signedAt,
  });

  return {
    success: true,
    signedDocumentUrl: signedDocPath,
  };
}
```

---

## 3. 급여 계산 로직

### 3.1 급여 산출 프로세스

```typescript
// services/payrollService.ts

interface PayrollCalculation {
  userId: string;
  yearMonth: string;  // "2024-01"
}

export async function calculatePayroll(params: PayrollCalculation) {
  const { userId, yearMonth } = params;

  // 1. 직원 정보 조회
  const user = await getUserById(userId);
  const baseSalary = user.baseSalary;

  // 2. 해당 월 근태 데이터 조회
  const attendances = await getMonthlyAttendances(userId, yearMonth);

  // 3. 근무시간 집계
  const workStats = calculateWorkStats(attendances);

  // 4. 급여 계산
  const hourlyRate = baseSalary / 209; // 월 통상임금 / 209시간

  const payrollData = {
    // 지급 항목
    basePay: baseSalary,
    overtimePay: calculateOvertimePay(workStats.overtimeMinutes, hourlyRate),
    nightPay: calculateNightPay(workStats.nightMinutes, hourlyRate),
    holidayPay: calculateHolidayPay(workStats.holidayMinutes, hourlyRate),
    mealAllowance: 100000,  // 비과세 식대

    // 공제 계산
    ...calculateDeductions(baseSalary + overtimePay),

    // 근태 통계
    totalWorkDays: workStats.totalDays,
    totalWorkHours: workStats.totalMinutes / 60,
    overtimeHours: workStats.overtimeMinutes / 60,
  };

  // 5. 합계 계산
  payrollData.totalPay =
    payrollData.basePay +
    payrollData.overtimePay +
    payrollData.nightPay +
    payrollData.holidayPay +
    payrollData.mealAllowance;

  payrollData.totalDeductions =
    payrollData.incomeTax +
    payrollData.localIncomeTax +
    payrollData.nationalPension +
    payrollData.healthInsurance +
    payrollData.longTermCare +
    payrollData.employmentInsurance;

  payrollData.netPay = payrollData.totalPay - payrollData.totalDeductions;

  return payrollData;
}
```

### 3.2 수당 계산 함수

```typescript
// 연장근로수당 (통상임금의 1.5배)
function calculateOvertimePay(overtimeMinutes: number, hourlyRate: number): number {
  const hours = overtimeMinutes / 60;
  return Math.round(hours * hourlyRate * 1.5);
}

// 야간근로수당 (22시~06시, 통상임금의 0.5배 추가)
function calculateNightPay(nightMinutes: number, hourlyRate: number): number {
  const hours = nightMinutes / 60;
  return Math.round(hours * hourlyRate * 0.5);
}

// 휴일근로수당 (8시간 이내 1.5배, 초과 2배)
function calculateHolidayPay(holidayMinutes: number, hourlyRate: number): number {
  const hours = holidayMinutes / 60;
  if (hours <= 8) {
    return Math.round(hours * hourlyRate * 1.5);
  }
  return Math.round(8 * hourlyRate * 1.5 + (hours - 8) * hourlyRate * 2);
}
```

### 3.3 4대보험 및 세금 계산

```typescript
// 2024년 기준 4대보험 요율
const INSURANCE_RATES = {
  nationalPension: 0.045,      // 국민연금 4.5%
  healthInsurance: 0.0709,     // 건강보험 7.09% (근로자 부담 3.545%)
  longTermCare: 0.1295,        // 장기요양 (건강보험료의 12.95%)
  employmentInsurance: 0.009,  // 고용보험 0.9%
};

function calculateDeductions(taxableIncome: number) {
  // 비과세 식대 제외
  const mealAllowance = 100000;
  const taxBase = taxableIncome - mealAllowance;

  // 4대보험 계산
  const nationalPension = Math.round(taxBase * INSURANCE_RATES.nationalPension);
  const healthInsurance = Math.round(taxBase * (INSURANCE_RATES.healthInsurance / 2));
  const longTermCare = Math.round(healthInsurance * INSURANCE_RATES.longTermCare);
  const employmentInsurance = Math.round(taxBase * INSURANCE_RATES.employmentInsurance);

  // 소득세 (간이세액표 기준 - 실제로는 테이블 조회 필요)
  const incomeTax = calculateIncomeTax(taxBase);
  const localIncomeTax = Math.round(incomeTax * 0.1); // 지방소득세 10%

  return {
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    incomeTax,
    localIncomeTax,
  };
}

// 간이세액표 기반 소득세 계산 (간략화된 버전)
function calculateIncomeTax(monthlyIncome: number): number {
  // 실제로는 국세청 간이세액표 참조
  if (monthlyIncome <= 1060000) return 0;
  if (monthlyIncome <= 1500000) return Math.round((monthlyIncome - 1060000) * 0.06);
  if (monthlyIncome <= 3000000) return 26400 + Math.round((monthlyIncome - 1500000) * 0.15);
  if (monthlyIncome <= 4500000) return 251400 + Math.round((monthlyIncome - 3000000) * 0.24);
  return 611400 + Math.round((monthlyIncome - 4500000) * 0.35);
}
```

### 3.4 52시간 관리

```typescript
// 주 52시간 체크
interface WeeklyWorkCheck {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
}

export async function checkWeeklyHours(params: WeeklyWorkCheck) {
  const { userId, weekStart, weekEnd } = params;

  const attendances = await getAttendancesByDateRange(userId, weekStart, weekEnd);

  const totalMinutes = attendances.reduce(
    (sum, att) => sum + (att.workMinutes || 0),
    0
  );

  const totalHours = totalMinutes / 60;
  const overtimeHours = Math.max(0, totalHours - 40); // 주 40시간 초과분
  const remainingHours = Math.max(0, 52 - totalHours);

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    regularHours: Math.min(40, totalHours),
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    remainingHours: Math.round(remainingHours * 10) / 10,
    isOverLimit: totalHours > 52,
    warningLevel: getWarningLevel(totalHours),
  };
}

function getWarningLevel(hours: number): 'safe' | 'warning' | 'danger' {
  if (hours >= 52) return 'danger';
  if (hours >= 45) return 'warning';
  return 'safe';
}
```

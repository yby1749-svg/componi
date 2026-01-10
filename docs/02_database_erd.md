# Componi - 데이터베이스 설계 (PostgreSQL)

## 1. ERD 다이어그램

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   companies     │       │   departments   │       │    positions    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │◀──┐   │ id (PK)         │       │ id (PK)         │
│ name            │   │   │ company_id (FK) │───────│ company_id (FK) │
│ business_no     │   │   │ name            │       │ name            │
│ address         │   │   │ parent_id (FK)  │───┐   │ level           │
│ ceo_name        │   │   │ created_at      │   │   │ created_at      │
│ created_at      │   │   └─────────────────┘   │   └─────────────────┘
└─────────────────┘   │           ▲             │
         │            │           │             │
         │            │           └─────────────┘
         │            │
         ▼            │
┌─────────────────────┴───────────────────────────────────────────────┐
│                              users                                   │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK)              │ department_id (FK)    │ position_id (FK)     │
│ company_id (FK)      │ employee_no           │ name                 │
│ email                │ phone                 │ role (ENUM)          │
│ password_hash        │ hire_date             │ resignation_date     │
│ status (ENUM)        │ base_salary           │ created_at           │
└──────────┬──────────────────────┬───────────────────────┬───────────┘
           │                      │                       │
           ▼                      ▼                       ▼
┌──────────────────┐   ┌──────────────────┐    ┌──────────────────────┐
│   attendances    │   │     leaves       │    │     contracts        │
├──────────────────┤   ├──────────────────┤    ├──────────────────────┤
│ id (PK)          │   │ id (PK)          │    │ id (PK)              │
│ user_id (FK)     │   │ user_id (FK)     │    │ user_id (FK)         │
│ check_in_time    │   │ leave_type (FK)  │    │ template_id (FK)     │
│ check_out_time   │   │ start_date       │    │ status (ENUM)        │
│ check_in_lat     │   │ end_date         │    │ document_url         │
│ check_in_lng     │   │ reason           │    │ signed_document_url  │
│ check_in_method  │   │ status (ENUM)    │    │ created_at           │
│ work_minutes     │   │ approver_id (FK) │    │ signed_at            │
│ overtime_minutes │   │ approved_at      │    └──────────┬───────────┘
│ status (ENUM)    │   │ created_at       │               │
│ created_at       │   └──────────────────┘               ▼
└──────────────────┘                            ┌──────────────────────┐
           │                                    │  digital_signatures  │
           ▼                                    ├──────────────────────┤
┌──────────────────┐                            │ id (PK)              │
│     payrolls     │                            │ contract_id (FK)     │
├──────────────────┤                            │ user_id (FK)         │
│ id (PK)          │                            │ signature_image_path │
│ user_id (FK)     │                            │ signature_hash       │
│ year_month       │                            │ ip_address           │
│ base_pay         │                            │ device_info          │
│ overtime_pay     │                            │ signed_at            │
│ bonus            │                            │ created_at           │
│ total_deductions │                            └──────────────────────┘
│ net_pay          │
│ status (ENUM)    │
│ created_at       │
└──────────────────┘
```

---

## 2. 테이블 상세 정의

### 2.1 companies (회사)
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    business_no VARCHAR(20) UNIQUE NOT NULL,  -- 사업자등록번호
    address TEXT,
    ceo_name VARCHAR(50),
    phone VARCHAR(20),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 users (사용자/직원)
```sql
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'employee');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'inactive', 'resigned');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),

    -- 인증 정보
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- 기본 정보
    employee_no VARCHAR(20),           -- 사번
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    profile_image_url TEXT,

    -- 인사 정보
    hire_date DATE,
    resignation_date DATE,
    base_salary DECIMAL(12, 0),        -- 기본급

    -- 권한 및 상태
    role user_role DEFAULT 'employee',
    status user_status DEFAULT 'pending',

    -- 생체인증
    biometric_enabled BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### 2.3 attendances (출퇴근 기록)
```sql
CREATE TYPE check_method AS ENUM ('gps', 'wifi', 'manual', 'qr');
CREATE TYPE attendance_status AS ENUM ('normal', 'late', 'early_leave', 'absent', 'pending_approval');

CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),

    -- 출근 정보
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_in_lat DECIMAL(10, 8),       -- 위도
    check_in_lng DECIMAL(11, 8),       -- 경도
    check_in_method check_method,
    check_in_wifi_ssid VARCHAR(100),

    -- 퇴근 정보
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_out_lat DECIMAL(10, 8),
    check_out_lng DECIMAL(11, 8),
    check_out_method check_method,

    -- 근무시간 계산
    work_minutes INTEGER DEFAULT 0,     -- 총 근무시간(분)
    overtime_minutes INTEGER DEFAULT 0, -- 연장근무시간(분)
    night_minutes INTEGER DEFAULT 0,    -- 야간근무시간(분)

    -- 상태
    status attendance_status DEFAULT 'normal',
    note TEXT,

    work_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_attendance_user_date ON attendances(user_id, work_date);
CREATE INDEX idx_attendance_date ON attendances(work_date);
```

### 2.4 contracts (전자계약)
```sql
CREATE TYPE contract_status AS ENUM ('draft', 'sent', 'viewed', 'signed', 'rejected', 'expired');

CREATE TABLE contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(100) NOT NULL,         -- 템플릿 이름
    type VARCHAR(50) NOT NULL,          -- 계약서 유형
    content TEXT NOT NULL,              -- HTML/Markdown 템플릿
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    template_id UUID REFERENCES contract_templates(id),

    -- 계약 내용
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,              -- 실제 계약 내용 (변수 치환 후)

    -- 문서 파일
    document_url TEXT,                  -- 원본 PDF
    signed_document_url TEXT,           -- 서명 완료된 PDF

    -- 상태
    status contract_status DEFAULT 'draft',
    expires_at TIMESTAMP WITH TIME ZONE,

    -- 시간 기록
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contracts_user ON contracts(user_id);
CREATE INDEX idx_contracts_status ON contracts(status);
```

### 2.5 digital_signatures (전자서명)
```sql
CREATE TABLE digital_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id),
    user_id UUID NOT NULL REFERENCES users(id),

    -- 서명 데이터
    signature_image_path TEXT NOT NULL,  -- 서명 이미지 저장 경로
    signature_hash VARCHAR(64) NOT NULL, -- SHA-256 해시 (무결성 검증)

    -- 서명 환경 정보 (법적 증빙)
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_info JSONB,                   -- 디바이스 정보

    -- 타임스탬프
    signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    timestamp_token TEXT,                -- TSA 타임스탬프 (선택)

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_signatures_contract ON digital_signatures(contract_id);
```

### 2.6 payrolls (급여)
```sql
CREATE TYPE payroll_status AS ENUM ('draft', 'calculated', 'confirmed', 'sent');

CREATE TABLE payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    year_month VARCHAR(7) NOT NULL,     -- '2024-01' 형식

    -- 지급 항목
    base_pay DECIMAL(12, 0) DEFAULT 0,           -- 기본급
    overtime_pay DECIMAL(12, 0) DEFAULT 0,       -- 연장근로수당
    night_pay DECIMAL(12, 0) DEFAULT 0,          -- 야간근로수당
    holiday_pay DECIMAL(12, 0) DEFAULT 0,        -- 휴일근로수당
    bonus DECIMAL(12, 0) DEFAULT 0,              -- 상여금
    meal_allowance DECIMAL(12, 0) DEFAULT 0,     -- 식대
    transport_allowance DECIMAL(12, 0) DEFAULT 0,-- 교통비
    other_allowance DECIMAL(12, 0) DEFAULT 0,    -- 기타수당

    -- 공제 항목
    income_tax DECIMAL(12, 0) DEFAULT 0,         -- 소득세
    local_income_tax DECIMAL(12, 0) DEFAULT 0,   -- 지방소득세
    national_pension DECIMAL(12, 0) DEFAULT 0,   -- 국민연금
    health_insurance DECIMAL(12, 0) DEFAULT 0,   -- 건강보험
    long_term_care DECIMAL(12, 0) DEFAULT 0,     -- 장기요양보험
    employment_insurance DECIMAL(12, 0) DEFAULT 0,-- 고용보험
    other_deduction DECIMAL(12, 0) DEFAULT 0,    -- 기타공제

    -- 합계
    total_pay DECIMAL(12, 0) DEFAULT 0,          -- 총 지급액
    total_deductions DECIMAL(12, 0) DEFAULT 0,   -- 총 공제액
    net_pay DECIMAL(12, 0) DEFAULT 0,            -- 실수령액

    -- 상태
    status payroll_status DEFAULT 'draft',
    sent_at TIMESTAMP WITH TIME ZONE,

    -- 근태 연동 데이터
    total_work_days INTEGER DEFAULT 0,
    total_work_hours DECIMAL(5, 1) DEFAULT 0,
    overtime_hours DECIMAL(5, 1) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, year_month)
);

CREATE INDEX idx_payrolls_user_month ON payrolls(user_id, year_month);
```

### 2.7 leaves (휴가/연차)
```sql
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(50) NOT NULL,          -- 연차, 반차, 병가, 경조사 등
    is_paid BOOLEAN DEFAULT TRUE,       -- 유급 여부
    deduct_annual BOOLEAN DEFAULT TRUE, -- 연차 차감 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_used DECIMAL(3, 1) NOT NULL,   -- 사용 일수 (0.5 = 반차)

    reason TEXT,
    status leave_status DEFAULT 'pending',

    -- 결재
    approver_id UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    reject_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 연차 현황
CREATE TABLE annual_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    year INTEGER NOT NULL,

    total_days DECIMAL(4, 1) NOT NULL,  -- 총 부여 연차
    used_days DECIMAL(4, 1) DEFAULT 0,  -- 사용 연차
    remaining_days DECIMAL(4, 1),       -- 잔여 연차

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, year)
);
```

### 2.8 work_locations (근무지 설정)
```sql
CREATE TABLE work_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),

    name VARCHAR(100) NOT NULL,
    address TEXT,

    -- GPS 설정
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 100,  -- 허용 반경 (미터)

    -- Wi-Fi 설정
    wifi_ssid VARCHAR(100),
    wifi_bssid VARCHAR(17),             -- MAC 주소

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 3. 전자서명 데이터 보관 전략

### 3.1 서명 데이터 구조
```json
{
    "signature": {
        "image_path": "/signatures/2024/01/uuid_signature.png",
        "format": "PNG",
        "dimensions": "400x200"
    },
    "integrity": {
        "hash_algorithm": "SHA-256",
        "signature_hash": "a1b2c3d4e5...",
        "document_hash": "f6g7h8i9j0...",
        "combined_hash": "k1l2m3n4o5..."
    },
    "metadata": {
        "signed_at": "2024-01-15T09:30:00+09:00",
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "device": {
            "type": "mobile",
            "os": "iOS 17.0",
            "app_version": "1.0.0"
        }
    },
    "legal": {
        "signer_id": "user-uuid",
        "signer_name": "홍길동",
        "agreement_text": "본인은 위 내용을 확인하고 동의합니다."
    }
}
```

### 3.2 해시 생성 프로세스
```
1. 서명 이미지 → Base64 인코딩 → SHA-256 해시 = signature_hash
2. 원본 PDF → SHA-256 해시 = document_hash
3. signature_hash + document_hash + timestamp → SHA-256 = combined_hash
4. combined_hash를 digital_signatures 테이블에 저장
```

### 3.3 무결성 검증
- 서명 이미지와 문서가 변조되지 않았음을 해시값으로 검증
- 서명 시점의 타임스탬프로 법적 효력 입증
- 서명자의 IP, 디바이스 정보로 본인 확인 보조

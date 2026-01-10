# Componi - 보안 및 확장성 전략

## 1. 인증 체계 (Authentication)

### 1.1 JWT 기반 인증

```typescript
// auth/jwtService.ts
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  companyId: string;
  role: 'super_admin' | 'admin' | 'manager' | 'employee';
  email: string;
}

// Access Token: 15분
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: '15m',
    issuer: 'easycom-hr',
  });
}

// Refresh Token: 7일
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d',
    issuer: 'easycom-hr',
  });
}

// 토큰 검증
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload;
}
```

### 1.2 생체인증 (Biometrics)

```typescript
// React Native - 생체인증 구현
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export async function authenticateWithBiometrics(): Promise<boolean> {
  // 생체인증 지원 확인
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    throw new Error('생체인증을 사용할 수 없습니다.');
  }

  // 생체인증 실행
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'EasyCom HR 로그인',
    cancelLabel: '취소',
    fallbackLabel: 'PIN 입력',
  });

  if (result.success) {
    // 저장된 Refresh Token 가져오기
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (refreshToken) {
      // 새 Access Token 발급
      await refreshAccessToken(refreshToken);
      return true;
    }
  }

  return false;
}
```

### 1.3 토큰 저장 및 관리

```typescript
// 앱: Secure Storage 사용
// - iOS: Keychain
// - Android: Encrypted SharedPreferences

// 토큰 저장
await SecureStore.setItemAsync('accessToken', accessToken);
await SecureStore.setItemAsync('refreshToken', refreshToken);

// 토큰 삭제 (로그아웃)
await SecureStore.deleteItemAsync('accessToken');
await SecureStore.deleteItemAsync('refreshToken');
```

---

## 2. 권한 관리 (RBAC)

### 2.1 역할 정의

| 역할 | 설명 | 권한 |
|------|------|------|
| `super_admin` | 시스템 관리자 | 모든 권한 |
| `admin` | 회사 관리자 | 자사 전체 관리 |
| `manager` | 팀장/부서장 | 소속 팀원 근태/휴가 승인 |
| `employee` | 일반 직원 | 본인 정보 조회/수정 |

### 2.2 권한 매트릭스

```typescript
// auth/permissions.ts

type Permission =
  | 'user:read'
  | 'user:write'
  | 'user:delete'
  | 'attendance:read'
  | 'attendance:write'
  | 'attendance:approve'
  | 'leave:read'
  | 'leave:write'
  | 'leave:approve'
  | 'payroll:read'
  | 'payroll:write'
  | 'contract:read'
  | 'contract:write'
  | 'settings:manage';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: ['*'], // 모든 권한

  admin: [
    'user:read', 'user:write', 'user:delete',
    'attendance:read', 'attendance:write', 'attendance:approve',
    'leave:read', 'leave:write', 'leave:approve',
    'payroll:read', 'payroll:write',
    'contract:read', 'contract:write',
    'settings:manage',
  ],

  manager: [
    'user:read',
    'attendance:read', 'attendance:approve',
    'leave:read', 'leave:approve',
    'payroll:read',
    'contract:read',
  ],

  employee: [
    'attendance:read', 'attendance:write',
    'leave:read', 'leave:write',
    'payroll:read',
    'contract:read',
  ],
};
```

### 2.3 권한 검사 미들웨어

```typescript
// middleware/authorize.ts

export function authorize(...requiredPermissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as TokenPayload;
    const userPermissions = ROLE_PERMISSIONS[user.role];

    // super_admin은 모든 권한
    if (userPermissions.includes('*')) {
      return next();
    }

    // 필요한 권한 확인
    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: '접근 권한이 없습니다.',
      });
    }

    next();
  };
}

// 사용 예시
router.get('/users', authorize('user:read'), getUsers);
router.post('/leaves/:id/approve', authorize('leave:approve'), approveLeave);
```

### 2.4 데이터 범위 제한

```typescript
// 직원: 본인 데이터만 조회
// 팀장: 소속 팀원 데이터 조회
// 관리자: 전사 데이터 조회

async function getAccessibleUserIds(user: TokenPayload): Promise<string[]> {
  switch (user.role) {
    case 'employee':
      return [user.userId];

    case 'manager':
      // 소속 부서원 조회
      const teamMembers = await db.users.findMany({
        where: { departmentId: user.departmentId },
        select: { id: true },
      });
      return teamMembers.map((m) => m.id);

    case 'admin':
    case 'super_admin':
      // 전체 직원
      const allUsers = await db.users.findMany({
        where: { companyId: user.companyId },
        select: { id: true },
      });
      return allUsers.map((u) => u.id);
  }
}
```

---

## 3. 데이터 보안

### 3.1 민감 데이터 암호화

```typescript
// utils/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

// 암호화 (급여 정보 등)
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // iv:authTag:encrypted 형식으로 저장
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// 복호화
export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 3.2 API 보안

```typescript
// 1. Rate Limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
});

app.use('/api', limiter);

// 2. CORS 설정
app.use(cors({
  origin: ['https://admin.easycom-hr.com'],
  credentials: true,
}));

// 3. Helmet (보안 헤더)
import helmet from 'helmet';
app.use(helmet());

// 4. 입력 검증
import { z } from 'zod';

const CheckInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  method: z.enum(['gps', 'wifi']),
});
```

### 3.3 감사 로그 (Audit Log)

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,  -- 'LOGIN', 'CHECK_IN', 'PAYROLL_VIEW' 등
    resource_type VARCHAR(50),      -- 'attendance', 'payroll', 'contract'
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

```typescript
// 감사 로그 기록
async function logAudit(params: {
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: object;
  request: Request;
}) {
  await db.auditLogs.create({
    data: {
      userId: params.userId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      ipAddress: params.request.ip,
      userAgent: params.request.headers['user-agent'],
      details: params.details,
    },
  });
}
```

---

## 4. 시스템 아키텍처

### 4.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         클라이언트                               │
│   ┌─────────────┐                      ┌─────────────┐         │
│   │ 직원 앱     │                      │ 관리자 웹   │         │
│   │ (React     │                      │ (Next.js)  │         │
│   │  Native)   │                      │            │         │
│   └──────┬──────┘                      └──────┬──────┘         │
└──────────┼─────────────────────────────────────┼────────────────┘
           │                                     │
           └──────────────┬──────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway / Load Balancer                │
│                         (AWS ALB / Nginx)                       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                         Backend                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │ Auth       │  │ HR         │  │ Payroll    │                 │
│  │ Service    │  │ Service    │  │ Service    │                 │
│  │ (Node.js)  │  │ (Node.js)  │  │ (Node.js)  │                 │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                 │
│        │               │               │                         │
│        └───────────────┼───────────────┘                        │
│                        │                                         │
└────────────────────────┼────────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────────┐
│                   Data Layer                                     │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│   │ PostgreSQL │  │ Redis      │  │ S3         │               │
│   │ (RDS)      │  │ (Cache)    │  │ (Files)    │               │
│   └────────────┘  └────────────┘  └────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 기술 스택

| 영역 | 기술 |
|------|------|
| **모바일 앱** | React Native + Expo |
| **관리자 웹** | Next.js 14 + TypeScript |
| **백엔드 API** | Node.js + Express/Fastify |
| **데이터베이스** | PostgreSQL (AWS RDS) |
| **캐시** | Redis (세션, 토큰) |
| **파일 저장소** | AWS S3 (서명, PDF) |
| **인증** | JWT + Biometrics |
| **푸시 알림** | Firebase Cloud Messaging |

### 4.3 확장성 전략

```yaml
# Docker Compose (개발/스테이징)
version: '3.8'
services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://...
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  postgres:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
```

---

## 5. 멀티테넌시 (Multi-Tenancy)

### 5.1 테넌트 격리 전략

```typescript
// 모든 쿼리에 company_id 필터 적용
// Prisma 미들웨어 예시

prisma.$use(async (params, next) => {
  const user = getCurrentUser();

  if (user && user.companyId) {
    // SELECT 쿼리에 where 조건 추가
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        companyId: user.companyId,
      };
    }

    // CREATE 시 companyId 자동 설정
    if (params.action === 'create') {
      params.args.data.companyId = user.companyId;
    }
  }

  return next(params);
});
```

### 5.2 Row Level Security (PostgreSQL)

```sql
-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payrolls ENABLE ROW LEVEL SECURITY;

-- 정책 생성: 같은 회사 데이터만 접근
CREATE POLICY company_isolation ON users
  FOR ALL
  USING (company_id = current_setting('app.company_id')::uuid);

-- 세션에 company_id 설정
SET app.company_id = 'company-uuid-here';
```

---

## 6. 배포 및 모니터링

### 6.1 CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS
        run: |
          aws ecs update-service --cluster prod --service api --force-new-deployment
```

### 6.2 모니터링

```typescript
// 성능 모니터링 (Sentry)
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});

// 커스텀 메트릭
Sentry.metrics.increment('attendance.check_in');
Sentry.metrics.distribution('api.response_time', responseTime);
```

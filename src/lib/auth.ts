/**
 * 보안 공통 헬퍼 (security-fixes 패치)
 * - JWT_SECRET 강제: 환경변수 미설정 시 즉시 에러 (fallback 시크릿 사용 금지)
 * - bcrypt 해싱: 구 SHA-256 해시는 로그인 성공 시 자동 마이그레이션
 * - 세션/권한 검증: getSession, requireAdmin
 */
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

const BCRYPT_COST = 12;
const LEGACY_SHA256_RE = /^[a-f0-9]{64}$/;

/** JWT 서명 시크릿. 미설정이거나 너무 짧으면 예외를 던진다. */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET 환경변수가 설정되지 않았거나 너무 짧습니다 (최소 32자 권장, 64자 랜덤 문자열 사용).'
    );
  }
  return new TextEncoder().encode(secret);
}

/** 비밀번호 해싱 (bcrypt, cost 12) */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * 비밀번호 검증.
 * bcrypt 해시를 우선 시도하고, 구 SHA-256 해시는 호환 검증 후
 * 호출자가 needsRehash()로 확인해 bcrypt로 재해싱하면 된다.
 */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (!passwordHash) return false;
  if (passwordHash.startsWith('$2')) {
    return bcrypt.compare(password, passwordHash);
  }
  if (LEGACY_SHA256_RE.test(passwordHash)) {
    const legacy = crypto.createHash('sha256').update(password).digest('hex');
    const a = Buffer.from(legacy);
    const b = Buffer.from(passwordHash);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  return false;
}

/** 구 해시(SHA-256 등)라서 bcrypt 재해싱이 필요한지 여부 */
export function needsRehash(passwordHash: string): boolean {
  return !passwordHash.startsWith('$2');
}

/** 임시 비밀번호 생성 (관리자 직접 등록·초기화용, 1회만 표시) */
export function randomPassword(length = 16): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

/** 평문 시크릿 비교 (타이밍 공격 방지) */
export function timingSafeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export interface SessionPayload {
  userId: number | null;
  role: string;
  name: string;
  email: string;
  partnerId: number | null;
}

/** 쿠키(admin_session) 또는 Authorization 헤더에서 JWT 세션을 읽는다. 없거나 무효하면 null. */
export async function getSession(request: Request): Promise<SessionPayload | null> {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  let token: string | null = match ? match[1] : null;
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      userId: (payload.userId as number | null) ?? null,
      role: (payload.role as string) || 'partner',
      name: (payload.name as string) || '',
      email: (payload.email as string) || '',
      partnerId: (payload.partnerId as number | null) ?? null,
    };
  } catch {
    return null;
  }
}

/** 관리자 세션이면 SessionPayload, 아니면 null (API 라우트 가드용) */
export async function requireAdmin(request: Request): Promise<SessionPayload | null> {
  const session = await getSession(request);
  if (!session || session.role !== 'admin') return null;
  return session;
}

/** 파트너 본인 데이터 접근 여부 (관리자는 전체 허용) */
export function canAccessPartner(session: SessionPayload, partnerId: number | null | undefined): boolean {
  if (session.role === 'admin') return true;
  return partnerId != null && session.partnerId === partnerId;
}

/** 작업 단위 접근 여부: 관리자는 전체, 파트너는 배정받았거나 등록한 작업만 */
export async function canAccessTask(session: SessionPayload, taskId: number): Promise<boolean> {
  if (session.role === 'admin') return true;
  if (!session.partnerId) return false;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { partnerId: true, registeredByPartnerId: true },
  });
  if (!task) return false;
  return task.partnerId === session.partnerId || task.registeredByPartnerId === session.partnerId;
}

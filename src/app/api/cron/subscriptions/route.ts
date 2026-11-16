import { NextResponse } from 'next/server';
import { sweepExpiredSubscriptions } from '@/lib/subscription';
import { timingSafeEqualString } from '@/lib/auth';

/**
 * 구독 만료 스윕 (Vercel Cron 전용)
 * - vercel.json 스케줄로 매일 1회 호출된다.
 * - CRON_SECRET 환경변수가 없으면 비활성화(fail-closed), Vercel은 동일 값을 Bearer로 자동 전송한다.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[cron] CRON_SECRET 환경변수가 없어 구독 만료 스윕을 건너뜁니다.');
    return NextResponse.json({ error: 'cron not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!provided || !timingSafeEqualString(provided, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expiredCount = await sweepExpiredSubscriptions();
  return NextResponse.json({ success: true, expiredCount });
}

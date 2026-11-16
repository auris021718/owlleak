import prisma from '@/lib/prisma';

/** 구독 기간 만료 여부 */
export function isSubscriptionExpired(currentPeriodEnd: Date): boolean {
  return currentPeriodEnd.getTime() < Date.now();
}

/**
 * 기간이 지난 active 구독을 past_due로 일괄 전환한다.
 * 실제 재결제(PG) 연동 전까지는 만료 시 past_due 상태로 관리해 무상 이용을 막는다.
 */
export async function sweepExpiredSubscriptions(): Promise<number> {
  const result = await prisma.subscription.updateMany({
    where: { status: 'active', currentPeriodEnd: { lt: new Date() } },
    data: { status: 'past_due' },
  });
  return result.count;
}

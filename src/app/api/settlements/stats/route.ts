import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allSettlements = await prisma.settlement.findMany({
      include: {
        partner: true,
      },
    });

    const totalPaid = allSettlements
      .filter((s) => s.status === 'paid')
      .reduce((sum, s) => sum + s.amount, 0);

    const totalPending = allSettlements
      .filter((s) => s.status === 'pending')
      .reduce((sum, s) => sum + s.amount, 0);

    const paidCount = allSettlements.filter((s) => s.status === 'paid').length;
    const pendingCount = allSettlements.filter((s) => s.status === 'pending').length;

    // Partner breakdown
    const partnerMap: Record<number, { id: number; name: string; pending: number; paid: number }> = {};
    for (const s of allSettlements) {
      if (!partnerMap[s.partnerId]) {
        partnerMap[s.partnerId] = {
          id: s.partnerId,
          name: s.partner?.companyName || `파트너 #${s.partnerId}`,
          pending: 0,
          paid: 0,
        };
      }
      if (s.status === 'paid') {
        partnerMap[s.partnerId].paid += s.amount;
      } else {
        partnerMap[s.partnerId].pending += s.amount;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalPaid,
        totalPending,
        paidCount,
        pendingCount,
        partnerBreakdown: Object.values(partnerMap),
      },
    });
  } catch (error) {
    console.error('Failed to get settlement stats:', error);
    return NextResponse.json({ success: false, error: '정산 통계 조회 실패' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPartnerClassification } from '@/lib/partnerType';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const where: any = {};
    if (partnerId) {
      where.partnerId = parseInt(partnerId, 10);
    }
    if (status && status !== 'all') {
      where.status = status;
    }
    if (type && type !== 'all') {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { partner: { companyName: { contains: search, mode: 'insensitive' } } },
        { task: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const settlements = await prisma.settlement.findMany({
      where,
      include: {
        partner: true,
        task: {
          include: {
            customer: true,
            estimate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: settlements });
  } catch (error) {
    console.error('Failed to fetch settlements:', error);
    return NextResponse.json({ success: false, error: '정산 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partnerId, taskId, amount, status = 'pending', type, rate } = body;

    if (!partnerId || !amount) {
      return NextResponse.json({ success: false, error: '파트너와 정산 금액은 필수입니다.' }, { status: 400 });
    }

    const parsedPartnerId = parseInt(String(partnerId), 10);
    const parsedTaskId = taskId ? parseInt(String(taskId), 10) : null;
    const totalAmount = parseInt(String(amount), 10);

    // Fetch performing partner classification
    const performingPartner = await prisma.partner.findUnique({
      where: { id: parsedPartnerId },
      select: { id: true, specialty: true, companyName: true },
    });

    const isCooperating = getPartnerClassification(performingPartner?.specialty).isCooperating;

    // 1. If Performing entity is a Cooperating partner (방수, 타일, 미장, 도배, 목수, 전기 등):
    // Receives 100% of the agreed amount proposed by the partner.
    if (isCooperating) {
      const settlement = await prisma.settlement.create({
        data: {
          partnerId: parsedPartnerId,
          taskId: parsedTaskId,
          amount: totalAmount,
          type: type || 'agreed_payout',
          rate: 100,
          status,
        },
        include: {
          partner: true,
          task: { include: { customer: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: settlement,
        message: '협력사 파트너 제시 금액 100% 정산이 생성되었습니다.',
      });
    }

    // 2. Partner-to-Partner dividend calculation (90% Performing Partner / 10% Registering Partner)
    if (parsedTaskId) {
      const task = await prisma.task.findUnique({
        where: { id: parsedTaskId },
      });

      if (
        task &&
        task.registrationType === 'dividend' &&
        task.registeredByPartnerId &&
        task.registeredByPartnerId !== parsedPartnerId
      ) {
        const jobAmount = Math.round(totalAmount * 0.9);
        const dividendAmount = Math.round(totalAmount * 0.1);

        // Performing Partner's 90% Job Payout Settlement
        const jobSettlement = await prisma.settlement.create({
          data: {
            partnerId: parsedPartnerId,
            taskId: parsedTaskId,
            amount: jobAmount,
            type: 'job_payout',
            rate: 90,
            status,
          },
          include: {
            partner: true,
            task: { include: { customer: true } },
          },
        });

        // Registering Partner's 10% Dividend Settlement
        const dividendSettlement = await prisma.settlement.create({
          data: {
            partnerId: task.registeredByPartnerId,
            taskId: parsedTaskId,
            amount: dividendAmount,
            type: 'registration_dividend',
            rate: 10,
            status: 'pending',
          },
          include: {
            partner: true,
            task: { include: { customer: true } },
          },
        });

        return NextResponse.json({
          success: true,
          data: jobSettlement,
          dividendSettlement,
          message: '파트너 간 시공 정산(90%) 및 일 등록자 배당금(10%)이 생성되었습니다.',
        });
      }
    }

    // Default 100% direct settlement for primary partner
    const settlement = await prisma.settlement.create({
      data: {
        partnerId: parsedPartnerId,
        taskId: parsedTaskId,
        amount: totalAmount,
        type: type || 'job_payout',
        rate: rate || 100,
        status,
      },
      include: {
        partner: true,
        task: {
          include: { customer: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: settlement });
  } catch (error) {
    console.error('Failed to create settlement:', error);
    return NextResponse.json({ success: false, error: '정산 내역 생성에 실패했습니다.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { getPartnerClassification } from '@/lib/partnerType';

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
    const partnerId = payload.partnerId as number | null;

    if (!partnerId) {
      return NextResponse.json({ error: '파트너 계정만 구독 신청이 가능합니다.' }, { status: 400 });
    }

    // 2. Fetch partner details to determine classification (협력사: 월 55,000원 / 파트너: 월 99,000원)
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { specialty: true, companyName: true },
    });

    const classification = getPartnerClassification(partner?.specialty);

    const body = await request.json().catch(() => ({}));
    const { cardNumber, cardExpiry } = body;

    const planPrice = body.planPrice || classification.monthlyPrice;
    const planType = classification.planType;

    // 3. Generate mock billing key & customer key (Toss Payments simulation)
    const billingKey = `bill_key_${crypto.randomBytes(8).toString('hex')}`;
    const customerKey = `cust_${partnerId}_${Date.now()}`;
    const orderId = `ORD_SUB_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    // 4. Upsert Subscription in DB
    const subscription = await prisma.subscription.upsert({
      where: { partnerId },
      update: {
        status: 'active',
        planType,
        price: planPrice,
        billingKey,
        customerKey,
        currentPeriodStart: new Date(),
        currentPeriodEnd: nextBillingDate,
        canceledAt: null,
      },
      create: {
        partnerId,
        planType,
        status: 'active',
        price: planPrice,
        billingCycle: 'monthly',
        billingKey,
        customerKey,
        currentPeriodStart: new Date(),
        currentPeriodEnd: nextBillingDate,
      },
    });

    // 5. Create Payment History for first month charge
    const payment = await prisma.paymentHistory.create({
      data: {
        subscriptionId: subscription.id,
        amount: planPrice,
        orderId,
        paymentKey: `pay_${crypto.randomBytes(12).toString('hex')}`,
        status: 'SUCCESS',
        receiptUrl: `https://dashboard.owl-leak.com/receipts/${orderId}`,
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${classification.planName}(${planPrice.toLocaleString()}원)이 성공적으로 활성화되었습니다.`,
      classification,
      subscription,
      payment,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: '구독 결제 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

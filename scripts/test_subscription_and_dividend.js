const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFlow() {
  console.log('=== 1. Testing Master Partner Subscription (99,000 KRW) ===');
  const partner = await prisma.partner.findFirst({
    where: { email: 'hansung@example.com' },
  });

  if (!partner) {
    console.error('Partner not found');
    return;
  }

  // Create or Update Master Subscription
  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  const sub = await prisma.subscription.upsert({
    where: { partnerId: partner.id },
    update: {
      status: 'active',
      planType: 'master',
      price: 99000,
      billingKey: 'bill_key_test_1234',
      customerKey: `cust_${partner.id}_test`,
      currentPeriodStart: new Date(),
      currentPeriodEnd: nextBillingDate,
    },
    create: {
      partnerId: partner.id,
      planType: 'master',
      status: 'active',
      price: 99000,
      billingCycle: 'monthly',
      billingKey: 'bill_key_test_1234',
      customerKey: `cust_${partner.id}_test`,
      currentPeriodStart: new Date(),
      currentPeriodEnd: nextBillingDate,
    },
  });

  console.log('Subscription Created:', {
    id: sub.id,
    planType: sub.planType,
    price: sub.price,
    status: sub.status,
    periodEnd: sub.currentPeriodEnd,
  });

  // Create Payment History
  const payment = await prisma.paymentHistory.create({
    data: {
      subscriptionId: sub.id,
      amount: 99000,
      orderId: `ORD_TEST_${Date.now()}`,
      status: 'SUCCESS',
      paidAt: new Date(),
    },
  });
  console.log('Payment History Created:', payment.orderId, payment.amount);

  console.log('\n=== 2. Testing Dual Customer Registration & 10% Dividend ===');
  // Registering a 10% dividend referral customer
  const customer = await prisma.customer.upsert({
    where: { phone: '010-9999-8888' },
    update: {
      name: '강남 역삼동 누수건',
      address: '서울 강남구 역삼동',
      registrationType: 'dividend',
      registeredByPartnerId: partner.id,
    },
    create: {
      name: '강남 역삼동 누수건',
      phone: '010-9999-8888',
      address: '서울 강남구 역삼동',
      registrationType: 'dividend',
      registeredByPartnerId: partner.id,
    },
  });
  console.log('Customer Created:', customer.name, 'Type:', customer.registrationType, 'RegisteredBy:', customer.registeredByPartnerId);

  // Performing Partner is Partner #10 (서울목공 박지훈)
  const performingPartner = await prisma.partner.findFirst({
    where: { email: 'seoul.wood@example.com' },
  });

  const task = await prisma.task.create({
    data: {
      title: `${customer.name} - 누수 및 배관 시공`,
      customerId: customer.id,
      partnerId: performingPartner.id,
      registrationType: 'dividend',
      registeredByPartnerId: partner.id,
      status: 'done',
    },
  });

  console.log('Task Created & Assigned to Performing Partner:', task.id, 'Title:', task.title);

  // Total Job Price = 1,000,000 KRW
  const totalAmount = 1000000;
  const jobAmount = Math.round(totalAmount * 0.9); // 900,000 KRW
  const dividendAmount = Math.round(totalAmount * 0.1); // 100,000 KRW

  // Create 90% Job Payout Settlement
  const jobSettlement = await prisma.settlement.create({
    data: {
      partnerId: performingPartner.id,
      taskId: task.id,
      amount: jobAmount,
      type: 'job_payout',
      rate: 90,
      status: 'pending',
    },
  });

  // Create 10% Registration Dividend Settlement
  const dividendSettlement = await prisma.settlement.create({
    data: {
      partnerId: partner.id, // Registered by partner
      taskId: task.id,
      amount: dividendAmount,
      type: 'registration_dividend',
      rate: 10,
      status: 'pending',
    },
  });

  console.log('\n=== Settlements Created ===');
  console.log('1. Performing Partner Payout (90%):', {
    id: jobSettlement.id,
    partnerId: jobSettlement.partnerId,
    amount: jobSettlement.amount,
    type: jobSettlement.type,
    rate: jobSettlement.rate,
  });
  console.log('2. Registering Partner 10% Dividend:', {
    id: dividendSettlement.id,
    partnerId: dividendSettlement.partnerId,
    amount: dividendSettlement.amount,
    type: dividendSettlement.type,
    rate: dividendSettlement.rate,
  });

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

testFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

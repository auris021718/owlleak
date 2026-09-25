const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records (in reverse dependency order)
  console.log('🧹 Clearing existing data...');
  await prisma.notification.deleteMany({});
  await prisma.taskLog.deleteMany({});
  await prisma.taskPhoto.deleteMany({});
  await prisma.settlement.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.estimate.deleteMany({});
  await prisma.partner.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✨ Existing data cleared.');

  // 2. Create Users
  console.log('🔐 Creating users...');
  const defaultPw = hashPassword('1234!');
  const adminPw = hashPassword('owlleak0815');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@owl-leak.kr',
      passwordHash: adminPw,
      name: '부엉이 관리자',
      phone: '010-0000-0000',
      role: 'admin',
    },
  });

  const partnerUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'hansung@example.com',
        passwordHash: defaultPw,
        name: '김한성',
        phone: '010-1234-5678',
        role: 'partner',
      },
    }),
    prisma.user.create({
      data: {
        email: 'seoul.wood@example.com',
        passwordHash: defaultPw,
        name: '박지훈',
        phone: '010-9876-5432',
        role: 'partner',
      },
    }),
    prisma.user.create({
      data: {
        email: 'gangnam.pipe@example.com',
        passwordHash: defaultPw,
        name: '이민수',
        phone: '010-5555-1234',
        role: 'partner',
      },
    }),
    prisma.user.create({
      data: {
        email: 'mideom.dobe@example.com',
        passwordHash: defaultPw,
        name: '최영희',
        phone: '010-7777-8888',
        role: 'partner',
      },
    }),
    prisma.user.create({
      data: {
        email: 'dream.mj@example.com',
        passwordHash: defaultPw,
        name: '정재원',
        phone: '010-2222-3333',
        role: 'partner',
      },
    }),
  ]);

  console.log(`✅ Created 1 admin and ${partnerUsers.length} partner user accounts.`);

  // 3. Create Partners
  console.log('🤝 Creating partner profiles...');
  const partnerData = [
    {
      userId: partnerUsers[0].id,
      companyName: '한성방수',
      contactName: '김한성',
      phone: '010-1234-5678',
      email: 'hansung@example.com',
      specialty: '방수',
      region: '서울 서초·강남',
      partnerCode: 'PTR-WP-001',
      status: 'active',
      rating: 5.0,
      completedJobs: 24,
      memo: '옥상·지하 방수 전문, 신뢰도 높음',
    },
    {
      userId: partnerUsers[1].id,
      companyName: '서울목공',
      contactName: '박지훈',
      phone: '010-9876-5432',
      email: 'seoul.wood@example.com',
      specialty: '목수',
      region: '서울 전 지역',
      partnerCode: 'PTR-WD-002',
      status: 'active',
      rating: 4.0,
      completedJobs: 15,
      memo: '누수 복구 후 목공 마감 담당',
    },
    {
      userId: partnerUsers[2].id,
      companyName: '강남파이프',
      contactName: '이민수',
      phone: '010-5555-1234',
      email: 'gangnam.pipe@example.com',
      specialty: '배관',
      region: '강남·송파·강동',
      partnerCode: 'PTR-PL-003',
      status: 'pending',
      rating: 3.0,
      completedJobs: 5,
      memo: '신규 파트너, 검증 진행 중',
    },
    {
      userId: partnerUsers[3].id,
      companyName: '믿음도배',
      contactName: '최영희',
      phone: '010-7777-8888',
      email: 'mideom.dobe@example.com',
      specialty: '도배',
      region: '경기 남부',
      partnerCode: 'PTR-WP-004',
      status: 'active',
      rating: 4.0,
      completedJobs: 11,
      memo: '빠른 시공, 마감 깔끔',
    },
    {
      userId: partnerUsers[4].id,
      companyName: '드림미장',
      contactName: '정재원',
      phone: '010-2222-3333',
      email: 'dream.mj@example.com',
      specialty: '미장',
      region: '인천·부천',
      partnerCode: 'PTR-PL-005',
      status: 'inactive',
      rating: 2.0,
      completedJobs: 3,
      memo: '현재 계약 종료 상태',
    },
  ];

  const partners = [];
  for (const data of partnerData) {
    const partner = await prisma.partner.create({ data });
    partners.push(partner);
  }
  console.log(`✅ Created ${partners.length} partner profiles.`);

  // 4. Create Customers
  console.log('👤 Creating customers...');
  const customers = [];
  const customerData = [
    {
      name: '홍길동',
      phone: '010-1234-5678',
      address: '서울특별시 강남구 역삼동 123-45 역삼푸르지오 102동 304호',
    },
    {
      name: '이영수',
      phone: '010-2345-6789',
      address: '서울특별시 서초구 서초동 567-89 서초자이 105동 202호',
    },
    {
      name: '김미영',
      phone: '010-3456-7890',
      address: '경기도 성남시 분당구 삼평동 456 봇들마을 3단지 301동 1205호',
    },
    {
      name: '박준형',
      phone: '010-4567-8901',
      address: '인천광역시 연수구 송도동 789 송도더샵 204동 502호',
    },
    {
      name: '최지민',
      phone: '010-5678-9012',
      address: '서울특별시 송파구 잠실동 321 잠실엘스 112동 804호',
    },
  ];

  for (const data of customerData) {
    const customer = await prisma.customer.create({ data });
    customers.push(customer);
  }
  console.log(`✅ Created ${customers.length} customers.`);

  // 5. Create Estimates and Tasks
  console.log('📝 Creating estimates and tasks...');
  const now = new Date();

  // Task 1: 진행중 (in-progress)
  const est1 = await prisma.estimate.create({
    data: {
      customerId: customers[0].id,
      customerPhone: customers[0].phone,
      parking: true,
      elevator: true,
      heatingTarget: '개별난방',
      floorLevel: '3층',
      leakLocation: '서초 래미안 아파트 101동 누수 탐지',
      leakAmount: '미세 누수 (서서히 젖어듬)',
      urgency: '보통',
      boilerBrand: '경동나비엔',
      boilerError: '없음',
      boilerPipeSize: '15A',
      waterBill: '평소보다 약 2만원 더 나옴',
      managerCheck: true,
      downstairsCheck: true,
      damageAreas: ['거실'],
      customDamageArea: '',
      timing: '약 일주일 전부터 아래층 거실 천장이 서서히 젖어들기 시작함.',
      detectChecks: ['배관 압력 검사', '가스 탐지', '청음 탐지'],
      customDetectItem: '',
      detectionDetails: '거실 보일러 온수 배관 엘보 연결 부위 미세 누수 의의. 가스 탐지 후 청음식으로 최종 위치 특정 예정.',
      detectionFee: 250000,
      requiredWorks: ['배관 부분 교체', '미장 마감'],
      estimatedMinPrice: 400000,
      estimatedMaxPrice: 600000,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const task1 = await prisma.task.create({
    data: {
      estimateId: est1.id,
      customerId: customers[0].id,
      partnerId: partners[0].id,
      title: '서초 래미안 아파트 101동 누수 탐지',
      status: 'in-progress',
      scheduledDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
      time: '10:00',
      location: '서초구 반포동 래미안 101동',
      type: 'normal',
      description: '보일러 하부 온수 배관 가스 탐지 완료 후 거실 굴착 및 배관 엘보 교체, 시멘트 미장 마감 작업.',
    },
  });

  // Task 2: 대기중 (todo)
  const est2 = await prisma.estimate.create({
    data: {
      customerId: customers[1].id,
      customerPhone: customers[1].phone,
      parking: false,
      elevator: false,
      heatingTarget: '지역난방',
      floorLevel: '2층',
      leakLocation: '송파 다세대 주택 배관',
      leakAmount: '지속적으로 물이 떨어짐',
      urgency: '긴급',
      damageAreas: ['화장실'],
      detectionDetails: '욕실 바닥 방수 결함 및 온수 배관 누수 의심.',
      detectionFee: 300000,
      estimatedMinPrice: 1500000,
      estimatedMaxPrice: 2200000,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      estimateId: est2.id,
      customerId: customers[1].id,
      partnerId: partners[2].id,
      title: '송파 다세대 주택 배관 공사',
      status: 'todo',
      scheduledDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0),
      time: '14:00',
      location: '송파구 석촌동 다세대 202호',
      type: 'urgent',
      description: '욕실 바닥 철거 후 배관 정밀 탐지 및 교체 작업.',
    },
  });

  // Task 3: 완료 (done)
  const est3 = await prisma.estimate.create({
    data: {
      customerId: customers[2].id,
      customerPhone: customers[2].phone,
      parking: true,
      elevator: true,
      heatingTarget: '개별난방',
      floorLevel: '12층',
      leakLocation: '강남 빌라 옥상 방수',
      leakAmount: '우천 시 누수',
      urgency: '보통',
      damageAreas: ['베란다'],
      detectionDetails: '옥상 우레탄 방수층 들뜸 및 크랙 보수.',
      detectionFee: 150000,
      estimatedMinPrice: 800000,
      estimatedMaxPrice: 1200000,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      estimateId: est3.id,
      customerId: customers[2].id,
      partnerId: partners[0].id,
      title: '강남 빌라 옥상 방수',
      status: 'done',
      scheduledDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 9, 30),
      time: '09:30',
      location: '강남구 역삼동 삼익빌라',
      type: 'normal',
      description: '옥상 우레탄 3회 도포 및 탑코트 마감 완료.',
    },
  });

  // 6. Create Photos
  console.log('📸 Creating task photos...');
  await prisma.taskPhoto.createMany({
    data: [
      {
        taskId: task1.id,
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
        title: '욕실 배관 누수',
        caption: '욕실 타일 하부 온수 배관 연결부위 누수 확인',
        phase: 'before',
        uploadedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        taskId: task1.id,
        url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600',
        title: '보일러 수리 전',
        caption: '보일러 하부 배관 노후 및 누수 상태',
        phase: 'before',
        uploadedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        taskId: task2.id,
        url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=600',
        title: '천장 얼룩 상태',
        caption: '아래층 천장 벽지 젖음 및 곰팡이 발생',
        phase: 'before',
        uploadedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        taskId: task3.id,
        url: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=600',
        title: '외부 방수 공사 완료',
        caption: '옥상 우레탄 3차 방수 도포 완료 후 경화 상태',
        phase: 'after',
        uploadedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // 7. Create Notifications
  console.log('🔔 Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        type: 'estimate',
        title: '신규 견적 접수',
        message: '홍길동 고객님의 새로운 누수 탐지 견적이 접수되었습니다.',
        isRead: false,
      },
      {
        userId: partnerUsers[0].id,
        type: 'task',
        title: '새 작업 배정 알림',
        message: '서초 래미안 아파트 101동 누수 탐지 작업이 배정되었습니다.',
        isRead: false,
      },
    ],
  });

  // 8. Create Settlements
  console.log('💰 Creating settlements...');
  await prisma.settlement.create({
    data: {
      partnerId: partners[0].id,
      taskId: task3.id,
      amount: 450000,
      status: 'paid',
    },
  });

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

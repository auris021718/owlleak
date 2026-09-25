import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const partnerId = searchParams.get('partnerId');
    const date = searchParams.get('date'); // YYYY-MM-DD

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (partnerId) {
      where.partnerId = parseInt(partnerId, 10);
    }
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      where.scheduledDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        customer: true,
        partner: true,
        photos: true,
        estimate: true,
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ success: false, error: '작업 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      status = 'todo',
      scheduledDate,
      time,
      location,
      type = 'normal',
      description,
      partnerId,
      customerId,
      estimateId,
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: '작업 제목은 필수입니다.' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        status,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        time,
        location,
        type,
        description,
        partnerId: partnerId ? parseInt(String(partnerId), 10) : null,
        customerId: customerId ? parseInt(String(customerId), 10) : null,
        estimateId: estimateId ? parseInt(String(estimateId), 10) : null,
      },
      include: {
        customer: true,
        partner: true,
        photos: true,
      },
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ success: false, error: '작업 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

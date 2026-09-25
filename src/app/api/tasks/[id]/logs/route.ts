import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 Task ID입니다.' }, { status: 400 });
    }

    const logs = await prisma.taskLog.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Failed to get task logs:', error);
    return NextResponse.json({ success: false, error: '작업 일지 조회 실패' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 Task ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { action, description, userId } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: '작업 구분은 필수입니다.' }, { status: 400 });
    }

    const log = await prisma.taskLog.create({
      data: {
        taskId,
        action,
        description: description || null,
        userId: userId ? parseInt(String(userId), 10) : null,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error('Failed to create task log:', error);
    return NextResponse.json({ success: false, error: '작업 일지 등록 실패' }, { status: 500 });
  }
}

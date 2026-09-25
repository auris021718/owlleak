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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 Task ID입니다.' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const body = await request.json();
    const logId = searchParams.get('logId') || body.logId;
    const parsedLogId = parseInt(String(logId), 10);

    if (isNaN(parsedLogId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 일지 ID입니다.' }, { status: 400 });
    }

    const { action, description } = body;
    const updateData: { action?: string; description?: string | null } = {};
    if (action !== undefined) {
      if (!action.trim()) {
        return NextResponse.json({ success: false, error: '작업 구분은 비워둘 수 없습니다.' }, { status: 400 });
      }
      updateData.action = action.trim();
    }
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    const updatedLog = await prisma.taskLog.update({
      where: { id: parsedLogId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, data: updatedLog });
  } catch (error) {
    console.error('Failed to update task log:', error);
    return NextResponse.json({ success: false, error: '작업 일지 수정 실패' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 Task ID입니다.' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    let logId = searchParams.get('logId');
    if (!logId) {
      try {
        const body = await request.json();
        logId = body.logId;
      } catch {
        // body not present
      }
    }

    const parsedLogId = parseInt(String(logId), 10);
    if (isNaN(parsedLogId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 일지 ID입니다.' }, { status: 400 });
    }

    await prisma.taskLog.deleteMany({
      where: { id: parsedLogId },
    });

    return NextResponse.json({ success: true, message: '작업 일지가 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete task log:', error);
    return NextResponse.json({ success: false, error: '작업 일지 삭제 실패' }, { status: 500 });
  }
}

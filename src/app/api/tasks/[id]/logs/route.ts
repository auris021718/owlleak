import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, canAccessTask } from '@/lib/auth';

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

    // [보안] 로그인 + 작업 접근 권한 필수
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }
    if (!(await canAccessTask(session, taskId))) {
      return NextResponse.json({ success: false, error: '접근 권한이 없습니다.' }, { status: 403 });
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

    // [보안] 로그인 + 작업 접근 권한 필수
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }
    if (!(await canAccessTask(session, taskId))) {
      return NextResponse.json({ success: false, error: '접근 권한이 없습니다.' }, { status: 403 });
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
        userId: session.userId, // [보안] 작성자는 세션 기준으로 기록 (요청값 신뢰 안 함)
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

    // [보안] 로그인 + 작업 접근 권한 필수
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }
    if (!(await canAccessTask(session, taskId))) {
      return NextResponse.json({ success: false, error: '접근 권한이 없습니다.' }, { status: 403 });
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

    // [보안] 수정 대상 일지가 이 작업의 일지인지 확인
    const targetLog = await prisma.taskLog.findUnique({ where: { id: parsedLogId }, select: { taskId: true } });
    if (!targetLog || targetLog.taskId !== taskId) {
      return NextResponse.json({ success: false, error: '작업 일지를 찾을 수 없습니다.' }, { status: 404 });
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

    // [보안] 로그인 + 작업 접근 권한 필수
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }
    if (!(await canAccessTask(session, taskId))) {
      return NextResponse.json({ success: false, error: '접근 권한이 없습니다.' }, { status: 403 });
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

    // [보안] 삭제 대상 일지가 이 작업의 일지인지 확인
    const targetLog = await prisma.taskLog.findUnique({ where: { id: parsedLogId }, select: { taskId: true } });
    if (!targetLog || targetLog.taskId !== taskId) {
      return NextResponse.json({ success: false, error: '작업 일지를 찾을 수 없습니다.' }, { status: 404 });
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

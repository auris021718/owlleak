import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, canAccessTask } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const { logId } = await params;
    const parsedLogId = parseInt(logId, 10);
    if (isNaN(parsedLogId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 일지 ID입니다.' }, { status: 400 });
    }

    // [보안] 로그인 세션 필수
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    const log = await prisma.taskLog.findUnique({
      where: { id: parsedLogId },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    if (!log) {
      return NextResponse.json({ success: false, error: '작업 일지를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!(await canAccessTask(session, log.taskId))) {
      return NextResponse.json({ success: false, error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error('Failed to get task log:', error);
    return NextResponse.json({ success: false, error: '작업 일지 조회 실패' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const { logId } = await params;
    const parsedLogId = parseInt(logId, 10);
    if (isNaN(parsedLogId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 일지 ID입니다.' }, { status: 400 });
    }

    // [보안] 로그인 세션 필수
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
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

    // [보안] 일지가 속한 작업에 대한 접근 권한 확인
    const log = await prisma.taskLog.findUnique({ where: { id: parsedLogId }, select: { taskId: true } });
    if (!log) {
      return NextResponse.json({ success: false, error: '작업 일지를 찾을 수 없습니다.' }, { status: 404 });
    }
    if (!(await canAccessTask(session, log.taskId))) {
      return NextResponse.json({ success: false, error: '접근 권한이 없습니다.' }, { status: 403 });
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
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const { logId } = await params;
    const parsedLogId = parseInt(logId, 10);
    if (isNaN(parsedLogId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 일지 ID입니다.' }, { status: 400 });
    }

    // [보안] 로그인 세션 필수
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    // [보안] 일지가 속한 작업에 대한 접근 권한 확인
    const log = await prisma.taskLog.findUnique({ where: { id: parsedLogId }, select: { taskId: true } });
    if (!log) {
      return NextResponse.json({ success: false, error: '작업 일지를 찾을 수 없습니다.' }, { status: 404 });
    }
    if (!(await canAccessTask(session, log.taskId))) {
      return NextResponse.json({ success: false, error: '접근 권한이 없습니다.' }, { status: 403 });
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

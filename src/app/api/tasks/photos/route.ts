import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, canAccessTask } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // [보안] 로그인 세션 필수
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const phase = searchParams.get('phase');

    const where: any = {};
    if (taskId) {
      where.taskId = parseInt(taskId, 10);
    }
    if (phase) {
      where.phase = phase;
    }

    // [보안] 파트너는 본인 작업의 사진만 조회
    if (session.role !== 'admin') {
      if (!session.partnerId) {
        return NextResponse.json({ success: true, data: [] });
      }
      if (taskId) {
        if (!(await canAccessTask(session, parseInt(taskId, 10)))) {
          return NextResponse.json({ success: false, error: '접근 권한이 없습니다.' }, { status: 403 });
        }
      } else {
        where.task = { partnerId: session.partnerId };
      }
    }

    const photos = await prisma.taskPhoto.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: photos });
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    return NextResponse.json({ success: false, error: '사진 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // [보안] 로그인 세션 필수
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, url, title, caption, phase = 'during' } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: '사진 URL은 필수입니다.' }, { status: 400 });
    }

    // [운영] taskId가 없으면 임의의 작업에 사진을 붙이던 기존 동작 제거 — 반드시 작업을 지정해야 한다
    const targetTaskId = taskId ? parseInt(String(taskId), 10) : null;
    if (!targetTaskId || isNaN(targetTaskId)) {
      return NextResponse.json({ success: false, error: '사진을 연결할 작업(taskId)이 필요합니다.' }, { status: 400 });
    }
    if (!(await canAccessTask(session, targetTaskId))) {
      return NextResponse.json({ success: false, error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    const photo = await prisma.taskPhoto.create({
      data: {
        taskId: targetTaskId,
        url,
        title: title || '현장 사진',
        caption,
        phase,
      },
    });

    return NextResponse.json({ success: true, data: photo });
  } catch (error) {
    console.error('Failed to create photo:', error);
    return NextResponse.json({ success: false, error: '사진 등록 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

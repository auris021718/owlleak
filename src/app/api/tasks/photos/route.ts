import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
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
    const body = await request.json();
    const { taskId, url, title, caption, phase = 'during' } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: '사진 URL은 필수입니다.' }, { status: 400 });
    }

    // If no taskId provided, link to the most recent task or first task
    let targetTaskId = taskId ? parseInt(String(taskId), 10) : null;
    if (!targetTaskId) {
      const latestTask = await prisma.task.findFirst({ orderBy: { id: 'asc' } });
      if (latestTask) {
        targetTaskId = latestTask.id;
      } else {
        // Create dummy task if none exists
        const dummyTask = await prisma.task.create({
          data: { title: '현장 기본 작업' },
        });
        targetTaskId = dummyTask.id;
      }
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

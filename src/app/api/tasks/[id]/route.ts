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
      return NextResponse.json({ success: false, error: '유효하지 않은 작업 ID입니다.' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        customer: true,
        partner: true,
        photos: true,
        logs: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
        estimate: true,
      },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: '작업을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error('Failed to get task:', error);
    return NextResponse.json({ success: false, error: '작업 조회 중 오류가 발생했습니다.' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: '유효하지 않은 작업 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      status,
      scheduledDate,
      time,
      location,
      type,
      description,
      partnerId,
      customerId,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (status !== undefined) updateData.status = status;
    if (scheduledDate !== undefined) {
      updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    }
    if (time !== undefined) updateData.time = time;
    if (location !== undefined) updateData.location = location;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (partnerId !== undefined) {
      updateData.partnerId = partnerId ? parseInt(String(partnerId), 10) : null;
    }
    if (customerId !== undefined) {
      updateData.customerId = customerId ? parseInt(String(customerId), 10) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        customer: true,
        partner: true,
        photos: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ success: false, error: '작업 수정 중 오류가 발생했습니다.' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: '유효하지 않은 작업 ID입니다.' }, { status: 400 });
    }

    // 외래키 제약조건 방지를 위해 연관된 정산, 사진, 로그를 트랜잭션으로 안전하게 함께 정리
    await prisma.$transaction(async (tx) => {
      // 1. 연결된 정산 내역 삭제
      await tx.settlement.deleteMany({ where: { taskId } });
      // 2. 연결된 시공 사진 삭제
      await tx.taskPhoto.deleteMany({ where: { taskId } });
      // 3. 연결된 작업 일지 삭제
      await tx.taskLog.deleteMany({ where: { taskId } });
      // 4. 작업 본체 삭제
      await tx.task.deleteMany({ where: { id: taskId } });
    });

    return NextResponse.json({ success: true, message: '작업이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ success: false, error: '작업 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 ID입니다.' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        estimates: {
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          include: {
            partner: true,
            photos: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { estimates: true, tasks: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: '고객을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error('Failed to get customer:', error);
    return NextResponse.json({ success: false, error: '고객 조회 실패' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { name, phone, address } = body;

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
      },
      include: {
        estimates: true,
        tasks: {
          include: { partner: true, photos: true },
        },
        _count: { select: { estimates: true, tasks: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update customer:', error);
    return NextResponse.json({ success: false, error: '고객 정보 수정 실패' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 ID입니다.' }, { status: 400 });
    }

    // Delete related tasks photos & estimates or use transaction
    await prisma.$transaction([
      prisma.taskPhoto.deleteMany({
        where: { task: { customerId } },
      }),
      prisma.taskLog.deleteMany({
        where: { task: { customerId } },
      }),
      prisma.settlement.deleteMany({
        where: { task: { customerId } },
      }),
      prisma.task.deleteMany({
        where: { customerId },
      }),
      prisma.estimate.deleteMany({
        where: { customerId },
      }),
      prisma.customer.delete({
        where: { id: customerId },
      }),
    ]);

    return NextResponse.json({ success: true, message: '고객 정보가 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete customer:', error);
    return NextResponse.json({ success: false, error: '고객 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

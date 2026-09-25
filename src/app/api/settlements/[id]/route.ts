import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const settlementId = parseInt(id, 10);
    if (isNaN(settlementId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 ID입니다.' }, { status: 400 });
    }

    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        partner: true,
        task: {
          include: {
            customer: true,
            estimate: true,
            photos: true,
          },
        },
      },
    });

    if (!settlement) {
      return NextResponse.json({ success: false, error: '정산 내역을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: settlement });
  } catch (error) {
    console.error('Failed to get settlement:', error);
    return NextResponse.json({ success: false, error: '정산 내역 조회 실패' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const settlementId = parseInt(id, 10);
    if (isNaN(settlementId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const { status, amount } = body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (amount !== undefined) updateData.amount = parseInt(String(amount), 10);

    const updated = await prisma.settlement.update({
      where: { id: settlementId },
      data: updateData,
      include: {
        partner: true,
        task: {
          include: { customer: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update settlement:', error);
    return NextResponse.json({ success: false, error: '정산 내역 수정 실패' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const settlementId = parseInt(id, 10);
    if (isNaN(settlementId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 ID입니다.' }, { status: 400 });
    }

    await prisma.settlement.delete({
      where: { id: settlementId },
    });

    return NextResponse.json({ success: true, message: '정산 내역이 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete settlement:', error);
    return NextResponse.json({ success: false, error: '정산 내역 삭제 실패' }, { status: 500 });
  }
}

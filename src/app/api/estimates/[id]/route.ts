import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const estId = parseInt(id, 10);
    if (isNaN(estId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 견적 ID입니다.' }, { status: 400 });
    }

    const estimate = await prisma.estimate.findUnique({
      where: { id: estId },
      include: {
        customer: true,
        task: {
          include: {
            partner: true,
            photos: true,
          },
        },
      },
    });

    if (!estimate) {
      return NextResponse.json({ success: false, error: '견적을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: estimate });
  } catch (error) {
    console.error('Failed to fetch estimate:', error);
    return NextResponse.json({ success: false, error: '견적 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const estId = parseInt(id, 10);
    if (isNaN(estId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 견적 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const {
      urgency,
      detectionFee,
      estimatedMinPrice,
      estimatedMaxPrice,
      detectionDetails,
      partnerId, // If provided, assign or create Task for this estimate
    } = body;

    const updateData: any = {};
    if (urgency !== undefined) updateData.urgency = urgency;
    if (detectionFee !== undefined) updateData.detectionFee = parseInt(String(detectionFee), 10);
    if (estimatedMinPrice !== undefined) updateData.estimatedMinPrice = parseInt(String(estimatedMinPrice), 10);
    if (estimatedMaxPrice !== undefined) updateData.estimatedMaxPrice = parseInt(String(estimatedMaxPrice), 10);
    if (detectionDetails !== undefined) updateData.detectionDetails = detectionDetails;

    const updatedEstimate = await prisma.estimate.update({
      where: { id: estId },
      data: updateData,
      include: {
        customer: true,
        task: true,
      },
    });

    // If partnerId was specified to assign a partner
    if (partnerId !== undefined) {
      const pid = partnerId ? parseInt(String(partnerId), 10) : null;
      if (updatedEstimate.task) {
        // Update existing task partner
        await prisma.task.update({
          where: { id: updatedEstimate.task.id },
          data: {
            partnerId: pid,
            status: pid ? 'in-progress' : 'todo',
          },
        });
      } else if (pid) {
        // Create new task linked to this estimate
        await prisma.task.create({
          data: {
            estimateId: estId,
            customerId: updatedEstimate.customerId,
            partnerId: pid,
            title: `${updatedEstimate.customer?.name || '고객'}님 누수 공사 (${updatedEstimate.leakLocation || '현장'})`,
            status: 'in-progress',
            scheduledDate: new Date(),
            location: updatedEstimate.customer?.address || updatedEstimate.leakLocation,
            type: updatedEstimate.urgency === '긴급' ? 'urgent' : 'normal',
          },
        });
      }
    }

    const finalEstimate = await prisma.estimate.findUnique({
      where: { id: estId },
      include: {
        customer: true,
        task: {
          include: { partner: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: finalEstimate });
  } catch (error) {
    console.error('Failed to update estimate:', error);
    return NextResponse.json({ success: false, error: '견적 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const estId = parseInt(id, 10);
    if (isNaN(estId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 견적 ID입니다.' }, { status: 400 });
    }

    // Delete task first if exists
    await prisma.task.deleteMany({ where: { estimateId: estId } });
    await prisma.estimate.delete({ where: { id: estId } });

    return NextResponse.json({ success: true, message: '견적이 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete estimate:', error);
    return NextResponse.json({ success: false, error: '견적 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

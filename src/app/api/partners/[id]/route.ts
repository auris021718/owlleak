import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partnerId = parseInt(id, 10);
    if (isNaN(partnerId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 파트너 ID입니다.' }, { status: 400 });
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
        tasks: {
          include: { customer: true, photos: true },
          orderBy: { createdAt: 'desc' },
        },
        settlements: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ success: false, error: '파트너를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: partner });
  } catch (error) {
    console.error('Failed to get partner:', error);
    return NextResponse.json({ success: false, error: '파트너 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partnerId = parseInt(id, 10);
    if (isNaN(partnerId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 파트너 ID입니다.' }, { status: 400 });
    }

    const body = await request.json();
    const {
      companyName,
      contactName,
      phone,
      email,
      specialty,
      region,
      partnerCode,
      status,
      rating,
      completedJobs,
      memo,
    } = body;

    const updateData: any = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (specialty !== undefined) updateData.specialty = specialty;
    if (region !== undefined) updateData.region = region;
    if (partnerCode !== undefined) updateData.partnerCode = partnerCode;
    if (status !== undefined) updateData.status = status;
    if (rating !== undefined) updateData.rating = parseFloat(String(rating));
    if (completedJobs !== undefined) updateData.completedJobs = parseInt(String(completedJobs), 10);
    if (memo !== undefined) updateData.memo = memo;

    const updatedPartner = await prisma.partner.update({
      where: { id: partnerId },
      data: updateData,
      include: { user: true },
    });

    return NextResponse.json({ success: true, data: updatedPartner });
  } catch (error) {
    console.error('Failed to update partner:', error);
    return NextResponse.json({ success: false, error: '파트너 정보 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partnerId = parseInt(id, 10);
    if (isNaN(partnerId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 파트너 ID입니다.' }, { status: 400 });
    }

    await prisma.partner.delete({
      where: { id: partnerId },
    });

    return NextResponse.json({ success: true, message: '파트너가 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete partner:', error);
    return NextResponse.json({ success: false, error: '파트너 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

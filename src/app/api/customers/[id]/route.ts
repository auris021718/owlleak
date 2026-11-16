import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, canAccessTask } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // [보안] 로그인 세션 필수
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Empty or invalid JSON body" }, { status: 400 });
    }
    const { 
      name, phone, region, jobType, isUrgent, detail, // Full edit fields
      phase, assignedPartner // Phase/Partner update fields
    } = body;

    // 1. Find the Task first to get linked IDs
    const task = await prisma.task.findUnique({
      where: { id },
      include: { customer: true, estimate: true }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // [보안] 파트너는 본인 작업에 연결된 고객만 수정 가능
    if (!(await canAccessTask(session, id))) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 2. Update Customer
    if (name || phone || region) {
      await prisma.customer.update({
        where: { id: task.customerId! },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(region && { address: region }),
        }
      });
    }

    // 3. Update Estimate
    if (jobType !== undefined || isUrgent !== undefined) {
      await prisma.estimate.update({
        where: { id: task.estimateId! },
        data: {
          ...(jobType && { detectionDetails: jobType }),
          ...(isUrgent !== undefined && { urgency: isUrgent ? "당일 긴급 방문" : "일반 방문" }),
        }
      });
    }

    // 4. Update Task
    let dbStatus = task.status;
    if (phase === "phase1") dbStatus = "대기중";
    if (phase === "phase2") dbStatus = "전체알림";
    if (phase === "assigned") dbStatus = "배정완료";

    // Partner assignment logic
    let partnerId = task.partnerId;
    if (assignedPartner) {
      const partner = await prisma.partner.findFirst({
        where: { companyName: assignedPartner }
      });
      if (partner) {
        partnerId = partner.id;
      } else {
        const newPartner = await prisma.partner.create({
          data: {
            companyName: assignedPartner,
            phone: "000-0000-0000"
          }
        });
        partnerId = newPartner.id;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: name ? `${name} 고객님 - ${jobType || task.estimate?.detectionDetails || "누수"} 작업` : task.title,
        description: detail !== undefined ? detail : task.description,
        status: dbStatus,
        partnerId: partnerId
      },
      include: {
        customer: true,
        estimate: true,
        partner: true
      }
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error("PUT customer error:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // [보안] 로그인 + 작업 접근 권한 필수
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }
    if (!(await canAccessTask(session, id))) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 1. Find task to get estimateId
    const task = await prisma.task.findUnique({
      where: { id },
      select: { estimateId: true }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2. Delete task and estimate
    // Note: Due to foreign key constraints, we delete Task first if it's the one referencing Estimate,
    // or use a transaction.
    await prisma.$transaction([
      prisma.task.delete({ where: { id } }),
      ...(task.estimateId ? [prisma.estimate.delete({ where: { id: task.estimateId } })] : []),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE customer error:", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}

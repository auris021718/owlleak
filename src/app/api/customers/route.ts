import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        customer: true,
        estimate: true,
        partner: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedCustomers = tasks.map((task) => ({
      id: task.id.toString(),
      name: task.customer?.name || "알 수 없음",
      phone: task.customer?.phone || "알 수 없음",
      region: task.customer?.address || "지역 미상",
      jobType: task.estimate?.detectionDetails || "누수",
      isUrgent: task.estimate?.urgency === "당일 긴급 방문",
      detail: task.description || "",
      registrationType: task.registrationType || "direct",
      registeredByPartnerId: task.registeredByPartnerId,
      registeredAt: task.createdAt.toISOString(),
      phase: task.status === "대기중" ? "phase1" : task.status === "전체알림" ? "phase2" : task.status === "배정완료" ? "assigned" : "unassigned",
      assignedPartner: task.partner?.companyName,
      notifications: [],
      phase1StartedAt: task.createdAt.getTime(),
    }));

    return NextResponse.json(mappedCustomers);
  } catch (error) {
    console.error("GET customers error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, 
      phone, 
      region, 
      jobType, 
      isUrgent, 
      detail, 
      phase, 
      registrationType = "direct", 
      assignedPartnerId,
      registeredByPartnerId: customRegisteredByPartnerId 
    } = body;

    // Check currently logged-in user to identify registering partner
    let sessionPartnerId: number | null = null;
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    if (match) {
      try {
        const jwtSecret = process.env.JWT_SECRET || "fallback_secret";
        const { payload } = await jwtVerify(match[1], new TextEncoder().encode(jwtSecret));
        sessionPartnerId = (payload.partnerId as number) || null;
      } catch (e) {
        // ignore
      }
    }

    const registeredByPartnerId = customRegisteredByPartnerId || sessionPartnerId || null;

    // 1. Upsert Customer (find by phone or create)
    const customer = await prisma.customer.upsert({
      where: { phone },
      update: { 
        name, 
        address: region,
        registrationType,
        registeredByPartnerId,
      },
      create: { 
        name, 
        phone, 
        address: region,
        registrationType,
        registeredByPartnerId,
      },
    });

    // 2. Create Estimate
    const estimate = await prisma.estimate.create({
      data: {
        customerId: customer.id,
        customerPhone: customer.phone,
        urgency: isUrgent ? "당일 긴급 방문" : "일반 방문",
        detectionDetails: jobType,
      },
    });

    // 3. Create Task
    const dbStatus = phase === "phase1" ? "대기중" : phase === "assigned" ? "배정완료" : "대기중";
    const task = await prisma.task.create({
      data: {
        title: `${name} 고객님 - ${jobType} 작업`,
        description: detail,
        status: dbStatus,
        customerId: customer.id,
        estimateId: estimate.id,
        partnerId: assignedPartnerId ? parseInt(String(assignedPartnerId), 10) : (registrationType === "direct" && registeredByPartnerId ? registeredByPartnerId : null),
        registrationType,
        registeredByPartnerId,
      },
      include: {
        customer: true,
        estimate: true,
        partner: true,
      }
    });

    const newCustomer = {
      ...body,
      id: task.id.toString(),
      registrationType,
      registeredByPartnerId,
      registeredAt: task.createdAt.toISOString(),
      phase1StartedAt: task.createdAt.getTime(),
    };

    return NextResponse.json(newCustomer);
  } catch (error) {
    console.error("POST customer error:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}

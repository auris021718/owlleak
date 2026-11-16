import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendAlimtalk } from "@/lib/alimtalk";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      basicInfo,
      damageAreas,
      customDamageArea,
      timing,
      detectChecks,
      customDetectItem,
      detectionDetails,
      detectionFee,
      requiredWorks,
      estimatedPrice, // string like "300,000원 ~ 360,000원"
      customerPhone,
    } = body;

    // Parse estimatedPrice string to min and max int
    let estimatedMinPrice = 0;
    let estimatedMaxPrice = 0;
    
    if (estimatedPrice) {
      const parts = estimatedPrice.split("~");
      if (parts.length > 0) {
        estimatedMinPrice = parseInt(parts[0].replace(/[^0-9]/g, "")) || 0;
      }
      if (parts.length > 1) {
        estimatedMaxPrice = parseInt(parts[1].replace(/[^0-9]/g, "")) || 0;
      }
    }

    // 1. Try to find or create customer based on phone
    let customer = null;
    if (customerPhone) {
      customer = await prisma.customer.findUnique({
        where: { phone: customerPhone },
      });
      
      if (!customer) {
        customer = await prisma.customer.create({
          data: { phone: customerPhone },
        });
      }
    }

    // 2. Create Estimate record
    const estimate = await prisma.estimate.create({
      data: {
        customerId: customer?.id || null,
        customerPhone: customerPhone,

        // Basic Info
        parking: basicInfo?.parking || false,
        elevator: basicInfo?.elevator || false,
        heatingTarget: basicInfo?.heatingTarget || "",
        floorLevel: basicInfo?.floorLevel || "",
        leakLocation: basicInfo?.leakLocation || "",
        leakAmount: basicInfo?.leakAmount || "",
        urgency: basicInfo?.urgency || "",
        boilerBrand: basicInfo?.boilerBrand || "",
        boilerError: basicInfo?.boilerError || "",
        boilerPipeSize: basicInfo?.boilerPipeSize || "",
        waterBill: basicInfo?.waterBill || "",
        managerCheck: basicInfo?.managerCheck || false,
        downstairsCheck: basicInfo?.downstairsCheck || false,

        // Damage symptoms
        damageAreas: damageAreas || [],
        customDamageArea: customDamageArea || "",
        timing: timing || "",

        // Detect checks
        detectChecks: detectChecks || [],
        customDetectItem: customDetectItem || "",

        // Works and cost
        detectionDetails: detectionDetails || "",
        detectionFee: parseInt(detectionFee) || 0,
        requiredWorks: requiredWorks || [],
        estimatedMinPrice,
        estimatedMaxPrice,
      },
    });

    // [운영] 견적 접수 알림톡 — 공개 발송 엔드포인트를 거치지 않고 서버에서 직접 발송한다.
    // 발송 실패가 견적 저장을 막지 않도록 결과만 응답에 포함한다.
    const alimtalk = await sendAlimtalk({
      to: customerPhone || "",
      templateId: "TPL_ESTIMATE_002",
      params: {
        estimate: estimatedPrice,
        works: Array.isArray(requiredWorks) ? requiredWorks.join(", ") : "",
        damage: [...(damageAreas || []), ...(customDamageArea ? [customDamageArea] : [])].join(", "),
        leakLocation: basicInfo?.leakLocation || "",
        detectionFee,
      },
    }).catch((e) => {
      console.error("Alimtalk dispatch failed:", e);
      return null;
    });

    return NextResponse.json({ success: true, estimate, alimtalk });
  } catch (error) {
    console.error("Failed to save estimate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save estimate data to DB" },
      { status: 500 }
    );
  }
}

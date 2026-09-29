export const COOPERATING_SPECIALTIES = [
  "방수",
  "타일",
  "미장",
  "도배",
  "목수",
  "전기",
  "배관내시경",
  "하수도고압세척"
];

export interface PartnerClassification {
  isCooperating: boolean;
  typeLabel: "협력사" | "파트너";
  planType: "cooperating" | "master";
  planName: string;
  monthlyPrice: number;
  payoutRule: string;
  payoutDescription: string;
}

/**
 * Determine partner type and subscription details based on specialty.
 * - 협력사: 방수, 타일, 미장, 도배, 목수, 전기, 배관내시경, 하수도고압세척 등 (월 55,000원 / 파트너 제시 금액 100% 수령)
 * - 파트너: 누수, 누수탐지 등 기존 핵심 파트너 (월 99,000원 / 파트너 간 배정 시 90% 시공비 + 10% 일등록 배당)
 */
export function getPartnerClassification(specialty?: string | null): PartnerClassification {
  if (!specialty) {
    return {
      isCooperating: false,
      typeLabel: "파트너",
      planType: "master",
      planName: "Master 파트너 월 정기구독",
      monthlyPrice: 99000,
      payoutRule: "파트너 간 시공비 90% 정산 & 일 등록 10% 배당금",
      payoutDescription: "파트너 간 교차 배정 시 시공 파트너 90% 정산 및 고객 등록 파트너 10% 배당금 자동 정산",
    };
  }

  const trimmed = specialty.trim();
  const isCooperating = COOPERATING_SPECIALTIES.some(s => trimmed.includes(s));

  if (isCooperating) {
    return {
      isCooperating: true,
      typeLabel: "협력사",
      planType: "cooperating",
      planName: "협력사 월 정기구독",
      monthlyPrice: 55000,
      payoutRule: "파트너 제시 금액 100% 수령",
      payoutDescription: "파트너가 연결한 후속 복구 공사에 대해 파트너가 제시/합의한 정액 금액을 그대로 수령합니다.",
    };
  }

  return {
    isCooperating: false,
    typeLabel: "파트너",
    planType: "master",
    planName: "Master 파트너 월 정기구독",
    monthlyPrice: 99000,
    payoutRule: "파트너 간 시공비 90% 정산 & 일 등록 10% 배당금",
    payoutDescription: "파트너 간 교차 배정 시 시공 파트너 90% 정산 및 고객 등록 파트너 10% 배당금 자동 정산",
  };
}

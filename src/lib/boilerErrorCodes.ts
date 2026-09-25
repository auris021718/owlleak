export interface BoilerErrorInfo {
  brand: string;
  code: string;
  title: string;
  symptom: string;
  leakRisk: "HIGH" | "MEDIUM" | "LOW";
  leakExplanation: string;
  recommendedAction: string;
}

export const BOILER_BRANDS = [
  "경동나비엔",
  "귀뚜라미",
  "린나이",
  "대성쎌틱",
  "알토엔대우",
  "기타/통합"
];

export const BOILER_ERROR_DATABASE: Record<string, Record<string, BoilerErrorInfo>> = {
  "경동나비엔": {
    "02": {
      brand: "경동나비엔",
      code: "02",
      title: "저수위 감지 (물부족 에러)",
      symptom: "보일러 내부 난방수가 부족하여 연소가 정지되는 현상입니다.",
      leakRisk: "HIGH",
      leakExplanation: "방바닥 난방 배관(엑셀관/동관)에서 미세 누수가 발생하여 난방수가 유실될 때 가장 빈번하게 발생하는 대표적인 누수 에러입니다.",
      recommendedAction: "보일러 밑 직수/온수 배관 잠금 후 난방 배관(분배기) 공기압력 검사 및 청음식 탐지 권장."
    },
    "28": {
      brand: "경동나비엔",
      code: "28",
      title: "배관 누수 의심 (자동 물보충 빈번)",
      symptom: "보일러가 자동으로 물을 보충하는 횟수가 비정상적으로 잦아 시스템이 멈춘 상태입니다.",
      leakRisk: "HIGH",
      leakExplanation: "난방 배관 크랙이나 밸브 체결 부위에서 지속적인 물 샘이 발생하고 있음을 뜻합니다. 아래층 천장 누수 피해로 직결될 수 있습니다.",
      recommendedAction: "즉시 보일러 전원을 끄고 난방 분배기 밸브 점검 및 배관 정밀 가스/청음 탐지 실시."
    },
    "51": {
      brand: "경동나비엔",
      code: "51",
      title: "물보충 밸브 이상 / 저수위",
      symptom: "물보충 밸브가 열려도 일정 시간 내 수위가 올라가지 않는 증상입니다.",
      leakRisk: "HIGH",
      leakExplanation: "공급되는 물보다 배관을 통해 빠져나가는 누수량이 많거나, 물보충 밸브 고장 또는 분배기 크랙이 원인입니다.",
      recommendedAction: "계량기 별침 회전 여부 확인 및 분배기 주변 젖음 확인 후 배관 누수 탐지."
    },
    "16": {
      brand: "경동나비엔",
      code: "16",
      title: "과열 감지 (난방수 순환 불량)",
      symptom: "보일러 열교환기 내부 온도가 비정상적으로 급상승하여 정지된 상태입니다.",
      leakRisk: "MEDIUM",
      leakExplanation: "분배기 밸브가 잠겨있거나, 배관 내 에어(공기) 참 또는 난방수 누수로 인한 순환량 부족일 수 있습니다.",
      recommendedAction: "분배기 에어빼기 및 순환펌프 작동 확인, 배관 압력 저하 점검."
    },
    "03": {
      brand: "경동나비엔",
      code: "03",
      title: "점화 불량 (불꽃 감지 실패)",
      symptom: "가스 공급이 불안정하거나 점화 플러그에 스파크가 튀지 않는 증상입니다.",
      leakRisk: "LOW",
      leakExplanation: "가스 밸브 잠김이나 점화 트랜스/화염 감지봉 노후 문제이며 누수와는 직접 관련이 적습니다.",
      recommendedAction: "가스 밸브 열림 확인 및 보일러 AS 기판/점화부 점검."
    }
  },
  "귀뚜라미": {
    "95": {
      brand: "귀뚜라미",
      code: "95",
      title: "저수위 감지 (물부족 에러) — 대표 누수 증상",
      symptom: "보일러 내에 물이 부족할 때 표시되는 귀뚜라미 대표 에러코드입니다.",
      leakRisk: "HIGH",
      leakExplanation: "난방 배관의 균열이나 노후된 엘보 부속 파열로 물이 새어 압력이 빠져나가는 상태입니다. 90% 이상 난방 배관 누수가 원인입니다.",
      recommendedAction: "직수 밸브를 열어 물보충 후에도 1~2일 내 95번이 재발생하면 100% 배관 누수이므로 정밀 탐지 필수."
    },
    "98": {
      brand: "귀뚜라미",
      code: "98",
      title: "배관 누수 감지 (자동 물보충 과다)",
      symptom: "일정 주기 내 자동 물보충이 반복 작동하여 누수 위험을 경고하는 상태입니다.",
      leakRisk: "HIGH",
      leakExplanation: "보일러가 배관 누수로 지속적인 물 유실을 감지하여 안전을 위해 가동을 차단한 상태입니다.",
      recommendedAction: "아래층 천장 젖음 상태 확인 및 온수/난방 라인 질소 압력 테스트 진행."
    },
    "96": {
      brand: "귀뚜라미",
      code: "96",
      title: "과열 안전장치 작동",
      symptom: "순환펌프 미작동 또는 난방수 순환 장애로 보일러 수온이 100도 이상 과열된 상태입니다.",
      leakRisk: "MEDIUM",
      leakExplanation: "배관에 물이 없거나 슬러지로 막힌 경우, 혹은 밸브 잠김 상태에서 발생합니다.",
      recommendedAction: "분배기 밸브 개방 및 난방수 누수/배관 막힘 상태 확인."
    },
    "01": {
      brand: "귀뚜라미",
      code: "01",
      title: "점화 실패 (불꽃 감지 이상)",
      symptom: "가스가 켜지지 않거나 초기 점화에 실패한 상태입니다.",
      leakRisk: "LOW",
      leakExplanation: "점화 센서 불량 또는 가스 차단기 차단 문제로 누수와는 무관합니다.",
      recommendedAction: "가스 중간밸브 확인 및 보일러 AS 접수."
    },
    "97": {
      brand: "귀뚜라미",
      code: "97",
      title: "가스 누출 감지",
      symptom: "가스누출 탐지 센서가 가스 유출을 감지하여 보일러 가동을 정지시킨 상태입니다.",
      leakRisk: "LOW",
      leakExplanation: "배관 물 누수가 아닌 가스 배관 또는 후렉시블 호스 연결부 가스 누출입니다.",
      recommendedAction: "즉시 가스 밸브를 잠그고 환기 후 도시가스 공급사 또는 AS 긴급 점검."
    }
  },
  "린나이": {
    "17": {
      brand: "린나이",
      code: "17",
      title: "물부족 에러 (저수위 이상)",
      symptom: "린나이 보일러 물부족 센서 작동으로 연소가 정지된 상태입니다.",
      leakRisk: "HIGH",
      leakExplanation: "난방 배관 누수로 인해 보일러 물탱크의 수위가 지속적으로 낮아질 때 발생합니다.",
      recommendedAction: "물보충 밸브 작동 확인 및 난방 배관 압력 테스트 누수 탐지 필수."
    },
    "28": {
      brand: "린나이",
      code: "28",
      title: "자동 물보충 연속 작동 이상",
      symptom: "자동 물보충 시간이 기준치를 초과하여 계속 급수되고 있는 상태입니다.",
      leakRisk: "HIGH",
      leakExplanation: "배관 어딘가에서 물이 지속적으로 뿜어져 나와 물탱크가 채워지지 않는 심각한 배관 파열 가능성이 있습니다.",
      recommendedAction: "즉시 수도 계량기 메인 밸브를 잠그고 긴급 누수 탐지 출동 필요."
    },
    "16": {
      brand: "린나이",
      code: "16",
      title: "난방 과열 이상",
      symptom: "난방 수온이 비정상적으로 높아 안전센서가 작동한 상태입니다.",
      leakRisk: "MEDIUM",
      leakExplanation: "난방수 부족 또는 순환 펌프 고장으로 순환이 정체될 때 발생합니다.",
      recommendedAction: "난방 필터 청소 및 배관 누수 여부 점검."
    },
    "11": {
      brand: "린나이",
      code: "11",
      title: "초기 점화 불량",
      symptom: "점화 시 불꽃이 일어나지 않는 증상입니다.",
      leakRisk: "LOW",
      leakExplanation: "가스 공급 압력 부족 또는 전기 스파크 센서 불량입니다.",
      recommendedAction: "가스 밸브 확인 및 전원 재인가."
    }
  },
  "대성쎌틱": {
    "A": {
      brand: "대성쎌틱",
      code: "A",
      title: "물부족 (저수위 감지) — 배관 누수",
      symptom: "대성쎌틱 보일러 화면에 깜빡이는 물부족 대표 에러코드입니다.",
      leakRisk: "HIGH",
      leakExplanation: "바닥 난방 배관 혹은 온수 배관 크랙으로 물이 새어 수위가 떨어진 전형적인 누수 증상입니다.",
      recommendedAction: "수동/자동 물보충 후 반복 발생 시 100% 누수 탐지 시공 필요."
    },
    "AA": {
      brand: "대성쎌틱",
      code: "AA",
      title: "보일러 과열 및 순환 불량",
      symptom: "수온 센서 감지 온도가 100도 이상 과열된 상태입니다.",
      leakRisk: "MEDIUM",
      leakExplanation: "배관 누수로 난방수가 비어있거나 순환 펌프 에어 참 현상입니다.",
      recommendedAction: "분배기 및 펌프 점검, 난방수 보충."
    },
    "A6": {
      brand: "대성쎌틱",
      code: "A6",
      title: "점화 불량 / 착화 불량",
      symptom: "불꽃 감지에 실패한 상태입니다.",
      leakRisk: "LOW",
      leakExplanation: "점화 트랜스, 가스 밸브 이상입니다.",
      recommendedAction: "가스 공급 상태 확인."
    }
  },
  "알토엔대우": {
    "E1": {
      brand: "알토엔대우",
      code: "E1",
      title: "저수위 감지 (물부족)",
      symptom: "난방수가 부족하여 점화가 차단된 상태입니다.",
      leakRisk: "HIGH",
      leakExplanation: "난방 배관 미세 누수나 밸브 누수로 인한 수위 저하입니다.",
      recommendedAction: "배관 누수 탐지 및 수압 검사."
    },
    "E2": {
      brand: "알토엔대우",
      code: "E2",
      title: "과열 감지",
      symptom: "열교환기 과열 센서 작동 상태입니다.",
      leakRisk: "MEDIUM",
      leakExplanation: "물 부족 또는 순환 장애입니다.",
      recommendedAction: "순환 펌프 및 밸브 점검."
    }
  }
};

export function lookupBoilerError(brandInput: string, codeInput: string): BoilerErrorInfo | null {
  if (!codeInput || !codeInput.trim()) return null;

  const normalizedCode = codeInput.trim().toUpperCase().replace(/^E-?/, "");
  const normalizedBrand = brandInput?.trim() || "";

  // 1. Try matching with specific brand
  for (const [dbBrand, errorMap] of Object.entries(BOILER_ERROR_DATABASE)) {
    if (normalizedBrand && (normalizedBrand.includes(dbBrand) || dbBrand.includes(normalizedBrand))) {
      // Exact code match
      if (errorMap[normalizedCode]) return errorMap[normalizedCode];
      if (errorMap[codeInput.trim()]) return errorMap[codeInput.trim()];
      
      // Partial code match (e.g. "02" in "E02" or "95" in "E95")
      for (const [codeKey, info] of Object.entries(errorMap)) {
        if (normalizedCode === codeKey || normalizedCode.endsWith(codeKey) || codeKey.endsWith(normalizedCode)) {
          return info;
        }
      }
    }
  }

  // 2. Search across all brands if brand not specified or no match
  for (const [dbBrand, errorMap] of Object.entries(BOILER_ERROR_DATABASE)) {
    for (const [codeKey, info] of Object.entries(errorMap)) {
      if (
        normalizedCode === codeKey ||
        normalizedCode.endsWith(codeKey) ||
        codeKey.endsWith(normalizedCode) ||
        (normalizedCode === "A" && codeKey === "A")
      ) {
        return info;
      }
    }
  }

  // 3. Fallback generic match for common keywords
  if (
    normalizedCode.includes("물") ||
    normalizedCode.includes("저수위") ||
    normalizedCode.includes("부족") ||
    normalizedCode === "02" ||
    normalizedCode === "28" ||
    normalizedCode === "95" ||
    normalizedCode === "17"
  ) {
    return {
      brand: normalizedBrand || "보일러 공통",
      code: codeInput,
      title: "저수위 감지 (물부족 에러) — 배관 누수 유력",
      symptom: "보일러 내부 난방수가 지속적으로 부족하여 가동이 중단된 상태입니다.",
      leakRisk: "HIGH",
      leakExplanation: "난방 배관의 실금(미세 크랙)이나 분배기 밸브 노후 누수로 인해 물이 빠져나가고 있을 가능성이 매우 높습니다.",
      recommendedAction: "직수/온수/난방 배관 정밀 공기압 테스트 및 청음식/가스식 누수 탐지 권장."
    };
  }

  return null;
}

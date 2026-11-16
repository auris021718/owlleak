import { NextResponse } from 'next/server';

/**
 * AI 누수 진단
 * - 실제 사진(JPEG/PNG/WebP)이 오면 Gemini 비전 모델로 분석한다 (GEMINI_API_KEY 필요).
 * - 키가 없거나 호출이 실패하면 기존 위치 기반 기본 안내로 폴백하고 aiAnalyzed: false로 표시한다.
 * - 샘플 SVG 같은 비사진 이미지도 폴백 대상이다.
 */

const SUPPORTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface DiagnosisPayload {
  type: string;
  typeName: string;
  probability: number;
  locationName: string;
  cause: string;
  description: string;
  checklist: string[];
  estMin: number;
  estMax: number;
  urgency: 'today' | 'scheduled';
}

function parseDataUrl(image: unknown): { mimeType: string; base64: string } | null {
  if (typeof image !== 'string') return null;
  const match = image.match(/^data:([^;,]+);base64,([\s\S]+)$/);
  if (!match) return null;
  const mimeType = match[1].toLowerCase();
  if (!SUPPORTED_MIME.includes(mimeType)) return null;
  return { mimeType, base64: match[2] };
}

function buildPrompt(x: number, y: number): string {
  return [
    '당신은 20년 경력의 누수 탐지 전문가입니다. 첨부된 현장 사진을 분석해 누수 진단을 내려 주세요.',
    `사용자가 지목한 의심 지점은 사진 기준 가로 ${Math.round(x)}%, 세로 ${Math.round(y)}% 위치입니다 (왼쪽 위가 0,0). 이 지점과 그 주변을 중심으로 보되, 사진 전체의 단서(물자국, 곰팡이, 벽지 들뜸/탈색, 균열, 배관·설비 위치)를 함께 판단하세요.`,
    '',
    '판단 원칙:',
    '- 사진에서 실제로 보이는 근거만으로 진단하세요. 보이지 않는 것을 단정하지 마세요.',
    '- probability는 가장 유력한 원인에 대한 확신도(0~100)입니다. 단서가 약하면 낮게 잡으세요.',
    '- 누수 흔적이 보이지 않으면 description에 그 사실을 솔직히 적고 probability를 낮게(30 이하) 잡으세요.',
    '- description은 3~4문장으로, 마지막에 "사진만으로 확정할 수 없어 현장 정밀 탐지가 필요합니다"라는 취지를 포함하세요.',
    '- checklist는 현장 점검/조치 3가지를 전문가가 실제로 하는 순서로 적으세요.',
    '- estMin/estMax는 국내 누수 탐지+보수 시세 기준의 예상 비용 범위(원 단위 숫자)입니다. 탐지비와 공사를 합친 현실적인 범위로 잡으세요.',
    '- type은 ceiling(천장), wall(벽면), floor(바닥), other(기타) 중 사진에 맞는 값으로 고르세요.',
    '- urgency는 진행 중 누수로 보이면 today, 아니면 scheduled로 하세요.',
    '- 모든 문장은 한국어로 작성하세요.',
  ].join('\n');
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['ceiling', 'wall', 'floor', 'other'] },
    typeName: { type: 'string' },
    probability: { type: 'integer' },
    locationName: { type: 'string' },
    cause: { type: 'string' },
    description: { type: 'string' },
    checklist: { type: 'array', items: { type: 'string' } },
    estMin: { type: 'integer' },
    estMax: { type: 'integer' },
    urgency: { type: 'string', enum: ['today', 'scheduled'] },
  },
  required: ['type', 'typeName', 'probability', 'locationName', 'cause', 'description', 'checklist', 'estMin', 'estMax', 'urgency'],
};

function toResult(p: DiagnosisPayload, x: number, y: number, aiAnalyzed: boolean) {
  const estMin = Math.max(0, Math.round(Number(p.estMin) || 0));
  const estMax = Math.max(estMin, Math.round(Number(p.estMax) || 0));
  const probability = Math.min(100, Math.max(0, Math.round(Number(p.probability) || 0)));
  return {
    success: true,
    aiAnalyzed,
    type: p.type,
    typeName: p.typeName,
    probability,
    locationName: p.locationName || `지목 지점 (X: ${Math.round(x)}%, Y: ${Math.round(y)}%)`,
    cause: p.cause,
    description: p.description,
    checklist: Array.isArray(p.checklist) ? p.checklist.slice(0, 5) : [],
    estimatedCost: `${estMin.toLocaleString()}원 ~ ${estMax.toLocaleString()}원`,
    estMin,
    estMax,
    queryParams: {
      leakLocation: p.type,
      urgency: p.urgency === 'today' ? 'today' : 'scheduled',
      detectChecks: JSON.stringify(['waterBill', 'downstairsCheck']),
    },
  };
}

async function diagnoseWithGemini(
  image: { mimeType: string; base64: string },
  x: number,
  y: number,
  apiKey: string,
): Promise<DiagnosisPayload> {
  const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: buildPrompt(x, y) },
                { inline_data: { mime_type: image.mimeType, data: image.base64 } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Gemini API ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini 응답이 비어 있습니다.');
    return JSON.parse(text) as DiagnosisPayload;
  } finally {
    clearTimeout(timer);
  }
}

/** 기존 위치 기반 기본 안내 (AI 미연결/실패 시 폴백) */
function fallbackDiagnosis(x: number, y: number) {
  const clickX = Math.round(x);
  const clickY = Math.round(y);

  if (y < 35) {
    return toResult(
      {
        type: 'ceiling',
        typeName: '천장 슬라브 및 욕실 하부 방수층 누수',
        probability: 95,
        locationName: `천장 부위 (상대좌표 X: ${clickX}%, Y: ${clickY}%)`,
        cause: '위층 욕실의 배수트랩 주변 방수층 노후화 또는 오배수관 크랙으로 인한 미세 누수로 판단됩니다.',
        description:
          '해당 지점은 물방울 맺힘 현상과 함께 미세한 벽지 탈색 및 곰팡이 포자가 보이고 있습니다. 이는 지속적인 누수가 진행 중임을 뜻하며, 위층 배수 배관 노후화 혹은 방수층 파열 가능성이 매우 높습니다.',
        checklist: [
          '위층 욕실 수도 계량기 밸브를 차단하여 유량 및 압력 변화 테스트',
          '욕실 바닥 유가(육가) 하부 및 변기 배수관 주위 방수 불량 상태 점검',
          '배관 연결 조인트 크랙 보강 및 우레탄 인젝션 방수 공사 진행',
        ],
        estMin: 750000,
        estMax: 1100000,
        urgency: 'today',
      },
      x,
      y,
      false,
    );
  }

  if (y > 65) {
    return toResult(
      {
        type: 'floor',
        typeName: '바닥 난방/온수 배관 노후화 누수',
        probability: 91,
        locationName: `바닥 부위 (상대좌표 X: ${clickX}%, Y: ${clickY}%)`,
        cause: '보일러 온수 배관(XL 혹은 PB)의 수축/팽창 반복에 따른 경화 크랙 및 이음새 누수로 판단됩니다.',
        description:
          '바닥면을 따라 습기가 넓게 퍼져 있으며 걸레받이 부근에 젖음 현상이 포착되었습니다. 온수 배관은 높은 열과 압력을 반복적으로 견디기 때문에 파열 위험이 큽니다. 신속한 정밀 배관 탐지가 시급합니다.',
        checklist: [
          '보일러실 직수 공급 밸브 일시 차단 후 난방 필터 누수 에러 코드 점검',
          '컴프레셔 청음식 장비 및 가스 탐지기를 이용해 누수점 정밀 추적',
          '의심 영역 바닥 파쇄 후 파열 배관(구간) 절단 및 정품 피팅 교체',
        ],
        estMin: 900000,
        estMax: 1400000,
        urgency: 'today',
      },
      x,
      y,
      false,
    );
  }

  return toResult(
    {
      type: 'wall',
      typeName: '외벽 크랙 및 샷시 코킹 불량 누수',
      probability: 86,
      locationName: `벽면 부위 (상대좌표 X: ${clickX}%, Y: ${clickY}%)`,
      cause: '건물 외벽의 옹벽 균열 및 창틀 외부 코킹(실리콘) 방수층 노후화로 인한 빗물 유입으로 판단됩니다.',
      description:
        '창틀 코너 부분에서 물자국과 습기가 번지는 양상입니다. 계절 변화에 따른 실리콘 틈새 벌어짐이나 건물 자체 침하 크랙으로 인해 외부 수분이 유입되고 있으며, 비가 올 때 특히 심해집니다.',
      checklist: [
        '외부 실리콘 코킹 균열 및 들뜸 상태 점검',
        '벽체 실내 단열재 수분 측정 및 콘크리트 균열 직접 점검',
        '외부 노후 실리콘 제거 후 우레탄 실란트 코킹 보강 및 아크릴 인젝션 주입',
      ],
      estMin: 600000,
      estMax: 950000,
      urgency: 'scheduled',
    },
    x,
    y,
    false,
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, x, y } = body;

    const clickX = typeof x === 'number' ? x : 50;
    const clickY = typeof y === 'number' ? y : 50;

    const parsedImage = parseDataUrl(image);
    const apiKey = process.env.GEMINI_API_KEY;

    if (parsedImage && apiKey) {
      try {
        const payload = await diagnoseWithGemini(parsedImage, clickX, clickY, apiKey);
        return NextResponse.json(toResult(payload, clickX, clickY, true));
      } catch (error) {
        // AI 호출 실패 시 기본 안내로 폴백 (기능 중단 방지)
        console.error('AI diagnosis (Gemini) failed, falling back:', error);
      }
    }

    return NextResponse.json(fallbackDiagnosis(clickX, clickY));
  } catch (error) {
    console.error('AI diagnosis error:', error);
    return NextResponse.json({ success: false, error: 'AI 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

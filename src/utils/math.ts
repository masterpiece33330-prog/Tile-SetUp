/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Math Utilities
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️ CRITICAL: 부동소수점 연산 금지
 * 
 * 이 모듈은 모든 mm 단위 연산을 정수(Integer)로 처리합니다.
 * JavaScript의 Number 타입(IEEE 754 부동소수점)은 0.1 + 0.2 = 0.30000000000000004
 * 같은 오차를 발생시키므로, 타일 시공의 정밀도를 보장할 수 없습니다.
 * 
 * 해결책: 1mm = 1000 MicroMM (정수) 변환
 * - 모든 내부 연산은 MicroMM(정수)으로 수행
 * - 화면 표시/저장 시점에만 mm로 변환
 * 
 * Ref: 분석 노트 - "부동소수점 연산의 배신" 방어
 */

import { 
  MicroMM, 
  Degree, 
  Percentage, 
  Point, 
  Vector3, 
  Dimension,
  TileCalculationInput,
  TileCalculationResult,
  TileCell,
  TileType,
  StartLineX,
  StartLineY,
  INPUT_LIMITS,
  ValidationResult,
  ValidationError,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Unit Conversion (단위 변환)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * MICRO_SCALE: mm → MicroMM 변환 배율
 * 1mm = 1000 MicroMM
 * 
 * 이 값을 사용하면 0.001mm 정밀도까지 정수로 표현 가능
 */
const MICRO_SCALE = 1000;

/**
 * mm를 MicroMM(정수)로 변환
 * 
 * @example
 * mmToMicro(300)   // → 300000 as MicroMM
 * mmToMicro(1.5)   // → 1500 as MicroMM (Gap 값)
 * mmToMicro(0.001) // → 1 as MicroMM (최소 정밀도)
 */
export function mmToMicro(mm: number): MicroMM {
  // 반올림하여 정수로 변환 (부동소수점 오차 제거)
  return Math.round(mm * MICRO_SCALE) as MicroMM;
}

/**
 * MicroMM(정수)를 mm로 변환 (화면 표시용)
 * 
 * @example
 * microToMM(300000 as MicroMM) // → 300
 * microToMM(1500 as MicroMM)   // → 1.5
 */
export function microToMM(micro: MicroMM): number {
  return micro / MICRO_SCALE;
}

/**
 * MicroMM(정수)를 cm로 변환
 */
export function microToCM(micro: MicroMM): number {
  return micro / (MICRO_SCALE * 10);
}

/**
 * MicroMM(정수)를 m로 변환
 */
export function microToM(micro: MicroMM): number {
  return micro / (MICRO_SCALE * 1000);
}

/**
 * MicroMM² 면적을 m²로 변환
 */
export function microAreaToM2(microArea: number): number {
  // MicroMM² → mm² → m²
  const mm2 = microArea / (MICRO_SCALE * MICRO_SCALE);
  return mm2 / 1_000_000;
}

/**
 * 도(degree)를 라디안으로 변환
 */
export function degreeToRadian(deg: Degree): number {
  return (deg * Math.PI) / 180;
}

/**
 * 라디안을 도(degree)로 변환
 */
export function radianToDegree(rad: number): Degree {
  return Math.round((rad * 180) / Math.PI) as Degree;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Safe Integer Arithmetic (안전한 정수 연산)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 안전한 정수 나눗셈 (Division by Zero 방지)
 */
export function safeDivide(numerator: MicroMM, denominator: MicroMM): number {
  if (denominator === 0) {
    throw new Error('Division by zero: 분모가 0입니다.');
  }
  return Math.floor(numerator / denominator);
}

/**
 * 안전한 정수 나머지 연산 (모듈로)
 */
export function safeModulo(value: MicroMM, divisor: MicroMM): MicroMM {
  if (divisor === 0) {
    throw new Error('Modulo by zero: 제수가 0입니다.');
  }
  return (value % divisor) as MicroMM;
}

/**
 * MicroMM 값 클램핑 (범위 제한)
 */
export function clampMicro(
  value: MicroMM, 
  min: MicroMM, 
  max: MicroMM
): MicroMM {
  return Math.max(min, Math.min(max, value)) as MicroMM;
}

/**
 * 두 MicroMM 값 더하기
 */
export function addMicro(a: MicroMM, b: MicroMM): MicroMM {
  return (a + b) as MicroMM;
}

/**
 * 두 MicroMM 값 빼기
 */
export function subtractMicro(a: MicroMM, b: MicroMM): MicroMM {
  return (a - b) as MicroMM;
}

/**
 * MicroMM 값에 정수 곱하기
 */
export function multiplyMicro(micro: MicroMM, multiplier: number): MicroMM {
  return Math.round(micro * multiplier) as MicroMM;
}

/**
 * MicroMM 값 나누기 (정수 결과)
 */
export function divideMicro(micro: MicroMM, divisor: number): MicroMM {
  if (divisor === 0) {
    throw new Error('Division by zero: 나누는 값이 0입니다.');
  }
  return Math.round(micro / divisor) as MicroMM;
}

/**
 * MicroMM 값의 제곱근 (거리 계산용)
 */
export function microSqrt(micro: MicroMM): MicroMM {
  if (micro < 0) {
    throw new Error('Negative sqrt: 음수의 제곱근을 구할 수 없습니다.');
  }
  return Math.round(Math.sqrt(micro)) as MicroMM;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: Tile Quantity Calculation (물량 산출)
// Ref: Chapter 1.2 - 핵심 알고리즘
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ FORMULA CORRECTION (Gap 계산):
 * 
 * 잘못된 공식 (명세서 원본):
 *   totalWidth = n × (tileWidth + gap)
 * 
 * 올바른 공식 (수정됨):
 *   totalWidth = (n × tileWidth) + ((n-1) × gap)
 * 
 * 마지막 타일의 외곽에는 Gap(줄눈)이 들어가지 않습니다.
 */

/**
 * 한 방향의 타일 개수와 잔여 길이 계산
 * 
 * @param areaLength - 시공 면적 길이 (MicroMM)
 * @param tileLength - 타일 길이 (MicroMM)
 * @param gap - 줄눈 간격 (MicroMM)
 * @param startLine - 시작선 위치 ('LEFT' | 'CENTER' | 'RIGHT')
 * 
 * @returns 타일 개수, 좌측 잔여, 우측 잔여
 */
export function calculateTileCountAndRemainder(
  areaLength: MicroMM,
  tileLength: MicroMM,
  gap: MicroMM,
  startLine: StartLineX | StartLineY
): {
  count: number;
  leftRemainder: MicroMM;
  rightRemainder: MicroMM;
} {
  // ⚠️ 수정된 공식: (n × tile) + ((n-1) × gap) ≤ area
  // 정리하면: n ≤ (area + gap) / (tile + gap)
  
  const effectiveTileLength = addMicro(tileLength, gap);
  const adjustedArea = addMicro(areaLength, gap);
  
  // 정수 나눗셈으로 최대 타일 수 계산
  const maxTiles = Math.floor(adjustedArea / effectiveTileLength);
  
  // 실제 사용되는 길이: (n × tile) + ((n-1) × gap)
  const usedLength = (maxTiles * tileLength + (maxTiles - 1) * gap) as MicroMM;
  
  // 총 잔여 길이
  const totalRemainder = subtractMicro(areaLength, usedLength);
  
  // ⚠️ LOGIC CORRECTION: 시작선에 따른 잔여 분배
  let leftRemainder: MicroMM;
  let rightRemainder: MicroMM;
  
  switch (startLine) {
    case 'LEFT':
    case 'TOP':
      // 왼쪽/상단 시작: 잔여는 오른쪽/하단에 몰림
      leftRemainder = 0 as MicroMM;
      rightRemainder = totalRemainder;
      break;
      
    case 'RIGHT':
    case 'BOTTOM':
      // 오른쪽/하단 시작: 잔여는 왼쪽/상단에 몰림
      leftRemainder = totalRemainder;
      rightRemainder = 0 as MicroMM;
      break;
      
    case 'CENTER':
      // ⚠️ 중앙 시작: 잔여를 양쪽으로 균등 분배
      const halfRemainder = Math.floor(totalRemainder / 2) as MicroMM;
      leftRemainder = halfRemainder;
      rightRemainder = subtractMicro(totalRemainder, halfRemainder);
      break;
      
    default:
      leftRemainder = 0 as MicroMM;
      rightRemainder = totalRemainder;
  }
  
  return {
    count: maxTiles,
    leftRemainder,
    rightRemainder,
  };
}

/**
 * 타일 타입 분류 (FULL / LARGE / SMALL)
 * 
 * @param cutWidth - 잘린 타일 너비
 * @param cutHeight - 잘린 타일 높이
 * @param fullWidth - 원본 타일 너비
 * @param fullHeight - 원본 타일 높이
 * 
 * Ref: Chapter 1.2.3 - 조각 타일 분류 기준
 */
export function classifyTileType(
  cutWidth: MicroMM,
  cutHeight: MicroMM,
  fullWidth: MicroMM,
  fullHeight: MicroMM
): TileType {
  // 온전한 타일인 경우
  if (cutWidth === fullWidth && cutHeight === fullHeight) {
    return 'FULL';
  }
  
  // 면적 비율 계산 (정수 연산)
  const cutArea = cutWidth * cutHeight;
  const fullArea = fullWidth * fullHeight;
  const areaRatio = (cutArea * 100) / fullArea; // 백분율 (정수)
  
  // 50% 기준 분류
  // ⚠️ 추가 고려: 원본 1장에서 몇 개 추출 가능한지
  if (areaRatio >= 50) {
    return 'LARGE';
  } else {
    return 'SMALL';
  }
}

/**
 * 면적 비율 계산 (퍼센트)
 */
export function calculateAreaRatio(
  cutWidth: MicroMM,
  cutHeight: MicroMM,
  fullWidth: MicroMM,
  fullHeight: MicroMM
): Percentage {
  const cutArea = cutWidth * cutHeight;
  const fullArea = fullWidth * fullHeight;
  return Math.round((cutArea * 100) / fullArea) as Percentage;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Input Validation (입력 검증)
// Ref: Chapter 1.4 - 엣지 케이스 방어
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 타일 계산 입력값 검증
 */
export function validateTileInput(
  input: TileCalculationInput
): ValidationResult {
  const errors: ValidationError[] = [];
  
  // 필수값 검증
  if (!input.areaWidth || input.areaWidth <= 0) {
    errors.push({
      field: 'areaWidth',
      code: 'REQUIRED',
      message: '시공면적 가로를 입력하세요',
      messageKey: 'validation.areaWidth.required',
    });
  }
  
  if (!input.areaHeight || input.areaHeight <= 0) {
    errors.push({
      field: 'areaHeight',
      code: 'REQUIRED',
      message: '시공면적 세로를 입력하세요',
      messageKey: 'validation.areaHeight.required',
    });
  }
  
  // 범위 검증 (MicroMM 단위)
  const areaMinMicro = mmToMicro(INPUT_LIMITS.AREA_WIDTH.min);
  const areaMaxMicro = mmToMicro(INPUT_LIMITS.AREA_WIDTH.max);
  const tileMinMicro = mmToMicro(INPUT_LIMITS.TILE_WIDTH.min);
  const tileMaxMicro = mmToMicro(INPUT_LIMITS.TILE_WIDTH.max);
  const gapMaxMicro = mmToMicro(INPUT_LIMITS.GAP_SIZE.max);
  
  if (input.areaWidth < areaMinMicro) {
    errors.push({
      field: 'areaWidth',
      code: 'MIN_VALUE',
      message: `시공면적 가로는 ${INPUT_LIMITS.AREA_WIDTH.min}mm 이상이어야 합니다`,
      messageKey: 'validation.areaWidth.minValue',
    });
  }
  
  if (input.areaWidth > areaMaxMicro) {
    errors.push({
      field: 'areaWidth',
      code: 'MAX_VALUE',
      message: `시공면적 가로는 ${INPUT_LIMITS.AREA_WIDTH.max}mm 이하여야 합니다`,
      messageKey: 'validation.areaWidth.maxValue',
    });
  }
  
  // 타일 > 면적 검증
  if (input.tileWidth > input.areaWidth) {
    errors.push({
      field: 'tileWidth',
      code: 'TILE_LARGER_AREA',
      message: '타일 크기가 시공면적보다 클 수 없습니다',
      messageKey: 'validation.tile.largerThanArea',
    });
  }
  
  if (input.tileHeight > input.areaHeight) {
    errors.push({
      field: 'tileHeight',
      code: 'TILE_LARGER_AREA',
      message: '타일 크기가 시공면적보다 클 수 없습니다',
      messageKey: 'validation.tile.largerThanArea',
    });
  }
  
  // Gap > 타일 검증
  const minTileDimension = Math.min(input.tileWidth, input.tileHeight);
  if (input.gapSize >= minTileDimension) {
    errors.push({
      field: 'gapSize',
      code: 'GAP_LARGER_TILE',
      message: '줄눈 간격이 타일보다 클 수 없습니다',
      messageKey: 'validation.gap.largerThanTile',
    });
  }
  
  // 최대 타일 수 검증 (성능 보호)
  if (input.areaWidth > 0 && input.areaHeight > 0 && 
      input.tileWidth > 0 && input.tileHeight > 0) {
    const estimatedTiles = Math.ceil(input.areaWidth / input.tileWidth) * 
                          Math.ceil(input.areaHeight / input.tileHeight);
    if (estimatedTiles > INPUT_LIMITS.MAX_TILES) {
      errors.push({
        field: 'general',
        code: 'OVERFLOW',
        message: `타일 수가 너무 많습니다 (최대 ${INPUT_LIMITS.MAX_TILES}개)`,
        messageKey: 'validation.tiles.overflow',
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Geometry Calculations (기하 계산)
// Ref: Chapter 5 - 도면 편집, Chapter 10 - 계량기
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 두 점 사이 거리 계산 (정수 연산)
 * 결과는 MicroMM 단위
 */
export function calculateDistance(p1: Point, p2: Point): MicroMM {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  // Math.hypot 사용하되 결과를 정수로 반올림
  return Math.round(Math.hypot(dx, dy)) as MicroMM;
}

/**
 * 3점을 이용한 각도 계산
 * Ref: Chapter 10.2.2
 * 
 * @param p1 - 첫 번째 점
 * @param vertex - 꼭짓점 (각도의 중심)
 * @param p2 - 두 번째 점
 * @returns 각도 (Degree, 0~360)
 */
export function calculateAngle(p1: Point, vertex: Point, p2: Point): Degree {
  // 두 벡터 계산
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
  
  // 내적과 외적
  const dot = v1.x * v2.x + v1.y * v2.y;
  const cross = v1.x * v2.y - v1.y * v2.x;
  
  // 라디안 → 도 변환
  let angleDeg = Math.atan2(cross, dot) * (180 / Math.PI);
  
  // 음수 각도를 양수로 변환 (0~360)
  if (angleDeg < 0) {
    angleDeg += 360;
  }
  
  // 소수점 1자리 반올림
  return (Math.round(angleDeg * 10) / 10) as Degree;
}

/**
 * 다각형 면적 계산 (신발끈 공식 / Shoelace Formula)
 * Ref: Chapter 10.2.3
 * 
 * @param vertices - 다각형 꼭짓점 배열 (순서대로)
 * @returns 면적 (MicroMM² 단위)
 */
export function calculatePolygonArea(vertices: Point[]): number {
  const n = vertices.length;
  if (n < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  
  return Math.abs(area) / 2;
}

/**
 * AABB(축 정렬 경계 상자) 교차 검사
 * Ref: Chapter 5.2.1 - 타일-도형 교차 판정
 * 
 * @returns true if intersecting
 */
export function checkAABBIntersection(
  rect1: { x: MicroMM; y: MicroMM; w: MicroMM; h: MicroMM },
  rect2: { x: MicroMM; y: MicroMM; w: MicroMM; h: MicroMM }
): boolean {
  return !(
    rect1.x + rect1.w < rect2.x ||
    rect1.x > rect2.x + rect2.w ||
    rect1.y + rect1.h < rect2.y ||
    rect1.y > rect2.y + rect2.h
  );
}

/**
 * 점이 원 내부에 있는지 검사
 */
export function isPointInCircle(
  point: Point,
  circleCenter: Point,
  radius: MicroMM
): boolean {
  const dist = calculateDistance(point, circleCenter);
  return dist <= radius;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Matrix Operations (행렬 연산 - 3D 렌더링용)
// Ref: Chapter 4 - 3D 뷰, InstancedMesh 변환
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 4x4 단위 행렬 생성
 * InstancedMesh의 matrix 초기화용
 */
export function createIdentityMatrix(): Float32Array {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

/**
 * 위치, 회전, 스케일을 4x4 변환 행렬로 생성
 * 
 * @param position - 위치 (MicroMM → 렌더링 단위로 변환 필요)
 * @param rotation - Z축 회전 (Degree)
 * @param scale - 스케일 (기본 1.0)
 */
export function createTransformMatrix(
  position: Vector3,
  rotationZ: Degree,
  scale: number = 1.0
): Float32Array {
  const rad = degreeToRadian(rotationZ);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  // 렌더링용 좌표로 변환 (MicroMM → 렌더링 단위)
  // 실제 구현 시 렌더링 스케일에 맞게 조정
  const renderScale = 0.001; // 예: 1 MicroMM = 0.001 렌더링 단위
  const x = position.x * renderScale;
  const y = position.y * renderScale;
  const z = position.z * renderScale;
  
  return new Float32Array([
    cos * scale, sin * scale, 0, 0,
    -sin * scale, cos * scale, 0, 0,
    0, 0, scale, 0,
    x, y, z, 1,
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: Format Utilities (포맷팅)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 거리 값을 사용자 친화적 문자열로 포맷
 */
export function formatDistance(
  micro: MicroMM, 
  unit: 'mm' | 'cm' | 'm' = 'mm'
): string {
  switch (unit) {
    case 'mm':
      return `${microToMM(micro).toLocaleString()} mm`;
    case 'cm':
      return `${microToCM(micro).toLocaleString()} cm`;
    case 'm':
      return `${microToM(micro).toFixed(3)} m`;
  }
}

/**
 * 면적 값을 사용자 친화적 문자열로 포맷
 */
export function formatArea(
  microArea: number, 
  unit: 'mm2' | 'm2' = 'm2'
): string {
  switch (unit) {
    case 'mm2':
      const mm2 = microArea / (MICRO_SCALE * MICRO_SCALE);
      return `${mm2.toLocaleString()} mm²`;
    case 'm2':
      const m2 = microAreaToM2(microArea);
      return `${m2.toFixed(2)} m²`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
  MICRO_SCALE,
};

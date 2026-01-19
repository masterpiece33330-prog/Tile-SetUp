/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Tile Calculation Service
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 타일 물량 산출의 핵심 엔진
 * 
 * 이 모듈은 사용자 입력(시공면적, 타일크기, Gap, 시작선)을 받아
 * 2차원 타일 그리드(TileCell[][])를 생성합니다.
 * 
 * ⚠️ CRITICAL ENGINEERING CONSTRAINTS 적용:
 * 1. 정수 연산만 사용 (MicroMM 타입)
 * 2. 수정된 Gap 공식: (n × tile) + ((n-1) × gap)
 * 3. 시작선 CENTER 양방향 분배
 * 4. 메모리 최적화: FULL 타일은 크기 생략
 * 
 * Ref: Chapter 1 - 물량 산출 시스템
 * Ref: 분석 노트 - Gap 중복 처리, 시작선 불일치 수정
 */

import {
  MicroMM,
  Point,
  Dimension,
  TileCalculationInput,
  TileCalculationResult,
  TileCell,
  TileType,
  PieceDimension,
  StartLineX,
  StartLineY,
  ValidationResult,
  INPUT_LIMITS,
  Percentage,
} from '../types';

import {
  mmToMicro,
  microToMM,
  microAreaToM2,
  addMicro,
  subtractMicro,
  multiplyMicro,
  validateTileInput,
  calculateAreaRatio,
  MICRO_SCALE,
} from './math';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Configuration Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 전역 타일 설정
 * TileCell의 width/height가 없을 때 이 값을 참조
 */
export interface GlobalTileConfig {
  tileWidth: MicroMM;
  tileHeight: MicroMM;
  gap: MicroMM;
}

/**
 * 그리드 차원 정보
 * 물량 계산 중간 결과
 */
interface GridDimensions {
  /** 열 수 (가로 방향 타일 수) */
  cols: number;
  
  /** 행 수 (세로 방향 타일 수) */
  rows: number;
  
  /** 좌측 잔여 길이 */
  leftRemainder: MicroMM;
  
  /** 우측 잔여 길이 */
  rightRemainder: MicroMM;
  
  /** 상단 잔여 길이 */
  topRemainder: MicroMM;
  
  /** 하단 잔여 길이 */
  bottomRemainder: MicroMM;
  
  /** 가장자리에 조각이 있는지 */
  hasLeftEdge: boolean;
  hasRightEdge: boolean;
  hasTopEdge: boolean;
  hasBottomEdge: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * TileCell의 실제 크기 조회 (메모리 최적화 지원)
 * 
 * ⚠️ MEMORY OPTIMIZATION:
 * FULL 타일은 width/height가 undefined이므로 전역 설정에서 조회
 * 
 * @param tile - 타일 셀
 * @param config - 전역 타일 설정
 * @returns 실제 가로/세로 크기
 */
export function getTileDimension(
  tile: TileCell,
  config: GlobalTileConfig
): { width: MicroMM; height: MicroMM } {
  return {
    width: tile.width ?? config.tileWidth,
    height: tile.height ?? config.tileHeight,
  };
}

/**
 * 고유 타일 ID 생성
 * 형식: "tile_행_열" (예: "tile_0_0", "tile_5_12")
 */
function generateTileId(row: number, col: number): string {
  return `tile_${row}_${col}`;
}

/**
 * 타일 타입 분류 (개선된 버전)
 * 
 * ⚠️ TODO (향후 확장 - 자재 재활용 알고리즘):
 * 현재는 단순히 면적 50%를 기준으로 분류하지만,
 * 향후 "이 조각을 자르고 남은 부분을 다른 곳에 쓸 수 있는가?"를
 * 판단하는 Waste Management 알고리즘 추가 필요.
 * 
 * 예시: 300x600 타일을 100x600으로 자르면(16%),
 *       남은 200x600(33%)도 다른 조각에 활용 가능.
 * 
 * 확장 포인트:
 * - classifyWithWasteManagement(cutW, cutH, fullW, fullH, existingWaste[])
 * - 기존 자투리 목록과 매칭하여 재활용 가능 여부 판단
 * - 자재 발주량 최적화에 활용
 * 
 * @param cutWidth - 잘린 타일 너비
 * @param cutHeight - 잘린 타일 높이
 * @param fullWidth - 원본 타일 너비
 * @param fullHeight - 원본 타일 높이
 */
function classifyTileType(
  cutWidth: MicroMM,
  cutHeight: MicroMM,
  fullWidth: MicroMM,
  fullHeight: MicroMM
): TileType {
  // 온전한 타일인 경우 (정수 비교로 오차 없음)
  if (cutWidth === fullWidth && cutHeight === fullHeight) {
    return 'FULL';
  }
  
  // 면적 비율 계산 (정수 연산)
  const cutArea = cutWidth * cutHeight;
  const fullArea = fullWidth * fullHeight;
  
  // 정수 연산으로 백분율 계산 (소수점 오차 방지)
  // (cutArea * 100) / fullArea >= 50 를 정수로 처리
  const areaRatioX100 = Math.floor((cutArea * 100) / fullArea);
  
  /**
   * ⚠️ FUTURE ENHANCEMENT: Waste Management
   * 
   * 현재: 단순 면적 50% 기준
   * 향후: 자투리 재활용 가능 여부 판단
   * 
   * interface WasteCandidate {
   *   remainingWidth: MicroMM;
   *   remainingHeight: MicroMM;
   *   canBeReused: boolean;
   *   matchingPositions: Point[]; // 재활용 가능한 위치
   * }
   */
  
  if (areaRatioX100 >= 50) {
    return 'LARGE';
  } else {
    return 'SMALL';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: Grid Dimension Calculation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 그리드 차원 계산 (타일 수 및 잔여 길이)
 * 
 * ⚠️ FORMULA CORRECTION (Gap 계산):
 * 
 * 잘못된 공식 (명세서 원본):
 *   totalWidth = n × (tileWidth + gap)
 *   → 마지막 타일 뒤에도 불필요한 gap이 추가됨
 * 
 * 올바른 공식 (수정됨):
 *   totalWidth = (n × tileWidth) + ((n-1) × gap)
 *   → 마지막 타일 외곽에는 gap 없음
 * 
 * 수학적 도출:
 *   (n × tile) + ((n-1) × gap) ≤ area
 *   n × tile + n × gap - gap ≤ area
 *   n × (tile + gap) ≤ area + gap
 *   n ≤ (area + gap) / (tile + gap)
 */
function calculateGridDimensions(
  input: TileCalculationInput
): GridDimensions {
  const { areaWidth, areaHeight, tileWidth, tileHeight, gapSize, startLine } = input;
  
  // ═══════════════════════════════════════════════════════════════════════
  // 가로 방향 (열) 계산
  // ═══════════════════════════════════════════════════════════════════════
  
  // 유효 타일 폭 (tile + gap)
  const effectiveTileW = addMicro(tileWidth, gapSize);
  
  // 수정된 공식: n ≤ (area + gap) / (tile + gap)
  const adjustedAreaW = addMicro(areaWidth, gapSize);
  const maxColsExact = adjustedAreaW / effectiveTileW;
  const cols = Math.floor(maxColsExact);
  
  // 실제 사용 가로 길이: (n × tile) + ((n-1) × gap)
  const usedWidth = cols > 0
    ? (cols * tileWidth + (cols - 1) * gapSize) as MicroMM
    : (0 as MicroMM);
  
  // 총 가로 잔여 길이
  const totalRemainderW = subtractMicro(areaWidth, usedWidth);
  
  // ═══════════════════════════════════════════════════════════════════════
  // 세로 방향 (행) 계산
  // ═══════════════════════════════════════════════════════════════════════
  
  const effectiveTileH = addMicro(tileHeight, gapSize);
  const adjustedAreaH = addMicro(areaHeight, gapSize);
  const maxRowsExact = adjustedAreaH / effectiveTileH;
  const rows = Math.floor(maxRowsExact);
  
  const usedHeight = rows > 0
    ? (rows * tileHeight + (rows - 1) * gapSize) as MicroMM
    : (0 as MicroMM);
  
  const totalRemainderH = subtractMicro(areaHeight, usedHeight);
  
  // ═══════════════════════════════════════════════════════════════════════
  // 시작선에 따른 잔여 분배
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * ⚠️ LOGIC CORRECTION: CENTER 시작선 처리
   * 
   * 명세서 원본의 문제:
   *   단순히 areaW % effW로 한쪽 끝 잔여량만 계산
   * 
   * 수정된 로직:
   *   CENTER인 경우 잔여를 양쪽으로 균등 분배
   *   → 좌측 조각 + 우측 조각이 각각 생성됨
   */
  
  let leftRemainder: MicroMM;
  let rightRemainder: MicroMM;
  
  switch (startLine.x) {
    case 'LEFT':
      // 좌측 정렬: 잔여는 우측에 몰림
      leftRemainder = 0 as MicroMM;
      rightRemainder = totalRemainderW;
      break;
      
    case 'RIGHT':
      // 우측 정렬: 잔여는 좌측에 몰림
      leftRemainder = totalRemainderW;
      rightRemainder = 0 as MicroMM;
      break;
      
    case 'CENTER':
      // 중앙 정렬: 잔여를 양쪽으로 균등 분배
      // 홀수인 경우 오른쪽에 1 MicroMM 더 할당 (반올림 처리)
      const halfRemainderW = Math.floor(totalRemainderW / 2) as MicroMM;
      leftRemainder = halfRemainderW;
      rightRemainder = subtractMicro(totalRemainderW, halfRemainderW);
      break;
  }
  
  let topRemainder: MicroMM;
  let bottomRemainder: MicroMM;
  
  switch (startLine.y) {
    case 'TOP':
      topRemainder = 0 as MicroMM;
      bottomRemainder = totalRemainderH;
      break;
      
    case 'BOTTOM':
      topRemainder = totalRemainderH;
      bottomRemainder = 0 as MicroMM;
      break;
      
    case 'CENTER':
      const halfRemainderH = Math.floor(totalRemainderH / 2) as MicroMM;
      topRemainder = halfRemainderH;
      bottomRemainder = subtractMicro(totalRemainderH, halfRemainderH);
      break;
  }
  
  // 가장자리 조각 존재 여부 (렌더링 최적화용)
  // 최소 의미 있는 크기: 1mm = 1000 MicroMM
  const MIN_PIECE_SIZE = mmToMicro(1);
  
  return {
    cols,
    rows,
    leftRemainder,
    rightRemainder,
    topRemainder,
    bottomRemainder,
    hasLeftEdge: leftRemainder >= MIN_PIECE_SIZE,
    hasRightEdge: rightRemainder >= MIN_PIECE_SIZE,
    hasTopEdge: topRemainder >= MIN_PIECE_SIZE,
    hasBottomEdge: bottomRemainder >= MIN_PIECE_SIZE,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Grid Generation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 2D 타일 그리드 생성
 * 
 * ⚠️ MEMORY OPTIMIZATION:
 * - FULL 타일: width/height 생략 (undefined)
 * - LARGE/SMALL 타일: width/height 명시
 * - 타일 10,000개 기준 약 40% 메모리 절감
 * 
 * @param input - 사용자 입력값
 * @param dims - 그리드 차원 정보
 * @returns 2D 타일 배열
 */
function generateTileGrid(
  input: TileCalculationInput,
  dims: GridDimensions
): TileCell[][] {
  const { tileWidth, tileHeight, gapSize, startLine } = input;
  const {
    cols, rows,
    leftRemainder, rightRemainder,
    topRemainder, bottomRemainder,
    hasLeftEdge, hasRightEdge,
    hasTopEdge, hasBottomEdge,
  } = dims;
  
  // 실제 그리드 크기 (가장자리 조각 포함)
  // CENTER 정렬 시 양쪽 가장자리가 모두 존재할 수 있음
  const actualCols = cols + (hasLeftEdge ? 1 : 0) + (hasRightEdge ? 1 : 0);
  const actualRows = rows + (hasTopEdge ? 1 : 0) + (hasBottomEdge ? 1 : 0);
  
  const grid: TileCell[][] = [];
  
  // 시작 오프셋 (CENTER 정렬 시 좌측/상단 조각의 위치)
  let currentY: MicroMM = 0 as MicroMM;
  
  for (let gridRow = 0; gridRow < actualRows; gridRow++) {
    const row: TileCell[] = [];
    let currentX: MicroMM = 0 as MicroMM;
    
    // 이 행이 상단 가장자리인지, 하단 가장자리인지, 내부인지 결정
    const isTopEdgeRow = hasTopEdge && gridRow === 0;
    const isBottomEdgeRow = hasBottomEdge && gridRow === actualRows - 1;
    const isFullHeightRow = !isTopEdgeRow && !isBottomEdgeRow;
    
    // 행의 타일 높이 결정
    let rowTileHeight: MicroMM;
    if (isTopEdgeRow) {
      rowTileHeight = topRemainder;
    } else if (isBottomEdgeRow) {
      rowTileHeight = bottomRemainder;
    } else {
      rowTileHeight = tileHeight;
    }
    
    for (let gridCol = 0; gridCol < actualCols; gridCol++) {
      // 이 열이 좌측 가장자리인지, 우측 가장자리인지, 내부인지 결정
      const isLeftEdgeCol = hasLeftEdge && gridCol === 0;
      const isRightEdgeCol = hasRightEdge && gridCol === actualCols - 1;
      const isFullWidthCol = !isLeftEdgeCol && !isRightEdgeCol;
      
      // 열의 타일 너비 결정
      let colTileWidth: MicroMM;
      if (isLeftEdgeCol) {
        colTileWidth = leftRemainder;
      } else if (isRightEdgeCol) {
        colTileWidth = rightRemainder;
      } else {
        colTileWidth = tileWidth;
      }
      
      // 타일 타입 분류
      const type = classifyTileType(
        colTileWidth,
        rowTileHeight,
        tileWidth,
        tileHeight
      );
      
      // 타일 생성
      // ⚠️ MEMORY OPTIMIZATION: FULL 타일은 width/height 생략
      const tile: TileCell = {
        id: generateTileId(gridRow, gridCol),
        type,
        row: gridRow,
        col: gridCol,
        position: {
          x: currentX,
          y: currentY,
        },
        rotation: 0,
        visible: true,
        maskedBy: [],
        isLocked: false,
      };
      
      // FULL 타일이 아닌 경우에만 크기 명시
      if (type !== 'FULL') {
        tile.width = colTileWidth;
        tile.height = rowTileHeight;
      }
      
      row.push(tile);
      
      // 다음 열 위치 계산 (타일 너비 + gap)
      currentX = addMicro(currentX, colTileWidth);
      if (gridCol < actualCols - 1) {
        currentX = addMicro(currentX, gapSize);
      }
    }
    
    grid.push(row);
    
    // 다음 행 위치 계산 (타일 높이 + gap)
    currentY = addMicro(currentY, rowTileHeight);
    if (gridRow < actualRows - 1) {
      currentY = addMicro(currentY, gapSize);
    }
  }
  
  return grid;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Statistics Calculation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 타일 통계 집계
 * 
 * @param grid - 2D 타일 그리드
 * @param config - 전역 타일 설정
 */
function calculateTileStatistics(
  grid: TileCell[][],
  config: GlobalTileConfig
): {
  totalCount: number;
  fullCount: number;
  largeCount: number;
  smallCount: number;
  largeDimension: PieceDimension | null;
  smallDimension: PieceDimension | null;
  coveredArea: number; // MicroMM² 단위
} {
  let totalCount = 0;
  let fullCount = 0;
  let largeCount = 0;
  let smallCount = 0;
  let coveredArea = 0;
  
  // 조각 크기 추적 (첫 번째 발견된 조각 기준)
  let largeDimension: PieceDimension | null = null;
  let smallDimension: PieceDimension | null = null;
  
  for (const row of grid) {
    for (const tile of row) {
      if (!tile.visible) continue;
      
      totalCount++;
      const { width, height } = getTileDimension(tile, config);
      
      // 면적 누적 (정수 연산)
      coveredArea += width * height;
      
      switch (tile.type) {
        case 'FULL':
          fullCount++;
          break;
          
        case 'LARGE':
          largeCount++;
          if (!largeDimension) {
            largeDimension = {
              width,
              height,
              areaRatio: calculateAreaRatio(
                width, height,
                config.tileWidth, config.tileHeight
              ),
            };
          }
          break;
          
        case 'SMALL':
          smallCount++;
          if (!smallDimension) {
            smallDimension = {
              width,
              height,
              areaRatio: calculateAreaRatio(
                width, height,
                config.tileWidth, config.tileHeight
              ),
            };
          }
          break;
          
        case 'SPLIT':
          // 사용자가 수동 분할한 타일은 별도 집계
          // 현재는 LARGE/SMALL과 유사하게 처리
          if (calculateAreaRatio(width, height, config.tileWidth, config.tileHeight) >= 50) {
            largeCount++;
          } else {
            smallCount++;
          }
          break;
      }
    }
  }
  
  return {
    totalCount,
    fullCount,
    largeCount,
    smallCount,
    largeDimension,
    smallDimension,
    coveredArea,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Main Calculation Function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 타일 물량 산출 메인 함수
 * 
 * 이 함수는 사용자 입력을 받아 완전한 타일 배치 결과를 반환합니다.
 * 
 * @param input - 사용자 입력 (시공면적, 타일크기, Gap, 시작선)
 * @returns 계산 결과 (그리드, 통계, 면적 등)
 * 
 * @throws ValidationError - 입력값이 유효하지 않은 경우
 * 
 * @example
 * ```typescript
 * const input: TileCalculationInput = {
 *   areaWidth: mmToMicro(55000),   // 55,000mm
 *   areaHeight: mmToMicro(40000),  // 40,000mm
 *   tileWidth: mmToMicro(300),     // 300mm
 *   tileHeight: mmToMicro(350),    // 350mm
 *   gapSize: mmToMicro(1.5),       // 1.5mm
 *   startLine: { x: 'LEFT', y: 'TOP' },
 * };
 * 
 * const result = calculateTileQuantity(input);
 * console.log(result.totalTileCount);  // 전체 타일 수
 * console.log(result.gridData);        // 2D 타일 배열
 * ```
 */
export function calculateTileQuantity(
  input: TileCalculationInput
): TileCalculationResult {
  // ═══════════════════════════════════════════════════════════════════════
  // Step 1: 입력 검증
  // ═══════════════════════════════════════════════════════════════════════
  
  const validation = validateTileInput(input);
  if (!validation.isValid) {
    throw new Error(
      `입력값 검증 실패: ${validation.errors.map(e => e.message).join(', ')}`
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Step 2: 그리드 차원 계산
  // ═══════════════════════════════════════════════════════════════════════
  
  const dims = calculateGridDimensions(input);
  
  // ═══════════════════════════════════════════════════════════════════════
  // Step 3: 타일 그리드 생성
  // ═══════════════════════════════════════════════════════════════════════
  
  const gridData = generateTileGrid(input, dims);
  
  // ═══════════════════════════════════════════════════════════════════════
  // Step 4: 통계 집계
  // ═══════════════════════════════════════════════════════════════════════
  
  const config: GlobalTileConfig = {
    tileWidth: input.tileWidth,
    tileHeight: input.tileHeight,
    gap: input.gapSize,
  };
  
  const stats = calculateTileStatistics(gridData, config);
  
  // ═══════════════════════════════════════════════════════════════════════
  // Step 5: 면적 계산
  // ═══════════════════════════════════════════════════════════════════════
  
  // 총 시공 면적 (MicroMM² → m²)
  const totalAreaMicro = input.areaWidth * input.areaHeight;
  const totalAreaM2 = microAreaToM2(totalAreaMicro);
  
  // 타일이 덮는 면적 (Blank Space 제외)
  const coveredAreaM2 = microAreaToM2(stats.coveredArea);
  
  // ═══════════════════════════════════════════════════════════════════════
  // Step 6: 결과 반환
  // ═══════════════════════════════════════════════════════════════════════
  
  return {
    totalTileCount: stats.totalCount,
    fullTileCount: stats.fullCount,
    largePieceCount: stats.largeCount,
    smallPieceCount: stats.smallCount,
    columnCount: gridData[0]?.length ?? 0,
    rowCount: gridData.length,
    largePieceDimension: stats.largeDimension,
    smallPieceDimension: stats.smallDimension,
    leftRemainder: dims.leftRemainder,
    rightRemainder: dims.rightRemainder,
    topRemainder: dims.topRemainder,
    bottomRemainder: dims.bottomRemainder,
    gridData,
    totalAreaM2,
    coveredAreaM2,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: Utility Exports
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 원본 기획안 예시 검증용 함수
 * 
 * 원본 기획안 데이터:
 * - 시공면적: W 55,000mm × H 40,000mm
 * - 타일크기: W 300mm × H 350mm
 * - Gap: 1.5mm
 * - 예상 결과: 전체 28장(?), 큰조각 8장, 작은조각 13장
 * 
 * ⚠️ 주의: 원본의 "28장"은 7열 × 4행 = 28칸이지만,
 * 수정된 공식과 가장자리 조각을 포함하면 결과가 달라질 수 있음.
 */
export function validateWithOriginalExample(): {
  input: TileCalculationInput;
  result: TileCalculationResult;
  comparison: {
    expected: { total: number; large: number; small: number };
    actual: { total: number; large: number; small: number };
    matches: boolean;
  };
} {
  const input: TileCalculationInput = {
    areaWidth: mmToMicro(55000),
    areaHeight: mmToMicro(40000),
    tileWidth: mmToMicro(300),
    tileHeight: mmToMicro(350),
    gapSize: mmToMicro(1.5),
    startLine: { x: 'LEFT', y: 'TOP' },
  };
  
  const result = calculateTileQuantity(input);
  
  // 원본 기획안의 예상 결과 (참고용)
  const expected = {
    total: 28, // 원본: "7열 × 4행 = 28칸"
    large: 8,  // 원본: "큰조각 8장"
    small: 13, // 원본: "작은조각 13장"
  };
  
  const actual = {
    total: result.totalTileCount,
    large: result.largePieceCount,
    small: result.smallPieceCount,
  };
  
  return {
    input,
    result,
    comparison: {
      expected,
      actual,
      matches: (
        expected.total === actual.total &&
        expected.large === actual.large &&
        expected.small === actual.small
      ),
    },
  };
}

/**
 * 메모리 사용량 추정 (개발/디버깅용)
 * 
 * @param tileCount - 예상 타일 수
 * @returns 메모리 추정치 (bytes)
 */
export function estimateMemoryUsage(tileCount: number): {
  oldStructure: number;
  optimizedStructure: number;
  savings: number;
  savingsPercent: number;
} {
  // 기존 구조: 모든 타일에 width/height (각 8 bytes for number)
  const bytesPerTileOld = 
    8 + // id (string ref, 대략)
    4 + // type (enum)
    8 + // width (number) ← 중복!
    8 + // height (number) ← 중복!
    4 + // row
    4 + // col
    16 + // position (2 numbers)
    4 + // rotation
    1 + // visible
    8 + // maskedBy (array ref)
    1;  // isLocked
  // 약 66 bytes/tile
  
  // 최적화된 구조: FULL 타일(90%)은 width/height 없음
  const fullTileRatio = 0.9;
  const bytesPerFullTile = bytesPerTileOld - 16; // width/height 제거
  const bytesPerCutTile = bytesPerTileOld;
  
  const oldStructure = tileCount * bytesPerTileOld;
  const optimizedStructure = Math.floor(
    tileCount * fullTileRatio * bytesPerFullTile +
    tileCount * (1 - fullTileRatio) * bytesPerCutTile
  );
  
  const savings = oldStructure - optimizedStructure;
  const savingsPercent = Math.round((savings / oldStructure) * 100);
  
  return {
    oldStructure,
    optimizedStructure,
    savings,
    savingsPercent,
  };
}

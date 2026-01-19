/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Pattern System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 15가지 타일 배치 패턴 알고리즘
 * 
 * 이 모듈은 원본 기획안 3페이지의 "기본 15가지 패턴 제공"을 구현합니다.
 * 각 패턴은 독립적인 오프셋 계산 함수를 가지며, 정수 연산(MicroMM)을
 * 유지합니다.
 * 
 * ⚠️ CRITICAL: 모든 좌표 계산은 MicroMM 단위로 수행
 * ⚠️ CRITICAL: 패턴 적용은 비파괴적 (원본 그리드 보존)
 * 
 * Ref: Chapter 3 - 타일 패턴 시스템
 * Ref: Chapter 3.2.1 - 기본 패턴 수식
 */

import {
  MicroMM,
  Point,
  Degree,
  TileCell,
  TileType,
  PatternId,
  TilePattern,
  TileCalculationInput,
} from '../types';

import {
  mmToMicro,
  microToMM,
  addMicro,
  subtractMicro,
  multiplyMicro,
} from './math';

import {
  GlobalTileConfig,
  getTileDimension,
} from './tileCalculationService';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Pattern Offset Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 패턴 오프셋 계산 결과
 */
export interface PatternOffset {
  /** X축 오프셋 (MicroMM) */
  offsetX: MicroMM;
  
  /** Y축 오프셋 (MicroMM) */
  offsetY: MicroMM;
  
  /** 타일 회전 각도 */
  rotation: 0 | 90 | 180 | 270;
  
  /** 타일 가로/세로 교환 여부 (헤링본 등) */
  swapDimensions: boolean;
}

/**
 * 패턴 오프셋 계산 함수 시그니처
 * 
 * @param row - 행 인덱스 (0-based)
 * @param col - 열 인덱스 (0-based)
 * @param tileWidth - 타일 너비 (MicroMM)
 * @param tileHeight - 타일 높이 (MicroMM)
 * @param gap - 줄눈 간격 (MicroMM)
 */
export type PatternOffsetCalculator = (
  row: number,
  col: number,
  tileWidth: MicroMM,
  tileHeight: MicroMM,
  gap: MicroMM
) => PatternOffset;

/**
 * 패턴 메타데이터
 */
export interface PatternMetadata {
  id: PatternId;
  nameKo: string;
  nameEn: string;
  description: string;
  
  /** 오프셋 타입 */
  offsetType: 'NONE' | 'HALF' | 'THIRD' | 'CUSTOM';
  
  /** 기본 회전 각도 */
  baseRotation: 0 | 45 | 90;
  
  /** 교대 패턴 여부 */
  alternating: boolean;
  
  /** 직사각형 타일 필요 여부 */
  requiresRectangular: boolean;
  
  /** 오프셋 계산 함수 */
  calculateOffset: PatternOffsetCalculator;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Basic Offset Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 기본 오프셋 (변형 없음)
 */
function createBaseOffset(): PatternOffset {
  return {
    offsetX: 0 as MicroMM,
    offsetY: 0 as MicroMM,
    rotation: 0,
    swapDimensions: false,
  };
}

/**
 * 50% 가로 오프셋 계산
 * Running Bond 계열 패턴에서 사용
 */
function calculateHalfOffset(
  row: number,
  tileWidth: MicroMM,
  gap: MicroMM
): MicroMM {
  // 홀수 행: 타일 너비의 절반만큼 이동
  if (row % 2 === 1) {
    return Math.floor(tileWidth / 2) as MicroMM;
  }
  return 0 as MicroMM;
}

/**
 * 33% (1/3) 가로 오프셋 계산
 * 1/3 Running Bond 패턴에서 사용
 */
function calculateThirdOffset(
  row: number,
  tileWidth: MicroMM,
  gap: MicroMM
): MicroMM {
  // 행 인덱스 mod 3에 따라 0%, 33%, 66% 오프셋
  const phase = row % 3;
  return Math.floor((tileWidth * phase) / 3) as MicroMM;
}

/**
 * 50% 세로 오프셋 계산
 * Vertical Running Bond 패턴에서 사용
 */
function calculateVerticalHalfOffset(
  col: number,
  tileHeight: MicroMM,
  gap: MicroMM
): MicroMM {
  if (col % 2 === 1) {
    return Math.floor(tileHeight / 2) as MicroMM;
  }
  return 0 as MicroMM;
}

/**
 * 33% 세로 오프셋 계산
 */
function calculateVerticalThirdOffset(
  col: number,
  tileHeight: MicroMM,
  gap: MicroMM
): MicroMM {
  const phase = col % 3;
  return Math.floor((tileHeight * phase) / 3) as MicroMM;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: 15 Pattern Definitions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 패턴 1: Linear Square (직선 사각)
 * 
 * 가장 기본적인 일렬 배치
 * 오프셋 없음, 모든 타일이 정렬됨
 * 
 * □ □ □ □
 * □ □ □ □
 * □ □ □ □
 */
const linearSquareOffset: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  return createBaseOffset();
};

/**
 * 패턴 2: Diamond (다이아몬드)
 * 
 * 45도 회전 배치
 * ⚠️ 주의: 실제 구현 시 타일 크기가 √2배로 확대되어 보임
 * 
 *   ◇   ◇
 * ◇   ◇   ◇
 *   ◇   ◇
 */
const diamondOffset: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  // 다이아몬드는 45도 회전이므로 체커보드 패턴의 오프셋 적용
  // 홀수 행은 타일 너비의 절반만큼 이동
  const isOddRow = row % 2 === 1;
  
  // √2 스케일링 보정을 위한 오프셋 (45도 회전 시)
  // 타일 대각선 길이 = √(w² + h²) ≈ 1.414 * w (정사각형 기준)
  const diagonalOffset = isOddRow 
    ? Math.floor(tileWidth / 2) as MicroMM 
    : 0 as MicroMM;
  
  return {
    offsetX: diagonalOffset,
    offsetY: 0 as MicroMM,
    rotation: 0, // 렌더링 시 45도 회전 적용
    swapDimensions: false,
  };
};

/**
 * 패턴 3: Running Bond Square (벽돌쌓기 - 사각)
 * 
 * 가로 50% 오프셋 (가장 일반적인 벽돌 패턴)
 * 
 * □ □ □ □
 *  □ □ □ □
 * □ □ □ □
 */
const runningBondSquareOffset: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  return {
    offsetX: calculateHalfOffset(row, tileWidth, gap),
    offsetY: 0 as MicroMM,
    rotation: 0,
    swapDimensions: false,
  };
};

/**
 * 패턴 4: Stack Bond (스택 본드)
 * 
 * 수직 정렬 배치 (Linear Square와 동일하지만 개념적 구분)
 * 세로로 쌓아 올리는 느낌
 * 
 * □ □ □ □
 * □ □ □ □
 * □ □ □ □
 */
const stackBondOffset: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  return createBaseOffset();
};

/**
 * 패턴 5: Vertical Stack (수직 스택)
 * 
 * 세로 방향 강조 - 타일을 세로로 세워서 배치
 * 
 * ▯ ▯ ▯ ▯
 * ▯ ▯ ▯ ▯
 * ▯ ▯ ▯ ▯
 */
const verticalStackOffset: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  return {
    offsetX: 0 as MicroMM,
    offsetY: 0 as MicroMM,
    rotation: 90, // 90도 회전하여 세로로 세움
    swapDimensions: true,
  };
};

/**
 * 패턴 6: Diagonal Running (대각 러닝)
 * 
 * 대각선 방향 오프셋
 * 
 * □ □ □
 *   □ □ □
 *     □ □ □
 */
const diagonalRunningOffset: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  // 행에 따라 점진적으로 오프셋 증가
  const offsetAmount = (row * tileWidth / 4) % tileWidth;
  
  return {
    offsetX: Math.floor(offsetAmount) as MicroMM,
    offsetY: 0 as MicroMM,
    rotation: 0,
    swapDimensions: false,
  };
};

/**
 * 패턴 7: Running Bond Offset (러닝 본드 오프셋)
 * 
 * 33% 오프셋 변형
 * 
 * □ □ □ □
 *    □ □ □ □
 *       □ □ □ □
 * □ □ □ □
 */
const runningBondOffsetPattern: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  return {
    offsetX: calculateThirdOffset(row, tileWidth, gap),
    offsetY: 0 as MicroMM,
    rotation: 0,
    swapDimensions: false,
  };
};

/**
 * 패턴 8: Vertical Running Bond (수직 러닝 본드)
 * 
 * 세로 50% 오프셋
 * 
 * □ □ □ □
 * □ □ □ □
 *    ↓ 열마다 세로 오프셋
 */
const verticalRunningBondOffset: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  return {
    offsetX: 0 as MicroMM,
    offsetY: calculateVerticalHalfOffset(col, tileHeight, gap),
    rotation: 0,
    swapDimensions: false,
  };
};

/**
 * 패턴 9: Vertical Stack Offset (수직 스택 오프셋)
 * 
 * 세로 방향 33% 오프셋
 */
const verticalStackOffsetPattern: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  return {
    offsetX: 0 as MicroMM,
    offsetY: calculateVerticalThirdOffset(col, tileHeight, gap),
    rotation: 0,
    swapDimensions: false,
  };
};

/**
 * 패턴 10: 1/3 Running Bond (1/3 러닝 본드)
 * 
 * 1/3 간격 반복 패턴
 * 
 * □□□□□□
 *   □□□□□□
 *     □□□□□□
 * □□□□□□
 */
const oneThirdRunningBondOffset: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  return {
    offsetX: calculateThirdOffset(row, tileWidth, gap),
    offsetY: 0 as MicroMM,
    rotation: 0,
    swapDimensions: false,
  };
};

/**
 * 패턴 11: Diagonal Running Point (대각 러닝 포인트)
 * 
 * 대각선 강조 패턴 - 교대로 90도 회전
 */
const diagonalRunningPointOffset: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  // 체커보드 패턴으로 회전 적용
  const shouldRotate = (row + col) % 2 === 1;
  
  return {
    offsetX: calculateHalfOffset(row, tileWidth, gap),
    offsetY: 0 as MicroMM,
    rotation: shouldRotate ? 90 : 0,
    swapDimensions: shouldRotate,
  };
};

/**
 * 패턴 12: Traditional Running Bond (전통 러닝 본드)
 * 
 * 클래식 벽돌 패턴 (Running Bond Square와 동일하지만 네이밍 구분)
 */
const traditionalRunningBondOffset: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  return {
    offsetX: calculateHalfOffset(row, tileWidth, gap),
    offsetY: 0 as MicroMM,
    rotation: 0,
    swapDimensions: false,
  };
};

/**
 * 패턴 13: Traditional Herringbone (전통 헤링본)
 * 
 * V자 청어뼈 패턴 - 가장 복잡한 패턴 중 하나
 * 직사각형 타일 필수
 * 
 *   ▬ ▮
 * ▮ ▬
 *   ▬ ▮
 */
const traditionalHerringboneOffset: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  /**
   * 헤링본 패턴 로직:
   * 
   * 2x2 블록 단위로 반복:
   * - (0,0): 가로 타일
   * - (0,1): 세로 타일
   * - (1,0): 세로 타일 (아래로 오프셋)
   * - (1,1): 가로 타일 (오른쪽으로 오프셋)
   */
  
  const blockRow = row % 2;
  const blockCol = col % 2;
  const blockIndex = blockRow * 2 + blockCol;
  
  // 헤링본 오프셋 계산
  let offsetX: MicroMM = 0 as MicroMM;
  let offsetY: MicroMM = 0 as MicroMM;
  let rotation: 0 | 90 | 180 | 270 = 0;
  let swapDimensions = false;
  
  switch (blockIndex) {
    case 0: // (0,0): 가로 배치
      rotation = 0;
      swapDimensions = false;
      break;
      
    case 1: // (0,1): 세로 배치
      rotation = 90;
      swapDimensions = true;
      offsetX = tileHeight; // 세로 타일의 높이만큼 이동
      break;
      
    case 2: // (1,0): 세로 배치 (아래로 오프셋)
      rotation = 90;
      swapDimensions = true;
      offsetY = Math.floor(tileWidth / 2) as MicroMM;
      break;
      
    case 3: // (1,1): 가로 배치
      rotation = 0;
      swapDimensions = false;
      offsetX = Math.floor(tileHeight / 2) as MicroMM;
      offsetY = Math.floor(tileWidth / 2) as MicroMM;
      break;
  }
  
  return { offsetX, offsetY, rotation, swapDimensions };
};

/**
 * 패턴 14: Straight Herringbone (직선 헤링본)
 * 
 * 90도 헤링본 변형 - 수직/수평 방향으로 정렬
 * 
 * ▬ ▮ ▬ ▮
 * ▮ ▬ ▮ ▬
 */
const straightHerringboneOffset: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  // 체커보드 패턴으로 가로/세로 교대
  const isVertical = (row + col) % 2 === 1;
  
  return {
    offsetX: 0 as MicroMM,
    offsetY: 0 as MicroMM,
    rotation: isVertical ? 90 : 0,
    swapDimensions: isVertical,
  };
};

/**
 * 패턴 15: Basket Weave (바스켓 위브)
 * 
 * 바구니 짜기 패턴 - 2개 타일을 그룹으로 교대 배치
 * 
 * ▬▬ ▮ ▬▬ ▮
 * ▮  ▬▬ ▮  ▬▬
 */
const basketWeaveOffset: PatternOffsetCalculator = (
  row, col, tileWidth, tileHeight, gap
) => {
  /**
   * 바스켓 위브 로직:
   * 
   * 2x2 블록 단위로 반복
   * - 블록 (0,0), (1,1): 가로 타일 2개
   * - 블록 (0,1), (1,0): 세로 타일 2개
   */
  
  const blockRow = Math.floor(row / 2);
  const blockCol = Math.floor(col / 2);
  const isVerticalBlock = (blockRow + blockCol) % 2 === 1;
  
  // 블록 내 위치
  const inBlockRow = row % 2;
  const inBlockCol = col % 2;
  
  let rotation: 0 | 90 | 180 | 270 = isVerticalBlock ? 90 : 0;
  
  // 세로 블록일 때 오프셋 조정
  let offsetX: MicroMM = 0 as MicroMM;
  let offsetY: MicroMM = 0 as MicroMM;
  
  if (isVerticalBlock) {
    // 세로 블록: 타일들을 세로로 쌓음
    offsetY = (inBlockCol * tileWidth) as MicroMM;
  } else {
    // 가로 블록: 타일들을 가로로 나열
    offsetX = (inBlockCol * tileWidth) as MicroMM;
  }
  
  return {
    offsetX,
    offsetY,
    rotation,
    swapDimensions: isVerticalBlock,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Pattern Registry
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 15가지 패턴 메타데이터 레지스트리
 */
export const PATTERN_REGISTRY: Record<PatternId, PatternMetadata> = {
  LINEAR_SQUARE: {
    id: 'LINEAR_SQUARE',
    nameKo: '직선 사각',
    nameEn: 'Linear Square',
    description: '가장 기본적인 일렬 배치',
    offsetType: 'NONE',
    baseRotation: 0,
    alternating: false,
    requiresRectangular: false,
    calculateOffset: linearSquareOffset,
  },
  
  DIAMOND: {
    id: 'DIAMOND',
    nameKo: '다이아몬드',
    nameEn: 'Diamond',
    description: '45도 회전 배치',
    offsetType: 'HALF',
    baseRotation: 45,
    alternating: false,
    requiresRectangular: false,
    calculateOffset: diamondOffset,
  },
  
  RUNNING_BOND_SQUARE: {
    id: 'RUNNING_BOND_SQUARE',
    nameKo: '벽돌쌓기 (사각)',
    nameEn: 'Running Bond Square',
    description: '가로 50% 오프셋',
    offsetType: 'HALF',
    baseRotation: 0,
    alternating: false,
    requiresRectangular: false,
    calculateOffset: runningBondSquareOffset,
  },
  
  STACK_BOND: {
    id: 'STACK_BOND',
    nameKo: '스택 본드',
    nameEn: 'Stack Bond',
    description: '수직 정렬 배치',
    offsetType: 'NONE',
    baseRotation: 0,
    alternating: false,
    requiresRectangular: false,
    calculateOffset: stackBondOffset,
  },
  
  VERTICAL_STACK: {
    id: 'VERTICAL_STACK',
    nameKo: '수직 스택',
    nameEn: 'Vertical Stack',
    description: '세로 방향 강조',
    offsetType: 'NONE',
    baseRotation: 90,
    alternating: false,
    requiresRectangular: true,
    calculateOffset: verticalStackOffset,
  },
  
  DIAGONAL_RUNNING: {
    id: 'DIAGONAL_RUNNING',
    nameKo: '대각 러닝',
    nameEn: 'Diagonal Running',
    description: '대각선 방향 오프셋',
    offsetType: 'CUSTOM',
    baseRotation: 0,
    alternating: false,
    requiresRectangular: false,
    calculateOffset: diagonalRunningOffset,
  },
  
  RUNNING_BOND_OFFSET: {
    id: 'RUNNING_BOND_OFFSET',
    nameKo: '러닝 본드 오프셋',
    nameEn: 'Running Bond Offset',
    description: '33% 오프셋 변형',
    offsetType: 'THIRD',
    baseRotation: 0,
    alternating: false,
    requiresRectangular: false,
    calculateOffset: runningBondOffsetPattern,
  },
  
  VERTICAL_RUNNING_BOND: {
    id: 'VERTICAL_RUNNING_BOND',
    nameKo: '수직 러닝 본드',
    nameEn: 'Vertical Running Bond',
    description: '세로 50% 오프셋',
    offsetType: 'HALF',
    baseRotation: 0,
    alternating: false,
    requiresRectangular: false,
    calculateOffset: verticalRunningBondOffset,
  },
  
  VERTICAL_STACK_OFFSET: {
    id: 'VERTICAL_STACK_OFFSET',
    nameKo: '수직 스택 오프셋',
    nameEn: 'Vertical Stack Offset',
    description: '세로 방향 33% 오프셋',
    offsetType: 'THIRD',
    baseRotation: 0,
    alternating: false,
    requiresRectangular: false,
    calculateOffset: verticalStackOffsetPattern,
  },
  
  ONE_THIRD_RUNNING_BOND: {
    id: 'ONE_THIRD_RUNNING_BOND',
    nameKo: '1/3 러닝 본드',
    nameEn: '1/3 Running Bond',
    description: '1/3 간격 반복 패턴',
    offsetType: 'THIRD',
    baseRotation: 0,
    alternating: false,
    requiresRectangular: false,
    calculateOffset: oneThirdRunningBondOffset,
  },
  
  DIAGONAL_RUNNING_POINT: {
    id: 'DIAGONAL_RUNNING_POINT',
    nameKo: '대각 러닝 포인트',
    nameEn: 'Diagonal Running Point',
    description: '대각선 강조 패턴',
    offsetType: 'HALF',
    baseRotation: 0,
    alternating: true,
    requiresRectangular: true,
    calculateOffset: diagonalRunningPointOffset,
  },
  
  TRADITIONAL_RUNNING_BOND: {
    id: 'TRADITIONAL_RUNNING_BOND',
    nameKo: '전통 러닝 본드',
    nameEn: 'Traditional Running Bond',
    description: '클래식 벽돌 패턴',
    offsetType: 'HALF',
    baseRotation: 0,
    alternating: false,
    requiresRectangular: false,
    calculateOffset: traditionalRunningBondOffset,
  },
  
  TRADITIONAL_HERRINGBONE: {
    id: 'TRADITIONAL_HERRINGBONE',
    nameKo: '전통 헤링본',
    nameEn: 'Traditional Herringbone',
    description: 'V자 청어뼈 패턴',
    offsetType: 'CUSTOM',
    baseRotation: 0,
    alternating: true,
    requiresRectangular: true,
    calculateOffset: traditionalHerringboneOffset,
  },
  
  STRAIGHT_HERRINGBONE: {
    id: 'STRAIGHT_HERRINGBONE',
    nameKo: '직선 헤링본',
    nameEn: 'Straight Herringbone',
    description: '90도 헤링본 변형',
    offsetType: 'NONE',
    baseRotation: 0,
    alternating: true,
    requiresRectangular: true,
    calculateOffset: straightHerringboneOffset,
  },
  
  BASKET_WEAVE: {
    id: 'BASKET_WEAVE',
    nameKo: '바스켓 위브',
    nameEn: 'Basket Weave',
    description: '바구니 짜기 패턴',
    offsetType: 'CUSTOM',
    baseRotation: 0,
    alternating: true,
    requiresRectangular: true,
    calculateOffset: basketWeaveOffset,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Pattern Application
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 패턴 적용 옵션
 */
export interface ApplyPatternOptions {
  /** 기존 가시성 유지 여부 */
  preserveVisibility?: boolean;
  
  /** 기존 마스킹 유지 여부 */
  preserveMasking?: boolean;
  
  /** 기존 잠금 상태 유지 여부 */
  preserveLocks?: boolean;
}

/**
 * 그리드에 패턴 적용
 * 
 * ⚠️ NON-DESTRUCTIVE:
 * 원본 그리드를 수정하지 않고 새 그리드를 반환합니다.
 * 
 * @param grid - 원본 타일 그리드
 * @param patternId - 적용할 패턴 ID
 * @param config - 전역 타일 설정
 * @param options - 적용 옵션
 * @returns 패턴이 적용된 새 그리드
 */
export function applyPatternToGrid(
  grid: TileCell[][],
  patternId: PatternId,
  config: GlobalTileConfig,
  options: ApplyPatternOptions = {}
): TileCell[][] {
  const {
    preserveVisibility = true,
    preserveMasking = true,
    preserveLocks = true,
  } = options;
  
  const pattern = PATTERN_REGISTRY[patternId];
  if (!pattern) {
    throw new Error(`Unknown pattern: ${patternId}`);
  }
  
  // 직사각형 타일 검증
  if (pattern.requiresRectangular) {
    const isSquare = config.tileWidth === config.tileHeight;
    if (isSquare) {
      console.warn(
        `패턴 "${pattern.nameKo}"은(는) 직사각형 타일에 최적화되어 있습니다.`
      );
    }
  }
  
  // 새 그리드 생성 (깊은 복사)
  const newGrid: TileCell[][] = [];
  
  for (let row = 0; row < grid.length; row++) {
    const newRow: TileCell[] = [];
    
    for (let col = 0; col < grid[row].length; col++) {
      const originalTile = grid[row][col];
      const { width, height } = getTileDimension(originalTile, config);
      
      // 패턴 오프셋 계산
      const offset = pattern.calculateOffset(
        row,
        col,
        config.tileWidth,
        config.tileHeight,
        config.gap
      );
      
      // 새 위치 계산
      const newPosition: Point = {
        x: addMicro(originalTile.position.x, offset.offsetX),
        y: addMicro(originalTile.position.y, offset.offsetY),
      };
      
      // 새 타일 생성
      const newTile: TileCell = {
        ...originalTile,
        position: newPosition,
        rotation: offset.rotation,
        // 가시성/마스킹/잠금 처리
        visible: preserveVisibility ? originalTile.visible : true,
        maskedBy: preserveMasking ? [...originalTile.maskedBy] : [],
        isLocked: preserveLocks ? originalTile.isLocked : false,
      };
      
      // 차원 교환 (헤링본 등)
      if (offset.swapDimensions && originalTile.type !== 'FULL') {
        // FULL 타일이 아닌 경우에만 크기 교환
        newTile.width = originalTile.height;
        newTile.height = originalTile.width;
      }
      
      newRow.push(newTile);
    }
    
    newGrid.push(newRow);
  }
  
  return newGrid;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Pattern Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 모든 패턴 목록 조회
 */
export function getAllPatterns(): PatternMetadata[] {
  return Object.values(PATTERN_REGISTRY);
}

/**
 * 패턴 ID로 메타데이터 조회
 */
export function getPatternById(patternId: PatternId): PatternMetadata | undefined {
  return PATTERN_REGISTRY[patternId];
}

/**
 * 타일 형태에 적합한 패턴 필터링
 * 
 * @param isSquareTile - 정사각형 타일 여부
 * @returns 적합한 패턴 목록
 */
export function getCompatiblePatterns(isSquareTile: boolean): PatternMetadata[] {
  return getAllPatterns().filter(pattern => {
    // 직사각형 필수 패턴은 정사각형에서 제외 권장
    if (pattern.requiresRectangular && isSquareTile) {
      return false; // 필터링하지 않고 경고만 표시하려면 return true
    }
    return true;
  });
}

/**
 * 패턴 미리보기 데이터 생성
 * 
 * 작은 그리드(4x4)에 패턴을 적용한 결과 반환
 * 썸네일 렌더링용
 * 
 * @param patternId - 패턴 ID
 * @returns 미리보기용 오프셋 배열 (4x4)
 */
export function generatePatternPreview(
  patternId: PatternId
): PatternOffset[][] {
  const pattern = PATTERN_REGISTRY[patternId];
  if (!pattern) return [];
  
  // 미리보기용 기본 크기 (100mm 정사각형 타일)
  const previewTileW = mmToMicro(100);
  const previewTileH = mmToMicro(100);
  const previewGap = mmToMicro(2);
  
  const preview: PatternOffset[][] = [];
  
  for (let row = 0; row < 4; row++) {
    const previewRow: PatternOffset[] = [];
    
    for (let col = 0; col < 4; col++) {
      const offset = pattern.calculateOffset(
        row,
        col,
        previewTileW,
        previewTileH,
        previewGap
      );
      previewRow.push(offset);
    }
    
    preview.push(previewRow);
  }
  
  return preview;
}

/**
 * 패턴 검증
 * 
 * 주어진 시공 조건에서 패턴이 올바르게 작동하는지 검증
 */
export function validatePatternApplication(
  patternId: PatternId,
  config: GlobalTileConfig
): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  const pattern = PATTERN_REGISTRY[patternId];
  if (!pattern) {
    errors.push(`알 수 없는 패턴: ${patternId}`);
    return { isValid: false, warnings, errors };
  }
  
  // 직사각형 타일 검증
  const isSquare = config.tileWidth === config.tileHeight;
  if (pattern.requiresRectangular && isSquare) {
    warnings.push(
      `"${pattern.nameKo}" 패턴은 직사각형 타일(가로≠세로)에 최적화되어 있습니다.`
    );
  }
  
  // 헤링본 패턴 비율 검증
  if (patternId === 'TRADITIONAL_HERRINGBONE' || patternId === 'STRAIGHT_HERRINGBONE') {
    const ratio = config.tileWidth / config.tileHeight;
    if (ratio < 0.4 || ratio > 0.6) {
      // 이상적인 비율: 1:2 또는 2:1
      warnings.push(
        `헤링본 패턴은 1:2 또는 2:1 비율의 타일에서 가장 아름답게 보입니다.`
      );
    }
  }
  
  // 다이아몬드 패턴 정사각형 권장
  if (patternId === 'DIAMOND' && !isSquare) {
    warnings.push(
      `다이아몬드 패턴은 정사각형 타일에서 가장 균형 잡힌 모습을 보입니다.`
    );
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

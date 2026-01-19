/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Masking Layer System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 비파괴 편집 시스템 (Non-Destructive Editing)
 * 
 * ⚠️ CRITICAL ARCHITECTURE DECISION (Code Review 반영):
 * "편집 도구(가위, 도형)는 타일 데이터를 삭제(delete)하는 것이 아니라,
 *  '마스킹 레이어(Masking Layer)'를 씌우는 방식이어야 한다.
 *  도형이 이동하면, 이전 위치의 타일은 다시 visible: true가 되어야 한다."
 * 
 * 핵심 원칙:
 * 1. 타일 데이터는 절대 삭제하지 않음
 * 2. 마스크(Shape)가 타일을 "가릴" 뿐
 * 3. 마스크 제거/이동 시 타일 자동 복원
 * 4. CSG(Constructive Solid Geometry) 개념 적용
 * 
 * Ref: Chapter 5 - 도면 편집 도구
 * Ref: 분석 노트 - "삭제 vs 가리기" 논리적 결함 해결
 */

import {
  MicroMM,
  Point,
  TileCell,
  EditShape,
  ShapeType,
} from '../types';

import {
  mmToMicro,
  microToMM,
  addMicro,
  subtractMicro,
  multiplyMicro,
  checkAABBIntersection,
  isPointInCircle,
  calculatePolygonArea,
} from './math';

import { getTileDimension, GlobalTileConfig } from './tileCalculationService';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Types & Interfaces
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 마스크와 타일의 교차 유형
 */
export type IntersectionType =
  | 'NONE'           // 교차 없음
  | 'FULL'           // 타일 전체가 마스크 내부
  | 'PARTIAL_LEFT'   // 좌측 부분 교차
  | 'PARTIAL_RIGHT'  // 우측 부분 교차
  | 'PARTIAL_TOP'    // 상단 부분 교차
  | 'PARTIAL_BOTTOM' // 하단 부분 교차
  | 'PARTIAL_CORNER' // 코너 부분 교차
  | 'MINIMAL';       // 미세 교차 (5% 미만)

/**
 * 교차 판정 결과
 */
export interface IntersectionResult {
  /** 교차 유형 */
  type: IntersectionType;
  
  /** 교차 면적 비율 (0~1) */
  overlapRatio: number;
  
  /** 교차하지 않는 잔여 영역 (커팅된 타일 생성용) */
  remainingArea?: {
    x: MicroMM;
    y: MicroMM;
    width: MicroMM;
    height: MicroMM;
  };
  
  /** 교차 영역 */
  intersectedArea?: {
    x: MicroMM;
    y: MicroMM;
    width: MicroMM;
    height: MicroMM;
  };
}

/**
 * 마스크 레이어
 */
export interface MaskLayer {
  /** 마스크 ID (= EditShape ID) */
  id: string;
  
  /** 마스크 도형 */
  shape: EditShape;
  
  /** 이 마스크에 의해 가려진 타일 ID 목록 */
  maskedTileIds: Set<string>;
  
  /** 부분 교차 타일 정보 (커팅 정보 포함) */
  partiallyMaskedTiles: Map<string, IntersectionResult>;
  
  /** 마스크 생성 시간 */
  createdAt: Date;
  
  /** 마스크 활성화 여부 */
  isActive: boolean;
  
  /** 표시 이름 (사용자 지정) */
  label?: string;
}

/**
 * 마스킹 시스템 설정
 */
export interface MaskingConfig {
  /** 미세 교차 무시 임계값 (0~1, 기본 0.05 = 5%) */
  minimalIntersectionThreshold: number;
  
  /** 부분 교차 시 타일 커팅 활성화 */
  enablePartialCutting: boolean;
  
  /** 교차 판정 시 Gap 포함 여부 */
  includeGapInIntersection: boolean;
}

/**
 * 기본 설정
 */
const DEFAULT_MASKING_CONFIG: MaskingConfig = {
  minimalIntersectionThreshold: 0.05,
  enablePartialCutting: true,
  includeGapInIntersection: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Intersection Detection Algorithms
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 사각형(Rectangle) 마스크와 타일의 교차 판정
 * 
 * AABB(Axis-Aligned Bounding Box) 교차 검사
 */
export function checkRectangleTileIntersection(
  tile: TileCell,
  tileWidth: MicroMM,
  tileHeight: MicroMM,
  rect: { x: MicroMM; y: MicroMM; width: MicroMM; height: MicroMM },
  config: MaskingConfig = DEFAULT_MASKING_CONFIG
): IntersectionResult {
  // 타일 AABB
  const tileX1 = tile.position.x;
  const tileY1 = tile.position.y;
  const tileX2 = addMicro(tile.position.x, tileWidth);
  const tileY2 = addMicro(tile.position.y, tileHeight);
  
  // 사각형 AABB
  const rectX1 = rect.x;
  const rectY1 = rect.y;
  const rectX2 = addMicro(rect.x, rect.width);
  const rectY2 = addMicro(rect.y, rect.height);
  
  // 교차 영역 계산
  const overlapX1 = Math.max(tileX1, rectX1) as MicroMM;
  const overlapY1 = Math.max(tileY1, rectY1) as MicroMM;
  const overlapX2 = Math.min(tileX2, rectX2) as MicroMM;
  const overlapY2 = Math.min(tileY2, rectY2) as MicroMM;
  
  // 교차 영역이 유효한지 확인
  if (overlapX1 >= overlapX2 || overlapY1 >= overlapY2) {
    return { type: 'NONE', overlapRatio: 0 };
  }
  
  // 교차 면적 계산
  const overlapWidth = subtractMicro(overlapX2, overlapX1);
  const overlapHeight = subtractMicro(overlapY2, overlapY1);
  const overlapArea = multiplyMicro(overlapWidth, overlapHeight);
  const tileArea = multiplyMicro(tileWidth, tileHeight);
  const overlapRatio = overlapArea / tileArea;
  
  // 교차 유형 분류
  let type: IntersectionType;
  
  if (overlapRatio < config.minimalIntersectionThreshold) {
    type = 'MINIMAL';
  } else if (overlapRatio > 0.99) {
    type = 'FULL';
  } else {
    // 부분 교차 방향 판정
    const leftCut = overlapX1 > tileX1;
    const rightCut = overlapX2 < tileX2;
    const topCut = overlapY1 > tileY1;
    const bottomCut = overlapY2 < tileY2;
    
    if ((leftCut || rightCut) && (topCut || bottomCut)) {
      type = 'PARTIAL_CORNER';
    } else if (leftCut) {
      type = 'PARTIAL_LEFT';
    } else if (rightCut) {
      type = 'PARTIAL_RIGHT';
    } else if (topCut) {
      type = 'PARTIAL_TOP';
    } else if (bottomCut) {
      type = 'PARTIAL_BOTTOM';
    } else {
      type = 'FULL';
    }
  }
  
  // 잔여 영역 계산 (부분 교차 시)
  let remainingArea: IntersectionResult['remainingArea'];
  
  if (type !== 'FULL' && type !== 'NONE' && type !== 'MINIMAL') {
    // 가장 큰 잔여 영역 선택 (단순화: 한 방향 기준)
    if (type === 'PARTIAL_LEFT' || type === 'PARTIAL_RIGHT') {
      const remainX = type === 'PARTIAL_LEFT' ? tileX1 : overlapX2;
      const remainWidth = type === 'PARTIAL_LEFT' 
        ? subtractMicro(overlapX1, tileX1)
        : subtractMicro(tileX2, overlapX2);
      
      remainingArea = {
        x: remainX,
        y: tileY1,
        width: remainWidth,
        height: tileHeight,
      };
    } else if (type === 'PARTIAL_TOP' || type === 'PARTIAL_BOTTOM') {
      const remainY = type === 'PARTIAL_TOP' ? tileY1 : overlapY2;
      const remainHeight = type === 'PARTIAL_TOP'
        ? subtractMicro(overlapY1, tileY1)
        : subtractMicro(tileY2, overlapY2);
      
      remainingArea = {
        x: tileX1,
        y: remainY,
        width: tileWidth,
        height: remainHeight,
      };
    }
  }
  
  return {
    type,
    overlapRatio,
    remainingArea,
    intersectedArea: {
      x: overlapX1,
      y: overlapY1,
      width: overlapWidth,
      height: overlapHeight,
    },
  };
}

/**
 * 원형(Circle) 마스크와 타일의 교차 판정
 * 
 * 타일 중심점 기준 + 4 코너 검사로 근사
 */
export function checkCircleTileIntersection(
  tile: TileCell,
  tileWidth: MicroMM,
  tileHeight: MicroMM,
  circle: { cx: MicroMM; cy: MicroMM; radius: MicroMM },
  config: MaskingConfig = DEFAULT_MASKING_CONFIG
): IntersectionResult {
  // 타일 중심점
  const tileCenterX = addMicro(tile.position.x, Math.floor(tileWidth / 2) as MicroMM);
  const tileCenterY = addMicro(tile.position.y, Math.floor(tileHeight / 2) as MicroMM);
  
  // 타일 4 코너
  const corners: Point[] = [
    { x: tile.position.x, y: tile.position.y },
    { x: addMicro(tile.position.x, tileWidth), y: tile.position.y },
    { x: tile.position.x, y: addMicro(tile.position.y, tileHeight) },
    { x: addMicro(tile.position.x, tileWidth), y: addMicro(tile.position.y, tileHeight) },
  ];
  
  // 각 코너가 원 내부에 있는지 검사
  let cornersInside = 0;
  for (const corner of corners) {
    if (isPointInCircle(corner, { x: circle.cx, y: circle.cy }, circle.radius)) {
      cornersInside++;
    }
  }
  
  // 중심점이 원 내부에 있는지 검사
  const centerInside = isPointInCircle(
    { x: tileCenterX, y: tileCenterY },
    { x: circle.cx, y: circle.cy },
    circle.radius
  );
  
  // 교차 판정
  if (cornersInside === 4) {
    return { type: 'FULL', overlapRatio: 1.0 };
  } else if (cornersInside === 0 && !centerInside) {
    // 추가 검사: 원이 타일 내부에 완전히 포함될 수 있음
    // 또는 원의 가장자리가 타일을 관통할 수 있음
    // 여기서는 간략화하여 NONE으로 처리
    // TODO: 더 정밀한 교차 검사 필요 시 원-사각형 교차 알고리즘 적용
    return { type: 'NONE', overlapRatio: 0 };
  } else {
    // 부분 교차: 코너 수로 대략적인 비율 추정
    const approxRatio = (cornersInside + (centerInside ? 1 : 0)) / 5;
    
    if (approxRatio < config.minimalIntersectionThreshold) {
      return { type: 'MINIMAL', overlapRatio: approxRatio };
    }
    
    return { type: 'PARTIAL_CORNER', overlapRatio: approxRatio };
  }
}

/**
 * 다각형(Polygon) 마스크와 타일의 교차 판정
 * 
 * 레이캐스팅 알고리즘으로 점 포함 여부 검사
 */
export function checkPolygonTileIntersection(
  tile: TileCell,
  tileWidth: MicroMM,
  tileHeight: MicroMM,
  polygon: Point[],
  config: MaskingConfig = DEFAULT_MASKING_CONFIG
): IntersectionResult {
  if (polygon.length < 3) {
    return { type: 'NONE', overlapRatio: 0 };
  }
  
  // 타일 4 코너 + 중심
  const tilePoints: Point[] = [
    { x: tile.position.x, y: tile.position.y },
    { x: addMicro(tile.position.x, tileWidth), y: tile.position.y },
    { x: tile.position.x, y: addMicro(tile.position.y, tileHeight) },
    { x: addMicro(tile.position.x, tileWidth), y: addMicro(tile.position.y, tileHeight) },
    { 
      x: addMicro(tile.position.x, Math.floor(tileWidth / 2) as MicroMM),
      y: addMicro(tile.position.y, Math.floor(tileHeight / 2) as MicroMM),
    },
  ];
  
  // 각 점이 다각형 내부에 있는지 검사
  let pointsInside = 0;
  for (const point of tilePoints) {
    if (isPointInPolygon(point, polygon)) {
      pointsInside++;
    }
  }
  
  if (pointsInside === 5) {
    return { type: 'FULL', overlapRatio: 1.0 };
  } else if (pointsInside === 0) {
    return { type: 'NONE', overlapRatio: 0 };
  } else {
    const approxRatio = pointsInside / 5;
    
    if (approxRatio < config.minimalIntersectionThreshold) {
      return { type: 'MINIMAL', overlapRatio: approxRatio };
    }
    
    return { type: 'PARTIAL_CORNER', overlapRatio: approxRatio };
  }
}

/**
 * 점이 다각형 내부에 있는지 검사 (Ray Casting Algorithm)
 */
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  const x = point.x;
  const y = point.y;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) {
      inside = !inside;
    }
  }
  
  return inside;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: MaskingManager Class
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 마스킹 시스템 관리자
 * 
 * 모든 마스크 레이어를 관리하고, 타일과의 교차 관계를 추적합니다.
 * 
 * ⚠️ NON-DESTRUCTIVE:
 * - 타일 데이터는 절대 수정하지 않음
 * - TileCell.visible, TileCell.maskedBy만 업데이트
 * - 마스크 제거 시 자동 복원
 * 
 * @example
 * ```typescript
 * const maskingManager = new MaskingManager(gridData, config);
 * 
 * // 사각형 마스크 추가 (창문)
 * const windowMask = maskingManager.addRectangleMask(
 *   'window_1',
 *   { x: 1000000, y: 500000, width: 500000, height: 800000 },
 *   '욕실 창문'
 * );
 * 
 * // 마스크 이동 → 이전 위치 타일 자동 복원
 * maskingManager.moveShape('window_1', { x: 1500000, y: 500000 });
 * 
 * // 마스크 삭제 → 모든 타일 복원
 * maskingManager.removeMask('window_1');
 * ```
 */
export class MaskingManager {
  // ═══════════════════════════════════════════════════════════════════════
  // Private Properties
  // ═══════════════════════════════════════════════════════════════════════
  
  /** 현재 타일 그리드 */
  private grid: TileCell[][];
  
  /** 전역 타일 설정 */
  private config: GlobalTileConfig;
  
  /** 마스킹 설정 */
  private maskingConfig: MaskingConfig;
  
  /** 활성 마스크 레이어 목록 */
  private masks: Map<string, MaskLayer>;
  
  /** 타일 ID → 마스크 ID 역매핑 (빠른 조회용) */
  private tileToMasks: Map<string, Set<string>>;
  
  /** 변경 콜백 */
  private onChangeCallbacks: ((affectedTileIds: string[]) => void)[];
  
  // ═══════════════════════════════════════════════════════════════════════
  // Constructor
  // ═══════════════════════════════════════════════════════════════════════
  
  constructor(
    grid: TileCell[][],
    config: GlobalTileConfig,
    maskingConfig: Partial<MaskingConfig> = {}
  ) {
    this.grid = grid;
    this.config = config;
    this.maskingConfig = { ...DEFAULT_MASKING_CONFIG, ...maskingConfig };
    this.masks = new Map();
    this.tileToMasks = new Map();
    this.onChangeCallbacks = [];
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Add Mask Methods
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 사각형 마스크 추가
   */
  addRectangleMask(
    id: string,
    rect: { x: MicroMM; y: MicroMM; width: MicroMM; height: MicroMM },
    label?: string
  ): MaskLayer {
    const shape: EditShape = {
      id,
      type: 'RECTANGLE',
      label,
      position: { x: rect.x, y: rect.y },
      rotation: 0 as any,
      width: rect.width,
      height: rect.height,
      strokeWidth: 1,
      strokeColor: '#FF0000',
      fillColor: null,
      affectedTiles: [],
      createdAt: new Date(),
    };
    
    return this.addMask(shape);
  }
  
  /**
   * 원형 마스크 추가
   */
  addCircleMask(
    id: string,
    circle: { cx: MicroMM; cy: MicroMM; radius: MicroMM },
    label?: string
  ): MaskLayer {
    const shape: EditShape = {
      id,
      type: 'CIRCLE',
      label,
      position: { 
        x: subtractMicro(circle.cx, circle.radius),
        y: subtractMicro(circle.cy, circle.radius),
      },
      rotation: 0 as any,
      radius: circle.radius,
      strokeWidth: 1,
      strokeColor: '#FF0000',
      fillColor: null,
      affectedTiles: [],
      createdAt: new Date(),
    };
    
    return this.addMask(shape);
  }
  
  /**
   * 다각형 마스크 추가
   */
  addPolygonMask(
    id: string,
    points: Point[],
    label?: string
  ): MaskLayer {
    if (points.length < 3) {
      throw new Error('다각형은 최소 3개의 점이 필요합니다.');
    }
    
    // 바운딩 박스 계산
    const minX = Math.min(...points.map(p => p.x)) as MicroMM;
    const minY = Math.min(...points.map(p => p.y)) as MicroMM;
    
    const shape: EditShape = {
      id,
      type: 'POLYGON',
      label,
      position: { x: minX, y: minY },
      rotation: 0 as any,
      points,
      strokeWidth: 1,
      strokeColor: '#FF0000',
      fillColor: null,
      affectedTiles: [],
      createdAt: new Date(),
    };
    
    return this.addMask(shape);
  }
  
  /**
   * 일반 마스크 추가 (내부 메서드)
   */
  private addMask(shape: EditShape): MaskLayer {
    // 중복 ID 체크
    if (this.masks.has(shape.id)) {
      throw new Error(`마스크 ID 중복: ${shape.id}`);
    }
    
    // 마스크 레이어 생성
    const maskLayer: MaskLayer = {
      id: shape.id,
      shape,
      maskedTileIds: new Set(),
      partiallyMaskedTiles: new Map(),
      createdAt: new Date(),
      isActive: true,
      label: shape.label,
    };
    
    // 교차하는 타일 찾기 및 마스킹
    const affectedTileIds = this.calculateAndApplyMask(maskLayer);
    
    // 레지스트리에 추가
    this.masks.set(shape.id, maskLayer);
    
    // 콜백 호출
    this.notifyChange(affectedTileIds);
    
    return maskLayer;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Remove & Update Mask Methods
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 마스크 제거 (가려진 타일 자동 복원)
   */
  removeMask(maskId: string): string[] {
    const mask = this.masks.get(maskId);
    if (!mask) return [];
    
    // 마스킹 해제
    const restoredTileIds = this.unmaskTiles(mask);
    
    // 레지스트리에서 제거
    this.masks.delete(maskId);
    
    // 콜백 호출
    this.notifyChange(restoredTileIds);
    
    return restoredTileIds;
  }
  
  /**
   * 마스크 이동
   * 
   * ⚠️ CRITICAL: 이전 위치의 타일은 자동 복원됨
   */
  moveShape(maskId: string, newPosition: Point): string[] {
    const mask = this.masks.get(maskId);
    if (!mask) return [];
    
    // 1. 기존 마스킹 해제
    const previouslyMaskedTiles = this.unmaskTiles(mask);
    
    // 2. 위치 업데이트
    mask.shape.position = { ...newPosition };
    
    // 다각형인 경우 모든 점 이동
    if (mask.shape.type === 'POLYGON' && mask.shape.points) {
      const dx = subtractMicro(newPosition.x, mask.shape.position.x);
      const dy = subtractMicro(newPosition.y, mask.shape.position.y);
      
      mask.shape.points = mask.shape.points.map(p => ({
        x: addMicro(p.x, dx),
        y: addMicro(p.y, dy),
      }));
    }
    
    // 3. 새 위치에서 교차 타일 다시 계산
    const newlyMaskedTiles = this.calculateAndApplyMask(mask);
    
    // 4. 모든 영향받은 타일 병합
    const allAffectedTiles = [
      ...new Set([...previouslyMaskedTiles, ...newlyMaskedTiles]),
    ];
    
    // 콜백 호출
    this.notifyChange(allAffectedTiles);
    
    return allAffectedTiles;
  }
  
  /**
   * 마스크 크기 조절
   */
  resizeShape(
    maskId: string,
    newSize: { width?: MicroMM; height?: MicroMM; radius?: MicroMM }
  ): string[] {
    const mask = this.masks.get(maskId);
    if (!mask) return [];
    
    // 1. 기존 마스킹 해제
    const previouslyMaskedTiles = this.unmaskTiles(mask);
    
    // 2. 크기 업데이트
    if (newSize.width !== undefined) {
      mask.shape.width = newSize.width;
    }
    if (newSize.height !== undefined) {
      mask.shape.height = newSize.height;
    }
    if (newSize.radius !== undefined) {
      mask.shape.radius = newSize.radius;
    }
    
    // 3. 새 크기로 교차 타일 다시 계산
    const newlyMaskedTiles = this.calculateAndApplyMask(mask);
    
    const allAffectedTiles = [
      ...new Set([...previouslyMaskedTiles, ...newlyMaskedTiles]),
    ];
    
    this.notifyChange(allAffectedTiles);
    
    return allAffectedTiles;
  }
  
  /**
   * 마스크 활성화/비활성화 토글
   */
  toggleMaskActive(maskId: string): string[] {
    const mask = this.masks.get(maskId);
    if (!mask) return [];
    
    mask.isActive = !mask.isActive;
    
    if (mask.isActive) {
      // 활성화: 다시 마스킹
      return this.calculateAndApplyMask(mask);
    } else {
      // 비활성화: 마스킹 해제
      return this.unmaskTiles(mask);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Internal Masking Logic
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 마스크와 교차하는 타일 계산 및 마스킹 적용
   */
  private calculateAndApplyMask(mask: MaskLayer): string[] {
    const affectedTileIds: string[] = [];
    
    // 모든 타일 순회
    for (const row of this.grid) {
      for (const tile of row) {
        const { width, height } = getTileDimension(tile, this.config);
        
        // 교차 검사
        const intersection = this.checkIntersection(tile, width, height, mask.shape);
        
        if (intersection.type === 'NONE') {
          continue;
        }
        
        if (intersection.type === 'MINIMAL') {
          // 미세 교차는 무시 (설정에 따라)
          continue;
        }
        
        // 마스킹 적용
        if (intersection.type === 'FULL') {
          // 완전히 가려짐
          tile.visible = false;
          tile.maskedBy.push(mask.id);
          mask.maskedTileIds.add(tile.id);
        } else {
          // 부분 교차
          if (this.maskingConfig.enablePartialCutting) {
            // 부분 교차 정보 저장 (나중에 커팅된 타일 생성 시 사용)
            mask.partiallyMaskedTiles.set(tile.id, intersection);
          }
          
          // 부분 교차도 일단 가림 처리 (옵션에 따라 다르게 처리 가능)
          tile.visible = false;
          tile.maskedBy.push(mask.id);
          mask.maskedTileIds.add(tile.id);
        }
        
        // 역매핑 업데이트
        if (!this.tileToMasks.has(tile.id)) {
          this.tileToMasks.set(tile.id, new Set());
        }
        this.tileToMasks.get(tile.id)!.add(mask.id);
        
        affectedTileIds.push(tile.id);
      }
    }
    
    // shape.affectedTiles 업데이트
    mask.shape.affectedTiles = Array.from(mask.maskedTileIds);
    
    return affectedTileIds;
  }
  
  /**
   * 마스크 해제 (타일 복원)
   */
  private unmaskTiles(mask: MaskLayer): string[] {
    const restoredTileIds: string[] = [];
    
    for (const tileId of mask.maskedTileIds) {
      const tile = this.findTileById(tileId);
      if (!tile) continue;
      
      // maskedBy에서 이 마스크 ID 제거
      tile.maskedBy = tile.maskedBy.filter(id => id !== mask.id);
      
      // 다른 마스크가 없으면 visible = true
      if (tile.maskedBy.length === 0) {
        tile.visible = true;
      }
      
      // 역매핑 업데이트
      const tileMasks = this.tileToMasks.get(tileId);
      if (tileMasks) {
        tileMasks.delete(mask.id);
        if (tileMasks.size === 0) {
          this.tileToMasks.delete(tileId);
        }
      }
      
      restoredTileIds.push(tileId);
    }
    
    // 마스크 상태 초기화
    mask.maskedTileIds.clear();
    mask.partiallyMaskedTiles.clear();
    mask.shape.affectedTiles = [];
    
    return restoredTileIds;
  }
  
  /**
   * 도형 타입에 따른 교차 검사 분기
   */
  private checkIntersection(
    tile: TileCell,
    tileWidth: MicroMM,
    tileHeight: MicroMM,
    shape: EditShape
  ): IntersectionResult {
    switch (shape.type) {
      case 'RECTANGLE':
        return checkRectangleTileIntersection(
          tile,
          tileWidth,
          tileHeight,
          {
            x: shape.position.x,
            y: shape.position.y,
            width: shape.width!,
            height: shape.height!,
          },
          this.maskingConfig
        );
      
      case 'CIRCLE':
        return checkCircleTileIntersection(
          tile,
          tileWidth,
          tileHeight,
          {
            cx: addMicro(shape.position.x, shape.radius!),
            cy: addMicro(shape.position.y, shape.radius!),
            radius: shape.radius!,
          },
          this.maskingConfig
        );
      
      case 'POLYGON':
      case 'HEXAGON':
        return checkPolygonTileIntersection(
          tile,
          tileWidth,
          tileHeight,
          shape.points!,
          this.maskingConfig
        );
      
      case 'LINE':
        // 선은 면적이 없으므로 마스킹 대상 아님
        return { type: 'NONE', overlapRatio: 0 };
      
      default:
        return { type: 'NONE', overlapRatio: 0 };
    }
  }
  
  /**
   * 타일 ID로 타일 찾기
   */
  private findTileById(tileId: string): TileCell | undefined {
    for (const row of this.grid) {
      for (const tile of row) {
        if (tile.id === tileId) {
          return tile;
        }
      }
    }
    return undefined;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Query Methods
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 특정 타일을 가리는 모든 마스크 조회
   */
  getMasksForTile(tileId: string): MaskLayer[] {
    const maskIds = this.tileToMasks.get(tileId);
    if (!maskIds) return [];
    
    return Array.from(maskIds)
      .map(id => this.masks.get(id))
      .filter((m): m is MaskLayer => m !== undefined);
  }
  
  /**
   * 특정 마스크 조회
   */
  getMask(maskId: string): MaskLayer | undefined {
    return this.masks.get(maskId);
  }
  
  /**
   * 모든 마스크 목록 조회
   */
  getAllMasks(): MaskLayer[] {
    return Array.from(this.masks.values());
  }
  
  /**
   * 활성 마스크만 조회
   */
  getActiveMasks(): MaskLayer[] {
    return Array.from(this.masks.values()).filter(m => m.isActive);
  }
  
  /**
   * 가려진 타일 총 개수
   */
  getMaskedTileCount(): number {
    let count = 0;
    for (const row of this.grid) {
      for (const tile of row) {
        if (!tile.visible && tile.maskedBy.length > 0) {
          count++;
        }
      }
    }
    return count;
  }
  
  /**
   * 특정 위치의 마스크 찾기
   */
  getMaskAtPosition(position: Point): MaskLayer | undefined {
    for (const mask of this.masks.values()) {
      // 간단한 바운딩 박스 검사
      const shape = mask.shape;
      
      if (shape.type === 'RECTANGLE') {
        if (
          position.x >= shape.position.x &&
          position.x <= addMicro(shape.position.x, shape.width!) &&
          position.y >= shape.position.y &&
          position.y <= addMicro(shape.position.y, shape.height!)
        ) {
          return mask;
        }
      }
      
      // 다른 도형 타입도 필요시 추가
    }
    return undefined;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Event Handling
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 변경 콜백 등록
   */
  onChange(callback: (affectedTileIds: string[]) => void): void {
    this.onChangeCallbacks.push(callback);
  }
  
  /**
   * 콜백 해제
   */
  offChange(callback: (affectedTileIds: string[]) => void): void {
    const index = this.onChangeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onChangeCallbacks.splice(index, 1);
    }
  }
  
  /**
   * 변경 알림
   */
  private notifyChange(affectedTileIds: string[]): void {
    for (const callback of this.onChangeCallbacks) {
      try {
        callback(affectedTileIds);
      } catch (error) {
        console.error('Masking change callback error:', error);
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Serialization
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 현재 마스크 상태 내보내기
   */
  exportMasks(): EditShape[] {
    return Array.from(this.masks.values()).map(m => m.shape);
  }
  
  /**
   * 마스크 상태 가져오기
   */
  importMasks(shapes: EditShape[]): void {
    for (const shape of shapes) {
      this.addMask(shape);
    }
  }
  
  /**
   * 모든 마스크 제거
   */
  clearAllMasks(): string[] {
    const allAffectedTiles: string[] = [];
    
    for (const maskId of Array.from(this.masks.keys())) {
      const restoredTiles = this.removeMask(maskId);
      allAffectedTiles.push(...restoredTiles);
    }
    
    return [...new Set(allAffectedTiles)];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Factory Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 마스킹 매니저 생성 팩토리
 */
export function createMaskingManager(
  grid: TileCell[][],
  config: GlobalTileConfig,
  maskingConfig?: Partial<MaskingConfig>
): MaskingManager {
  return new MaskingManager(grid, config, maskingConfig);
}

/**
 * 교차 판정 유틸리티 (독립 사용)
 */
export function checkShapeTileIntersection(
  tile: TileCell,
  tileWidth: MicroMM,
  tileHeight: MicroMM,
  shape: EditShape,
  config?: MaskingConfig
): IntersectionResult {
  const maskingConfig = config || DEFAULT_MASKING_CONFIG;
  
  switch (shape.type) {
    case 'RECTANGLE':
      return checkRectangleTileIntersection(
        tile, tileWidth, tileHeight,
        { x: shape.position.x, y: shape.position.y, width: shape.width!, height: shape.height! },
        maskingConfig
      );
    
    case 'CIRCLE':
      return checkCircleTileIntersection(
        tile, tileWidth, tileHeight,
        { cx: addMicro(shape.position.x, shape.radius!), cy: addMicro(shape.position.y, shape.radius!), radius: shape.radius! },
        maskingConfig
      );
    
    case 'POLYGON':
      return checkPolygonTileIntersection(
        tile, tileWidth, tileHeight,
        shape.points!,
        maskingConfig
      );
    
    default:
      return { type: 'NONE', overlapRatio: 0 };
  }
}

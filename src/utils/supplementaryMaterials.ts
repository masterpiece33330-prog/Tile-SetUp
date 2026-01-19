/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Chapter 9: 특수 기능 (시공 보조 도구)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 원본 기획안 3페이지:
 * - "8: 조인트지, 실리콘관 (타일이 떨어지는 현상방지)"
 * - "9: Angle - 타일의 세로면이 만나는곳사용 (기둥, 코너) 그룹으로 틴 앵글"
 * 
 * 기능:
 * 1. 조인트지 - 타일 접합부 강화, 총 길이 및 롤 수량 계산
 * 2. 실리콘 - 방수/접착 구간 표시, 튜브 수량 계산
 * 3. 앵글 - 코너/기둥 마감재, 자동 감지 및 배치
 * 
 * 핵심 원칙:
 * - 모든 연산은 MicroMM (정수) 단위로 수행
 * - 물량 산출은 실제 시공 기준 반영 (여유분 포함)
 * 
 * Ref: TILE-SPEC-2026-003, Chapter 9
 */

import {
  MicroMM,
  Point,
  TileCell,
  EditShape,
} from '../types';

import {
  mmToMicro,
  microToMM,
  addMicro,
  subtractMicro,
  multiplyMicro,
  divideMicro,
  microSqrt,
} from './math';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Types & Interfaces
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 조인트지(Joint Tape) 데이터
 */
export interface JointTapeConfig {
  /** 활성화 여부 */
  enabled: boolean;
  /** 롤당 길이 (기본: 10m = 10,000mm) */
  rollLengthMM: number;
  /** 여유율 (기본: 10% = 1.1) */
  marginRate: number;
}

export interface JointTapeResult {
  /** 총 필요 길이 (mm) */
  totalLengthMM: number;
  /** 총 필요 길이 (m) */
  totalLengthM: number;
  /** 필요 롤 수 */
  rollsNeeded: number;
  /** 가로 줄눈 총 길이 */
  horizontalLengthMM: number;
  /** 세로 줄눈 총 길이 */
  verticalLengthMM: number;
}

/**
 * 실리콘(Silicone) 세그먼트
 */
export interface SiliconeSegment {
  id: string;
  /** 시작점 */
  startPoint: Point;
  /** 끝점 */
  endPoint: Point;
  /** 길이 (MicroMM) */
  length: MicroMM;
  /** 위치 유형 */
  location: SiliconeLocation;
  /** 사용자 라벨 */
  label?: string;
}

export type SiliconeLocation = 
  | 'FLOOR_WALL'      // 바닥-벽 경계
  | 'AROUND_WINDOW'   // 창문 주변
  | 'AROUND_DOOR'     // 문 주변
  | 'CORNER'          // 코너
  | 'CUSTOM';         // 사용자 지정

export interface SiliconeConfig {
  /** 활성화 여부 */
  enabled: boolean;
  /** 튜브당 시공 가능 길이 (기본: 10m = 10,000mm, 300ml 튜브 기준) */
  tubeCoverageMM: number;
  /** 여유율 (기본: 15% = 1.15, 실리콘은 낭비가 많음) */
  marginRate: number;
}

export interface SiliconeResult {
  /** 세그먼트 목록 */
  segments: SiliconeSegment[];
  /** 총 길이 (mm) */
  totalLengthMM: number;
  /** 총 길이 (m) */
  totalLengthM: number;
  /** 필요 튜브 수 */
  tubesNeeded: number;
  /** 위치별 길이 요약 */
  lengthByLocation: Record<SiliconeLocation, number>;
}

/**
 * 앵글(Angle) 배치
 */
export interface AnglePlacement {
  id: string;
  /** 앵글 타입 */
  type: AngleType;
  /** 배치 위치 (3D 좌표) */
  position: { x: MicroMM; y: MicroMM; z?: MicroMM };
  /** 길이/높이 (MicroMM) */
  length: MicroMM;
  /** 관련 벽면 ID */
  wallIds?: string[];
  /** 재질 */
  material: AngleMaterial;
  /** 사용자 라벨 */
  label?: string;
}

export type AngleType = 
  | 'EXTERNAL'  // 외부 코너 (90° 돌출)
  | 'INTERNAL'  // 내부 코너 (90° 함몰)
  | 'PILLAR'    // 기둥 (4면)
  | 'STRAIGHT'; // 직선 마감

export type AngleMaterial = 
  | 'ALUMINUM'   // 알루미늄
  | 'PVC'        // PVC
  | 'STAINLESS'; // 스테인리스

export interface AngleConfig {
  /** 활성화 여부 */
  enabled: boolean;
  /** 기본 재질 */
  defaultMaterial: AngleMaterial;
  /** 앵글 1개당 길이 (기본: 2.4m = 2,400mm) */
  unitLengthMM: number;
  /** 자동 코너 감지 사용 */
  autoDetectCorners: boolean;
}

export interface AngleResult {
  /** 배치 목록 */
  placements: AnglePlacement[];
  /** 타입별 수량 */
  countByType: Record<AngleType, number>;
  /** 재질별 수량 */
  countByMaterial: Record<AngleMaterial, number>;
  /** 총 필요 개수 */
  totalCount: number;
  /** 총 길이 (mm) */
  totalLengthMM: number;
}

/**
 * 부자재 전체 결과
 */
export interface SupplementaryMaterialsResult {
  jointTape: JointTapeResult;
  silicone: SiliconeResult;
  angles: AngleResult;
  /** 계산 시점 */
  calculatedAt: Date;
}

/**
 * 3D 룸 구조 (앵글 자동 감지용)
 */
export interface Room3D {
  width: MicroMM;   // X축
  depth: MicroMM;   // Z축
  height: MicroMM;  // Y축
  walls: Wall3D[];
}

export interface Wall3D {
  id: string;
  /** 벽 번호 (1~4) */
  number: 1 | 2 | 3 | 4;
  /** 시작점 */
  start: Point;
  /** 끝점 */
  end: Point;
  /** 높이 */
  height: MicroMM;
  /** 타일 적용 여부 */
  hasTiles: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Default Configurations
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_JOINT_TAPE_CONFIG: JointTapeConfig = {
  enabled: true,
  rollLengthMM: 10000,  // 10m/롤
  marginRate: 1.1,       // 10% 여유
};

export const DEFAULT_SILICONE_CONFIG: SiliconeConfig = {
  enabled: true,
  tubeCoverageMM: 10000,  // 10m/튜브 (300ml 기준)
  marginRate: 1.15,        // 15% 여유 (낭비 고려)
};

export const DEFAULT_ANGLE_CONFIG: AngleConfig = {
  enabled: true,
  defaultMaterial: 'ALUMINUM',
  unitLengthMM: 2400,  // 2.4m/개
  autoDetectCorners: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: Joint Tape Calculator (조인트지 계산)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 조인트지 총 길이 계산
 * 
 * 원본 명세서 9.2.1 기준:
 * - 가로 줄눈: 행 사이의 모든 수평선
 * - 세로 줄눈: 열 사이의 모든 수직선
 * 
 * @param grid - 타일 그리드
 * @param gapSize - 줄눈 크기 (MicroMM)
 * @param config - 조인트지 설정
 */
export function calculateJointTapeQuantity(
  grid: TileCell[][],
  gapSize: MicroMM,
  config: JointTapeConfig = DEFAULT_JOINT_TAPE_CONFIG
): JointTapeResult {
  if (!config.enabled || grid.length === 0) {
    return {
      totalLengthMM: 0,
      totalLengthM: 0,
      rollsNeeded: 0,
      horizontalLengthMM: 0,
      verticalLengthMM: 0,
    };
  }

  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  let horizontalTotal: MicroMM = 0 as MicroMM;
  let verticalTotal: MicroMM = 0 as MicroMM;

  // 가로 줄눈 계산 (행 사이, rows-1 개의 수평선)
  for (let r = 0; r < rows - 1; r++) {
    let rowWidth: MicroMM = 0 as MicroMM;
    
    for (const tile of grid[r]) {
      // 마스킹되지 않은 타일만 계산
      if (tile.visible && !tile.isMasked) {
        rowWidth = addMicro(rowWidth, tile.width);
      }
    }
    
    horizontalTotal = addMicro(horizontalTotal, rowWidth);
  }

  // 세로 줄눈 계산 (열 사이, cols-1 개의 수직선)
  for (let c = 0; c < cols - 1; c++) {
    let colHeight: MicroMM = 0 as MicroMM;
    
    for (let r = 0; r < rows; r++) {
      const tile = grid[r]?.[c];
      if (tile && tile.visible && !tile.isMasked) {
        colHeight = addMicro(colHeight, tile.height);
      }
    }
    
    verticalTotal = addMicro(verticalTotal, colHeight);
  }

  // MicroMM → mm 변환
  const horizontalMM = microToMM(horizontalTotal);
  const verticalMM = microToMM(verticalTotal);
  const totalMM = (horizontalMM + verticalMM) * config.marginRate;

  // 필요 롤 수 (올림)
  const rollsNeeded = Math.ceil(totalMM / config.rollLengthMM);

  return {
    totalLengthMM: Math.round(totalMM),
    totalLengthM: Math.round(totalMM / 100) / 10,  // 소수점 1자리
    rollsNeeded,
    horizontalLengthMM: Math.round(horizontalMM),
    verticalLengthMM: Math.round(verticalMM),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Silicone Calculator (실리콘 계산)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 실리콘 세그먼트 생성
 */
export function createSiliconeSegment(
  id: string,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  location: SiliconeLocation,
  label?: string
): SiliconeSegment {
  const startPoint: Point = {
    x: mmToMicro(startX) as MicroMM,
    y: mmToMicro(startY) as MicroMM,
  };
  
  const endPoint: Point = {
    x: mmToMicro(endX) as MicroMM,
    y: mmToMicro(endY) as MicroMM,
  };

  // 거리 계산 (피타고라스)
  const dx = subtractMicro(endPoint.x, startPoint.x);
  const dy = subtractMicro(endPoint.y, startPoint.y);
  const dxSquared = multiplyMicro(dx, dx);
  const dySquared = multiplyMicro(dy, dy);
  const sumSquared = addMicro(dxSquared, dySquared);
  const length = microSqrt(sumSquared);

  return {
    id,
    startPoint,
    endPoint,
    length,
    location,
    label,
  };
}

/**
 * 바닥-벽 경계 실리콘 자동 생성
 * 
 * 방의 둘레를 따라 실리콘 라인 생성
 */
export function generateFloorWallSilicone(
  roomWidth: number,  // mm
  roomDepth: number,  // mm
  excludeAreas?: { start: number; end: number; wall: 1 | 2 | 3 | 4 }[]
): SiliconeSegment[] {
  const segments: SiliconeSegment[] = [];
  
  // 벽 1 (정면, Z=0, X: 0→width)
  segments.push(createSiliconeSegment(
    'silicone_floor_wall1',
    0, 0,
    roomWidth, 0,
    'FLOOR_WALL',
    '바닥-1번벽 경계'
  ));

  // 벽 2 (좌측, X=0, Z: 0→depth)
  segments.push(createSiliconeSegment(
    'silicone_floor_wall2',
    0, 0,
    0, roomDepth,
    'FLOOR_WALL',
    '바닥-2번벽 경계'
  ));

  // 벽 3 (우측, X=width, Z: 0→depth)
  segments.push(createSiliconeSegment(
    'silicone_floor_wall3',
    roomWidth, 0,
    roomWidth, roomDepth,
    'FLOOR_WALL',
    '바닥-3번벽 경계'
  ));

  // 벽 4 (후면, Z=depth, X: 0→width)
  segments.push(createSiliconeSegment(
    'silicone_floor_wall4',
    0, roomDepth,
    roomWidth, roomDepth,
    'FLOOR_WALL',
    '바닥-4번벽 경계'
  ));

  return segments;
}

/**
 * 마스크(창문/문) 주변 실리콘 자동 생성
 */
export function generateMaskPerimeterSilicone(
  masks: EditShape[]
): SiliconeSegment[] {
  const segments: SiliconeSegment[] = [];

  for (const mask of masks) {
    if (mask.type === 'RECTANGLE' && mask.width && mask.height) {
      const x = microToMM(mask.position.x);
      const y = microToMM(mask.position.y);
      const w = microToMM(mask.width);
      const h = microToMM(mask.height);

      const location: SiliconeLocation = 
        mask.label?.includes('창문') || mask.label?.includes('window') 
          ? 'AROUND_WINDOW' 
          : mask.label?.includes('문') || mask.label?.includes('door')
            ? 'AROUND_DOOR'
            : 'CUSTOM';

      // 4변 실리콘
      segments.push(
        createSiliconeSegment(`silicone_${mask.id}_top`, x, y, x + w, y, location),
        createSiliconeSegment(`silicone_${mask.id}_right`, x + w, y, x + w, y + h, location),
        createSiliconeSegment(`silicone_${mask.id}_bottom`, x, y + h, x + w, y + h, location),
        createSiliconeSegment(`silicone_${mask.id}_left`, x, y, x, y + h, location)
      );
    } else if (mask.type === 'CIRCLE' && mask.radius) {
      // 원형은 둘레로 계산 (근사값)
      const cx = microToMM(mask.position.x);
      const cy = microToMM(mask.position.y);
      const r = microToMM(mask.radius);
      const circumference = 2 * Math.PI * r;

      segments.push({
        id: `silicone_${mask.id}_circle`,
        startPoint: { x: mmToMicro(cx) as MicroMM, y: mmToMicro(cy) as MicroMM },
        endPoint: { x: mmToMicro(cx) as MicroMM, y: mmToMicro(cy) as MicroMM },
        length: mmToMicro(circumference) as MicroMM,
        location: 'CUSTOM',
        label: `${mask.label || '원형'} 둘레`,
      });
    }
  }

  return segments;
}

/**
 * 실리콘 총량 계산
 */
export function calculateSiliconeQuantity(
  segments: SiliconeSegment[],
  config: SiliconeConfig = DEFAULT_SILICONE_CONFIG
): SiliconeResult {
  if (!config.enabled || segments.length === 0) {
    return {
      segments: [],
      totalLengthMM: 0,
      totalLengthM: 0,
      tubesNeeded: 0,
      lengthByLocation: {
        FLOOR_WALL: 0,
        AROUND_WINDOW: 0,
        AROUND_DOOR: 0,
        CORNER: 0,
        CUSTOM: 0,
      },
    };
  }

  const lengthByLocation: Record<SiliconeLocation, number> = {
    FLOOR_WALL: 0,
    AROUND_WINDOW: 0,
    AROUND_DOOR: 0,
    CORNER: 0,
    CUSTOM: 0,
  };

  let totalMicro: MicroMM = 0 as MicroMM;

  for (const seg of segments) {
    totalMicro = addMicro(totalMicro, seg.length);
    lengthByLocation[seg.location] += microToMM(seg.length);
  }

  const totalMM = microToMM(totalMicro) * config.marginRate;
  const tubesNeeded = Math.ceil(totalMM / config.tubeCoverageMM);

  return {
    segments,
    totalLengthMM: Math.round(totalMM),
    totalLengthM: Math.round(totalMM / 100) / 10,
    tubesNeeded,
    lengthByLocation,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Angle Calculator (앵글 계산)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 앵글 배치 생성
 */
export function createAnglePlacement(
  id: string,
  type: AngleType,
  x: number,
  y: number,
  lengthMM: number,
  material: AngleMaterial = 'ALUMINUM',
  wallIds?: string[],
  label?: string
): AnglePlacement {
  return {
    id,
    type,
    position: {
      x: mmToMicro(x) as MicroMM,
      y: mmToMicro(y) as MicroMM,
    },
    length: mmToMicro(lengthMM) as MicroMM,
    wallIds,
    material,
    label,
  };
}

/**
 * 코너 자동 감지 및 앵글 배치
 * 
 * 원본 명세서 9.2.2:
 * - 인접한 두 벽면이 만나는 지점 찾기
 * - 볼록(External) / 오목(Internal) 판정
 */
export function detectCornersAndGenerateAngles(
  room: Room3D,
  config: AngleConfig = DEFAULT_ANGLE_CONFIG
): AnglePlacement[] {
  if (!config.autoDetectCorners) {
    return [];
  }

  const placements: AnglePlacement[] = [];
  const heightMM = microToMM(room.height);

  // 벽 쌍 정의 (인접한 벽들)
  const wallPairs: [1 | 2 | 3 | 4, 1 | 2 | 3 | 4, boolean][] = [
    [1, 2, true],   // 1번벽-2번벽 코너 (외부)
    [2, 4, true],   // 2번벽-4번벽 코너 (외부)
    [4, 3, true],   // 4번벽-3번벽 코너 (외부)
    [3, 1, true],   // 3번벽-1번벽 코너 (외부)
  ];

  const roomWidthMM = microToMM(room.width);
  const roomDepthMM = microToMM(room.depth);

  // 코너 위치 계산
  const cornerPositions: { id: string; x: number; y: number; walls: string[] }[] = [
    { id: 'corner_1_2', x: 0, y: 0, walls: ['wall_1', 'wall_2'] },
    { id: 'corner_2_4', x: 0, y: roomDepthMM, walls: ['wall_2', 'wall_4'] },
    { id: 'corner_4_3', x: roomWidthMM, y: roomDepthMM, walls: ['wall_4', 'wall_3'] },
    { id: 'corner_3_1', x: roomWidthMM, y: 0, walls: ['wall_3', 'wall_1'] },
  ];

  for (const corner of cornerPositions) {
    placements.push(createAnglePlacement(
      `angle_${corner.id}`,
      'EXTERNAL',  // 방 내부에서 볼 때 외부 코너
      corner.x,
      corner.y,
      heightMM,
      config.defaultMaterial,
      corner.walls,
      `${corner.walls.join('-')} 코너`
    ));
  }

  return placements;
}

/**
 * 기둥 앵글 생성
 * 
 * 사각 기둥의 4면 모서리에 앵글 배치
 */
export function generatePillarAngles(
  pillarId: string,
  x: number,
  y: number,
  width: number,
  depth: number,
  height: number,
  material: AngleMaterial = 'ALUMINUM'
): AnglePlacement[] {
  return [
    createAnglePlacement(
      `${pillarId}_corner1`,
      'EXTERNAL',
      x, y, height, material,
      undefined,
      `기둥 ${pillarId} 코너1`
    ),
    createAnglePlacement(
      `${pillarId}_corner2`,
      'EXTERNAL',
      x + width, y, height, material,
      undefined,
      `기둥 ${pillarId} 코너2`
    ),
    createAnglePlacement(
      `${pillarId}_corner3`,
      'EXTERNAL',
      x + width, y + depth, height, material,
      undefined,
      `기둥 ${pillarId} 코너3`
    ),
    createAnglePlacement(
      `${pillarId}_corner4`,
      'EXTERNAL',
      x, y + depth, height, material,
      undefined,
      `기둥 ${pillarId} 코너4`
    ),
  ];
}

/**
 * 앵글 총량 계산
 */
export function calculateAngleQuantity(
  placements: AnglePlacement[],
  config: AngleConfig = DEFAULT_ANGLE_CONFIG
): AngleResult {
  if (!config.enabled || placements.length === 0) {
    return {
      placements: [],
      countByType: { EXTERNAL: 0, INTERNAL: 0, PILLAR: 0, STRAIGHT: 0 },
      countByMaterial: { ALUMINUM: 0, PVC: 0, STAINLESS: 0 },
      totalCount: 0,
      totalLengthMM: 0,
    };
  }

  const countByType: Record<AngleType, number> = {
    EXTERNAL: 0,
    INTERNAL: 0,
    PILLAR: 0,
    STRAIGHT: 0,
  };

  const countByMaterial: Record<AngleMaterial, number> = {
    ALUMINUM: 0,
    PVC: 0,
    STAINLESS: 0,
  };

  let totalLengthMicro: MicroMM = 0 as MicroMM;

  for (const p of placements) {
    countByType[p.type]++;
    countByMaterial[p.material]++;
    totalLengthMicro = addMicro(totalLengthMicro, p.length);
  }

  // 필요 앵글 개수 (개별 앵글 길이 기준으로 계산)
  const totalLengthMM = microToMM(totalLengthMicro);
  const totalCount = Math.ceil(totalLengthMM / config.unitLengthMM);

  return {
    placements,
    countByType,
    countByMaterial,
    totalCount,
    totalLengthMM: Math.round(totalLengthMM),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Supplementary Materials Manager
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 부자재 관리자 인터페이스
 */
export interface SupplementaryMaterialsManager {
  // 설정
  setJointTapeConfig: (config: Partial<JointTapeConfig>) => void;
  setSiliconeConfig: (config: Partial<SiliconeConfig>) => void;
  setAngleConfig: (config: Partial<AngleConfig>) => void;

  // 실리콘 세그먼트 관리
  addSiliconeSegment: (segment: SiliconeSegment) => void;
  removeSiliconeSegment: (id: string) => void;
  getSiliconeSegments: () => SiliconeSegment[];

  // 앵글 배치 관리
  addAnglePlacement: (placement: AnglePlacement) => void;
  removeAnglePlacement: (id: string) => void;
  getAnglePlacements: () => AnglePlacement[];

  // 자동 생성
  autoGenerateFloorWallSilicone: (roomWidth: number, roomDepth: number) => void;
  autoGenerateMaskSilicone: (masks: EditShape[]) => void;
  autoDetectAndGenerateAngles: (room: Room3D) => void;

  // 계산
  calculateAll: (grid: TileCell[][], gapSize: MicroMM) => SupplementaryMaterialsResult;

  // 내보내기
  exportSummary: () => MaterialsSummary;
}

/**
 * 물량표 요약
 */
export interface MaterialsSummary {
  items: MaterialsSummaryItem[];
  totalItems: number;
}

export interface MaterialsSummaryItem {
  category: '조인트지' | '실리콘' | '앵글';
  name: string;
  quantity: number;
  unit: string;
  note?: string;
}

/**
 * 부자재 관리자 생성
 */
export function createSupplementaryMaterialsManager(): SupplementaryMaterialsManager {
  // 내부 상태
  let jointTapeConfig = { ...DEFAULT_JOINT_TAPE_CONFIG };
  let siliconeConfig = { ...DEFAULT_SILICONE_CONFIG };
  let angleConfig = { ...DEFAULT_ANGLE_CONFIG };

  let siliconeSegments: SiliconeSegment[] = [];
  let anglePlacements: AnglePlacement[] = [];

  return {
    // 설정
    setJointTapeConfig: (config) => {
      jointTapeConfig = { ...jointTapeConfig, ...config };
    },

    setSiliconeConfig: (config) => {
      siliconeConfig = { ...siliconeConfig, ...config };
    },

    setAngleConfig: (config) => {
      angleConfig = { ...angleConfig, ...config };
    },

    // 실리콘 세그먼트 관리
    addSiliconeSegment: (segment) => {
      // 중복 체크
      if (!siliconeSegments.find(s => s.id === segment.id)) {
        siliconeSegments.push(segment);
      }
    },

    removeSiliconeSegment: (id) => {
      siliconeSegments = siliconeSegments.filter(s => s.id !== id);
    },

    getSiliconeSegments: () => [...siliconeSegments],

    // 앵글 배치 관리
    addAnglePlacement: (placement) => {
      if (!anglePlacements.find(p => p.id === placement.id)) {
        anglePlacements.push(placement);
      }
    },

    removeAnglePlacement: (id) => {
      anglePlacements = anglePlacements.filter(p => p.id !== id);
    },

    getAnglePlacements: () => [...anglePlacements],

    // 자동 생성
    autoGenerateFloorWallSilicone: (roomWidth, roomDepth) => {
      const generated = generateFloorWallSilicone(roomWidth, roomDepth);
      for (const seg of generated) {
        if (!siliconeSegments.find(s => s.id === seg.id)) {
          siliconeSegments.push(seg);
        }
      }
    },

    autoGenerateMaskSilicone: (masks) => {
      const generated = generateMaskPerimeterSilicone(masks);
      for (const seg of generated) {
        if (!siliconeSegments.find(s => s.id === seg.id)) {
          siliconeSegments.push(seg);
        }
      }
    },

    autoDetectAndGenerateAngles: (room) => {
      const generated = detectCornersAndGenerateAngles(room, angleConfig);
      for (const placement of generated) {
        if (!anglePlacements.find(p => p.id === placement.id)) {
          anglePlacements.push(placement);
        }
      }
    },

    // 전체 계산
    calculateAll: (grid, gapSize) => {
      const jointTape = calculateJointTapeQuantity(grid, gapSize, jointTapeConfig);
      const silicone = calculateSiliconeQuantity(siliconeSegments, siliconeConfig);
      const angles = calculateAngleQuantity(anglePlacements, angleConfig);

      return {
        jointTape,
        silicone,
        angles,
        calculatedAt: new Date(),
      };
    },

    // 물량표 요약 내보내기
    exportSummary: () => {
      const items: MaterialsSummaryItem[] = [];

      // 조인트지 (임시 - 실제 계산은 calculateAll에서)
      items.push({
        category: '조인트지',
        name: '조인트지',
        quantity: 0, // calculateAll 호출 시 업데이트 필요
        unit: '롤',
        note: `${jointTapeConfig.rollLengthMM / 1000}m/롤`,
      });

      // 실리콘
      items.push({
        category: '실리콘',
        name: '실리콘',
        quantity: 0,
        unit: '튜브',
        note: `300ml/튜브, ${siliconeConfig.tubeCoverageMM / 1000}m 시공`,
      });

      // 앵글 (타입별)
      const angleTypes: AngleType[] = ['EXTERNAL', 'INTERNAL', 'PILLAR', 'STRAIGHT'];
      const angleTypeNames: Record<AngleType, string> = {
        EXTERNAL: '외부 코너 앵글',
        INTERNAL: '내부 코너 앵글',
        PILLAR: '기둥 앵글',
        STRAIGHT: '직선 앵글',
      };

      for (const type of angleTypes) {
        const count = anglePlacements.filter(p => p.type === type).length;
        if (count > 0) {
          items.push({
            category: '앵글',
            name: angleTypeNames[type],
            quantity: count,
            unit: '개',
            note: `${angleConfig.unitLengthMM / 1000}m/개, ${angleConfig.defaultMaterial}`,
          });
        }
      }

      return {
        items,
        totalItems: items.length,
      };
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: Edge Case Defense (엣지 케이스 방어)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 앵글 배치 유효성 검증
 */
export function validateAnglePlacement(
  placement: AnglePlacement,
  existingPlacements: AnglePlacement[]
): { valid: boolean; error?: string } {
  // 중복 위치 체크
  const duplicate = existingPlacements.find(p => 
    p.id !== placement.id &&
    p.position.x === placement.position.x &&
    p.position.y === placement.position.y
  );

  if (duplicate) {
    return {
      valid: false,
      error: `같은 위치에 앵글이 이미 있습니다: ${duplicate.label || duplicate.id}`,
    };
  }

  // 길이 검증
  if (microToMM(placement.length) <= 0) {
    return {
      valid: false,
      error: '앵글 길이는 0보다 커야 합니다',
    };
  }

  // 최대 길이 제한 (10m)
  if (microToMM(placement.length) > 10000) {
    return {
      valid: false,
      error: '앵글 길이가 최대값(10m)을 초과합니다',
    };
  }

  return { valid: true };
}

/**
 * 실리콘 세그먼트 유효성 검증
 */
export function validateSiliconeSegment(
  segment: SiliconeSegment
): { valid: boolean; error?: string } {
  // 시작점 = 끝점 (길이 0)
  if (
    segment.startPoint.x === segment.endPoint.x &&
    segment.startPoint.y === segment.endPoint.y &&
    segment.location !== 'CUSTOM'  // 원형은 예외
  ) {
    return {
      valid: false,
      error: '실리콘 세그먼트의 시작점과 끝점이 같습니다',
    };
  }

  // 길이 검증
  if (microToMM(segment.length) <= 0) {
    return {
      valid: false,
      error: '실리콘 길이는 0보다 커야 합니다',
    };
  }

  return { valid: true };
}

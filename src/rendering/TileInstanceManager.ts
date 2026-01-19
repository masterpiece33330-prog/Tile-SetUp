/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - 3D Tile Instance Manager
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Three.js InstancedMesh를 위한 통합 버퍼 관리자
 * 
 * ⚠️ CRITICAL PERFORMANCE OPTIMIZATION:
 * - 개별 Float32Array 객체 생성 금지
 * - 하나의 거대한 pre-allocated 버퍼 사용
 * - 인덱스 기반 접근으로 GC 부하 최소화
 * - 타일 10,000개 기준 Draw Call 1~5회 유지
 * 
 * Ref: Chapter 4 - 3D 뷰 시스템
 * Ref: Code Review - 렌더링용 변환 행렬 오버헤드 해결
 */

import {
  MicroMM,
  Point,
  Vector3,
  Degree,
  TileCell,
  TileInstanceBuffer,
  InstanceBufferUpdate,
  LODLevel,
  SurfaceId,
} from '../types';

import {
  mmToMicro,
  microToMM,
  degreeToRadian,
} from './math';

import {
  getTileDimension,
  GlobalTileConfig,
} from './tileCalculationService';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Constants & Configuration
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 렌더링 스케일: MicroMM → Three.js 단위 변환
 * 1 MicroMM = 0.000001 Three.js 단위 (1mm = 0.001 단위)
 */
const RENDER_SCALE = 0.000001;

/**
 * 기본 타일 색상 (RGBA, 0~1 범위)
 */
const DEFAULT_TILE_COLOR: [number, number, number, number] = [0.9, 0.9, 0.85, 1.0];

/**
 * 숨겨진 타일의 스케일 (0으로 축소하여 비가시화)
 */
const HIDDEN_SCALE = 0.0001;

/**
 * 매트릭스 요소 수 (4x4 = 16)
 */
const MATRIX_SIZE = 16;

/**
 * 색상 요소 수 (RGBA = 4)
 */
const COLOR_SIZE = 4;

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Matrix Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 단위 행렬을 버퍼의 특정 위치에 설정
 * 
 * @param buffer - 대상 Float32Array
 * @param offset - 시작 인덱스 (instanceIndex * 16)
 */
function setIdentityMatrix(buffer: Float32Array, offset: number): void {
  // 먼저 모든 요소를 0으로 초기화
  for (let i = 0; i < MATRIX_SIZE; i++) {
    buffer[offset + i] = 0;
  }
  // 대각선 요소를 1로 설정
  buffer[offset + 0] = 1;  // m[0][0]
  buffer[offset + 5] = 1;  // m[1][1]
  buffer[offset + 10] = 1; // m[2][2]
  buffer[offset + 15] = 1; // m[3][3]
}

/**
 * 변환 행렬을 버퍼의 특정 위치에 설정
 * 
 * Three.js는 Column-Major 순서를 사용:
 * | m0  m4  m8   m12 |
 * | m1  m5  m9   m13 |
 * | m2  m6  m10  m14 |
 * | m3  m7  m11  m15 |
 * 
 * @param buffer - 대상 Float32Array
 * @param offset - 시작 인덱스
 * @param x, y, z - 위치 (Three.js 단위)
 * @param rotationZ - Z축 회전 (라디안)
 * @param scaleX, scaleY, scaleZ - 스케일
 */
function setTransformMatrix(
  buffer: Float32Array,
  offset: number,
  x: number,
  y: number,
  z: number,
  rotationZ: number,
  scaleX: number,
  scaleY: number,
  scaleZ: number
): void {
  const cos = Math.cos(rotationZ);
  const sin = Math.sin(rotationZ);
  
  // Column 0
  buffer[offset + 0] = cos * scaleX;
  buffer[offset + 1] = sin * scaleX;
  buffer[offset + 2] = 0;
  buffer[offset + 3] = 0;
  
  // Column 1
  buffer[offset + 4] = -sin * scaleY;
  buffer[offset + 5] = cos * scaleY;
  buffer[offset + 6] = 0;
  buffer[offset + 7] = 0;
  
  // Column 2
  buffer[offset + 8] = 0;
  buffer[offset + 9] = 0;
  buffer[offset + 10] = scaleZ;
  buffer[offset + 11] = 0;
  
  // Column 3 (Translation)
  buffer[offset + 12] = x;
  buffer[offset + 13] = y;
  buffer[offset + 14] = z;
  buffer[offset + 15] = 1;
}

/**
 * 타일을 숨기기 위해 스케일을 0으로 설정
 * (완전히 삭제하지 않고 비가시화)
 */
function hideInstance(buffer: Float32Array, offset: number): void {
  // 스케일만 0으로 변경 (위치는 유지)
  buffer[offset + 0] = HIDDEN_SCALE;  // scaleX
  buffer[offset + 5] = HIDDEN_SCALE;  // scaleY
  buffer[offset + 10] = HIDDEN_SCALE; // scaleZ
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: TileInstanceManager Class
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 타일 인스턴스 관리자
 * 
 * ⚠️ MEMORY OPTIMIZATION:
 * - 생성 시 최대 용량만큼 버퍼를 pre-allocate
 * - 런타임에 new Float32Array() 호출 금지
 * - 모든 업데이트는 기존 버퍼에 인덱스로 접근
 * 
 * @example
 * ```typescript
 * const manager = new TileInstanceManager(10000);
 * manager.initializeFromGrid(gridData, tileConfig);
 * 
 * // InstancedMesh에 버퍼 연결
 * instancedMesh.instanceMatrix = new THREE.InstancedBufferAttribute(
 *   manager.getMatrixBuffer(),
 *   16
 * );
 * ```
 */
export class TileInstanceManager {
  // ═══════════════════════════════════════════════════════════════════════
  // Private Properties
  // ═══════════════════════════════════════════════════════════════════════
  
  /** 최대 인스턴스 용량 */
  private readonly capacity: number;
  
  /** 현재 활성 인스턴스 수 */
  private count: number = 0;
  
  /** 통합 변환 행렬 버퍼 (capacity * 16 floats) */
  private readonly matrices: Float32Array;
  
  /** 통합 색상 버퍼 (capacity * 4 floats) */
  private readonly colors: Float32Array;
  
  /** 가시성 플래그 배열 */
  private readonly visibilityFlags: Uint8Array;
  
  /** TileCell ID → Instance Index 매핑 */
  private readonly tileIdToIndex: Map<string, number>;
  
  /** Instance Index → TileCell ID 역매핑 */
  private readonly indexToTileId: string[];
  
  /** 전역 타일 설정 (크기 참조용) */
  private globalConfig: GlobalTileConfig | null = null;
  
  /** 더티 플래그 (버퍼 업데이트 필요 여부) */
  private isDirty: boolean = false;
  
  /** 더티 인덱스 범위 (부분 업데이트 최적화) */
  private dirtyRange: { start: number; end: number } = { start: 0, end: 0 };
  
  // ═══════════════════════════════════════════════════════════════════════
  // Constructor
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * @param capacity - 최대 타일 수 (pre-allocation)
   */
  constructor(capacity: number = 10000) {
    this.capacity = capacity;
    
    // ⚠️ PRE-ALLOCATION: 런타임 메모리 할당 방지
    this.matrices = new Float32Array(capacity * MATRIX_SIZE);
    this.colors = new Float32Array(capacity * COLOR_SIZE);
    this.visibilityFlags = new Uint8Array(capacity);
    
    this.tileIdToIndex = new Map();
    this.indexToTileId = new Array(capacity).fill('');
    
    // 모든 행렬을 단위 행렬로 초기화
    for (let i = 0; i < capacity; i++) {
      setIdentityMatrix(this.matrices, i * MATRIX_SIZE);
      
      // 기본 색상 설정
      const colorOffset = i * COLOR_SIZE;
      this.colors[colorOffset + 0] = DEFAULT_TILE_COLOR[0];
      this.colors[colorOffset + 1] = DEFAULT_TILE_COLOR[1];
      this.colors[colorOffset + 2] = DEFAULT_TILE_COLOR[2];
      this.colors[colorOffset + 3] = DEFAULT_TILE_COLOR[3];
      
      // 가시성 초기화 (0 = hidden)
      this.visibilityFlags[i] = 0;
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Public Getters
  // ═══════════════════════════════════════════════════════════════════════
  
  /** 현재 활성 인스턴스 수 */
  getCount(): number {
    return this.count;
  }
  
  /** 최대 용량 */
  getCapacity(): number {
    return this.capacity;
  }
  
  /** 변환 행렬 버퍼 (Three.js InstancedBufferAttribute용) */
  getMatrixBuffer(): Float32Array {
    return this.matrices;
  }
  
  /** 색상 버퍼 */
  getColorBuffer(): Float32Array {
    return this.colors;
  }
  
  /** 버퍼 업데이트 필요 여부 */
  needsUpdate(): boolean {
    return this.isDirty;
  }
  
  /** 더티 범위 (부분 업데이트용) */
  getDirtyRange(): { start: number; end: number } {
    return { ...this.dirtyRange };
  }
  
  /** 업데이트 완료 표시 */
  clearDirtyFlag(): void {
    this.isDirty = false;
    this.dirtyRange = { start: this.count, end: 0 };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Initialization
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 2D 타일 그리드로부터 인스턴스 버퍼 초기화
   * 
   * @param grid - TileCell 2D 배열
   * @param config - 전역 타일 설정
   * @param surfaceId - 적용할 표면 (FLOOR, WALL_1 등)
   * @param surfaceOffset - 표면의 3D 공간 내 오프셋
   */
  initializeFromGrid(
    grid: TileCell[][],
    config: GlobalTileConfig,
    surfaceId: SurfaceId = 'FLOOR',
    surfaceOffset: Vector3 = { x: 0 as MicroMM, y: 0 as MicroMM, z: 0 as MicroMM }
  ): void {
    this.globalConfig = config;
    this.count = 0;
    this.tileIdToIndex.clear();
    
    // 표면 타입에 따른 좌표 변환 설정
    const transform = this.getSurfaceTransform(surfaceId);
    
    for (const row of grid) {
      for (const tile of row) {
        if (this.count >= this.capacity) {
          console.warn(`TileInstanceManager: 용량 초과 (${this.capacity})`);
          break;
        }
        
        const index = this.count;
        const matrixOffset = index * MATRIX_SIZE;
        
        // 타일 크기 조회 (메모리 최적화된 방식)
        const { width, height } = getTileDimension(tile, config);
        
        // MicroMM → Three.js 좌표 변환
        const tileX = (tile.position.x + width / 2) * RENDER_SCALE;
        const tileY = (tile.position.y + height / 2) * RENDER_SCALE;
        const tileZ = 0;
        
        // 표면에 따른 좌표 변환 적용
        const [worldX, worldY, worldZ] = transform(
          tileX + surfaceOffset.x * RENDER_SCALE,
          tileY + surfaceOffset.y * RENDER_SCALE,
          tileZ + surfaceOffset.z * RENDER_SCALE
        );
        
        // 회전 (라디안 변환)
        const rotationRad = (tile.rotation * Math.PI) / 180;
        
        // 스케일 (타일 크기 반영)
        const scaleX = width * RENDER_SCALE;
        const scaleY = height * RENDER_SCALE;
        const scaleZ = 0.01; // 타일 두께 (얇게)
        
        // 가시성에 따른 행렬 설정
        if (tile.visible) {
          setTransformMatrix(
            this.matrices,
            matrixOffset,
            worldX, worldY, worldZ,
            rotationRad,
            scaleX, scaleY, scaleZ
          );
          this.visibilityFlags[index] = 1;
        } else {
          hideInstance(this.matrices, matrixOffset);
          this.visibilityFlags[index] = 0;
        }
        
        // 매핑 등록
        this.tileIdToIndex.set(tile.id, index);
        this.indexToTileId[index] = tile.id;
        
        this.count++;
      }
    }
    
    // 전체 버퍼 업데이트 필요
    this.markDirty(0, this.count - 1);
  }
  
  /**
   * 표면 타입별 좌표 변환 함수 반환
   * Ref: Chapter 4.2.2 - 타일 그리드 3D 매핑
   */
  private getSurfaceTransform(
    surfaceId: SurfaceId
  ): (x: number, y: number, z: number) => [number, number, number] {
    switch (surfaceId) {
      case 'FLOOR':
        // XZ 평면, Y=0
        return (x, y, z) => [x, 0, y];
        
      case 'WALL_1': // 정면 (Z=깊이)
        // XY 평면
        return (x, y, z) => [x, y, z];
        
      case 'WALL_2': // 좌측 (X=0)
        // ZY 평면
        return (x, y, z) => [0, y, x];
        
      case 'WALL_3': // 우측 (X=너비)
        // ZY 평면 (반전)
        return (x, y, z) => [z, y, -x];
        
      case 'WALL_4': // 후면 (Z=0)
        // XY 평면 (반전)
        return (x, y, z) => [-x, y, 0];
        
      default:
        return (x, y, z) => [x, y, z];
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Instance Updates
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 특정 타일의 가시성 업데이트
   * 
   * ⚠️ NON-DESTRUCTIVE:
   * visible=false로 설정해도 데이터는 보존
   * 스케일만 0으로 변경하여 비가시화
   */
  setTileVisibility(tileId: string, visible: boolean): boolean {
    const index = this.tileIdToIndex.get(tileId);
    if (index === undefined) return false;
    
    const matrixOffset = index * MATRIX_SIZE;
    
    if (visible) {
      // TODO: 원래 스케일 복원 (현재는 기본값 사용)
      // 실제 구현에서는 별도의 원본 스케일 저장 필요
      this.visibilityFlags[index] = 1;
    } else {
      hideInstance(this.matrices, matrixOffset);
      this.visibilityFlags[index] = 0;
    }
    
    this.markDirty(index, index);
    return true;
  }
  
  /**
   * 특정 타일의 위치 업데이트
   */
  setTilePosition(tileId: string, position: Vector3): boolean {
    const index = this.tileIdToIndex.get(tileId);
    if (index === undefined) return false;
    
    const matrixOffset = index * MATRIX_SIZE;
    
    // Translation 컬럼만 업데이트 (Column 3)
    this.matrices[matrixOffset + 12] = position.x * RENDER_SCALE;
    this.matrices[matrixOffset + 13] = position.y * RENDER_SCALE;
    this.matrices[matrixOffset + 14] = position.z * RENDER_SCALE;
    
    this.markDirty(index, index);
    return true;
  }
  
  /**
   * 특정 타일의 회전 업데이트
   */
  setTileRotation(tileId: string, rotation: Degree): boolean {
    const index = this.tileIdToIndex.get(tileId);
    if (index === undefined) return false;
    
    // 현재 위치와 스케일 추출
    const matrixOffset = index * MATRIX_SIZE;
    const x = this.matrices[matrixOffset + 12];
    const y = this.matrices[matrixOffset + 13];
    const z = this.matrices[matrixOffset + 14];
    
    // 스케일 추출 (대각선 요소의 크기)
    const scaleX = Math.hypot(
      this.matrices[matrixOffset + 0],
      this.matrices[matrixOffset + 1]
    );
    const scaleY = Math.hypot(
      this.matrices[matrixOffset + 4],
      this.matrices[matrixOffset + 5]
    );
    const scaleZ = this.matrices[matrixOffset + 10];
    
    // 새 회전으로 행렬 재계산
    const rotationRad = (rotation * Math.PI) / 180;
    setTransformMatrix(
      this.matrices,
      matrixOffset,
      x, y, z,
      rotationRad,
      scaleX, scaleY, scaleZ
    );
    
    this.markDirty(index, index);
    return true;
  }
  
  /**
   * 특정 타일의 색상 업데이트
   */
  setTileColor(
    tileId: string, 
    color: [number, number, number, number]
  ): boolean {
    const index = this.tileIdToIndex.get(tileId);
    if (index === undefined) return false;
    
    const colorOffset = index * COLOR_SIZE;
    this.colors[colorOffset + 0] = color[0];
    this.colors[colorOffset + 1] = color[1];
    this.colors[colorOffset + 2] = color[2];
    this.colors[colorOffset + 3] = color[3];
    
    // 색상 버퍼도 더티 표시 필요 (별도 관리 시)
    return true;
  }
  
  /**
   * 여러 타일 일괄 마스킹 (Shape에 의한 가림 처리)
   * 
   * Ref: Chapter 5 - 도면 편집 도구
   * ⚠️ NON-DESTRUCTIVE: 마스킹만 수행, 데이터 보존
   */
  maskTilesByShape(tileIds: string[], shapeId: string): void {
    for (const tileId of tileIds) {
      this.setTileVisibility(tileId, false);
    }
  }
  
  /**
   * Shape 제거 시 마스킹 해제
   */
  unmaskTilesByShape(tileIds: string[], shapeId: string): void {
    for (const tileId of tileIds) {
      this.setTileVisibility(tileId, true);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Batch Updates
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 여러 업데이트를 일괄 처리 (성능 최적화)
   */
  batchUpdate(updates: InstanceBufferUpdate[]): void {
    for (const update of updates) {
      if (update.position) {
        const tileId = this.indexToTileId[update.index];
        if (tileId) this.setTilePosition(tileId, update.position);
      }
      
      if (update.rotation !== undefined) {
        const tileId = this.indexToTileId[update.index];
        if (tileId) this.setTileRotation(tileId, update.rotation);
      }
      
      if (update.visible !== undefined) {
        const tileId = this.indexToTileId[update.index];
        if (tileId) this.setTileVisibility(tileId, update.visible);
      }
      
      if (update.color) {
        const tileId = this.indexToTileId[update.index];
        if (tileId) this.setTileColor(tileId, update.color);
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Query Methods
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 타일 ID로 인스턴스 인덱스 조회
   */
  getIndexByTileId(tileId: string): number | undefined {
    return this.tileIdToIndex.get(tileId);
  }
  
  /**
   * 인스턴스 인덱스로 타일 ID 조회
   */
  getTileIdByIndex(index: number): string | undefined {
    return this.indexToTileId[index] || undefined;
  }
  
  /**
   * 타일 가시성 조회
   */
  isTileVisible(tileId: string): boolean {
    const index = this.tileIdToIndex.get(tileId);
    if (index === undefined) return false;
    return this.visibilityFlags[index] === 1;
  }
  
  /**
   * 가시 타일 수 조회
   */
  getVisibleCount(): number {
    let count = 0;
    for (let i = 0; i < this.count; i++) {
      if (this.visibilityFlags[i] === 1) count++;
    }
    return count;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Dirty Flag Management
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 특정 인덱스 범위를 더티로 표시
   * (Three.js의 needsUpdate와 연동)
   */
  private markDirty(startIndex: number, endIndex: number): void {
    this.isDirty = true;
    this.dirtyRange.start = Math.min(this.dirtyRange.start, startIndex);
    this.dirtyRange.end = Math.max(this.dirtyRange.end, endIndex);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Cleanup
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 리소스 정리 (메모리 해제)
   */
  dispose(): void {
    this.count = 0;
    this.tileIdToIndex.clear();
    this.indexToTileId.fill('');
    this.globalConfig = null;
    
    // Float32Array는 GC가 처리하지만, 명시적으로 참조 해제
    // (실제로는 버퍼 자체를 null로 설정할 수 없음)
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Serialization (저장/불러오기용)
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 현재 상태를 직렬화 가능한 객체로 내보내기
   */
  exportState(): TileInstanceBuffer {
    return {
      count: this.count,
      capacity: this.capacity,
      matrices: new Float32Array(this.matrices.slice(0, this.count * MATRIX_SIZE)),
      colors: new Float32Array(this.colors.slice(0, this.count * COLOR_SIZE)),
      visibilityFlags: new Uint8Array(this.visibilityFlags.slice(0, this.count)),
      tileIdToIndex: new Map(this.tileIdToIndex),
      indexToTileId: this.indexToTileId.slice(0, this.count),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Factory Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 타일 그리드로부터 인스턴스 매니저 생성
 * 
 * @example
 * ```typescript
 * const manager = createTileInstanceManager(gridData, tileConfig);
 * ```
 */
export function createTileInstanceManager(
  grid: TileCell[][],
  config: GlobalTileConfig,
  surfaceId: SurfaceId = 'FLOOR'
): TileInstanceManager {
  // 그리드 크기로 용량 계산 (여유분 10% 추가)
  const tileCount = grid.reduce((sum, row) => sum + row.length, 0);
  const capacity = Math.ceil(tileCount * 1.1);
  
  const manager = new TileInstanceManager(capacity);
  manager.initializeFromGrid(grid, config, surfaceId);
  
  return manager;
}

/**
 * 메모리 사용량 추정
 */
export function estimateInstanceBufferMemory(tileCount: number): {
  matricesBytes: number;
  colorsBytes: number;
  flagsBytes: number;
  totalBytes: number;
  totalKB: number;
  totalMB: number;
} {
  const matricesBytes = tileCount * MATRIX_SIZE * 4; // Float32 = 4 bytes
  const colorsBytes = tileCount * COLOR_SIZE * 4;
  const flagsBytes = tileCount * 1; // Uint8 = 1 byte
  const totalBytes = matricesBytes + colorsBytes + flagsBytes;
  
  return {
    matricesBytes,
    colorsBytes,
    flagsBytes,
    totalBytes,
    totalKB: totalBytes / 1024,
    totalMB: totalBytes / (1024 * 1024),
  };
}

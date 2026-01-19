/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Wall Culling Manager
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 카메라 각도에 따른 벽면 자동 투명화 시스템
 * 
 * ⚠️ UX OPTIMIZATION (Code Review 반영):
 * 사용자가 특정 벽면을 보고 싶을 때, 카메라 앞에 있는 벽이
 * 시야를 가리면 불편합니다. 이 모듈은 카메라의 방향을 감지하여
 * 시야를 가리는 벽면을 자동으로 반투명 처리합니다.
 * 
 * Ref: Chapter 4 - 3D 뷰 시스템
 * Ref: 분석 노트 - Wall Occlusion 해결
 */

import {
  SurfaceId,
  Vector3,
  Degree,
  Scene3D,
} from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Types & Constants
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 벽면 가시성 상태
 */
export interface WallVisibilityState {
  surfaceId: SurfaceId;
  
  /** 현재 불투명도 (0 = 완전 투명, 1 = 불투명) */
  opacity: number;
  
  /** 목표 불투명도 (애니메이션용) */
  targetOpacity: number;
  
  /** 카메라에 의해 가려지는 상태인지 */
  isOccluding: boolean;
  
  /** 사용자가 수동으로 숨김 처리했는지 */
  isManuallyHidden: boolean;
}

/**
 * 카메라 상태
 */
export interface CameraState {
  /** 카메라 위치 */
  position: { x: number; y: number; z: number };
  
  /** 방위각 (Azimuth): Y축 기준 수평 회전 (0-360도) */
  azimuth: number;
  
  /** 고도각 (Elevation): 수평면 기준 상하 회전 (-90 ~ 90도) */
  elevation: number;
  
  /** 카메라가 바라보는 대상 위치 */
  target: { x: number; y: number; z: number };
}

/**
 * Wall Culling 설정
 */
export interface WallCullingConfig {
  /** 가려짐 판정 시 벽면의 불투명도 */
  occludedOpacity: number;
  
  /** 일반 상태의 불투명도 */
  normalOpacity: number;
  
  /** 불투명도 전환 애니메이션 지속 시간 (ms) */
  transitionDuration: number;
  
  /** 자동 culling 활성화 여부 */
  enabled: boolean;
  
  /**
   * 가려짐 판정 각도 임계값 (도)
   * 카메라가 벽면의 법선 방향에서 이 각도 이내일 때 가려짐으로 판정
   */
  occlusionAngleThreshold: number;
}

/**
 * 기본 설정
 */
const DEFAULT_CONFIG: WallCullingConfig = {
  occludedOpacity: 0.2,
  normalOpacity: 1.0,
  transitionDuration: 200,
  enabled: true,
  occlusionAngleThreshold: 60, // 60도 이내면 가려짐
};

/**
 * 각 벽면의 법선 벡터 방향 (카메라를 향해야 할 방향)
 * 
 * 방 중심에서 바깥쪽을 향하는 방향
 * 방위각(Azimuth) 기준: 0도 = +Z 방향, 90도 = +X 방향
 */
const WALL_NORMAL_AZIMUTHS: Record<SurfaceId, number | null> = {
  'FLOOR': null,   // 바닥은 수평면이므로 방위각으로 판정 안함
  'WALL_1': 0,     // 정면벽 → 카메라가 0도(+Z)에서 볼 때 보임
  'WALL_2': 270,   // 좌측벽 → 카메라가 270도(-X)에서 볼 때 보임
  'WALL_3': 90,    // 우측벽 → 카메라가 90도(+X)에서 볼 때 보임
  'WALL_4': 180,   // 후면벽 → 카메라가 180도(-Z)에서 볼 때 보임
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: WallCullingManager Class
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 벽면 Culling 관리자
 * 
 * @example
 * ```typescript
 * const cullingManager = new WallCullingManager();
 * 
 * // 카메라 이동 시 호출
 * const visibilityChanges = cullingManager.updateCameraState(cameraState);
 * 
 * // 변경된 벽면에 불투명도 적용
 * for (const change of visibilityChanges) {
 *   wallMesh[change.surfaceId].material.opacity = change.opacity;
 * }
 * ```
 */
export class WallCullingManager {
  // ═══════════════════════════════════════════════════════════════════════
  // Private Properties
  // ═══════════════════════════════════════════════════════════════════════
  
  /** 설정 */
  private config: WallCullingConfig;
  
  /** 각 벽면의 현재 가시성 상태 */
  private wallStates: Map<SurfaceId, WallVisibilityState>;
  
  /** 이전 카메라 상태 (변경 감지용) */
  private lastCameraAzimuth: number = 0;
  
  /** 애니메이션 타이머 */
  private animationFrameId: number | null = null;
  
  // ═══════════════════════════════════════════════════════════════════════
  // Constructor
  // ═══════════════════════════════════════════════════════════════════════
  
  constructor(config: Partial<WallCullingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 벽면 상태 초기화
    this.wallStates = new Map();
    const surfaces: SurfaceId[] = ['FLOOR', 'WALL_1', 'WALL_2', 'WALL_3', 'WALL_4'];
    
    for (const surfaceId of surfaces) {
      this.wallStates.set(surfaceId, {
        surfaceId,
        opacity: this.config.normalOpacity,
        targetOpacity: this.config.normalOpacity,
        isOccluding: false,
        isManuallyHidden: false,
      });
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Public Methods
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 카메라 상태 업데이트 및 벽면 가시성 재계산
   * 
   * @param camera - 현재 카메라 상태
   * @returns 가시성이 변경된 벽면 목록
   */
  updateCameraState(camera: CameraState): WallVisibilityState[] {
    if (!this.config.enabled) {
      return [];
    }
    
    const changedWalls: WallVisibilityState[] = [];
    
    // 각 벽면에 대해 가려짐 여부 판정
    for (const [surfaceId, state] of this.wallStates) {
      // 바닥은 culling 대상 아님
      if (surfaceId === 'FLOOR') continue;
      
      // 수동 숨김 상태면 건너뜀
      if (state.isManuallyHidden) continue;
      
      const wallNormalAzimuth = WALL_NORMAL_AZIMUTHS[surfaceId];
      if (wallNormalAzimuth === null) continue;
      
      // 카메라 방위각과 벽면 법선 방향의 각도 차이 계산
      const isOccluding = this.isWallOccludingCamera(
        camera.azimuth,
        wallNormalAzimuth
      );
      
      // 상태 변경 여부 확인
      if (isOccluding !== state.isOccluding) {
        state.isOccluding = isOccluding;
        state.targetOpacity = isOccluding
          ? this.config.occludedOpacity
          : this.config.normalOpacity;
        
        changedWalls.push({ ...state });
      }
    }
    
    this.lastCameraAzimuth = camera.azimuth;
    
    return changedWalls;
  }
  
  /**
   * 벽면이 카메라를 가리는지 판정
   * 
   * 로직:
   * - 카메라가 벽면의 "뒤쪽"에 있으면 해당 벽은 시야를 가림
   * - "뒤쪽" = 벽면 법선과 카메라 방향이 반대
   * - 즉, 카메라 방위각과 벽면 법선 방위각의 차이가 90도 이내면 가려짐
   */
  private isWallOccludingCamera(
    cameraAzimuth: number,
    wallNormalAzimuth: number
  ): boolean {
    // 방위각 차이 계산 (0-180 범위로 정규화)
    let angleDiff = Math.abs(cameraAzimuth - wallNormalAzimuth);
    if (angleDiff > 180) {
      angleDiff = 360 - angleDiff;
    }
    
    /**
     * 판정 로직:
     * 
     * 카메라 방위각이 벽면 법선과 "반대 방향"일 때 벽이 보임
     * → angleDiff가 180도에 가까울수록 잘 보임
     * → angleDiff가 0도에 가까우면 벽이 카메라 앞에 있음 (가려짐)
     * 
     * 예: WALL_1(정면벽)의 법선은 0도(+Z)
     *     카메라가 180도(-Z)에서 보면 angleDiff=180 → 잘 보임
     *     카메라가 0도(+Z)에서 보면 angleDiff=0 → 카메라 앞에 벽 (가려짐)
     */
    
    // 카메라가 벽을 "뒤에서" 볼 때 (법선 방향과 비슷한 방향)
    // → 벽이 카메라와 타겟 사이에 있을 가능성이 높음
    return angleDiff < this.config.occlusionAngleThreshold;
  }
  
  /**
   * 특정 벽면의 가시성 상태 조회
   */
  getWallState(surfaceId: SurfaceId): WallVisibilityState | undefined {
    return this.wallStates.get(surfaceId);
  }
  
  /**
   * 모든 벽면의 가시성 상태 조회
   */
  getAllWallStates(): WallVisibilityState[] {
    return Array.from(this.wallStates.values());
  }
  
  /**
   * 현재 가려진 벽면 목록 조회
   */
  getOccludedWalls(): SurfaceId[] {
    const occluded: SurfaceId[] = [];
    for (const [surfaceId, state] of this.wallStates) {
      if (state.isOccluding || state.isManuallyHidden) {
        occluded.push(surfaceId);
      }
    }
    return occluded;
  }
  
  /**
   * 벽면 수동 숨김/표시 토글
   * (사용자가 직접 벽면을 숨기고 싶을 때)
   */
  toggleWallManualVisibility(surfaceId: SurfaceId): WallVisibilityState | undefined {
    const state = this.wallStates.get(surfaceId);
    if (!state) return undefined;
    
    state.isManuallyHidden = !state.isManuallyHidden;
    state.targetOpacity = state.isManuallyHidden
      ? 0 // 완전 투명
      : (state.isOccluding ? this.config.occludedOpacity : this.config.normalOpacity);
    
    return { ...state };
  }
  
  /**
   * 특정 벽면 강제 표시 (수동 숨김 해제 + culling 무시)
   */
  forceShowWall(surfaceId: SurfaceId): void {
    const state = this.wallStates.get(surfaceId);
    if (state) {
      state.isManuallyHidden = false;
      state.opacity = this.config.normalOpacity;
      state.targetOpacity = this.config.normalOpacity;
    }
  }
  
  /**
   * 모든 벽면 표시 (초기화)
   */
  showAllWalls(): void {
    for (const state of this.wallStates.values()) {
      state.isManuallyHidden = false;
      state.isOccluding = false;
      state.opacity = this.config.normalOpacity;
      state.targetOpacity = this.config.normalOpacity;
    }
  }
  
  /**
   * Culling 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (!enabled) {
      // 비활성화 시 모든 벽면 표시
      this.showAllWalls();
    }
  }
  
  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<WallCullingConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Animation (Optional)
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 불투명도 전환 애니메이션 틱
   * (requestAnimationFrame과 함께 사용)
   * 
   * @param deltaTime - 이전 프레임 이후 경과 시간 (ms)
   * @returns 애니메이션 진행 중인 벽면 목록
   */
  animateTick(deltaTime: number): WallVisibilityState[] {
    const animating: WallVisibilityState[] = [];
    const transitionSpeed = 1 / this.config.transitionDuration;
    
    for (const state of this.wallStates.values()) {
      if (Math.abs(state.opacity - state.targetOpacity) > 0.01) {
        // 선형 보간으로 불투명도 전환
        const direction = state.targetOpacity > state.opacity ? 1 : -1;
        state.opacity += direction * transitionSpeed * deltaTime;
        
        // 클램핑
        if (direction > 0 && state.opacity > state.targetOpacity) {
          state.opacity = state.targetOpacity;
        } else if (direction < 0 && state.opacity < state.targetOpacity) {
          state.opacity = state.targetOpacity;
        }
        
        animating.push({ ...state });
      }
    }
    
    return animating;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * OrbitControls 등에서 방위각 추출
 * 
 * @param cameraPosition - 카메라 월드 위치
 * @param targetPosition - 카메라가 바라보는 대상 위치
 * @returns 방위각 (0-360도)
 */
export function calculateAzimuthFromCamera(
  cameraPosition: { x: number; y: number; z: number },
  targetPosition: { x: number; y: number; z: number }
): number {
  // 카메라에서 타겟으로 향하는 방향 벡터
  const dx = targetPosition.x - cameraPosition.x;
  const dz = targetPosition.z - cameraPosition.z;
  
  // atan2로 방위각 계산 (라디안 → 도)
  let azimuth = Math.atan2(dx, dz) * (180 / Math.PI);
  
  // 0-360 범위로 정규화
  if (azimuth < 0) {
    azimuth += 360;
  }
  
  return azimuth;
}

/**
 * Three.js Camera 객체에서 CameraState 추출
 * 
 * @example
 * ```typescript
 * // Three.js에서 사용
 * const cameraState = extractCameraState(camera, controls.target);
 * cullingManager.updateCameraState(cameraState);
 * ```
 */
export function extractCameraState(
  camera: { position: { x: number; y: number; z: number } },
  target: { x: number; y: number; z: number }
): CameraState {
  const azimuth = calculateAzimuthFromCamera(camera.position, target);
  
  // 고도각 계산
  const dx = target.x - camera.position.x;
  const dy = target.y - camera.position.y;
  const dz = target.z - camera.position.z;
  const horizontalDist = Math.sqrt(dx * dx + dz * dz);
  const elevation = Math.atan2(dy, horizontalDist) * (180 / Math.PI);
  
  return {
    position: { ...camera.position },
    azimuth,
    elevation,
    target: { ...target },
  };
}

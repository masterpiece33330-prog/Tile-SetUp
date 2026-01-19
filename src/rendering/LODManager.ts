/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - LOD (Level of Detail) Manager
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 카메라 거리에 따른 렌더링 품질 자동 조절 시스템
 * 
 * ⚠️ PERFORMANCE OPTIMIZATION:
 * - 원거리: 줄눈 표시 생략, 단순화된 지오메트리
 * - 중거리: 기본 품질
 * - 근거리: 최대 디테일 (줄눈, 텍스처 등)
 * 
 * 저사양 모바일에서도 60FPS 유지 목표
 * 
 * Ref: Chapter 4 - 3D 뷰 시스템
 * Ref: 분석 노트 - 3D 최적화
 */

import { LODLevel, RenderSettings } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Types & Constants
// ═══════════════════════════════════════════════════════════════════════════

/**
 * LOD 레벨별 설정
 */
export interface LODLevelConfig {
  /** 레벨 ID */
  level: LODLevel;
  
  /** 이 레벨이 적용되는 최소 거리 (Three.js 단위) */
  minDistance: number;
  
  /** 이 레벨이 적용되는 최대 거리 */
  maxDistance: number;
  
  /** 줄눈(Gap) 표시 여부 */
  showGap: boolean;
  
  /** 타일당 세그먼트 수 (지오메트리 복잡도) */
  tileSegments: number;
  
  /** 텍스처 해상도 배율 (1.0 = 원본) */
  textureScale: number;
  
  /** 그림자 활성화 */
  enableShadows: boolean;
  
  /** 반사/광택 효과 */
  enableReflections: boolean;
  
  /** 타일 엣지 베벨 표시 */
  showTileBevel: boolean;
}

/**
 * 기본 LOD 설정
 */
const DEFAULT_LOD_CONFIGS: LODLevelConfig[] = [
  {
    level: 'HIGH',
    minDistance: 0,
    maxDistance: 2,      // 근거리: 0 ~ 2 단위
    showGap: true,
    tileSegments: 4,     // 세밀한 지오메트리
    textureScale: 1.0,
    enableShadows: true,
    enableReflections: true,
    showTileBevel: true,
  },
  {
    level: 'MEDIUM',
    minDistance: 2,
    maxDistance: 5,      // 중거리: 2 ~ 5 단위
    showGap: true,
    tileSegments: 2,
    textureScale: 0.5,
    enableShadows: true,
    enableReflections: false,
    showTileBevel: false,
  },
  {
    level: 'LOW',
    minDistance: 5,
    maxDistance: Infinity, // 원거리: 5 단위 이상
    showGap: false,        // 줄눈 생략
    tileSegments: 1,       // 최소 지오메트리
    textureScale: 0.25,
    enableShadows: false,
    enableReflections: false,
    showTileBevel: false,
  },
];

/**
 * 디바이스 성능 등급
 */
export type DevicePerformanceTier = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * 디바이스별 LOD 거리 배율
 * 저사양 디바이스는 더 빨리 LOW LOD로 전환
 */
const DEVICE_DISTANCE_MULTIPLIERS: Record<DevicePerformanceTier, number> = {
  LOW: 0.5,    // 거리 임계값 절반 → 더 빨리 품질 낮춤
  MEDIUM: 1.0, // 기본값
  HIGH: 1.5,   // 거리 임계값 1.5배 → 더 오래 고품질 유지
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: LODManager Class
// ═══════════════════════════════════════════════════════════════════════════

/**
 * LOD 관리자
 * 
 * @example
 * ```typescript
 * const lodManager = new LODManager();
 * 
 * // 렌더 루프에서 매 프레임 호출
 * function render() {
 *   const distance = camera.position.distanceTo(target);
 *   const lodChange = lodManager.updateDistance(distance);
 *   
 *   if (lodChange) {
 *     // LOD 레벨 변경됨 → 렌더링 설정 업데이트
 *     applyLODSettings(lodChange.config);
 *   }
 *   
 *   renderer.render(scene, camera);
 * }
 * ```
 */
export class LODManager {
  // ═══════════════════════════════════════════════════════════════════════
  // Private Properties
  // ═══════════════════════════════════════════════════════════════════════
  
  /** LOD 레벨 설정 목록 */
  private lodConfigs: LODLevelConfig[];
  
  /** 현재 LOD 레벨 */
  private currentLevel: LODLevel = 'HIGH';
  
  /** 현재 적용된 설정 */
  private currentConfig: LODLevelConfig;
  
  /** 디바이스 성능 등급 */
  private deviceTier: DevicePerformanceTier = 'MEDIUM';
  
  /** 거리 배율 (디바이스 성능에 따라 조정) */
  private distanceMultiplier: number = 1.0;
  
  /** 히스테리시스 버퍼 (깜빡임 방지) */
  private hysteresisBuffer: number = 0.2; // 20% 버퍼
  
  /** 마지막 업데이트 거리 */
  private lastDistance: number = 0;
  
  /** LOD 전환 콜백 */
  private onLevelChangeCallbacks: ((level: LODLevel, config: LODLevelConfig) => void)[] = [];
  
  // ═══════════════════════════════════════════════════════════════════════
  // Constructor
  // ═══════════════════════════════════════════════════════════════════════
  
  constructor(
    deviceTier: DevicePerformanceTier = 'MEDIUM',
    customConfigs?: LODLevelConfig[]
  ) {
    this.deviceTier = deviceTier;
    this.distanceMultiplier = DEVICE_DISTANCE_MULTIPLIERS[deviceTier];
    
    // LOD 설정 초기화 (거리 배율 적용)
    this.lodConfigs = (customConfigs || DEFAULT_LOD_CONFIGS).map(config => ({
      ...config,
      minDistance: config.minDistance * this.distanceMultiplier,
      maxDistance: config.maxDistance === Infinity 
        ? Infinity 
        : config.maxDistance * this.distanceMultiplier,
    }));
    
    // 초기 레벨 설정
    this.currentConfig = this.lodConfigs[0];
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Public Methods
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 카메라 거리 업데이트 및 LOD 레벨 재계산
   * 
   * @param distance - 카메라와 대상 사이의 거리 (Three.js 단위)
   * @returns LOD 레벨이 변경된 경우 새 설정, 아니면 null
   */
  updateDistance(distance: number): { 
    level: LODLevel; 
    config: LODLevelConfig;
    previousLevel: LODLevel;
  } | null {
    this.lastDistance = distance;
    
    // 현재 거리에 맞는 LOD 레벨 찾기
    const newConfig = this.findLODConfig(distance);
    
    if (newConfig.level !== this.currentLevel) {
      // 히스테리시스 체크 (경계에서 깜빡임 방지)
      if (this.shouldTransition(distance, newConfig)) {
        const previousLevel = this.currentLevel;
        this.currentLevel = newConfig.level;
        this.currentConfig = newConfig;
        
        // 콜백 호출
        this.notifyLevelChange(newConfig.level, newConfig);
        
        return {
          level: newConfig.level,
          config: newConfig,
          previousLevel,
        };
      }
    }
    
    return null;
  }
  
  /**
   * 거리에 맞는 LOD 설정 찾기
   */
  private findLODConfig(distance: number): LODLevelConfig {
    for (const config of this.lodConfigs) {
      if (distance >= config.minDistance && distance < config.maxDistance) {
        return config;
      }
    }
    // 기본값: LOW
    return this.lodConfigs[this.lodConfigs.length - 1];
  }
  
  /**
   * 히스테리시스를 고려한 전환 여부 판단
   * (경계에서 왔다갔다하는 깜빡임 방지)
   */
  private shouldTransition(distance: number, newConfig: LODLevelConfig): boolean {
    const currentMinDist = this.currentConfig.minDistance;
    const currentMaxDist = this.currentConfig.maxDistance;
    
    // 버퍼 크기 계산
    const bufferSize = Math.min(
      (currentMaxDist - currentMinDist) * this.hysteresisBuffer,
      0.5 // 최대 0.5 단위 버퍼
    );
    
    // 현재 레벨에서 멀리 벗어났는지 확인
    if (distance < currentMinDist - bufferSize || 
        distance > currentMaxDist + bufferSize) {
      return true;
    }
    
    // 버퍼 내에 있으면 현재 레벨 유지
    return false;
  }
  
  /**
   * 현재 LOD 레벨 조회
   */
  getCurrentLevel(): LODLevel {
    return this.currentLevel;
  }
  
  /**
   * 현재 LOD 설정 조회
   */
  getCurrentConfig(): LODLevelConfig {
    return { ...this.currentConfig };
  }
  
  /**
   * LOD 레벨 강제 설정 (디버깅/프리뷰용)
   */
  forceLevel(level: LODLevel): LODLevelConfig {
    const config = this.lodConfigs.find(c => c.level === level);
    if (config) {
      const previousLevel = this.currentLevel;
      this.currentLevel = level;
      this.currentConfig = config;
      this.notifyLevelChange(level, config);
    }
    return this.currentConfig;
  }
  
  /**
   * RenderSettings 형식으로 현재 설정 내보내기
   */
  toRenderSettings(): RenderSettings {
    return {
      currentLOD: this.currentLevel,
      showGap: this.currentConfig.showGap,
      enableShadows: this.currentConfig.enableShadows,
      antialias: this.deviceTier !== 'LOW',
      targetFPS: this.deviceTier === 'LOW' ? 30 : 60,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Device Detection
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 디바이스 성능 등급 설정
   */
  setDeviceTier(tier: DevicePerformanceTier): void {
    this.deviceTier = tier;
    this.distanceMultiplier = DEVICE_DISTANCE_MULTIPLIERS[tier];
    
    // LOD 거리 재계산
    this.lodConfigs = DEFAULT_LOD_CONFIGS.map(config => ({
      ...config,
      minDistance: config.minDistance * this.distanceMultiplier,
      maxDistance: config.maxDistance === Infinity 
        ? Infinity 
        : config.maxDistance * this.distanceMultiplier,
    }));
    
    // 현재 거리로 LOD 재평가
    this.updateDistance(this.lastDistance);
  }
  
  /**
   * 디바이스 성능 자동 감지 (휴리스틱)
   * 
   * ⚠️ 주의: 브라우저 환경에서만 동작
   */
  static detectDeviceTier(): DevicePerformanceTier {
    // 서버 사이드 렌더링 체크
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'MEDIUM';
    }
    
    // 하드웨어 코어 수 체크
    const cores = navigator.hardwareConcurrency || 2;
    
    // 디바이스 메모리 체크 (Chrome 전용)
    const memory = (navigator as any).deviceMemory || 4;
    
    // 모바일 여부 체크
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      .test(navigator.userAgent);
    
    // 점수 계산
    let score = 0;
    
    if (cores >= 8) score += 2;
    else if (cores >= 4) score += 1;
    
    if (memory >= 8) score += 2;
    else if (memory >= 4) score += 1;
    
    if (!isMobile) score += 1;
    
    // 등급 결정
    if (score >= 4) return 'HIGH';
    if (score >= 2) return 'MEDIUM';
    return 'LOW';
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Event Handling
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * LOD 레벨 변경 콜백 등록
   */
  onLevelChange(callback: (level: LODLevel, config: LODLevelConfig) => void): void {
    this.onLevelChangeCallbacks.push(callback);
  }
  
  /**
   * 콜백 해제
   */
  offLevelChange(callback: (level: LODLevel, config: LODLevelConfig) => void): void {
    const index = this.onLevelChangeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onLevelChangeCallbacks.splice(index, 1);
    }
  }
  
  /**
   * 레벨 변경 알림
   */
  private notifyLevelChange(level: LODLevel, config: LODLevelConfig): void {
    for (const callback of this.onLevelChangeCallbacks) {
      try {
        callback(level, config);
      } catch (error) {
        console.error('LOD level change callback error:', error);
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Debug
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 디버그 정보 출력
   */
  getDebugInfo(): {
    currentLevel: LODLevel;
    lastDistance: number;
    deviceTier: DevicePerformanceTier;
    distanceMultiplier: number;
    configs: LODLevelConfig[];
  } {
    return {
      currentLevel: this.currentLevel,
      lastDistance: this.lastDistance,
      deviceTier: this.deviceTier,
      distanceMultiplier: this.distanceMultiplier,
      configs: this.lodConfigs.map(c => ({ ...c })),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * LOD 관리자 팩토리 함수
 * 디바이스 성능을 자동 감지하여 최적화된 LODManager 생성
 */
export function createLODManager(): LODManager {
  const deviceTier = LODManager.detectDeviceTier();
  console.log(`[LODManager] Detected device tier: ${deviceTier}`);
  return new LODManager(deviceTier);
}

/**
 * Three.js PerspectiveCamera와 함께 사용하기 위한 헬퍼
 */
export function calculateCameraDistance(
  cameraPosition: { x: number; y: number; z: number },
  targetPosition: { x: number; y: number; z: number }
): number {
  const dx = targetPosition.x - cameraPosition.x;
  const dy = targetPosition.y - cameraPosition.y;
  const dz = targetPosition.z - cameraPosition.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

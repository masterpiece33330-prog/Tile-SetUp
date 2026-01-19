/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - React Three.js Integration Hook
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * @react-three/fiber와 함께 사용하기 위한 커스텀 훅
 * 
 * 이 훅은 TileInstanceManager, WallCullingManager, LODManager를
 * React 컴포넌트에서 쉽게 사용할 수 있도록 통합합니다.
 * 
 * @example
 * ```tsx
 * function TileScene() {
 *   const { meshRef, onCameraMove } = useTileRenderer(gridData, config);
 *   
 *   useFrame(({ camera }) => {
 *     onCameraMove(camera.position, controls.target);
 *   });
 *   
 *   return (
 *     <instancedMesh ref={meshRef} args={[undefined, undefined, tileCount]}>
 *       <boxGeometry args={[1, 1, 0.02]} />
 *       <meshStandardMaterial />
 *     </instancedMesh>
 *   );
 * }
 * ```
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { InstancedMesh, BufferAttribute } from 'three';

import { TileCell, SurfaceId, LODLevel } from '../types';
import { 
  TileInstanceManager, 
  createTileInstanceManager,
} from './TileInstanceManager';
import {
  WallCullingManager,
  extractCameraState,
  WallVisibilityState,
} from './WallCullingManager';
import {
  LODManager,
  createLODManager,
  calculateCameraDistance,
  LODLevelConfig,
} from './LODManager';
import { GlobalTileConfig } from '../utils/tileCalculationService';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 훅 옵션
 */
export interface UseTileRendererOptions {
  /** 자동 LOD 활성화 (기본: true) */
  enableLOD?: boolean;
  
  /** 자동 Wall Culling 활성화 (기본: true) */
  enableWallCulling?: boolean;
  
  /** 적용할 표면 ID */
  surfaceId?: SurfaceId;
  
  /** LOD 레벨 변경 콜백 */
  onLODChange?: (level: LODLevel, config: LODLevelConfig) => void;
  
  /** 벽면 가시성 변경 콜백 */
  onWallVisibilityChange?: (walls: WallVisibilityState[]) => void;
}

/**
 * 훅 반환값
 */
export interface UseTileRendererReturn {
  /** InstancedMesh에 연결할 ref */
  meshRef: React.RefObject<InstancedMesh>;
  
  /** 인스턴스 매니저 직접 접근 */
  instanceManager: TileInstanceManager | null;
  
  /** 카메라 이동 시 호출 (useFrame에서 사용) */
  onCameraMove: (
    cameraPosition: { x: number; y: number; z: number },
    targetPosition: { x: number; y: number; z: number }
  ) => void;
  
  /** 특정 타일 가시성 변경 */
  setTileVisibility: (tileId: string, visible: boolean) => void;
  
  /** 현재 LOD 레벨 */
  currentLOD: LODLevel;
  
  /** 현재 가려진 벽면 목록 */
  culledWalls: SurfaceId[];
  
  /** 버퍼 업데이트 필요 여부 */
  needsUpdate: boolean;
  
  /** 업데이트 플래그 초기화 (렌더 후 호출) */
  clearUpdateFlag: () => void;
  
  /** 전체 가시 타일 수 */
  visibleTileCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook Implementation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 타일 렌더링 통합 훅
 * 
 * TileInstanceManager, WallCullingManager, LODManager를 통합하여
 * React Three Fiber 환경에서 쉽게 사용할 수 있도록 합니다.
 * 
 * @param grid - 2D 타일 그리드 데이터
 * @param config - 전역 타일 설정
 * @param options - 추가 옵션
 */
export function useTileRenderer(
  grid: TileCell[][] | null,
  config: GlobalTileConfig | null,
  options: UseTileRendererOptions = {}
): UseTileRendererReturn {
  const {
    enableLOD = true,
    enableWallCulling = true,
    surfaceId = 'FLOOR',
    onLODChange,
    onWallVisibilityChange,
  } = options;
  
  // ═══════════════════════════════════════════════════════════════════════
  // Refs & State
  // ═══════════════════════════════════════════════════════════════════════
  
  const meshRef = useRef<InstancedMesh>(null);
  const instanceManagerRef = useRef<TileInstanceManager | null>(null);
  const wallCullingManagerRef = useRef<WallCullingManager | null>(null);
  const lodManagerRef = useRef<LODManager | null>(null);
  
  const currentLODRef = useRef<LODLevel>('HIGH');
  const culledWallsRef = useRef<SurfaceId[]>([]);
  const needsUpdateRef = useRef<boolean>(false);
  
  // ═══════════════════════════════════════════════════════════════════════
  // Initialization
  // ═══════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    // 그리드나 설정이 없으면 초기화 건너뜀
    if (!grid || !config) return;
    
    // Instance Manager 생성
    const instanceManager = createTileInstanceManager(grid, config, surfaceId);
    instanceManagerRef.current = instanceManager;
    
    // Wall Culling Manager 생성
    if (enableWallCulling) {
      wallCullingManagerRef.current = new WallCullingManager();
    }
    
    // LOD Manager 생성
    if (enableLOD) {
      const lodManager = createLODManager();
      lodManagerRef.current = lodManager;
      
      // LOD 변경 콜백 등록
      if (onLODChange) {
        lodManager.onLevelChange(onLODChange);
      }
    }
    
    // InstancedMesh에 버퍼 연결
    if (meshRef.current) {
      const matrices = instanceManager.getMatrixBuffer();
      const colors = instanceManager.getColorBuffer();
      
      // instanceMatrix 설정
      meshRef.current.instanceMatrix.array = matrices;
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.count = instanceManager.getCount();
      
      // instanceColor 설정 (지원되는 경우)
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.array = colors;
        meshRef.current.instanceColor.needsUpdate = true;
      }
    }
    
    needsUpdateRef.current = true;
    
    // Cleanup
    return () => {
      instanceManagerRef.current?.dispose();
      instanceManagerRef.current = null;
      wallCullingManagerRef.current = null;
      lodManagerRef.current = null;
    };
  }, [grid, config, surfaceId, enableLOD, enableWallCulling, onLODChange]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // Camera Update Handler
  // ═══════════════════════════════════════════════════════════════════════
  
  const onCameraMove = useCallback((
    cameraPosition: { x: number; y: number; z: number },
    targetPosition: { x: number; y: number; z: number }
  ) => {
    // LOD 업데이트
    if (enableLOD && lodManagerRef.current) {
      const distance = calculateCameraDistance(cameraPosition, targetPosition);
      const lodChange = lodManagerRef.current.updateDistance(distance);
      
      if (lodChange) {
        currentLODRef.current = lodChange.level;
        needsUpdateRef.current = true;
      }
    }
    
    // Wall Culling 업데이트
    if (enableWallCulling && wallCullingManagerRef.current) {
      const cameraState = extractCameraState(
        { position: cameraPosition },
        targetPosition
      );
      
      const wallChanges = wallCullingManagerRef.current.updateCameraState(cameraState);
      
      if (wallChanges.length > 0) {
        culledWallsRef.current = wallCullingManagerRef.current.getOccludedWalls();
        needsUpdateRef.current = true;
        
        if (onWallVisibilityChange) {
          onWallVisibilityChange(wallChanges);
        }
      }
    }
    
    // InstancedMesh 업데이트
    if (needsUpdateRef.current && meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [enableLOD, enableWallCulling, onWallVisibilityChange]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // Tile Visibility Control
  // ═══════════════════════════════════════════════════════════════════════
  
  const setTileVisibility = useCallback((tileId: string, visible: boolean) => {
    if (instanceManagerRef.current) {
      instanceManagerRef.current.setTileVisibility(tileId, visible);
      needsUpdateRef.current = true;
      
      if (meshRef.current) {
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════
  // Update Flag Control
  // ═══════════════════════════════════════════════════════════════════════
  
  const clearUpdateFlag = useCallback(() => {
    needsUpdateRef.current = false;
    instanceManagerRef.current?.clearDirtyFlag();
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════
  // Return Values
  // ═══════════════════════════════════════════════════════════════════════
  
  return useMemo(() => ({
    meshRef,
    instanceManager: instanceManagerRef.current,
    onCameraMove,
    setTileVisibility,
    currentLOD: currentLODRef.current,
    culledWalls: culledWallsRef.current,
    needsUpdate: needsUpdateRef.current,
    clearUpdateFlag,
    visibleTileCount: instanceManagerRef.current?.getVisibleCount() ?? 0,
  }), [onCameraMove, setTileVisibility, clearUpdateFlag]);
}

// ═══════════════════════════════════════════════════════════════════════════
// Additional Hooks
// ═══════════════════════════════════════════════════════════════════════════

/**
 * LOD 전용 훅 (경량)
 */
export function useLOD(
  enabled: boolean = true
): {
  lodManager: LODManager | null;
  updateDistance: (distance: number) => LODLevel;
  currentLevel: LODLevel;
} {
  const lodManagerRef = useRef<LODManager | null>(null);
  const currentLevelRef = useRef<LODLevel>('HIGH');
  
  useEffect(() => {
    if (enabled) {
      lodManagerRef.current = createLODManager();
    }
    return () => {
      lodManagerRef.current = null;
    };
  }, [enabled]);
  
  const updateDistance = useCallback((distance: number): LODLevel => {
    if (lodManagerRef.current) {
      const change = lodManagerRef.current.updateDistance(distance);
      if (change) {
        currentLevelRef.current = change.level;
      }
    }
    return currentLevelRef.current;
  }, []);
  
  return useMemo(() => ({
    lodManager: lodManagerRef.current,
    updateDistance,
    currentLevel: currentLevelRef.current,
  }), [updateDistance]);
}

/**
 * Wall Culling 전용 훅 (경량)
 */
export function useWallCulling(
  enabled: boolean = true
): {
  cullingManager: WallCullingManager | null;
  updateCamera: (
    cameraPosition: { x: number; y: number; z: number },
    targetPosition: { x: number; y: number; z: number }
  ) => WallVisibilityState[];
  getOccludedWalls: () => SurfaceId[];
} {
  const cullingManagerRef = useRef<WallCullingManager | null>(null);
  
  useEffect(() => {
    if (enabled) {
      cullingManagerRef.current = new WallCullingManager();
    }
    return () => {
      cullingManagerRef.current = null;
    };
  }, [enabled]);
  
  const updateCamera = useCallback((
    cameraPosition: { x: number; y: number; z: number },
    targetPosition: { x: number; y: number; z: number }
  ): WallVisibilityState[] => {
    if (!cullingManagerRef.current) return [];
    
    const cameraState = extractCameraState(
      { position: cameraPosition },
      targetPosition
    );
    
    return cullingManagerRef.current.updateCameraState(cameraState);
  }, []);
  
  const getOccludedWalls = useCallback((): SurfaceId[] => {
    return cullingManagerRef.current?.getOccludedWalls() ?? [];
  }, []);
  
  return useMemo(() => ({
    cullingManager: cullingManagerRef.current,
    updateCamera,
    getOccludedWalls,
  }), [updateCamera, getOccludedWalls]);
}

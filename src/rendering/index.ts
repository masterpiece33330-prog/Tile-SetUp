/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Rendering Module
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 3D 렌더링 시스템의 메인 진입점
 * 
 * 이 모듈은 Three.js 기반의 타일 시각화를 위한 모든 컴포넌트를 제공합니다.
 * 
 * 핵심 기능:
 * 1. TileInstanceManager - InstancedMesh 기반 대량 타일 렌더링
 * 2. WallCullingManager - 카메라 기반 벽면 투명화
 * 3. LODManager - 거리 기반 디테일 조절
 * 4. React Hooks - @react-three/fiber 통합
 * 
 * ⚠️ PERFORMANCE TARGETS:
 * - 타일 10,000개: Draw Call < 5회
 * - 저사양 모바일: 60 FPS 유지
 * - 메모리: GC 스파이크 최소화
 * 
 * @module rendering
 */

// ═══════════════════════════════════════════════════════════════════════════
// Core Managers
// ═══════════════════════════════════════════════════════════════════════════

export {
  TileInstanceManager,
  createTileInstanceManager,
  estimateInstanceBufferMemory,
} from './TileInstanceManager';

export {
  WallCullingManager,
  calculateAzimuthFromCamera,
  extractCameraState,
  type WallVisibilityState,
  type CameraState,
  type WallCullingConfig,
} from './WallCullingManager';

export {
  LODManager,
  createLODManager,
  calculateCameraDistance,
  type LODLevelConfig,
  type DevicePerformanceTier,
} from './LODManager';

// ═══════════════════════════════════════════════════════════════════════════
// React Hooks (@react-three/fiber integration)
// ═══════════════════════════════════════════════════════════════════════════

export {
  useTileRenderer,
  useLOD,
  useWallCulling,
  type UseTileRendererOptions,
  type UseTileRendererReturn,
} from './hooks';

// ═══════════════════════════════════════════════════════════════════════════
// Re-exports from types (렌더링 관련)
// ═══════════════════════════════════════════════════════════════════════════

export type {
  TileInstanceBuffer,
  InstanceBufferUpdate,
  LODLevel,
  RenderSettings,
  SurfaceId,
} from '../types';

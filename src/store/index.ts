/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Store Module
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Zustand 기반 전역 상태 관리 모듈
 * 
 * 사용법:
 * ```typescript
 * import { 
 *   useTileSetupStore,
 *   useAreaDimensions,
 *   useTileConfig,
 *   useHistoryState,
 * } from './store';
 * 
 * // 컴포넌트에서 사용
 * function TileConfigPanel() {
 *   const { tileWidth, tileHeight, setTileWidth } = useTileConfig();
 *   // ...
 * }
 * ```
 * 
 * @module store
 */

// ═══════════════════════════════════════════════════════════════════════════
// Main Store
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Main Store Hook
  useTileSetupStore,
  
  // Type
  type TileSetupStore,
  type ToolType,
} from './tileSetupStore';

// ═══════════════════════════════════════════════════════════════════════════
// Selector Hooks (성능 최적화된 부분 구독)
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Project
  useProjectInfo,
  
  // Area
  useAreaDimensions,
  
  // Tile
  useTileConfig,
  useCalculationResult,
  useGridData,
  
  // Pattern
  usePatternState,
  
  // Masking
  useMaskingState,
  
  // History
  useHistoryState,
  
  // UI
  useUIState,
  useSelectionState,
} from './tileSetupStore';

// ═══════════════════════════════════════════════════════════════════════════
// Action Helpers (복합 액션)
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Tile Actions
  moveSelectedTiles,
  rotateSelectedTiles,
  
  // Project Actions
  recalculateAll,
  initializeProject,
  
  // Subscriptions
  setupAutoSave,
  subscribeToGridChanges,
} from './tileSetupStore';

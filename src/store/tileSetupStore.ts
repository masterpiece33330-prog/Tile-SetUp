/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Zustand State Management
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 전역 상태 관리 시스템
 * 
 * 아키텍처:
 * 1. Slice Pattern - 관심사별 상태 분리
 * 2. 선택적 구독 - 필요한 상태만 구독하여 리렌더링 최소화
 * 3. 미들웨어 - 자동 저장, 개발자 도구 연동
 * 4. 통합 - 계산, 패턴, 마스킹, 히스토리 모듈 연결
 * 
 * 슬라이스 구조:
 * - ProjectSlice: 프로젝트 메타데이터
 * - AreaSlice: 시공 면적 설정
 * - TileSlice: 타일 설정 및 그리드
 * - PatternSlice: 패턴 선택 및 적용
 * - MaskingSlice: 마스킹 레이어 관리
 * - HistorySlice: Undo/Redo 연동
 * - UISlice: UI 상태 (선택, 뷰 모드 등)
 * 
 * Ref: Chapter 6 - 파일 관리 시스템 (프로젝트 상태)
 * Ref: 마스터 프롬프트 - "상태 관리는 Zustand 권장"
 */

import { create, StateCreator } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import {
  MicroMM,
  Point,
  TileCell,
  PatternId,
  EditShape,
  TileCalculationInput,
  TileCalculationResult,
  StartLineX,
  StartLineY,
} from '../types';

import {
  mmToMicro,
  microToMM,
  calculateTileQuantity,
  getTileDimension,
  GlobalTileConfig,
  PATTERN_REGISTRY,
  applyPatternToGrid,
  MaskingManager,
  createMaskingManager,
  HistoryManager,
  createHistoryManager,
  Command,
  TileMoveCommand,
  TileRotateCommand,
  BatchCommand,
} from '../utils';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Slice Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 프로젝트 슬라이스
 */
interface ProjectSlice {
  // State
  projectId: string | null;
  projectName: string;
  createdAt: Date | null;
  modifiedAt: Date | null;
  isDirty: boolean;
  
  // Actions
  setProjectName: (name: string) => void;
  createNewProject: () => void;
  markDirty: () => void;
  markClean: () => void;
}

/**
 * 시공 면적 슬라이스
 */
interface AreaSlice {
  // State
  areaWidth: MicroMM;
  areaHeight: MicroMM;
  
  // Actions
  setAreaWidth: (width: number) => void;  // mm 단위 입력
  setAreaHeight: (height: number) => void;
  setAreaDimensions: (width: number, height: number) => void;
}

/**
 * 타일 설정 슬라이스
 */
interface TileSlice {
  // State
  tileWidth: MicroMM;
  tileHeight: MicroMM;
  gapSize: MicroMM;
  startLineX: StartLineX;
  startLineY: StartLineY;
  
  // 계산 결과
  gridData: TileCell[][];
  totalTileCount: number;
  fullTileCount: number;
  largePieceCount: number;
  smallPieceCount: number;
  
  // Actions
  setTileWidth: (width: number) => void;
  setTileHeight: (height: number) => void;
  setGapSize: (gap: number) => void;
  setStartLine: (x: StartLineX, y: StartLineY) => void;
  recalculateGrid: () => void;
  
  // 타일 개별 조작
  getTileById: (id: string) => TileCell | undefined;
  updateTile: (id: string, updates: Partial<TileCell>) => void;
}

/**
 * 패턴 슬라이스
 */
interface PatternSlice {
  // State
  currentPatternId: PatternId;
  
  // Actions
  setPattern: (patternId: PatternId) => void;
  applyCurrentPattern: () => void;
}

/**
 * 마스킹 슬라이스
 */
interface MaskingSlice {
  // State
  masks: EditShape[];
  maskingManager: MaskingManager | null;
  
  // Actions
  initMaskingManager: () => void;
  addRectangleMask: (id: string, rect: { x: number; y: number; width: number; height: number }, label?: string) => void;
  addCircleMask: (id: string, circle: { cx: number; cy: number; radius: number }, label?: string) => void;
  removeMask: (id: string) => void;
  moveMask: (id: string, newPosition: { x: number; y: number }) => void;
  getMaskedTileCount: () => number;
}

/**
 * 히스토리 슬라이스
 */
interface HistorySlice {
  // State
  historyManager: HistoryManager;
  canUndo: boolean;
  canRedo: boolean;
  lastAction: string | null;
  
  // Actions
  executeCommand: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  beginGroup: (description: string) => void;
  endGroup: () => void;
  clearHistory: () => void;
}

/**
 * UI 슬라이스
 */
interface UISlice {
  // State
  viewMode: '2D' | '3D';
  currentStep: number;  // 1~7 작업 단계
  isHoldMode: boolean;
  selectedTileIds: string[];
  selectedMaskId: string | null;
  activeTool: ToolType | null;
  zoomLevel: number;
  panOffset: Point;
  
  // Actions
  setViewMode: (mode: '2D' | '3D') => void;
  setCurrentStep: (step: number) => void;
  toggleHoldMode: () => void;
  selectTile: (id: string, multiSelect?: boolean) => void;
  deselectTile: (id: string) => void;
  clearTileSelection: () => void;
  selectMask: (id: string | null) => void;
  setActiveTool: (tool: ToolType | null) => void;
  setZoom: (level: number) => void;
  setPan: (offset: Point) => void;
}

/**
 * 도구 타입
 */
export type ToolType =
  | 'SELECT'
  | 'SCISSORS'
  | 'LINE'
  | 'RECTANGLE'
  | 'CIRCLE'
  | 'HEXAGON'
  | 'POLYGON'
  | 'MEASURE_DISTANCE'
  | 'MEASURE_ANGLE'
  | 'MEASURE_AREA'
  | 'TEXT';

/**
 * 전체 스토어 타입
 */
export type TileSetupStore = 
  ProjectSlice & 
  AreaSlice & 
  TileSlice & 
  PatternSlice & 
  MaskingSlice & 
  HistorySlice & 
  UISlice;

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Slice Implementations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 프로젝트 슬라이스 생성자
 */
const createProjectSlice: StateCreator<
  TileSetupStore,
  [['zustand/immer', never]],
  [],
  ProjectSlice
> = (set) => ({
  // Initial State
  projectId: null,
  projectName: '새 프로젝트',
  createdAt: null,
  modifiedAt: null,
  isDirty: false,
  
  // Actions
  setProjectName: (name) => set((state) => {
    state.projectName = name;
    state.isDirty = true;
    state.modifiedAt = new Date();
  }),
  
  createNewProject: () => set((state) => {
    state.projectId = `proj_${Date.now()}`;
    state.projectName = '새 프로젝트';
    state.createdAt = new Date();
    state.modifiedAt = new Date();
    state.isDirty = false;
  }),
  
  markDirty: () => set((state) => {
    state.isDirty = true;
    state.modifiedAt = new Date();
  }),
  
  markClean: () => set((state) => {
    state.isDirty = false;
  }),
});

/**
 * 시공 면적 슬라이스 생성자
 */
const createAreaSlice: StateCreator<
  TileSetupStore,
  [['zustand/immer', never]],
  [],
  AreaSlice
> = (set, get) => ({
  // Initial State (원본 기획안 예시: 55,000 x 40,000mm)
  areaWidth: mmToMicro(55000) as MicroMM,
  areaHeight: mmToMicro(40000) as MicroMM,
  
  // Actions
  setAreaWidth: (width) => set((state) => {
    state.areaWidth = mmToMicro(width) as MicroMM;
    state.isDirty = true;
  }),
  
  setAreaHeight: (height) => set((state) => {
    state.areaHeight = mmToMicro(height) as MicroMM;
    state.isDirty = true;
  }),
  
  setAreaDimensions: (width, height) => set((state) => {
    state.areaWidth = mmToMicro(width) as MicroMM;
    state.areaHeight = mmToMicro(height) as MicroMM;
    state.isDirty = true;
  }),
});

/**
 * 타일 설정 슬라이스 생성자
 */
const createTileSlice: StateCreator<
  TileSetupStore,
  [['zustand/immer', never]],
  [],
  TileSlice
> = (set, get) => ({
  // Initial State (원본 기획안 예시: 300 x 350mm, Gap 1.5mm)
  tileWidth: mmToMicro(300) as MicroMM,
  tileHeight: mmToMicro(350) as MicroMM,
  gapSize: mmToMicro(1.5) as MicroMM,
  startLineX: 'LEFT',
  startLineY: 'TOP',
  
  // 계산 결과
  gridData: [],
  totalTileCount: 0,
  fullTileCount: 0,
  largePieceCount: 0,
  smallPieceCount: 0,
  
  // Actions
  setTileWidth: (width) => set((state) => {
    state.tileWidth = mmToMicro(width) as MicroMM;
    state.isDirty = true;
  }),
  
  setTileHeight: (height) => set((state) => {
    state.tileHeight = mmToMicro(height) as MicroMM;
    state.isDirty = true;
  }),
  
  setGapSize: (gap) => set((state) => {
    state.gapSize = mmToMicro(gap) as MicroMM;
    state.isDirty = true;
  }),
  
  setStartLine: (x, y) => set((state) => {
    state.startLineX = x;
    state.startLineY = y;
    state.isDirty = true;
  }),
  
  recalculateGrid: () => {
    const state = get();
    
    const input: TileCalculationInput = {
      areaWidth: state.areaWidth,
      areaHeight: state.areaHeight,
      tileWidth: state.tileWidth,
      tileHeight: state.tileHeight,
      gapSize: state.gapSize,
      startLine: { x: state.startLineX, y: state.startLineY },
    };
    
    const result = calculateTileQuantity(input);
    
    set((s) => {
      s.gridData = result.gridData;
      s.totalTileCount = result.totalTileCount;
      s.fullTileCount = result.fullTileCount;
      s.largePieceCount = result.largePieceCount;
      s.smallPieceCount = result.smallPieceCount;
      s.isDirty = true;
      
      // 마스킹 매니저 재초기화
      s.maskingManager = null;
    });
    
    // 마스킹 매니저 초기화
    get().initMaskingManager();
  },
  
  getTileById: (id) => {
    const { gridData } = get();
    for (const row of gridData) {
      for (const tile of row) {
        if (tile.id === id) return tile;
      }
    }
    return undefined;
  },
  
  updateTile: (id, updates) => set((state) => {
    for (const row of state.gridData) {
      for (const tile of row) {
        if (tile.id === id) {
          Object.assign(tile, updates);
          state.isDirty = true;
          return;
        }
      }
    }
  }),
});

/**
 * 패턴 슬라이스 생성자
 */
const createPatternSlice: StateCreator<
  TileSetupStore,
  [['zustand/immer', never]],
  [],
  PatternSlice
> = (set, get) => ({
  // Initial State
  currentPatternId: 'LINEAR_SQUARE',
  
  // Actions
  setPattern: (patternId) => set((state) => {
    state.currentPatternId = patternId;
    state.isDirty = true;
  }),
  
  applyCurrentPattern: () => {
    const state = get();
    const { gridData, currentPatternId, tileWidth, tileHeight, gapSize } = state;
    
    if (gridData.length === 0) return;
    
    const config: GlobalTileConfig = {
      tileWidth,
      tileHeight,
      gap: gapSize,
    };
    
    const patternedGrid = applyPatternToGrid(
      gridData,
      currentPatternId,
      config,
      {
        preserveVisibility: true,
        preserveMasking: true,
        preserveLocks: true,
      }
    );
    
    set((s) => {
      s.gridData = patternedGrid;
      s.isDirty = true;
    });
  },
});

/**
 * 마스킹 슬라이스 생성자
 */
const createMaskingSlice: StateCreator<
  TileSetupStore,
  [['zustand/immer', never]],
  [],
  MaskingSlice
> = (set, get) => ({
  // Initial State
  masks: [],
  maskingManager: null,
  
  // Actions
  initMaskingManager: () => {
    const state = get();
    const { gridData, tileWidth, tileHeight, gapSize } = state;
    
    if (gridData.length === 0) return;
    
    const config: GlobalTileConfig = {
      tileWidth,
      tileHeight,
      gap: gapSize,
    };
    
    const manager = createMaskingManager(gridData, config);
    
    // 변경 시 스토어 업데이트
    manager.onChange((affectedTileIds) => {
      set((s) => {
        s.masks = manager.exportMasks();
        s.isDirty = true;
      });
    });
    
    set((s) => {
      s.maskingManager = manager;
    });
  },
  
  addRectangleMask: (id, rect, label) => {
    const { maskingManager, historyManager } = get();
    if (!maskingManager) return;
    
    // 히스토리에 기록
    // Note: MaskAddCommand 사용 시 maskingManager 참조 필요
    
    maskingManager.addRectangleMask(
      id,
      {
        x: mmToMicro(rect.x) as MicroMM,
        y: mmToMicro(rect.y) as MicroMM,
        width: mmToMicro(rect.width) as MicroMM,
        height: mmToMicro(rect.height) as MicroMM,
      },
      label
    );
    
    set((s) => {
      s.masks = maskingManager.exportMasks();
      s.isDirty = true;
    });
  },
  
  addCircleMask: (id, circle, label) => {
    const { maskingManager } = get();
    if (!maskingManager) return;
    
    maskingManager.addCircleMask(
      id,
      {
        cx: mmToMicro(circle.cx) as MicroMM,
        cy: mmToMicro(circle.cy) as MicroMM,
        radius: mmToMicro(circle.radius) as MicroMM,
      },
      label
    );
    
    set((s) => {
      s.masks = maskingManager.exportMasks();
      s.isDirty = true;
    });
  },
  
  removeMask: (id) => {
    const { maskingManager } = get();
    if (!maskingManager) return;
    
    maskingManager.removeMask(id);
    
    set((s) => {
      s.masks = maskingManager.exportMasks();
      s.isDirty = true;
    });
  },
  
  moveMask: (id, newPosition) => {
    const { maskingManager } = get();
    if (!maskingManager) return;
    
    maskingManager.moveShape(id, {
      x: mmToMicro(newPosition.x) as MicroMM,
      y: mmToMicro(newPosition.y) as MicroMM,
    });
    
    set((s) => {
      s.masks = maskingManager.exportMasks();
      s.isDirty = true;
    });
  },
  
  getMaskedTileCount: () => {
    const { maskingManager } = get();
    if (!maskingManager) return 0;
    return maskingManager.getMaskedTileCount();
  },
});

/**
 * 히스토리 슬라이스 생성자
 */
const createHistorySlice: StateCreator<
  TileSetupStore,
  [['zustand/immer', never]],
  [],
  HistorySlice
> = (set, get) => {
  // 히스토리 매니저 인스턴스
  const historyManager = createHistoryManager({ maxUndoStackSize: 50 });
  
  // 변경 이벤트 구독
  historyManager.onChange((event) => {
    set((s) => {
      s.canUndo = event.canUndo;
      s.canRedo = event.canRedo;
      s.lastAction = event.command?.description || null;
    });
  });
  
  return {
    // Initial State
    historyManager,
    canUndo: false,
    canRedo: false,
    lastAction: null,
    
    // Actions
    executeCommand: (command) => {
      historyManager.execute(command);
      get().markDirty();
    },
    
    undo: () => {
      const result = historyManager.undo();
      if (result?.success) {
        get().markDirty();
      }
    },
    
    redo: () => {
      const result = historyManager.redo();
      if (result?.success) {
        get().markDirty();
      }
    },
    
    beginGroup: (description) => {
      historyManager.beginGroup(description);
    },
    
    endGroup: () => {
      historyManager.endGroup();
    },
    
    clearHistory: () => {
      historyManager.clear();
    },
  };
};

/**
 * UI 슬라이스 생성자
 */
const createUISlice: StateCreator<
  TileSetupStore,
  [['zustand/immer', never]],
  [],
  UISlice
> = (set) => ({
  // Initial State
  viewMode: '2D',
  currentStep: 1,
  isHoldMode: false,
  selectedTileIds: [],
  selectedMaskId: null,
  activeTool: 'SELECT',
  zoomLevel: 1.0,
  panOffset: { x: 0 as MicroMM, y: 0 as MicroMM },
  
  // Actions
  setViewMode: (mode) => set((state) => {
    state.viewMode = mode;
  }),
  
  setCurrentStep: (step) => set((state) => {
    if (step >= 1 && step <= 7) {
      state.currentStep = step;
      state.isHoldMode = false; // 스텝 이동 시 HOLD 해제
    }
  }),
  
  toggleHoldMode: () => set((state) => {
    state.isHoldMode = !state.isHoldMode;
  }),
  
  selectTile: (id, multiSelect = false) => set((state) => {
    if (multiSelect) {
      if (!state.selectedTileIds.includes(id)) {
        state.selectedTileIds.push(id);
      }
    } else {
      state.selectedTileIds = [id];
    }
  }),
  
  deselectTile: (id) => set((state) => {
    state.selectedTileIds = state.selectedTileIds.filter(tid => tid !== id);
  }),
  
  clearTileSelection: () => set((state) => {
    state.selectedTileIds = [];
  }),
  
  selectMask: (id) => set((state) => {
    state.selectedMaskId = id;
  }),
  
  setActiveTool: (tool) => set((state) => {
    state.activeTool = tool;
    // 도구 변경 시 선택 해제
    if (tool !== 'SELECT') {
      state.selectedTileIds = [];
      state.selectedMaskId = null;
    }
  }),
  
  setZoom: (level) => set((state) => {
    state.zoomLevel = Math.max(0.1, Math.min(5.0, level));
  }),
  
  setPan: (offset) => set((state) => {
    state.panOffset = offset;
  }),
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: Store Creation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 메인 스토어 생성
 * 
 * 미들웨어:
 * - immer: 불변성 관리 간소화
 * - devtools: Redux DevTools 연동
 * - subscribeWithSelector: 선택적 구독
 * - persist: 로컬 저장 (선택적)
 */
export const useTileSetupStore = create<TileSetupStore>()(
  devtools(
    subscribeWithSelector(
      immer((...args) => ({
        ...createProjectSlice(...args),
        ...createAreaSlice(...args),
        ...createTileSlice(...args),
        ...createPatternSlice(...args),
        ...createMaskingSlice(...args),
        ...createHistorySlice(...args),
        ...createUISlice(...args),
      }))
    ),
    {
      name: 'TileSetupStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Selector Hooks (성능 최적화)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 프로젝트 정보만 구독
 */
export const useProjectInfo = () => useTileSetupStore((state) => ({
  projectId: state.projectId,
  projectName: state.projectName,
  isDirty: state.isDirty,
  createdAt: state.createdAt,
  modifiedAt: state.modifiedAt,
}));

/**
 * 시공 면적만 구독
 */
export const useAreaDimensions = () => useTileSetupStore((state) => ({
  areaWidth: microToMM(state.areaWidth),
  areaHeight: microToMM(state.areaHeight),
  setAreaWidth: state.setAreaWidth,
  setAreaHeight: state.setAreaHeight,
  setAreaDimensions: state.setAreaDimensions,
}));

/**
 * 타일 설정만 구독
 */
export const useTileConfig = () => useTileSetupStore((state) => ({
  tileWidth: microToMM(state.tileWidth),
  tileHeight: microToMM(state.tileHeight),
  gapSize: microToMM(state.gapSize),
  startLineX: state.startLineX,
  startLineY: state.startLineY,
  setTileWidth: state.setTileWidth,
  setTileHeight: state.setTileHeight,
  setGapSize: state.setGapSize,
  setStartLine: state.setStartLine,
}));

/**
 * 계산 결과만 구독
 */
export const useCalculationResult = () => useTileSetupStore((state) => ({
  totalTileCount: state.totalTileCount,
  fullTileCount: state.fullTileCount,
  largePieceCount: state.largePieceCount,
  smallPieceCount: state.smallPieceCount,
  recalculateGrid: state.recalculateGrid,
}));

/**
 * 그리드 데이터만 구독 (렌더링용)
 */
export const useGridData = () => useTileSetupStore((state) => state.gridData);

/**
 * 패턴 상태만 구독
 */
export const usePatternState = () => useTileSetupStore((state) => ({
  currentPatternId: state.currentPatternId,
  setPattern: state.setPattern,
  applyCurrentPattern: state.applyCurrentPattern,
}));

/**
 * 마스킹 상태만 구독
 */
export const useMaskingState = () => useTileSetupStore((state) => ({
  masks: state.masks,
  addRectangleMask: state.addRectangleMask,
  addCircleMask: state.addCircleMask,
  removeMask: state.removeMask,
  moveMask: state.moveMask,
  getMaskedTileCount: state.getMaskedTileCount,
}));

/**
 * 히스토리 상태만 구독
 */
export const useHistoryState = () => useTileSetupStore((state) => ({
  canUndo: state.canUndo,
  canRedo: state.canRedo,
  lastAction: state.lastAction,
  undo: state.undo,
  redo: state.redo,
  executeCommand: state.executeCommand,
  beginGroup: state.beginGroup,
  endGroup: state.endGroup,
}));

/**
 * UI 상태만 구독
 */
export const useUIState = () => useTileSetupStore((state) => ({
  viewMode: state.viewMode,
  currentStep: state.currentStep,
  isHoldMode: state.isHoldMode,
  activeTool: state.activeTool,
  zoomLevel: state.zoomLevel,
  setViewMode: state.setViewMode,
  setCurrentStep: state.setCurrentStep,
  toggleHoldMode: state.toggleHoldMode,
  setActiveTool: state.setActiveTool,
  setZoom: state.setZoom,
}));

/**
 * 선택 상태만 구독
 */
export const useSelectionState = () => useTileSetupStore((state) => ({
  selectedTileIds: state.selectedTileIds,
  selectedMaskId: state.selectedMaskId,
  selectTile: state.selectTile,
  deselectTile: state.deselectTile,
  clearTileSelection: state.clearTileSelection,
  selectMask: state.selectMask,
}));

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Action Helpers (복합 액션)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 선택된 타일들 일괄 이동 (히스토리 연동)
 */
export function moveSelectedTiles(dx: number, dy: number): void {
  const state = useTileSetupStore.getState();
  const { selectedTileIds, gridData, historyManager, tileWidth, tileHeight, gapSize } = state;
  
  if (selectedTileIds.length === 0) return;
  
  const dxMicro = mmToMicro(dx) as MicroMM;
  const dyMicro = mmToMicro(dy) as MicroMM;
  
  // 그룹으로 묶기
  historyManager.beginGroup(`${selectedTileIds.length}개 타일 이동`);
  
  for (const tileId of selectedTileIds) {
    const tileGetter = () => state.getTileById(tileId);
    const cmd = new TileMoveCommand(tileGetter, tileId, dxMicro, dyMicro);
    historyManager.execute(cmd);
  }
  
  historyManager.endGroup();
  
  useTileSetupStore.setState({ isDirty: true });
}

/**
 * 선택된 타일들 회전 (히스토리 연동)
 */
export function rotateSelectedTiles(direction: 'CW' | 'CCW'): void {
  const state = useTileSetupStore.getState();
  const { selectedTileIds, gridData, historyManager } = state;
  
  if (selectedTileIds.length === 0) return;
  
  const rotationDelta = direction === 'CW' ? 90 : -90;
  
  historyManager.beginGroup(`${selectedTileIds.length}개 타일 회전`);
  
  for (const tileId of selectedTileIds) {
    const tile = state.getTileById(tileId);
    if (!tile) continue;
    
    const fromRotation = tile.rotation;
    let toRotation = (fromRotation + rotationDelta) % 360;
    if (toRotation < 0) toRotation += 360;
    
    const tileGetter = () => state.getTileById(tileId);
    const cmd = new TileRotateCommand(
      tileGetter,
      tileId,
      fromRotation as 0 | 90 | 180 | 270,
      toRotation as 0 | 90 | 180 | 270
    );
    historyManager.execute(cmd);
  }
  
  historyManager.endGroup();
  
  useTileSetupStore.setState({ isDirty: true });
}

/**
 * 전체 재계산 (시공면적, 타일설정 변경 후)
 */
export function recalculateAll(): void {
  const state = useTileSetupStore.getState();
  state.recalculateGrid();
  state.applyCurrentPattern();
}

/**
 * 프로젝트 초기화
 */
export function initializeProject(): void {
  const state = useTileSetupStore.getState();
  state.createNewProject();
  state.recalculateGrid();
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Subscriptions (외부 연동)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 자동 저장 구독 설정
 * 
 * @example
 * ```typescript
 * // 앱 시작 시 호출
 * const unsubscribe = setupAutoSave(30000, async (state) => {
 *   await saveToLocalStorage(state);
 * });
 * 
 * // 앱 종료 시 구독 해제
 * unsubscribe();
 * ```
 */
export function setupAutoSave(
  intervalMs: number,
  saveFunction: (state: Partial<TileSetupStore>) => Promise<void>
): () => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const unsubscribe = useTileSetupStore.subscribe(
    (state) => state.isDirty,
    (isDirty) => {
      if (isDirty) {
        // 디바운스
        if (timeoutId) clearTimeout(timeoutId);
        
        timeoutId = setTimeout(async () => {
          const state = useTileSetupStore.getState();
          
          // 저장할 데이터 추출
          const saveData = {
            projectId: state.projectId,
            projectName: state.projectName,
            areaWidth: state.areaWidth,
            areaHeight: state.areaHeight,
            tileWidth: state.tileWidth,
            tileHeight: state.tileHeight,
            gapSize: state.gapSize,
            startLineX: state.startLineX,
            startLineY: state.startLineY,
            currentPatternId: state.currentPatternId,
            masks: state.masks,
          };
          
          await saveFunction(saveData);
          useTileSetupStore.setState({ isDirty: false });
        }, intervalMs);
      }
    }
  );
  
  return () => {
    unsubscribe();
    if (timeoutId) clearTimeout(timeoutId);
  };
}

/**
 * 렌더링 업데이트 구독
 * 
 * 그리드 데이터가 변경될 때 3D 렌더러 업데이트
 */
export function subscribeToGridChanges(
  callback: (gridData: TileCell[][]) => void
): () => void {
  return useTileSetupStore.subscribe(
    (state) => state.gridData,
    callback
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Utilities Module
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 핵심 유틸리티 함수들의 진입점
 * 
 * 이 모듈은 다음 기능을 제공합니다:
 * 1. math - 정수 연산 유틸리티 (MicroMM 변환)
 * 2. tileCalculationService - 물량 산출 엔진
 * 3. patternSystem - 15가지 타일 패턴 알고리즘
 * 4. maskingLayer - 비파괴 편집 시스템
 * 
 * @module utils
 */

// ═══════════════════════════════════════════════════════════════════════════
// Math Utilities (정수 연산)
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Constants
  MICRO_SCALE,
  
  // Unit Conversion
  mmToMicro,
  microToMM,
  microToM,
  microAreaToM2,
  degreeToRadian,
  radianToDegree,
  
  // Safe Arithmetic
  addMicro,
  subtractMicro,
  multiplyMicro,
  divideMicro,
  microSqrt,
  safeDivide,
  safeModulo,
  clampMicro,
  
  // Tile Calculations
  calculateTileCountAndRemainder,
  calculateAreaRatio,
  
  // Input Validation
  validateTileInput,
  
  // Geometry
  calculateDistance,
  calculateAngle,
  calculatePolygonArea,
  checkAABBIntersection,
  isPointInCircle,
  
  // Matrix Operations
  createIdentityMatrix,
  createTransformMatrix,
  
  // Formatting
  formatDistance,
  formatArea,
} from './math';

// ═══════════════════════════════════════════════════════════════════════════
// Tile Calculation Service (물량 산출)
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Main Function
  calculateTileQuantity,
  
  // Helpers
  getTileDimension,
  validateWithOriginalExample,
  estimateMemoryUsage,
  
  // Types
  type GlobalTileConfig,
} from './tileCalculationService';

// ═══════════════════════════════════════════════════════════════════════════
// Pattern System (15가지 패턴)
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Registry
  PATTERN_REGISTRY,
  
  // Query Functions
  getAllPatterns,
  getPatternById,
  getCompatiblePatterns,
  
  // Pattern Application
  applyPatternToGrid,
  
  // Utilities
  generatePatternPreview,
  validatePatternApplication,
  
  // Types
  type PatternOffset,
  type PatternOffsetCalculator,
  type PatternMetadata,
  type ApplyPatternOptions,
} from './patternSystem';

// ═══════════════════════════════════════════════════════════════════════════
// Masking Layer (비파괴 편집)
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Manager
  MaskingManager,
  createMaskingManager,
  
  // Intersection Detection
  checkRectangleTileIntersection,
  checkCircleTileIntersection,
  checkPolygonTileIntersection,
  checkShapeTileIntersection,
  
  // Types
  type IntersectionType,
  type IntersectionResult,
  type MaskLayer,
  type MaskingConfig,
} from './maskingLayer';

// ═══════════════════════════════════════════════════════════════════════════
// Command History (Undo/Redo)
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Manager
  HistoryManager,
  createHistoryManager,
  
  // Commands
  TileMoveCommand,
  TileRotateCommand,
  TileVisibilityCommand,
  TileLockCommand,
  MaskAddCommand,
  MaskRemoveCommand,
  MaskMoveCommand,
  PatternChangeCommand,
  BatchCommand,
  
  // Utilities
  generateCommandId,
  createTileMoveCommand,
  createTileRotateCommand,
  
  // Types
  type Command,
  type CommandResult,
  type CommandType,
  type HistoryManagerConfig,
  type HistoryChangeEvent,
} from './commandHistory';

// ═══════════════════════════════════════════════════════════════════════════
// Supplementary Materials (부자재 - Chapter 9)
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Joint Tape (조인트지)
  calculateJointTapeQuantity,
  DEFAULT_JOINT_TAPE_CONFIG,
  
  // Silicone (실리콘)
  createSiliconeSegment,
  generateFloorWallSilicone,
  generateMaskPerimeterSilicone,
  calculateSiliconeQuantity,
  DEFAULT_SILICONE_CONFIG,
  
  // Angle (앵글)
  createAnglePlacement,
  detectCornersAndGenerateAngles,
  generatePillarAngles,
  calculateAngleQuantity,
  DEFAULT_ANGLE_CONFIG,
  
  // Manager
  createSupplementaryMaterialsManager,
  
  // Validation
  validateAnglePlacement,
  validateSiliconeSegment,
  
  // Types
  type JointTapeConfig,
  type JointTapeResult,
  type SiliconeSegment,
  type SiliconeLocation,
  type SiliconeConfig,
  type SiliconeResult,
  type AnglePlacement,
  type AngleType,
  type AngleMaterial,
  type AngleConfig,
  type AngleResult,
  type SupplementaryMaterialsResult,
  type SupplementaryMaterialsManager,
  type MaterialsSummary,
  type MaterialsSummaryItem,
  type Room3D,
  type Wall3D,
} from './supplementaryMaterials';

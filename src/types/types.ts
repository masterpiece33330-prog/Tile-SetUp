/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Master Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Engineering Principle #1: INTEGER MATH ONLY
 * - All dimensions use `MicroUnit` (1mm = 1000 units) to prevent floating-point errors
 * - Display conversion happens only at render time via utility functions
 * 
 * Engineering Principle #3: NON-DESTRUCTIVE EDITING
 * - All editable entities include `visible` and `masked` flags
 * - Original data is never deleted, only flagged
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 0: Core Primitive Types & Constants
// ═══════════════════════════════════════════════════════════════════════════

/**
 * MicroUnit: Internal precision unit (1mm = 1000 MicroUnits)
 * This prevents floating-point arithmetic errors in tile calculations.
 * Ref: Engineering Constraint #1
 */
export type MicroUnit = number & { readonly __brand: 'MicroUnit' };

/**
 * Conversion constants for MicroUnit system
 */
export const MICRO_UNITS_PER_MM = 1000 as const;
export const MICRO_UNITS_PER_CM = 10000 as const;
export const MICRO_UNITS_PER_M = 1000000 as const;

/**
 * Utility type for 2D coordinates in MicroUnits
 */
export interface Point2D {
  readonly x: MicroUnit;
  readonly y: MicroUnit;
}

/**
 * Utility type for 3D coordinates in MicroUnits
 */
export interface Point3D {
  readonly x: MicroUnit;
  readonly y: MicroUnit;
  readonly z: MicroUnit;
}

/**
 * Utility type for dimensions (width, height)
 */
export interface Dimensions2D {
  readonly width: MicroUnit;
  readonly height: MicroUnit;
}

/**
 * Utility type for 3D dimensions
 */
export interface Dimensions3D {
  readonly width: MicroUnit;
  readonly height: MicroUnit;
  readonly depth: MicroUnit;
}

/**
 * Rotation angles (stored as integer degrees * 10 for 0.1° precision)
 */
export type DeciDegree = number & { readonly __brand: 'DeciDegree' };

/**
 * Standard rotation values for tile operations
 * Ref: Chapter 7.2.1 - Tile Rotation Algorithm
 */
export const ROTATION = {
  DEG_0: 0 as DeciDegree,
  DEG_90: 900 as DeciDegree,
  DEG_180: 1800 as DeciDegree,
  DEG_270: 2700 as DeciDegree,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Tile Calculation System (Chapter 1)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start line position for tile alignment
 * Ref: Chapter 1.3.1 - Input Data Model
 */
export type HorizontalAlignment = 'LEFT' | 'CENTER' | 'RIGHT';
export type VerticalAlignment = 'TOP' | 'CENTER' | 'BOTTOM';

export interface StartLineConfig {
  readonly x: HorizontalAlignment;
  readonly y: VerticalAlignment;
}

/**
 * Input parameters for tile quantity calculation
 * Ref: Chapter 1.3.1 - Input Data Model
 * 
 * CORRECTED: Gap uses MicroUnit with 0.1mm precision (100 MicroUnits = 0.1mm)
 */
export interface TileCalculationInput {
  /** Construction area width (MicroUnits, range: 100mm ~ 99,999,999mm) */
  readonly areaWidth: MicroUnit;
  /** Construction area height (MicroUnits) */
  readonly areaHeight: MicroUnit;
  /** Tile width (MicroUnits, range: 10mm ~ 9,999mm) */
  readonly tileWidth: MicroUnit;
  /** Tile height (MicroUnits) */
  readonly tileHeight: MicroUnit;
  /** Gap/grout size (MicroUnits, range: 0 ~ 50mm, 0.1mm step) */
  readonly gapSize: MicroUnit;
  /** Tile alignment starting position */
  readonly startLine: StartLineConfig;
}

/**
 * Tile piece classification
 * Ref: Chapter 1.2.3 - Piece Classification Algorithm
 */
export type TilePieceType = 'FULL' | 'LARGE' | 'SMALL' | 'SPLIT';

/**
 * Individual tile cell in the grid
 * Ref: Chapter 1.3.3 - TileCell Interface
 * 
 * ENHANCED: Added non-destructive editing flags (Engineering Constraint #3)
 */
export interface TileCell {
  /** Unique identifier (1-based index) */
  readonly id: string;
  /** Piece classification */
  readonly type: TilePieceType;
  /** Actual display width after cutting (MicroUnits) */
  readonly width: MicroUnit;
  /** Actual display height after cutting (MicroUnits) */
  readonly height: MicroUnit;
  /** Row index (0-based) */
  readonly row: number;
  /** Column index (0-based) */
  readonly col: number;
  /** Position X in area coordinates (MicroUnits) */
  readonly positionX: MicroUnit;
  /** Position Y in area coordinates (MicroUnits) */
  readonly positionY: MicroUnit;
  
  // === Editing Properties (Chapter 7) ===
  /** Rotation angle (DeciDegree: 0, 900, 1800, 2700) */
  rotation: DeciDegree;
  /** Whether this tile was split from another */
  readonly isSplit: boolean;
  /** Parent tile ID if this is a split piece */
  readonly parentId: string | null;
  /** Split ratio if applicable */
  readonly splitRatio: readonly number[] | null;
  
  // === Non-Destructive Editing Flags (Engineering Constraint #3) ===
  /** Visibility flag (false = hidden by mask, not deleted) */
  visible: boolean;
  /** IDs of shapes/masks covering this tile */
  maskedBy: readonly string[];
  /** Individual tile lock state */
  isLocked: boolean;
}

/**
 * Result of tile quantity calculation
 * Ref: Chapter 1.3.2 - Output Data Model
 */
export interface TileCalculationResult {
  /** Total tile count (entire grid) */
  readonly totalTileCount: number;
  /** Full tiles (no cutting required) */
  readonly fullTileCount: number;
  /** Large pieces (area >= 50% of original) */
  readonly largePieceCount: number;
  /** Small pieces (area < 50% of original) */
  readonly smallPieceCount: number;
  /** Dimensions of large pieces */
  readonly largePieceDimension: Dimensions2D;
  /** Dimensions of small pieces */
  readonly smallPieceDimension: Dimensions2D;
  /** Complete grid data for rendering */
  readonly gridData: readonly (readonly TileCell[])[];
  /** Grid column count */
  readonly colCount: number;
  /** Grid row count */
  readonly rowCount: number;
  /** Left-side remainder for CENTER alignment (MicroUnits) */
  readonly remainderLeft: MicroUnit;
  /** Right-side remainder for CENTER alignment (MicroUnits) */
  readonly remainderRight: MicroUnit;
  /** Top-side remainder for CENTER alignment (MicroUnits) */
  readonly remainderTop: MicroUnit;
  /** Bottom-side remainder for CENTER alignment (MicroUnits) */
  readonly remainderBottom: MicroUnit;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Authentication System (Chapter 2)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Authentication provider types
 * Ref: Chapter 2.1.2 - Login Screen
 */
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'FACEBOOK' | 'TWITTER' | 'APPLE';

/**
 * User account data model
 * Ref: Chapter 2.3.1 - User Data Model
 */
export interface User {
  readonly userId: string;
  readonly email: string;
  readonly passwordHash: string | null; // null for social login
  readonly firstName: string;
  readonly lastName: string;
  readonly authProvider: AuthProvider;
  readonly providerId: string | null;
  readonly createdAt: Date;
  readonly lastLoginAt: Date | null;
}

/**
 * Authentication state for the app
 */
export interface AuthState {
  readonly isAuthenticated: boolean;
  readonly user: User | null;
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly loginAttempts: number;
  readonly lockedUntil: Date | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: Tile Pattern System (Chapter 3)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pattern offset types
 * Ref: Chapter 3.3 - Pattern Data Structure
 */
export type PatternOffsetType = 'NONE' | 'HALF' | 'THIRD' | 'CUSTOM';

/**
 * Pattern identifiers (15 patterns)
 * Ref: Chapter 3.1.1 - Pattern Selection UI
 */
export type PatternId =
  | 'LINEAR_SQUARE'
  | 'DIAMOND'
  | 'RUNNING_BOND_SQUARE'
  | 'STACK_BOND'
  | 'VERTICAL_STACK'
  | 'DIAGONAL_RUNNING'
  | 'RUNNING_BOND_OFFSET'
  | 'VERTICAL_RUNNING_BOND'
  | 'VERTICAL_STACK_OFFSET'
  | 'ONE_THIRD_RUNNING_BOND'
  | 'DIAGONAL_RUNNING_POINT'
  | 'TRADITIONAL_RUNNING_BOND'
  | 'TRADITIONAL_HERRINGBONE'
  | 'STRAIGHT_HERRINGBONE'
  | 'BASKET_WEAVE';

/**
 * Tile pattern definition
 * Ref: Chapter 3.3 - Data Structure
 */
export interface TilePattern {
  readonly id: PatternId;
  readonly nameKo: string;
  readonly nameEn: string;
  readonly thumbnailUrl: string;
  readonly offsetType: PatternOffsetType;
  /** Base rotation angle (DeciDegree) */
  readonly rotation: DeciDegree;
  /** Whether tiles alternate in rotation/position */
  readonly alternating: boolean;
  /** Custom offset ratio (0.0 ~ 1.0 as integer percentage * 1000) */
  readonly customOffsetRatio: number | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: 2D/3D View System (Chapter 4)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * View mode toggle
 */
export type ViewMode = '2D' | '3D';

/**
 * Surface identifiers for 3D room
 * Ref: Chapter 4.1.2 - 3D View Components
 */
export type SurfaceId = 'FLOOR' | 'WALL_1' | 'WALL_2' | 'WALL_3' | 'WALL_4';

/**
 * Room object types (doors, windows)
 * Ref: Chapter 4.3.1 - RoomObject Interface
 */
export type RoomObjectType = 'DOOR' | 'WINDOW';

/**
 * Camera configuration for 3D view
 */
export interface Camera3D {
  readonly position: Point3D;
  /** Rotation in DeciDegrees (pitch, yaw, roll) */
  readonly rotation: {
    readonly pitch: DeciDegree;
    readonly yaw: DeciDegree;
    readonly roll: DeciDegree;
  };
  /** Zoom level (500 = 0.5x, 1000 = 1.0x, 3000 = 3.0x) */
  readonly zoom: number;
}

/**
 * Room dimensions for 3D scene
 */
export interface Room3D {
  readonly width: MicroUnit;
  readonly depth: MicroUnit;
  readonly height: MicroUnit;
}

/**
 * 3D surface (floor or wall) with tile data
 * Ref: Chapter 4.3.1 - Surface3D Interface
 */
export interface Surface3D {
  readonly id: SurfaceId;
  /** Reference to applied tile group */
  readonly tileGroupId: string | null;
  /** Tile grid for this surface */
  readonly gridData: readonly (readonly TileCell[])[];
  /** Visibility flag (for wall culling optimization) */
  visible: boolean;
  /** Opacity for transparent wall rendering (0-1000, where 1000 = 100%) */
  opacity: number;
}

/**
 * Room objects (doors, windows) placed on walls
 * Ref: Chapter 4.3.1 - RoomObject Interface
 */
export interface RoomObject {
  readonly id: string;
  readonly type: RoomObjectType;
  /** Wall this object is attached to */
  readonly wallId: SurfaceId;
  /** Position on the wall surface (MicroUnits) */
  readonly position: Point2D;
  /** Object dimensions (MicroUnits) */
  readonly size: Dimensions2D;
}

/**
 * Complete 3D scene state
 * Ref: Chapter 4.3.1 - Scene3D Interface
 */
export interface Scene3D {
  readonly camera: Camera3D;
  readonly room: Room3D;
  readonly surfaces: readonly Surface3D[];
  readonly objects: readonly RoomObject[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Drawing & Editing Tools (Chapter 5)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Shape types for drawing tools
 * Ref: Chapter 5.3.1 - ShapeType
 */
export type ShapeType = 'RECTANGLE' | 'CIRCLE' | 'HEXAGON' | 'LINE' | 'POLYGON';

/**
 * Edit tool identifiers
 * Ref: Chapter 5.1.1 - Editing Tool List
 */
export type EditToolId =
  | 'SCISSORS'
  | 'LINE'
  | 'HEXAGON'
  | 'CIRCLE'
  | 'RECTANGLE'
  | 'BLANK_SPACE'
  | 'SELECT';

/**
 * Shape style properties
 */
export interface ShapeStyle {
  /** Stroke width in pixels */
  readonly strokeWidth: number;
  /** Stroke color (hex string) */
  readonly strokeColor: string;
  /** Fill color (null = transparent/blank space) */
  readonly fillColor: string | null;
}

/**
 * Edit shape placed on the canvas
 * Ref: Chapter 5.3.1 - EditShape Interface
 * 
 * This is a MASK layer, not a destructive edit (Engineering Constraint #3)
 */
export interface EditShape {
  readonly id: string;
  readonly type: ShapeType;
  /** User-defined label (e.g., "Bathroom Window") */
  readonly label: string | null;
  /** Position in area coordinates (MicroUnits) */
  readonly position: Point2D;
  /** Rotation angle (DeciDegree) */
  readonly rotation: DeciDegree;
  
  // Type-specific dimensions (MicroUnits)
  readonly width: MicroUnit | null;      // RECTANGLE, LINE
  readonly height: MicroUnit | null;     // RECTANGLE
  readonly radius: MicroUnit | null;     // CIRCLE
  readonly sideLength: MicroUnit | null; // HEXAGON
  readonly points: readonly Point2D[] | null; // POLYGON, LINE
  
  // Style
  readonly style: ShapeStyle;
  
  // Masking metadata
  /** IDs of tiles affected by this shape */
  readonly affectedTileIds: readonly string[];
  readonly createdAt: Date;
  readonly modifiedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: File Management System (Chapter 6)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Part types for multi-surface projects
 * Ref: Chapter 6.3.2 - PartData Structure
 */
export type PartType = 'FLOOR_BASE' | 'FLOOR_EDIT' | 'WALL_BASE' | 'WALL_EDIT';

/**
 * Wall number for wall parts
 */
export type WallNumber = 1 | 2 | 3 | 4;

/**
 * Individual part data (floor or wall section)
 * Ref: Chapter 6.3.2 - PartData Interface
 */
export interface PartData {
  readonly partId: string;
  readonly partType: PartType;
  readonly wallNumber: WallNumber | null;
  readonly tileGrid: readonly (readonly TileCell[])[];
  readonly patternId: PatternId;
  readonly shapes: readonly EditShape[];
  readonly isComplete: boolean;
  readonly savedAt: Date | null;
}

/**
 * Project tile configuration
 */
export interface TileConfig {
  readonly width: MicroUnit;
  readonly height: MicroUnit;
  readonly gap: MicroUnit;
  readonly patternId: PatternId;
}

/**
 * Complete project file structure (.tileproj)
 * Ref: Chapter 6.3.1 - TileProject Interface
 */
export interface TileProject {
  // Metadata
  readonly version: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly createdAt: Date;
  readonly modifiedAt: Date;
  readonly thumbnail: string | null; // Base64 encoded
  
  // Area configuration
  readonly area: Dimensions2D;
  
  // Tile configuration
  readonly tileConfig: TileConfig;
  
  // Parts (26~35 mapping from original spec)
  readonly parts: {
    readonly floorTileBase: PartData | null;
    readonly floorEditTile: PartData | null;
    readonly wallTile1Base: PartData | null;
    readonly wallEdit1Tile: PartData | null;
    readonly wallTile2Base: PartData | null;
    readonly wallEdit2Tile: PartData | null;
    readonly wallTile3Base: PartData | null;
    readonly wallEdit3Tile: PartData | null;
    readonly wallTile4Base: PartData | null;
    readonly wallEdit4Tile: PartData | null;
  };
  
  // Edit objects (shapes, masks)
  readonly shapes: readonly EditShape[];
  
  // 3D scene configuration
  readonly scene3D: Scene3D | null;
  
  // Measurements and annotations
  readonly measurements: readonly Measurement[];
  readonly textAnnotations: readonly TextAnnotation[];
  
  // Supplementary materials
  readonly supplementaryMaterials: SupplementaryMaterials | null;
}

/**
 * Export format types
 * Ref: Chapter 6.3.3 - Export Formats
 */
export type ExportFormat = 'TILEPROJ' | 'PNG' | 'JPG' | 'PDF' | 'TILEPART';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: Navigation & Tile Editing (Chapter 7)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Workflow step numbers
 * Ref: Chapter 7.1.3 - Workflow Steps
 */
export type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Step snapshot for navigation history
 * Ref: Chapter 7.3.1 - StepSnapshot Interface
 */
export interface StepSnapshot {
  readonly stepNumber: WorkflowStep;
  readonly timestamp: Date;
  readonly data: Partial<TileProject>;
  readonly isComplete: boolean;
}

/**
 * Navigation state
 * Ref: Chapter 7.3.1 - NavigationState Interface
 */
export interface NavigationState {
  readonly currentStep: WorkflowStep;
  readonly maxReachedStep: WorkflowStep;
  readonly stepHistory: readonly StepSnapshot[];
  readonly isHoldMode: boolean;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
}

/**
 * Tile split direction
 * Ref: Chapter 7.2.2 - SplitOptions
 */
export type SplitDirection = 'HORIZONTAL' | 'VERTICAL' | 'BOTH';

/**
 * Options for tile split operation
 */
export interface SplitOptions {
  readonly direction: SplitDirection;
  /** Split ratio as integers (e.g., [500, 500] for 50/50) */
  readonly ratio: readonly number[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: Calendar Integration (Chapter 8)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schedule status
 * Ref: Chapter 8.3.1 - TileSchedule Interface
 */
export type ScheduleStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/**
 * Tile project schedule/calendar event
 * Ref: Chapter 8.3.1 - TileSchedule Interface
 */
export interface TileSchedule {
  readonly id: string;
  readonly googleEventId: string | null;
  readonly title: string;
  readonly projectId: string | null;
  readonly projectName: string | null;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly location: string | null;
  readonly memo: string | null;
  /** Reminder times in minutes before event */
  readonly reminders: readonly number[];
  readonly syncEnabled: boolean;
  readonly lastSyncedAt: Date | null;
  readonly status: ScheduleStatus;
}

/**
 * Google Calendar integration state
 * Ref: Chapter 8.3.1 - GoogleIntegration Interface
 */
export interface GoogleIntegration {
  readonly isConnected: boolean;
  readonly userEmail: string | null;
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly selectedCalendarId: string | null;
  readonly lastSyncTime: Date | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: Special Features - Supplementary Materials (Chapter 9)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Silicone segment location types
 * Ref: Chapter 9.3.1 - SiliconeSegment Interface
 */
export type SiliconeLocation = 
  | 'FLOOR_WALL' 
  | 'AROUND_WINDOW' 
  | 'AROUND_DOOR' 
  | 'CUSTOM';

/**
 * Silicone application segment
 */
export interface SiliconeSegment {
  readonly id: string;
  readonly startPoint: Point2D;
  readonly endPoint: Point2D;
  /** Length in MicroUnits */
  readonly length: MicroUnit;
  readonly location: SiliconeLocation;
}

/**
 * Angle placement types
 * Ref: Chapter 9.1.2 - Angle Types
 */
export type AngleType = 'EXTERNAL' | 'INTERNAL' | 'PILLAR' | 'STRAIGHT';

/**
 * Angle material types
 */
export type AngleMaterial = 'ALUMINUM' | 'PVC' | 'STAINLESS';

/**
 * Corner angle placement
 * Ref: Chapter 9.3.1 - AnglePlacement Interface
 */
export interface AnglePlacement {
  readonly id: string;
  readonly type: AngleType;
  readonly position: Point3D;
  /** Length/height in MicroUnits */
  readonly length: MicroUnit;
  readonly walls: readonly SurfaceId[] | null;
  readonly material: AngleMaterial;
}

/**
 * Joint tape calculation result
 */
export interface JointTapeResult {
  readonly enabled: boolean;
  /** Total length in MicroUnits */
  readonly totalLength: MicroUnit;
  /** Number of rolls needed (10m/roll) */
  readonly rollsNeeded: number;
}

/**
 * Silicone calculation result
 */
export interface SiliconeResult {
  readonly enabled: boolean;
  readonly segments: readonly SiliconeSegment[];
  /** Total length in MicroUnits */
  readonly totalLength: MicroUnit;
  /** Number of tubes needed (300ml/tube ≈ 10m coverage) */
  readonly tubesNeeded: number;
}

/**
 * Complete supplementary materials state
 * Ref: Chapter 9.3.1 - SupplementaryMaterials Interface
 */
export interface SupplementaryMaterials {
  readonly jointTape: JointTapeResult;
  readonly silicone: SiliconeResult;
  readonly angles: readonly AnglePlacement[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10: Measurement & Text Tools (Chapter 10)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Measurement types
 * Ref: Chapter 10.3.1 - Measurement Interface
 */
export type MeasurementType = 'DISTANCE' | 'ANGLE' | 'AREA';

/**
 * Display units for measurements
 */
export type LengthUnit = 'mm' | 'cm' | 'm';
export type AreaUnit = 'mm2' | 'cm2' | 'm2';
export type AngleUnit = 'deg';
export type MeasurementUnit = LengthUnit | AreaUnit | AngleUnit;

/**
 * Measurement style options
 */
export interface MeasurementStyle {
  readonly lineColor: string;
  readonly textColor: string;
  readonly fontSize: number;
  readonly showArrows: boolean;
}

/**
 * Measurement annotation on the canvas
 * Ref: Chapter 10.3.1 - Measurement Interface
 */
export interface Measurement {
  readonly id: string;
  readonly type: MeasurementType;
  /** Points used for measurement (MicroUnits) */
  readonly points: readonly Point2D[];
  /** Measured value in base units (MicroUnits for length, DeciDegree for angle, MicroUnits² for area) */
  readonly value: number;
  readonly unit: MeasurementUnit;
  /** Whether to show permanently on the drawing */
  readonly isPersistent: boolean;
  readonly label: string | null;
  readonly style: MeasurementStyle;
}

/**
 * Text annotation style
 */
export interface TextStyle {
  /** Font size in points (8-72) */
  readonly fontSize: number;
  /** Font color (hex) */
  readonly fontColor: string;
  readonly fontFamily: string;
  readonly isBold: boolean;
  readonly isItalic: boolean;
}

/**
 * Text annotation on the canvas
 * Ref: Chapter 10.3.1 - TextAnnotation Interface
 */
export interface TextAnnotation {
  readonly id: string;
  /** Text content (max 500 characters) */
  readonly content: string;
  /** Position in area coordinates (MicroUnits) */
  readonly position: Point2D;
  /** Rotation angle (DeciDegree) */
  readonly rotation: DeciDegree;
  readonly style: TextStyle;
  readonly createdAt: Date;
  readonly modifiedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 11: Internationalization & Help (Chapter 11)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Supported locale codes
 * Ref: Chapter 11.1.1 - Language Support
 */
export type SupportedLocale = 'ko-KR' | 'en-US' | 'ja-JP' | 'zh-CN' | 'vi-VN';

/**
 * Help content category
 * Ref: Chapter 11.3.1 - HelpContent Interface
 */
export type HelpCategory = 'TUTORIAL' | 'FAQ' | 'VIDEO' | 'GUIDE';

/**
 * Help content item
 */
export interface HelpContent {
  readonly id: string;
  readonly category: HelpCategory;
  readonly titleKey: string;
  readonly contentKey: string;
  readonly videoUrl: string | null;
  readonly relatedFeature: string | null;
  readonly order: number;
}

/**
 * Tutorial tooltip position
 */
export type TooltipPosition = 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';

/**
 * Tutorial step definition
 * Ref: Chapter 11.3.1 - TutorialStep Interface
 */
export interface TutorialStep {
  readonly stepNumber: number;
  readonly targetElementId: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly position: TooltipPosition;
  readonly requiredAction: string | null;
}

/**
 * User preferences (persisted)
 * Ref: Chapter 11.3.1 - UserPreferences Interface
 */
export interface UserPreferences {
  readonly language: SupportedLocale;
  readonly hasCompletedTutorial: boolean;
  readonly tutorialSkippedAt: Date | null;
  readonly lastSeenVersion: string;
  /** Preferred measurement unit */
  readonly defaultLengthUnit: LengthUnit;
  /** Auto-save interval in seconds (0 = disabled) */
  readonly autoSaveInterval: number;
  /** Show grid lines in 2D view */
  readonly showGridLines: boolean;
  /** Enable haptic feedback */
  readonly hapticFeedback: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 12: Command Pattern for Undo/Redo (Engineering Constraint #4)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Action types for command pattern
 * This prevents memory-heavy snapshots by storing only deltas
 */
export type CommandActionType =
  | 'TILE_MOVE'
  | 'TILE_ROTATE'
  | 'TILE_SPLIT'
  | 'TILE_VISIBILITY_CHANGE'
  | 'SHAPE_ADD'
  | 'SHAPE_REMOVE'
  | 'SHAPE_MODIFY'
  | 'PATTERN_CHANGE'
  | 'MEASUREMENT_ADD'
  | 'MEASUREMENT_REMOVE'
  | 'TEXT_ADD'
  | 'TEXT_REMOVE'
  | 'TEXT_MODIFY'
  | 'CONFIG_CHANGE';

/**
 * Base command interface
 */
export interface Command {
  readonly id: string;
  readonly type: CommandActionType;
  readonly timestamp: Date;
  /** Target entity ID */
  readonly targetId: string;
  /** Previous value (for undo) */
  readonly previousValue: unknown;
  /** New value (for redo) */
  readonly newValue: unknown;
}

/**
 * Command history state
 */
export interface CommandHistory {
  /** Commands that can be undone */
  readonly undoStack: readonly Command[];
  /** Commands that can be redone */
  readonly redoStack: readonly Command[];
  /** Maximum history size */
  readonly maxSize: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 13: Validation Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validation error structure
 * Ref: Chapter 1.4.3 - Validation Defense
 */
export interface ValidationError {
  readonly field: string;
  readonly code: string;
  readonly message: string;
  readonly messageKey: string; // i18n key
}

/**
 * Validation result
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 14: App-wide State Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Current editing tool
 */
export type ActiveTool = 
  | 'SELECT'
  | 'PAN'
  | 'ZOOM'
  | EditToolId
  | 'MEASURE_DISTANCE'
  | 'MEASURE_ANGLE'
  | 'MEASURE_AREA'
  | 'TEXT';

/**
 * Main application state (for Zustand store)
 */
export interface AppState {
  // View
  readonly viewMode: ViewMode;
  readonly activeTool: ActiveTool;
  readonly isHoldMode: boolean;
  
  // Project
  readonly currentProject: TileProject | null;
  readonly isDirty: boolean; // Has unsaved changes
  
  // Navigation
  readonly navigation: NavigationState;
  
  // Selection
  readonly selectedTileIds: readonly string[];
  readonly selectedShapeIds: readonly string[];
  
  // History
  readonly commandHistory: CommandHistory;
  
  // UI State
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  
  // User
  readonly auth: AuthState;
  readonly preferences: UserPreferences;
  readonly googleIntegration: GoogleIntegration;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 15: Utility Type Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Make specific properties mutable (for state updates)
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Deep partial for nested updates
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract mutable version of TileCell for editing operations
 */
export type MutableTileCell = Mutable<TileCell>;

/**
 * Result type for async operations
 */
export type AsyncResult<T> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: ValidationError };

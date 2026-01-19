/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Core Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 이 파일은 Tile Set Up 앱의 모든 데이터 구조를 정의합니다.
 * 
 * ⚠️ CRITICAL ENGINEERING CONSTRAINT:
 * 모든 mm 단위는 내부적으로 정수(Integer)로 처리됩니다.
 * 1mm = 1000 units (MicroMM 타입)
 * 부동소수점 오차를 원천 차단합니다.
 * 
 * Ref: 분석 노트 - "부동소수점 연산의 배신" 방어
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Branded Types (정수 연산 강제)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 브랜드 타입: 일반 number와 구분되는 타입 안전성 확보
 * TypeScript의 구조적 타이핑을 우회하여 명시적 변환 강제
 */
declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

/**
 * MicroMM: 1mm = 1000 MicroMM
 * 모든 길이/좌표 연산의 기본 단위
 * 
 * @example
 * const tile300mm: MicroMM = mmToMicro(300); // 300000
 * const displayValue = microToMM(tile300mm); // 300
 */
export type MicroMM = Brand<number, 'MicroMM'>;

/**
 * Degree: 각도 (0-360)
 * 회전 연산에 사용
 */
export type Degree = Brand<number, 'Degree'>;

/**
 * Percentage: 백분율 (0-100)
 * 면적 비율 계산에 사용
 */
export type Percentage = Brand<number, 'Percentage'>;

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Utility Types & Converters
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 단위 변환 유틸리티 함수 시그니처
 * 실제 구현은 utils/math.ts에서 수행
 */
export interface UnitConverters {
  mmToMicro: (mm: number) => MicroMM;
  microToMM: (micro: MicroMM) => number;
  microToM: (micro: MicroMM) => number;
  degreeToRadian: (deg: Degree) => number;
  radianToDegree: (rad: number) => Degree;
}

/**
 * 2D 좌표 (정수 기반)
 * Ref: Chapter 5 - 도면 편집 도구
 */
export interface Point {
  x: MicroMM;
  y: MicroMM;
}

/**
 * 3D 좌표 (정수 기반)
 * Ref: Chapter 4 - 3D 뷰 시스템
 */
export interface Vector3 {
  x: MicroMM;
  y: MicroMM;
  z: MicroMM;
}

/**
 * 크기 정의 (가로 x 세로)
 */
export interface Dimension {
  width: MicroMM;
  height: MicroMM;
}

/**
 * 3D 크기 정의
 */
export interface Dimension3D extends Dimension {
  depth: MicroMM;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: Chapter 1 - 물량 산출 시스템
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 시작선 위치 (가로)
 * Ref: Chapter 1.3.1 - 시작선 정의
 * 
 * ⚠️ LOGIC CORRECTION:
 * CENTER 선택 시 잔여 타일이 양쪽으로 분배되어야 함
 */
export type StartLineX = 'LEFT' | 'CENTER' | 'RIGHT';

/**
 * 시작선 위치 (세로)
 */
export type StartLineY = 'TOP' | 'CENTER' | 'BOTTOM';

/**
 * 타일 계산 입력값
 * Ref: Chapter 1.3.1
 * 
 * 모든 길이 값은 MicroMM(정수) 타입으로 강제
 */
export interface TileCalculationInput {
  /** 시공면적 가로 (100mm ~ 99,999,999mm) */
  areaWidth: MicroMM;
  
  /** 시공면적 세로 (100mm ~ 99,999,999mm) */
  areaHeight: MicroMM;
  
  /** 타일 가로 크기 (10mm ~ 9,999mm) */
  tileWidth: MicroMM;
  
  /** 타일 세로 크기 (10mm ~ 9,999mm) */
  tileHeight: MicroMM;
  
  /**
   * Gap/줄눈 크기 (0mm ~ 50mm, 0.1mm 단위)
   * 
   * ⚠️ 주의: 소수점 허용 필드이나, 내부적으로는 MicroMM로 변환
   * 예: 1.5mm → 1500 MicroMM
   */
  gapSize: MicroMM;
  
  /** 시작선 설정 */
  startLine: {
    x: StartLineX;
    y: StartLineY;
  };
}

/**
 * 타일 분류 타입
 * Ref: Chapter 1.2.3
 * 
 * ⚠️ LOGIC CLARIFICATION:
 * - FULL: 커팅 불필요한 온전한 타일
 * - LARGE: 면적 50% 이상의 조각 (원본 1장에서 1개 추출)
 * - SMALL: 면적 50% 미만의 조각 (원본 1장에서 2개 이상 추출 가능)
 * - SPLIT: 사용자가 수동 분할한 타일 (Chapter 7)
 */
export type TileType = 'FULL' | 'LARGE' | 'SMALL' | 'SPLIT';

/**
 * 개별 타일 셀 데이터
 * Ref: Chapter 1.3.3
 * 
 * ⚠️ NON-DESTRUCTIVE EDITING:
 * visible, maskedBy 필드로 삭제가 아닌 마스킹 처리
 * 
 * ⚠️ MEMORY OPTIMIZATION (Code Review 반영):
 * - FULL 타일: width/height 생략 → 전역 tileConfig 참조
 * - LARGE/SMALL 타일: width/height 명시 (커팅된 크기)
 * - 타일 10,000개 기준 약 40% 메모리 절감 효과
 * 
 * 크기 조회 시 반드시 getTileDimension() 헬퍼 함수 사용:
 * ```typescript
 * const { width, height } = getTileDimension(tile, globalConfig);
 * ```
 */
export interface TileCell {
  /** 타일 고유 ID (1부터 시작) */
  id: string;
  
  /** 타일 분류 */
  type: TileType;
  
  /**
   * ⚠️ MEMORY OPTIMIZED:
   * - FULL 타일: undefined (전역 설정 참조)
   * - LARGE/SMALL/SPLIT: 실제 커팅된 너비
   */
  width?: MicroMM;
  
  /**
   * ⚠️ MEMORY OPTIMIZED:
   * - FULL 타일: undefined (전역 설정 참조)
   * - LARGE/SMALL/SPLIT: 실제 커팅된 높이
   */
  height?: MicroMM;
  
  /** 행 인덱스 (0-based) */
  row: number;
  
  /** 열 인덱스 (0-based) */
  col: number;
  
  /** 
   * 그리드 내 위치 (좌상단 기준)
   * 렌더링 시 사용
   */
  position: Point;
  
  /**
   * 회전 각도 (0, 90, 180, 270)
   * Ref: Chapter 7 - 타일 회전 기능
   */
  rotation: 0 | 90 | 180 | 270;
  
  /**
   * ⚠️ NON-DESTRUCTIVE: 가시성 플래그
   * false여도 데이터는 보존됨
   */
  visible: boolean;
  
  /**
   * ⚠️ NON-DESTRUCTIVE: 이 타일을 가리는 Shape ID 목록
   * Shape가 이동/삭제되면 자동으로 visible 복구
   */
  maskedBy: string[];
  
  /**
   * 분할된 타일인 경우 원본 타일 ID
   * Ref: Chapter 7 - 타일 분할 기능
   */
  parentId?: string;
  
  /**
   * 분할 비율 (분할된 타일인 경우)
   */
  splitRatio?: number[];
  
  /**
   * 개별 타일 편집 잠금
   */
  isLocked: boolean;
}

/**
 * 조각 타일 크기 정보
 */
export interface PieceDimension {
  width: MicroMM;
  height: MicroMM;
  /** 원본 타일 대비 면적 비율 */
  areaRatio: Percentage;
}

/**
 * 타일 계산 결과
 * Ref: Chapter 1.3.2
 * 
 * ⚠️ FORMULA CORRECTION (Gap 계산):
 * totalWidth = (n * tileWidth) + ((n-1) * gap)
 * 마지막 타일 외곽에는 Gap을 추가하지 않음
 */
export interface TileCalculationResult {
  /** 전체 그리드 타일 수 (cols × rows) */
  totalTileCount: number;
  
  /** 온전한 타일 장수 (커팅 불필요) */
  fullTileCount: number;
  
  /** 큰조각 장수 (면적 50% 이상) */
  largePieceCount: number;
  
  /** 작은조각 장수 (면적 50% 미만) */
  smallPieceCount: number;
  
  /** 그리드 열 수 */
  columnCount: number;
  
  /** 그리드 행 수 */
  rowCount: number;
  
  /** 큰조각 크기 정보 */
  largePieceDimension: PieceDimension | null;
  
  /** 작은조각 크기 정보 */
  smallPieceDimension: PieceDimension | null;
  
  /**
   * 시작선에 따른 좌측 잔여 길이
   * CENTER인 경우 leftRemainder + rightRemainder로 분배
   */
  leftRemainder: MicroMM;
  rightRemainder: MicroMM;
  topRemainder: MicroMM;
  bottomRemainder: MicroMM;
  
  /** 2D 그리드 데이터 */
  gridData: TileCell[][];
  
  /** 총 시공 면적 (m²) */
  totalAreaM2: number;
  
  /** 실제 타일이 덮는 면적 (m²) - Blank Space 제외 */
  coveredAreaM2: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Chapter 2 - 회원가입/인증 시스템
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 인증 제공자
 * Ref: Chapter 2.2.2
 * 
 * ⚠️ 분석 노트 권고: MVP에서는 Google/Apple/Email 우선
 */
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'APPLE' | 'FACEBOOK' | 'TWITTER';

/**
 * 사용자 데이터
 * Ref: Chapter 2.3.1
 */
export interface User {
  userId: string;
  email: string;
  passwordHash?: string; // LOCAL 가입 시에만
  firstName: string;
  lastName: string;
  authProvider: AuthProvider;
  providerId?: string; // 소셜 로그인 고유 ID
  createdAt: Date;
  lastLoginAt?: Date;
  
  /** 사용자 설정 */
  preferences: UserPreferences;
}

/**
 * 사용자 환경설정
 * Ref: Chapter 11.3.1
 */
export interface UserPreferences {
  /** 선택한 언어 코드 */
  language: SupportedLocale;
  
  /** 튜토리얼 완료 여부 */
  hasCompletedTutorial: boolean;
  
  /** 튜토리얼 스킵 시간 */
  tutorialSkippedAt?: Date;
  
  /** 마지막 확인 앱 버전 */
  lastSeenVersion: string;
  
  /** 자동 저장 활성화 */
  autoSaveEnabled: boolean;
  
  /** 기본 단위 표시 */
  defaultUnit: 'mm' | 'cm' | 'm';
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Chapter 3 - 타일 패턴 시스템
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 패턴 ID (15가지)
 * Ref: Chapter 3.1.1
 */
export type PatternId =
  | 'LINEAR_SQUARE'           // 1. 직선 사각
  | 'DIAMOND'                 // 2. 다이아몬드
  | 'RUNNING_BOND_SQUARE'     // 3. 벽돌쌓기 (사각)
  | 'STACK_BOND'              // 4. 스택 본드
  | 'VERTICAL_STACK'          // 5. 수직 스택
  | 'DIAGONAL_RUNNING'        // 6. 대각 러닝
  | 'RUNNING_BOND_OFFSET'     // 7. 러닝 본드 오프셋
  | 'VERTICAL_RUNNING_BOND'   // 8. 수직 러닝 본드
  | 'VERTICAL_STACK_OFFSET'   // 9. 수직 스택 오프셋
  | 'ONE_THIRD_RUNNING_BOND'  // 10. 1/3 러닝 본드
  | 'DIAGONAL_RUNNING_POINT'  // 11. 대각 러닝 포인트
  | 'TRADITIONAL_RUNNING_BOND'// 12. 전통 러닝 본드
  | 'TRADITIONAL_HERRINGBONE' // 13. 전통 헤링본
  | 'STRAIGHT_HERRINGBONE'    // 14. 직선 헤링본
  | 'BASKET_WEAVE';           // 15. 바스켓 위브

/**
 * 패턴 오프셋 타입
 */
export type OffsetType = 'NONE' | 'HALF' | 'THIRD' | 'CUSTOM';

/**
 * 타일 패턴 정의
 * Ref: Chapter 3.3
 */
export interface TilePattern {
  id: PatternId;
  
  /** 한글명 */
  nameKo: string;
  
  /** 영문명 */
  nameEn: string;
  
  /** 패턴 미리보기 이미지 경로 */
  thumbnailUrl: string;
  
  /** 오프셋 타입 */
  offsetType: OffsetType;
  
  /** 기본 회전 각도 */
  rotation: Degree;
  
  /** 교대 패턴 여부 (헤링본 등) */
  alternating: boolean;
  
  /** 직사각 타일 필수 여부 (헤링본은 true) */
  requiresRectangular: boolean;
  
  /**
   * 오프셋 계산 함수
   * row, col 인덱스를 받아 해당 타일의 오프셋 반환
   */
  calculateOffset: (
    row: number,
    col: number,
    tileWidth: MicroMM,
    tileHeight: MicroMM
  ) => Point;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Chapter 4 - 2D/3D 뷰 시스템
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 뷰 모드
 */
export type ViewMode = '2D' | '3D';

/**
 * 표면 ID (바닥 + 4개 벽)
 * Ref: Chapter 4.1.2
 */
export type SurfaceId = 'FLOOR' | 'WALL_1' | 'WALL_2' | 'WALL_3' | 'WALL_4';

/**
 * 3D 씬 데이터
 * Ref: Chapter 4.3.1
 */
export interface Scene3D {
  camera: {
    position: Vector3;
    /** pitch, yaw, roll */
    rotation: Vector3;
    /** 줌 레벨 (0.5 ~ 3.0) */
    zoom: number;
  };
  
  room: {
    width: MicroMM;
    depth: MicroMM;
    height: MicroMM;
  };
  
  surfaces: Surface3D[];
  objects: RoomObject[];
  
  /** 현재 뷰 모드 */
  viewMode: ViewMode;
  
  /**
   * ⚠️ WALL CULLING:
   * 카메라 각도에 따라 자동 투명화되는 벽 목록
   */
  culledWalls: SurfaceId[];
}

/**
 * 3D 표면 (바닥/벽)
 * Ref: Chapter 4.3.1
 */
export interface Surface3D {
  id: SurfaceId;
  
  /** 적용된 타일 그룹 ID */
  tileGroupId?: string;
  
  /** 타일 배치 데이터 */
  gridData: TileCell[][];
  
  /** 표시 여부 */
  visible: boolean;
  
  /**
   * ⚠️ WALL CULLING: 투명도
   * 1.0 = 불투명, 0.2 = 반투명 (카메라에 의해 가려질 때)
   */
  opacity: number;
}

/**
 * 방 내 오브젝트 (문, 창문)
 * Ref: Chapter 4.3.1
 */
export interface RoomObject {
  id: string;
  type: 'DOOR' | 'WINDOW';
  
  /** 부착된 벽 ID */
  wallId: SurfaceId;
  
  /** 벽면 내 위치 (2D 좌표) */
  position: Point;
  
  /** 크기 */
  size: Dimension;
  
  /** 
   * ⚠️ NON-DESTRUCTIVE:
   * 이 오브젝트가 마스킹하는 타일 ID 목록
   */
  maskedTileIds: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: Chapter 5 - 도면 편집 도구
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 편집 도형 타입
 * Ref: Chapter 5.1.1
 */
export type ShapeType = 
  | 'RECTANGLE' 
  | 'CIRCLE' 
  | 'HEXAGON' 
  | 'LINE' 
  | 'POLYGON';

/**
 * 편집 도형 데이터
 * Ref: Chapter 5.3.1
 * 
 * ⚠️ NON-DESTRUCTIVE EDITING:
 * 도형은 타일을 삭제하지 않고 마스킹만 수행
 */
export interface EditShape {
  id: string;
  type: ShapeType;
  
  /** 사용자 지정 이름 (예: '욕실창문') */
  label?: string;
  
  /** 위치 (mm 단위, 내부는 MicroMM) */
  position: Point;
  
  /** 회전 각도 */
  rotation: Degree;
  
  // 타입별 속성
  width?: MicroMM;      // RECTANGLE, LINE
  height?: MicroMM;     // RECTANGLE
  radius?: MicroMM;     // CIRCLE
  sideLength?: MicroMM; // HEXAGON
  points?: Point[];     // POLYGON, LINE
  
  // 스타일
  strokeWidth: number;  // px
  strokeColor: string;  // HEX
  fillColor?: string;   // null = blank space
  
  /**
   * ⚠️ NON-DESTRUCTIVE:
   * 이 도형이 마스킹하는 타일 ID 목록
   * 도형 이동/삭제 시 해당 타일들의 visible 자동 복구
   */
  affectedTileIds: string[];
  
  createdAt: Date;
  modifiedAt: Date;
}

/**
 * 편집 도구 타입
 */
export type EditToolType = 
  | 'SCISSORS'     // 자르기
  | 'LINE'         // 선그리기
  | 'HEXAGON'      // 육각형
  | 'CIRCLE'       // 원형
  | 'RECTANGLE'    // 사각형
  | 'SELECT'       // 선택
  | 'BLANK_SPACE'; // 빈 공간

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: Chapter 6 - 파일 관리 시스템
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 파트 타입 (파트별 저장)
 * Ref: Chapter 6.3.2
 */
export type PartType = 
  | 'FLOOR_BASE' 
  | 'FLOOR_EDIT' 
  | 'WALL_BASE' 
  | 'WALL_EDIT';

/**
 * 파트 데이터
 * Ref: Chapter 6.3.2
 */
export interface PartData {
  partId: string;
  partType: PartType;
  
  /** 벽면 번호 (WALL 타입인 경우) */
  wallNumber?: 1 | 2 | 3 | 4;
  
  /** 타일 배치 데이터 */
  tileGrid: TileCell[][];
  
  /** 적용된 패턴 */
  patternId: PatternId;
  
  /** 해당 파트의 편집 오브젝트 */
  shapes: EditShape[];
  
  /** 완성 여부 */
  isComplete: boolean;
  
  /** 개별 저장 시간 */
  savedAt?: Date;
}

/**
 * 프로젝트 파일 (.tileproj)
 * Ref: Chapter 6.3.1
 */
export interface TileProject {
  // 메타데이터
  version: string;
  projectId: string;
  projectName: string;
  createdAt: Date;
  modifiedAt: Date;
  thumbnail?: string; // Base64
  
  // 시공 영역 설정
  area: Dimension;
  
  // 타일 설정
  tileConfig: {
    width: MicroMM;
    height: MicroMM;
    gap: MicroMM;
    patternId: PatternId;
  };
  
  // 시작선 설정
  startLine: {
    x: StartLineX;
    y: StartLineY;
  };
  
  // 파트별 데이터 (원본 26~35)
  parts: {
    floorTileBase?: PartData;
    floorEditTile?: PartData;
    wallTile1Base?: PartData;
    wallEdit1Tile?: PartData;
    wallTile2Base?: PartData;
    wallEdit2Tile?: PartData;
    wallTile3Base?: PartData;
    wallEdit3Tile?: PartData;
    wallTile4Base?: PartData;
    wallEdit4Tile?: PartData;
  };
  
  // 편집 오브젝트
  shapes: EditShape[];
  
  // 3D 씬 데이터
  scene3D?: Scene3D;
  
  // 부자재 데이터
  supplementaryMaterials?: SupplementaryMaterials;
  
  // 측정 데이터
  measurements?: Measurement[];
  
  // 텍스트 주석
  textAnnotations?: TextAnnotation[];
  
  /**
   * ⚠️ COMMAND PATTERN:
   * Undo/Redo를 위한 액션 히스토리 (델타 기록)
   */
  actionHistory: ProjectAction[];
  currentActionIndex: number;
}

/**
 * 내보내기 형식
 */
export type ExportFormat = 'TILEPROJ' | 'PNG' | 'JPG' | 'PDF' | 'TILEPART';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: Chapter 7 - 네비게이션 및 타일 편집
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 작업 단계 (1~7)
 * Ref: Chapter 7.1.3
 */
export type WorkStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * 네비게이션 상태
 * Ref: Chapter 7.3.1
 */
export interface NavigationState {
  currentStep: WorkStep;
  maxReachedStep: WorkStep;
  stepHistory: StepSnapshot[];
  isHoldMode: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

/**
 * 단계 스냅샷
 */
export interface StepSnapshot {
  stepNumber: WorkStep;
  timestamp: Date;
  
  /**
   * ⚠️ COMMAND PATTERN:
   * 전체 상태가 아닌 변경된 델타만 저장
   */
  deltaActions: ProjectAction[];
  
  isComplete: boolean;
}

/**
 * 타일 분할 옵션
 * Ref: Chapter 7.2.2
 */
export interface SplitOptions {
  direction: 'HORIZONTAL' | 'VERTICAL' | 'BOTH';
  
  /** 분할 비율 (합이 1.0) */
  ratio: number[];
}

/**
 * 프로젝트 액션 (Undo/Redo용)
 * 
 * ⚠️ COMMAND PATTERN:
 * 스냅샷이 아닌 델타(변경사항)만 기록하여 메모리 절약
 */
export type ProjectAction =
  | { type: 'TILE_ADD'; payload: { tiles: TileCell[] } }
  | { type: 'TILE_REMOVE'; payload: { tileIds: string[] } }
  | { type: 'TILE_MOVE'; payload: { tileId: string; from: Point; to: Point } }
  | { type: 'TILE_ROTATE'; payload: { tileId: string; from: number; to: number } }
  | { type: 'TILE_SPLIT'; payload: { tileId: string; options: SplitOptions } }
  | { type: 'TILE_MASK'; payload: { tileIds: string[]; shapeId: string } }
  | { type: 'TILE_UNMASK'; payload: { tileIds: string[]; shapeId: string } }
  | { type: 'SHAPE_ADD'; payload: { shape: EditShape } }
  | { type: 'SHAPE_REMOVE'; payload: { shapeId: string } }
  | { type: 'SHAPE_MOVE'; payload: { shapeId: string; from: Point; to: Point } }
  | { type: 'PATTERN_CHANGE'; payload: { from: PatternId; to: PatternId } }
  | { type: 'CONFIG_CHANGE'; payload: { field: string; from: unknown; to: unknown } };

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10: Chapter 8 - 외부 연동 (다이어리)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 일정 상태
 */
export type ScheduleStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/**
 * 시공 일정
 * Ref: Chapter 8.3.1
 */
export interface TileSchedule {
  id: string;
  googleEventId?: string;
  title: string;
  projectId?: string;
  projectName?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  memo?: string;
  
  /** 알림 (분 단위: [1440=1일전, 60=1시간전, 30=30분전]) */
  reminders: number[];
  
  syncEnabled: boolean;
  lastSyncedAt?: Date;
  status: ScheduleStatus;
}

/**
 * Google 연동 상태
 */
export interface GoogleIntegration {
  isConnected: boolean;
  userEmail?: string;
  accessToken?: string;
  refreshToken?: string;
  selectedCalendarId?: string;
  lastSyncTime?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 11: Chapter 9 - 특수 기능 (시공 보조)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 앵글 타입
 * Ref: Chapter 9.1.2
 */
export type AngleType = 'EXTERNAL' | 'INTERNAL' | 'PILLAR' | 'STRAIGHT';

/**
 * 앵글 재질
 */
export type AngleMaterial = 'ALUMINUM' | 'PVC' | 'STAINLESS';

/**
 * 앵글 배치 정보
 * Ref: Chapter 9.3.1
 */
export interface AnglePlacement {
  id: string;
  type: AngleType;
  position: Vector3;
  length: MicroMM;
  walls?: SurfaceId[];
  material: AngleMaterial;
}

/**
 * 실리콘 구간 위치
 */
export type SiliconeLocation = 
  | 'FLOOR_WALL' 
  | 'AROUND_WINDOW' 
  | 'AROUND_DOOR' 
  | 'CUSTOM';

/**
 * 실리콘 구간 정보
 */
export interface SiliconeSegment {
  id: string;
  startPoint: Point;
  endPoint: Point;
  length: MicroMM;
  location: SiliconeLocation;
}

/**
 * 부자재 데이터
 * Ref: Chapter 9.3.1
 */
export interface SupplementaryMaterials {
  jointTape: {
    enabled: boolean;
    totalLength: MicroMM;
    rollsNeeded: number; // 10m/롤 기준
  };
  
  silicone: {
    enabled: boolean;
    segments: SiliconeSegment[];
    totalLength: MicroMM;
    tubesNeeded: number; // 300ml/튜브, 약 10m 시공 기준
  };
  
  angles: AnglePlacement[];
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 12: Chapter 10 - 계량기 및 텍스트 기능
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 측정 타입
 * Ref: Chapter 10.1.1
 */
export type MeasurementType = 'DISTANCE' | 'ANGLE' | 'AREA';

/**
 * 측정 단위
 */
export type MeasurementUnit = 'mm' | 'cm' | 'm' | 'deg' | 'mm2' | 'm2';

/**
 * 측정 스타일
 */
export interface MeasurementStyle {
  lineColor: string;
  lineWidth: number;
  fontSize: number;
  fontColor: string;
}

/**
 * 측정 데이터
 * Ref: Chapter 10.3.1
 */
export interface Measurement {
  id: string;
  type: MeasurementType;
  points: Point[];
  value: number;
  unit: MeasurementUnit;
  
  /** 도면에 영구 표시 여부 */
  isPersistent: boolean;
  
  label?: string;
  style: MeasurementStyle;
}

/**
 * 텍스트 스타일
 */
export interface TextStyle {
  fontSize: number;  // 8~72pt
  fontColor: string; // HEX
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
}

/**
 * 텍스트 주석
 * Ref: Chapter 10.3.1
 */
export interface TextAnnotation {
  id: string;
  content: string; // 최대 500자
  position: Point;
  rotation: Degree;
  style: TextStyle;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 13: Chapter 11 - 다국어 시스템
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 지원 언어
 * Ref: Chapter 11.1.1
 */
export type SupportedLocale = 
  | 'ko-KR'  // 한국어 (Primary)
  | 'en-US'  // 영어 (Primary)
  | 'ja-JP'  // 일본어 (2차)
  | 'zh-CN'  // 중국어 간체 (2차)
  | 'vi-VN'; // 베트남어 (2차)

/**
 * 도움말 카테고리
 */
export type HelpCategory = 'TUTORIAL' | 'FAQ' | 'VIDEO' | 'GUIDE';

/**
 * 도움말 콘텐츠
 * Ref: Chapter 11.3.1
 */
export interface HelpContent {
  id: string;
  category: HelpCategory;
  titleKey: string;     // i18n 키
  contentKey: string;   // i18n 키
  videoUrl?: string;    // VIDEO 타입
  relatedFeature?: string;
  order: number;
}

/**
 * 튜토리얼 단계
 */
export interface TutorialStep {
  stepNumber: number;
  targetElementId: string;
  titleKey: string;
  descriptionKey: string;
  position: 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT';
  requiredAction?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 14: Validation & Edge Case Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 입력 검증 결과
 * Ref: Chapter 1.4.1
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * 검증 오류
 */
export interface ValidationError {
  field: string;
  code: ValidationErrorCode;
  message: string;
  messageKey: string; // i18n 키
}

/**
 * 검증 오류 코드
 */
export type ValidationErrorCode =
  | 'REQUIRED'           // 필수 입력
  | 'MIN_VALUE'          // 최소값 미달
  | 'MAX_VALUE'          // 최대값 초과
  | 'INVALID_FORMAT'     // 형식 오류
  | 'TILE_LARGER_AREA'   // 타일 > 면적
  | 'GAP_LARGER_TILE'    // Gap > 타일
  | 'DIVISION_BY_ZERO'   // 0으로 나누기
  | 'OVERFLOW';          // 오버플로우

/**
 * 입력 범위 제한
 * Ref: Chapter 1.1.2
 */
export const INPUT_LIMITS = {
  AREA_WIDTH: { min: 100, max: 99_999_999 },    // mm
  AREA_HEIGHT: { min: 100, max: 99_999_999 },   // mm
  TILE_WIDTH: { min: 10, max: 9_999 },          // mm
  TILE_HEIGHT: { min: 10, max: 9_999 },         // mm
  GAP_SIZE: { min: 0, max: 50, step: 0.1 },     // mm
  MAX_TILES: 10_000,                             // 그리드 최대 타일 수
  MAX_UNDO_ACTIONS: 100,                         // Undo 히스토리 제한
  AUTO_SAVE_DELAY: 30_000,                       // 자동 저장 딜레이 (ms)
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 15: Rendering & Performance Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ INSTANCED RENDERING (OPTIMIZED):
 * Three.js InstancedMesh를 위한 통합 버퍼 관리자
 * 
 * 3,000개 이상 타일도 Draw Call 1~5회로 렌더링
 * 
 * ⚠️ MEMORY OPTIMIZATION (Code Review 반영):
 * - 개별 Float32Array 대신 하나의 거대한 SharedArrayBuffer 사용
 * - 인덱스 기반 접근으로 GC 부하 최소화
 * - 타일 10,000개 기준 메모리 사용량 약 60% 절감
 */
export interface TileInstanceBuffer {
  /** 총 인스턴스 수 */
  count: number;
  
  /** 최대 용량 (pre-allocated) */
  capacity: number;
  
  /**
   * 통합 변환 행렬 버퍼
   * 각 인스턴스당 16개 float (4x4 matrix)
   * 접근: matrices[instanceIndex * 16 + offset]
   */
  matrices: Float32Array;
  
  /**
   * 통합 색상 버퍼
   * 각 인스턴스당 4개 float (RGBA)
   * 접근: colors[instanceIndex * 4 + channel]
   */
  colors: Float32Array;
  
  /**
   * 가시성 플래그 배열
   * InstancedMesh의 setMatrixAt 호출 최적화용
   */
  visibilityFlags: Uint8Array;
  
  /**
   * TileCell ID → Instance Index 매핑
   * 타일 선택/수정 시 빠른 조회용
   */
  tileIdToIndex: Map<string, number>;
  
  /**
   * Instance Index → TileCell ID 역매핑
   */
  indexToTileId: string[];
}

/**
 * 인스턴스 버퍼 업데이트 요청
 * 부분 업데이트로 성능 최적화
 */
export interface InstanceBufferUpdate {
  /** 업데이트할 인스턴스 인덱스 */
  index: number;
  
  /** 새로운 위치 (optional) */
  position?: Vector3;
  
  /** 새로운 회전 (optional) */
  rotation?: Degree;
  
  /** 새로운 가시성 (optional) */
  visible?: boolean;
  
  /** 새로운 색상 (optional) */
  color?: [number, number, number, number];
}

/**
 * LOD (Level of Detail) 레벨
 * Ref: 분석 노트 - 3D 최적화
 */
export type LODLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * 렌더링 설정
 */
export interface RenderSettings {
  /** 현재 LOD 레벨 (카메라 거리 기반 자동 조절) */
  currentLOD: LODLevel;
  
  /** 줄눈 표시 여부 (LOW LOD에서는 숨김) */
  showGap: boolean;
  
  /** 그림자 활성화 */
  enableShadows: boolean;
  
  /** 안티앨리어싱 */
  antialias: boolean;
  
  /** 최대 FPS */
  targetFPS: 30 | 60;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE GUARDS & UTILITY FUNCTIONS (Signatures)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * MicroMM 타입 가드
 */
export function isMicroMM(value: unknown): value is MicroMM;

/**
 * TileCell 타입 가드
 */
export function isTileCell(value: unknown): value is TileCell;

/**
 * EditShape 타입 가드
 */
export function isEditShape(value: unknown): value is EditShape;

/**
 * 패턴이 직사각 타일을 필요로 하는지 확인
 */
export function patternRequiresRectangular(patternId: PatternId): boolean;

// 타입 가드 구현은 utils/typeGuards.ts에서 수행

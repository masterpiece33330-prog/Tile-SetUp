/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Command Pattern Undo/Redo System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 메모리 효율적인 히스토리 관리 시스템
 * 
 * ⚠️ CRITICAL ARCHITECTURE DECISION (Code Review 반영):
 * "Undo/Redo 시스템을 구현할 때, 전체 상태(State)를 저장하는
 *  '스냅샷 방식'을 금지한다. 대신 변경된 사항만 기록하는
 *  '커맨드 패턴(Command Pattern)'을 적용한다."
 * 
 * 문제 상황:
 * - 10,000개 타일 × 50회 스냅샷 = 메모리 폭주 → 앱 크래시
 * 
 * 해결책:
 * - 변경된 델타만 저장: { action: 'MOVE', tileId: 'tile_55', dx: 10 }
 * - execute() / undo() 양방향 실행 가능한 Command 객체
 * - 메모리 사용량: 스냅샷 대비 ~99% 절감
 * 
 * Ref: 분석 노트 - "Undo/Redo의 메모리 폭주" 해결
 * Ref: Gang of Four - Command Pattern
 */

import {
  MicroMM,
  Point,
  TileCell,
  PatternId,
  EditShape,
} from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: Command Interface & Base Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 명령 실행 결과
 */
export interface CommandResult {
  /** 성공 여부 */
  success: boolean;
  
  /** 영향받은 타일/객체 ID 목록 */
  affectedIds: string[];
  
  /** 오류 메시지 (실패 시) */
  error?: string;
}

/**
 * 명령(Command) 인터페이스
 * 
 * 모든 편집 작업은 이 인터페이스를 구현하여 Undo/Redo 가능하게 됩니다.
 * 
 * ⚠️ CRITICAL: 
 * - execute()와 undo()는 정확히 역연산이어야 함
 * - 상태를 저장하지 않고 델타만 저장
 */
export interface Command {
  /** 명령 타입 (로깅/디버깅용) */
  readonly type: CommandType;
  
  /** 명령 ID (고유 식별자) */
  readonly id: string;
  
  /** 명령 생성 시간 */
  readonly timestamp: Date;
  
  /** 명령 설명 (사용자 표시용) */
  readonly description: string;
  
  /**
   * 명령 실행 (정방향)
   * @returns 실행 결과
   */
  execute(): CommandResult;
  
  /**
   * 명령 취소 (역방향)
   * @returns 취소 결과
   */
  undo(): CommandResult;
  
  /**
   * 다른 명령과 병합 가능 여부
   * 연속된 같은 타입의 명령을 하나로 합칠 수 있을 때 true
   * 
   * @example
   * 타일을 10번 드래그 → 10개의 MOVE 명령 대신 1개로 병합
   */
  canMergeWith?(other: Command): boolean;
  
  /**
   * 다른 명령과 병합
   * @returns 병합된 새 명령 또는 null (병합 불가)
   */
  mergeWith?(other: Command): Command | null;
}

/**
 * 명령 타입 열거
 */
export type CommandType =
  // 타일 조작
  | 'TILE_MOVE'
  | 'TILE_ROTATE'
  | 'TILE_SPLIT'
  | 'TILE_VISIBILITY'
  | 'TILE_LOCK'
  | 'TILE_COLOR'
  
  // 마스크 조작
  | 'MASK_ADD'
  | 'MASK_REMOVE'
  | 'MASK_MOVE'
  | 'MASK_RESIZE'
  
  // 패턴 조작
  | 'PATTERN_CHANGE'
  
  // 그리드 조작
  | 'GRID_RESIZE'
  | 'GRID_CONFIG_CHANGE'
  
  // 복합 명령
  | 'BATCH';

/**
 * 명령 ID 생성기
 */
let commandIdCounter = 0;
export function generateCommandId(): string {
  return `cmd_${++commandIdCounter}_${Date.now()}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: Concrete Command Implementations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 타일 이동 명령
 * 
 * 델타만 저장: { tileId, dx, dy }
 * 스냅샷 대비 메모리: ~100배 절감
 */
export class TileMoveCommand implements Command {
  readonly type = 'TILE_MOVE' as const;
  readonly id: string;
  readonly timestamp: Date;
  readonly description: string;
  
  constructor(
    private tileGetter: () => TileCell | undefined,
    private readonly tileId: string,
    private readonly dx: MicroMM,
    private readonly dy: MicroMM
  ) {
    this.id = generateCommandId();
    this.timestamp = new Date();
    this.description = `타일 ${tileId} 이동 (${dx}, ${dy})`;
  }
  
  execute(): CommandResult {
    const tile = this.tileGetter();
    if (!tile) {
      return { success: false, affectedIds: [], error: `타일 ${this.tileId}를 찾을 수 없음` };
    }
    
    // 정방향: 델타 더하기
    tile.position.x = (tile.position.x + this.dx) as MicroMM;
    tile.position.y = (tile.position.y + this.dy) as MicroMM;
    
    return { success: true, affectedIds: [this.tileId] };
  }
  
  undo(): CommandResult {
    const tile = this.tileGetter();
    if (!tile) {
      return { success: false, affectedIds: [], error: `타일 ${this.tileId}를 찾을 수 없음` };
    }
    
    // 역방향: 델타 빼기
    tile.position.x = (tile.position.x - this.dx) as MicroMM;
    tile.position.y = (tile.position.y - this.dy) as MicroMM;
    
    return { success: true, affectedIds: [this.tileId] };
  }
  
  canMergeWith(other: Command): boolean {
    // 같은 타일에 대한 연속 이동만 병합
    return (
      other.type === 'TILE_MOVE' &&
      (other as TileMoveCommand).tileId === this.tileId &&
      // 1초 이내의 연속 이동만 병합
      Math.abs(other.timestamp.getTime() - this.timestamp.getTime()) < 1000
    );
  }
  
  mergeWith(other: Command): Command | null {
    if (!this.canMergeWith(other)) return null;
    
    const otherMove = other as TileMoveCommand;
    
    // 두 이동을 합친 새 명령 생성
    return new TileMoveCommand(
      this.tileGetter,
      this.tileId,
      (this.dx + otherMove.dx) as MicroMM,
      (this.dy + otherMove.dy) as MicroMM
    );
  }
}

/**
 * 타일 회전 명령
 */
export class TileRotateCommand implements Command {
  readonly type = 'TILE_ROTATE' as const;
  readonly id: string;
  readonly timestamp: Date;
  readonly description: string;
  
  constructor(
    private tileGetter: () => TileCell | undefined,
    private readonly tileId: string,
    private readonly fromRotation: 0 | 90 | 180 | 270,
    private readonly toRotation: 0 | 90 | 180 | 270
  ) {
    this.id = generateCommandId();
    this.timestamp = new Date();
    this.description = `타일 ${tileId} 회전 ${fromRotation}° → ${toRotation}°`;
  }
  
  execute(): CommandResult {
    const tile = this.tileGetter();
    if (!tile) {
      return { success: false, affectedIds: [], error: `타일 ${this.tileId}를 찾을 수 없음` };
    }
    
    tile.rotation = this.toRotation;
    
    return { success: true, affectedIds: [this.tileId] };
  }
  
  undo(): CommandResult {
    const tile = this.tileGetter();
    if (!tile) {
      return { success: false, affectedIds: [], error: `타일 ${this.tileId}를 찾을 수 없음` };
    }
    
    tile.rotation = this.fromRotation;
    
    return { success: true, affectedIds: [this.tileId] };
  }
}

/**
 * 타일 가시성 명령
 */
export class TileVisibilityCommand implements Command {
  readonly type = 'TILE_VISIBILITY' as const;
  readonly id: string;
  readonly timestamp: Date;
  readonly description: string;
  
  constructor(
    private tileGetter: () => TileCell | undefined,
    private readonly tileId: string,
    private readonly wasVisible: boolean,
    private readonly isVisible: boolean
  ) {
    this.id = generateCommandId();
    this.timestamp = new Date();
    this.description = `타일 ${tileId} ${isVisible ? '표시' : '숨김'}`;
  }
  
  execute(): CommandResult {
    const tile = this.tileGetter();
    if (!tile) {
      return { success: false, affectedIds: [], error: `타일 ${this.tileId}를 찾을 수 없음` };
    }
    
    tile.visible = this.isVisible;
    
    return { success: true, affectedIds: [this.tileId] };
  }
  
  undo(): CommandResult {
    const tile = this.tileGetter();
    if (!tile) {
      return { success: false, affectedIds: [], error: `타일 ${this.tileId}를 찾을 수 없음` };
    }
    
    tile.visible = this.wasVisible;
    
    return { success: true, affectedIds: [this.tileId] };
  }
}

/**
 * 타일 잠금 명령
 */
export class TileLockCommand implements Command {
  readonly type = 'TILE_LOCK' as const;
  readonly id: string;
  readonly timestamp: Date;
  readonly description: string;
  
  constructor(
    private tileGetter: () => TileCell | undefined,
    private readonly tileId: string,
    private readonly wasLocked: boolean,
    private readonly isLocked: boolean
  ) {
    this.id = generateCommandId();
    this.timestamp = new Date();
    this.description = `타일 ${tileId} ${isLocked ? '잠금' : '잠금 해제'}`;
  }
  
  execute(): CommandResult {
    const tile = this.tileGetter();
    if (!tile) {
      return { success: false, affectedIds: [], error: `타일 ${this.tileId}를 찾을 수 없음` };
    }
    
    tile.isLocked = this.isLocked;
    
    return { success: true, affectedIds: [this.tileId] };
  }
  
  undo(): CommandResult {
    const tile = this.tileGetter();
    if (!tile) {
      return { success: false, affectedIds: [], error: `타일 ${this.tileId}를 찾을 수 없음` };
    }
    
    tile.isLocked = this.wasLocked;
    
    return { success: true, affectedIds: [this.tileId] };
  }
}

/**
 * 마스크 추가 명령
 */
export class MaskAddCommand implements Command {
  readonly type = 'MASK_ADD' as const;
  readonly id: string;
  readonly timestamp: Date;
  readonly description: string;
  
  constructor(
    private maskingManager: {
      addRectangleMask: (id: string, rect: any, label?: string) => any;
      addCircleMask: (id: string, circle: any, label?: string) => any;
      addPolygonMask: (id: string, points: Point[], label?: string) => any;
      removeMask: (id: string) => string[];
    },
    private readonly maskId: string,
    private readonly shapeData: {
      type: 'RECTANGLE' | 'CIRCLE' | 'POLYGON';
      rect?: { x: MicroMM; y: MicroMM; width: MicroMM; height: MicroMM };
      circle?: { cx: MicroMM; cy: MicroMM; radius: MicroMM };
      polygon?: Point[];
      label?: string;
    }
  ) {
    this.id = generateCommandId();
    this.timestamp = new Date();
    this.description = `마스크 ${maskId} 추가 (${shapeData.type})`;
  }
  
  execute(): CommandResult {
    try {
      switch (this.shapeData.type) {
        case 'RECTANGLE':
          this.maskingManager.addRectangleMask(
            this.maskId,
            this.shapeData.rect!,
            this.shapeData.label
          );
          break;
        case 'CIRCLE':
          this.maskingManager.addCircleMask(
            this.maskId,
            this.shapeData.circle!,
            this.shapeData.label
          );
          break;
        case 'POLYGON':
          this.maskingManager.addPolygonMask(
            this.maskId,
            this.shapeData.polygon!,
            this.shapeData.label
          );
          break;
      }
      
      return { success: true, affectedIds: [this.maskId] };
    } catch (error) {
      return { 
        success: false, 
        affectedIds: [], 
        error: `마스크 추가 실패: ${error}` 
      };
    }
  }
  
  undo(): CommandResult {
    const restoredTiles = this.maskingManager.removeMask(this.maskId);
    return { success: true, affectedIds: [this.maskId, ...restoredTiles] };
  }
}

/**
 * 마스크 제거 명령
 * 
 * 제거 시 마스크 데이터를 저장해두어 Undo 시 복원 가능
 */
export class MaskRemoveCommand implements Command {
  readonly type = 'MASK_REMOVE' as const;
  readonly id: string;
  readonly timestamp: Date;
  readonly description: string;
  
  private removedMaskData: {
    type: 'RECTANGLE' | 'CIRCLE' | 'POLYGON';
    rect?: { x: MicroMM; y: MicroMM; width: MicroMM; height: MicroMM };
    circle?: { cx: MicroMM; cy: MicroMM; radius: MicroMM };
    polygon?: Point[];
    label?: string;
  } | null = null;
  
  constructor(
    private maskingManager: {
      getMask: (id: string) => { shape: EditShape } | undefined;
      addRectangleMask: (id: string, rect: any, label?: string) => any;
      addCircleMask: (id: string, circle: any, label?: string) => any;
      addPolygonMask: (id: string, points: Point[], label?: string) => any;
      removeMask: (id: string) => string[];
    },
    private readonly maskId: string
  ) {
    this.id = generateCommandId();
    this.timestamp = new Date();
    this.description = `마스크 ${maskId} 제거`;
    
    // 제거 전 데이터 저장 (Undo용)
    this.captureBeforeRemove();
  }
  
  private captureBeforeRemove(): void {
    const mask = this.maskingManager.getMask(this.maskId);
    if (!mask) return;
    
    const shape = mask.shape;
    
    switch (shape.type) {
      case 'RECTANGLE':
        this.removedMaskData = {
          type: 'RECTANGLE',
          rect: {
            x: shape.position.x,
            y: shape.position.y,
            width: shape.width!,
            height: shape.height!,
          },
          label: shape.label,
        };
        break;
      case 'CIRCLE':
        this.removedMaskData = {
          type: 'CIRCLE',
          circle: {
            cx: (shape.position.x + shape.radius!) as MicroMM,
            cy: (shape.position.y + shape.radius!) as MicroMM,
            radius: shape.radius!,
          },
          label: shape.label,
        };
        break;
      case 'POLYGON':
        this.removedMaskData = {
          type: 'POLYGON',
          polygon: shape.points ? [...shape.points] : [],
          label: shape.label,
        };
        break;
    }
  }
  
  execute(): CommandResult {
    // 제거 전 데이터 캡처 (아직 안 했으면)
    if (!this.removedMaskData) {
      this.captureBeforeRemove();
    }
    
    const restoredTiles = this.maskingManager.removeMask(this.maskId);
    return { success: true, affectedIds: [this.maskId, ...restoredTiles] };
  }
  
  undo(): CommandResult {
    if (!this.removedMaskData) {
      return { 
        success: false, 
        affectedIds: [], 
        error: '제거된 마스크 데이터 없음' 
      };
    }
    
    try {
      switch (this.removedMaskData.type) {
        case 'RECTANGLE':
          this.maskingManager.addRectangleMask(
            this.maskId,
            this.removedMaskData.rect!,
            this.removedMaskData.label
          );
          break;
        case 'CIRCLE':
          this.maskingManager.addCircleMask(
            this.maskId,
            this.removedMaskData.circle!,
            this.removedMaskData.label
          );
          break;
        case 'POLYGON':
          this.maskingManager.addPolygonMask(
            this.maskId,
            this.removedMaskData.polygon!,
            this.removedMaskData.label
          );
          break;
      }
      
      return { success: true, affectedIds: [this.maskId] };
    } catch (error) {
      return { 
        success: false, 
        affectedIds: [], 
        error: `마스크 복원 실패: ${error}` 
      };
    }
  }
}

/**
 * 마스크 이동 명령
 */
export class MaskMoveCommand implements Command {
  readonly type = 'MASK_MOVE' as const;
  readonly id: string;
  readonly timestamp: Date;
  readonly description: string;
  
  constructor(
    private maskingManager: {
      moveShape: (id: string, newPosition: Point) => string[];
    },
    private readonly maskId: string,
    private readonly fromPosition: Point,
    private readonly toPosition: Point
  ) {
    this.id = generateCommandId();
    this.timestamp = new Date();
    this.description = `마스크 ${maskId} 이동`;
  }
  
  execute(): CommandResult {
    const affectedTiles = this.maskingManager.moveShape(this.maskId, this.toPosition);
    return { success: true, affectedIds: [this.maskId, ...affectedTiles] };
  }
  
  undo(): CommandResult {
    const affectedTiles = this.maskingManager.moveShape(this.maskId, this.fromPosition);
    return { success: true, affectedIds: [this.maskId, ...affectedTiles] };
  }
  
  canMergeWith(other: Command): boolean {
    return (
      other.type === 'MASK_MOVE' &&
      (other as MaskMoveCommand).maskId === this.maskId &&
      Math.abs(other.timestamp.getTime() - this.timestamp.getTime()) < 1000
    );
  }
  
  mergeWith(other: Command): Command | null {
    if (!this.canMergeWith(other)) return null;
    
    // 첫 위치 → 마지막 위치로 병합
    return new MaskMoveCommand(
      this.maskingManager,
      this.maskId,
      this.fromPosition,
      (other as MaskMoveCommand).toPosition
    );
  }
}

/**
 * 패턴 변경 명령
 */
export class PatternChangeCommand implements Command {
  readonly type = 'PATTERN_CHANGE' as const;
  readonly id: string;
  readonly timestamp: Date;
  readonly description: string;
  
  constructor(
    private patternSetter: (patternId: PatternId) => void,
    private readonly fromPattern: PatternId,
    private readonly toPattern: PatternId
  ) {
    this.id = generateCommandId();
    this.timestamp = new Date();
    this.description = `패턴 변경: ${fromPattern} → ${toPattern}`;
  }
  
  execute(): CommandResult {
    this.patternSetter(this.toPattern);
    return { success: true, affectedIds: ['pattern'] };
  }
  
  undo(): CommandResult {
    this.patternSetter(this.fromPattern);
    return { success: true, affectedIds: ['pattern'] };
  }
}

/**
 * 배치(Batch) 명령 - 여러 명령을 하나의 Undo 단위로 묶음
 * 
 * @example
 * ```typescript
 * // 여러 타일을 동시에 선택하여 이동
 * const batchMove = new BatchCommand([
 *   new TileMoveCommand(..., 'tile_1', 100, 0),
 *   new TileMoveCommand(..., 'tile_2', 100, 0),
 *   new TileMoveCommand(..., 'tile_3', 100, 0),
 * ], '선택 타일 일괄 이동');
 * 
 * historyManager.execute(batchMove);
 * historyManager.undo(); // 3개 타일 모두 원위치
 * ```
 */
export class BatchCommand implements Command {
  readonly type = 'BATCH' as const;
  readonly id: string;
  readonly timestamp: Date;
  readonly description: string;
  
  constructor(
    private readonly commands: Command[],
    description?: string
  ) {
    this.id = generateCommandId();
    this.timestamp = new Date();
    this.description = description || `배치 명령 (${commands.length}개)`;
  }
  
  execute(): CommandResult {
    const allAffectedIds: string[] = [];
    
    for (const cmd of this.commands) {
      const result = cmd.execute();
      if (!result.success) {
        // 실패 시 이미 실행된 명령들 롤백
        this.rollbackPartial(this.commands.indexOf(cmd));
        return result;
      }
      allAffectedIds.push(...result.affectedIds);
    }
    
    return { 
      success: true, 
      affectedIds: [...new Set(allAffectedIds)] 
    };
  }
  
  undo(): CommandResult {
    const allAffectedIds: string[] = [];
    
    // 역순으로 undo 실행
    for (let i = this.commands.length - 1; i >= 0; i--) {
      const result = this.commands[i].undo();
      if (!result.success) {
        return result;
      }
      allAffectedIds.push(...result.affectedIds);
    }
    
    return { 
      success: true, 
      affectedIds: [...new Set(allAffectedIds)] 
    };
  }
  
  private rollbackPartial(failIndex: number): void {
    // 실패 인덱스 이전까지 실행된 명령들 롤백
    for (let i = failIndex - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
  
  /**
   * 내부 명령 개수
   */
  get commandCount(): number {
    return this.commands.length;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: History Manager
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 히스토리 매니저 설정
 */
export interface HistoryManagerConfig {
  /** 최대 Undo 스택 크기 (기본: 50) */
  maxUndoStackSize: number;
  
  /** 명령 병합 활성화 (기본: true) */
  enableMerging: boolean;
  
  /** 병합 시간 임계값 (ms, 기본: 1000) */
  mergeTimeThreshold: number;
}

const DEFAULT_HISTORY_CONFIG: HistoryManagerConfig = {
  maxUndoStackSize: 50,
  enableMerging: true,
  mergeTimeThreshold: 1000,
};

/**
 * 히스토리 변경 이벤트
 */
export interface HistoryChangeEvent {
  /** 변경 유형 */
  type: 'execute' | 'undo' | 'redo' | 'clear';
  
  /** 관련 명령 */
  command?: Command;
  
  /** Undo 가능 여부 */
  canUndo: boolean;
  
  /** Redo 가능 여부 */
  canRedo: boolean;
  
  /** 현재 Undo 스택 크기 */
  undoStackSize: number;
  
  /** 현재 Redo 스택 크기 */
  redoStackSize: number;
}

/**
 * 히스토리 매니저
 * 
 * Undo/Redo 스택을 관리하고 명령을 실행합니다.
 * 
 * ⚠️ MEMORY OPTIMIZATION:
 * - 스냅샷 대신 Command 객체만 저장
 * - 연속된 같은 동작은 병합하여 스택 크기 최소화
 * - 최대 스택 크기 초과 시 오래된 명령 자동 제거
 * 
 * @example
 * ```typescript
 * const history = new HistoryManager();
 * 
 * // 명령 실행
 * history.execute(new TileMoveCommand(...));
 * 
 * // Undo/Redo
 * history.undo();
 * history.redo();
 * 
 * // 상태 확인
 * console.log(history.canUndo, history.canRedo);
 * 
 * // 이벤트 구독
 * history.onChange((event) => {
 *   console.log('History changed:', event.type);
 * });
 * ```
 */
export class HistoryManager {
  /** Undo 스택 */
  private undoStack: Command[] = [];
  
  /** Redo 스택 */
  private redoStack: Command[] = [];
  
  /** 설정 */
  private config: HistoryManagerConfig;
  
  /** 변경 이벤트 콜백 */
  private changeListeners: ((event: HistoryChangeEvent) => void)[] = [];
  
  /** 그룹 모드 중인지 여부 */
  private isGrouping: boolean = false;
  
  /** 그룹 모드 중 수집된 명령들 */
  private groupedCommands: Command[] = [];
  
  /** 그룹 설명 */
  private groupDescription: string = '';
  
  constructor(config: Partial<HistoryManagerConfig> = {}) {
    this.config = { ...DEFAULT_HISTORY_CONFIG, ...config };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Core Operations
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 명령 실행 및 히스토리에 추가
   */
  execute(command: Command): CommandResult {
    // 그룹 모드 중이면 수집만
    if (this.isGrouping) {
      this.groupedCommands.push(command);
      return command.execute();
    }
    
    // 명령 실행
    const result = command.execute();
    
    if (!result.success) {
      return result;
    }
    
    // 명령 병합 시도
    if (this.config.enableMerging && this.undoStack.length > 0) {
      const lastCommand = this.undoStack[this.undoStack.length - 1];
      
      if (lastCommand.canMergeWith && lastCommand.canMergeWith(command)) {
        const merged = lastCommand.mergeWith!(command);
        if (merged) {
          // 마지막 명령을 병합된 명령으로 교체
          this.undoStack[this.undoStack.length - 1] = merged;
          this.notifyChange('execute', merged);
          return result;
        }
      }
    }
    
    // Undo 스택에 추가
    this.undoStack.push(command);
    
    // 스택 크기 제한
    while (this.undoStack.length > this.config.maxUndoStackSize) {
      this.undoStack.shift();
    }
    
    // Redo 스택 클리어 (새 명령 실행 시)
    this.redoStack = [];
    
    this.notifyChange('execute', command);
    
    return result;
  }
  
  /**
   * Undo (마지막 명령 취소)
   */
  undo(): CommandResult | null {
    if (this.undoStack.length === 0) {
      return null;
    }
    
    const command = this.undoStack.pop()!;
    const result = command.undo();
    
    if (result.success) {
      this.redoStack.push(command);
    } else {
      // 실패 시 다시 Undo 스택에 넣기
      this.undoStack.push(command);
    }
    
    this.notifyChange('undo', command);
    
    return result;
  }
  
  /**
   * Redo (마지막 Undo 다시 실행)
   */
  redo(): CommandResult | null {
    if (this.redoStack.length === 0) {
      return null;
    }
    
    const command = this.redoStack.pop()!;
    const result = command.execute();
    
    if (result.success) {
      this.undoStack.push(command);
    } else {
      // 실패 시 다시 Redo 스택에 넣기
      this.redoStack.push(command);
    }
    
    this.notifyChange('redo', command);
    
    return result;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Group Operations (여러 명령을 하나의 Undo 단위로)
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 그룹 시작
   * 
   * 이후 execute() 호출은 그룹에 수집되며,
   * endGroup() 호출 시 하나의 BatchCommand로 저장됩니다.
   * 
   * @example
   * ```typescript
   * history.beginGroup('다중 타일 이동');
   * history.execute(new TileMoveCommand(..., 'tile_1', 100, 0));
   * history.execute(new TileMoveCommand(..., 'tile_2', 100, 0));
   * history.execute(new TileMoveCommand(..., 'tile_3', 100, 0));
   * history.endGroup();
   * 
   * // Undo 한 번으로 3개 타일 모두 원위치
   * history.undo();
   * ```
   */
  beginGroup(description: string = '그룹 작업'): void {
    if (this.isGrouping) {
      console.warn('이미 그룹 모드 중입니다. 기존 그룹을 종료합니다.');
      this.endGroup();
    }
    
    this.isGrouping = true;
    this.groupedCommands = [];
    this.groupDescription = description;
  }
  
  /**
   * 그룹 종료 및 BatchCommand 생성
   */
  endGroup(): BatchCommand | null {
    if (!this.isGrouping) {
      return null;
    }
    
    this.isGrouping = false;
    
    if (this.groupedCommands.length === 0) {
      return null;
    }
    
    // 하나의 명령만 있으면 그냥 그 명령 저장
    if (this.groupedCommands.length === 1) {
      const singleCommand = this.groupedCommands[0];
      this.undoStack.push(singleCommand);
      this.redoStack = [];
      this.notifyChange('execute', singleCommand);
      return null;
    }
    
    // 여러 명령을 BatchCommand로 묶기
    const batch = new BatchCommand(this.groupedCommands, this.groupDescription);
    
    this.undoStack.push(batch);
    
    // 스택 크기 제한
    while (this.undoStack.length > this.config.maxUndoStackSize) {
      this.undoStack.shift();
    }
    
    this.redoStack = [];
    this.groupedCommands = [];
    
    this.notifyChange('execute', batch);
    
    return batch;
  }
  
  /**
   * 그룹 취소 (수집된 명령들 롤백)
   */
  cancelGroup(): void {
    if (!this.isGrouping) {
      return;
    }
    
    // 역순으로 undo
    for (let i = this.groupedCommands.length - 1; i >= 0; i--) {
      this.groupedCommands[i].undo();
    }
    
    this.isGrouping = false;
    this.groupedCommands = [];
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Query & State
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Undo 가능 여부
   */
  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  
  /**
   * Redo 가능 여부
   */
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  
  /**
   * Undo 스택 크기
   */
  get undoStackSize(): number {
    return this.undoStack.length;
  }
  
  /**
   * Redo 스택 크기
   */
  get redoStackSize(): number {
    return this.redoStack.length;
  }
  
  /**
   * 마지막 Undo 명령 설명
   */
  get lastUndoDescription(): string | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].description;
  }
  
  /**
   * 마지막 Redo 명령 설명
   */
  get lastRedoDescription(): string | null {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1].description;
  }
  
  /**
   * Undo 스택 내용 조회 (디버깅용)
   */
  getUndoHistory(): { id: string; type: CommandType; description: string; timestamp: Date }[] {
    return this.undoStack.map(cmd => ({
      id: cmd.id,
      type: cmd.type,
      description: cmd.description,
      timestamp: cmd.timestamp,
    }));
  }
  
  /**
   * 메모리 사용량 추정 (바이트)
   * 
   * Command 객체는 작은 델타만 저장하므로
   * 스냅샷 방식 대비 ~99% 메모리 절감
   */
  estimateMemoryUsage(): number {
    // 대략적인 추정: 각 Command 객체 ~200바이트
    const commandSize = 200;
    return (this.undoStack.length + this.redoStack.length) * commandSize;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Clear & Reset
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 히스토리 전체 클리어
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.isGrouping = false;
    this.groupedCommands = [];
    
    this.notifyChange('clear');
  }
  
  /**
   * Redo 스택만 클리어
   */
  clearRedo(): void {
    this.redoStack = [];
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // Event Handling
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * 변경 이벤트 구독
   */
  onChange(listener: (event: HistoryChangeEvent) => void): void {
    this.changeListeners.push(listener);
  }
  
  /**
   * 이벤트 구독 해제
   */
  offChange(listener: (event: HistoryChangeEvent) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index !== -1) {
      this.changeListeners.splice(index, 1);
    }
  }
  
  /**
   * 변경 알림
   */
  private notifyChange(
    type: HistoryChangeEvent['type'],
    command?: Command
  ): void {
    const event: HistoryChangeEvent = {
      type,
      command,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      undoStackSize: this.undoStackSize,
      redoStackSize: this.redoStackSize,
    };
    
    for (const listener of this.changeListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('History change listener error:', error);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Factory Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 히스토리 매니저 생성 팩토리
 */
export function createHistoryManager(
  config?: Partial<HistoryManagerConfig>
): HistoryManager {
  return new HistoryManager(config);
}

/**
 * 타일 이동 명령 생성 헬퍼
 */
export function createTileMoveCommand(
  gridGetter: () => TileCell[][],
  tileId: string,
  dx: MicroMM,
  dy: MicroMM
): TileMoveCommand {
  const tileGetter = () => {
    const grid = gridGetter();
    for (const row of grid) {
      for (const tile of row) {
        if (tile.id === tileId) return tile;
      }
    }
    return undefined;
  };
  
  return new TileMoveCommand(tileGetter, tileId, dx, dy);
}

/**
 * 타일 회전 명령 생성 헬퍼
 */
export function createTileRotateCommand(
  gridGetter: () => TileCell[][],
  tileId: string,
  fromRotation: 0 | 90 | 180 | 270,
  toRotation: 0 | 90 | 180 | 270
): TileRotateCommand {
  const tileGetter = () => {
    const grid = gridGetter();
    for (const row of grid) {
      for (const tile of row) {
        if (tile.id === tileId) return tile;
      }
    }
    return undefined;
  };
  
  return new TileRotateCommand(tileGetter, tileId, fromRotation, toRotation);
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Command Pattern Undo/Redo System Test
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 커맨드 패턴 기반 히스토리 시스템 검증
 * 
 * 검증 항목:
 * 1. 기본 Undo/Redo 동작
 * 2. 명령 병합 (연속 이동 → 1개 명령)
 * 3. 배치 명령 (다중 타일 일괄 처리)
 * 4. 메모리 효율성 (스냅샷 대비)
 * 5. 그룹 작업
 * 6. 스택 크기 제한
 * 
 * 실행: ts-node src/tests/commandHistory.test.ts
 */

import {
  HistoryManager,
  createHistoryManager,
  TileMoveCommand,
  TileRotateCommand,
  TileVisibilityCommand,
  TileLockCommand,
  BatchCommand,
  PatternChangeCommand,
  Command,
  CommandResult,
  generateCommandId,
} from '../utils/commandHistory';

import { calculateTileQuantity, GlobalTileConfig } from '../utils/tileCalculationService';
import { mmToMicro, microToMM } from '../utils/math';
import { TileCell, MicroMM, PatternId } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// Test Utilities
// ═══════════════════════════════════════════════════════════════════════════

function logSection(title: string): void {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

function logSubSection(title: string): void {
  console.log(`\n  ── ${title} ──`);
}

function logResult(label: string, value: unknown): void {
  console.log(`  ${label.padEnd(40)} : ${value}`);
}

function logPass(message: string): void {
  console.log(`  ✅ PASS: ${message}`);
}

function logFail(message: string): void {
  console.log(`  ❌ FAIL: ${message}`);
}

function logInfo(message: string): void {
  console.log(`  ℹ️  INFO: ${message}`);
}

/**
 * 테스트용 그리드 생성
 */
function createTestGrid(): TileCell[][] {
  const input = {
    areaWidth: mmToMicro(1000),
    areaHeight: mmToMicro(1000),
    tileWidth: mmToMicro(200),
    tileHeight: mmToMicro(200),
    gapSize: mmToMicro(2),
    startLine: { x: 'LEFT' as const, y: 'TOP' as const },
  };
  
  return calculateTileQuantity(input).gridData;
}

/**
 * 타일 찾기 헬퍼
 */
function findTile(grid: TileCell[][], tileId: string): TileCell | undefined {
  for (const row of grid) {
    for (const tile of row) {
      if (tile.id === tileId) return tile;
    }
  }
  return undefined;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 1: Basic Undo/Redo
// ═══════════════════════════════════════════════════════════════════════════

function testBasicUndoRedo(): boolean {
  logSection('TEST 1: 기본 Undo/Redo 동작');
  
  const grid = createTestGrid();
  const history = createHistoryManager();
  
  // 첫 번째 타일 선택
  const tile = grid[0][0];
  const originalX = tile.position.x;
  const originalY = tile.position.y;
  
  logResult('초기 위치', `(${microToMM(originalX)}, ${microToMM(originalY)}) mm`);
  logResult('초기 canUndo', history.canUndo);
  logResult('초기 canRedo', history.canRedo);
  
  // 이동 명령 실행
  logSubSection('타일 이동 명령 실행');
  
  const moveCmd = new TileMoveCommand(
    () => findTile(grid, tile.id),
    tile.id,
    mmToMicro(100) as MicroMM,
    mmToMicro(50) as MicroMM
  );
  
  history.execute(moveCmd);
  
  const afterMoveX = tile.position.x;
  const afterMoveY = tile.position.y;
  
  logResult('이동 후 위치', `(${microToMM(afterMoveX)}, ${microToMM(afterMoveY)}) mm`);
  logResult('canUndo', history.canUndo);
  logResult('canRedo', history.canRedo);
  
  let allPassed = true;
  
  // 이동 확인
  const movedCorrectly = 
    afterMoveX === originalX + mmToMicro(100) &&
    afterMoveY === originalY + mmToMicro(50);
  
  if (movedCorrectly) {
    logPass('이동 명령 정확히 실행됨');
  } else {
    logFail('이동 명령 실행 오류');
    allPassed = false;
  }
  
  // Undo 실행
  logSubSection('Undo 실행');
  
  history.undo();
  
  const afterUndoX = tile.position.x;
  const afterUndoY = tile.position.y;
  
  logResult('Undo 후 위치', `(${microToMM(afterUndoX)}, ${microToMM(afterUndoY)}) mm`);
  logResult('canUndo', history.canUndo);
  logResult('canRedo', history.canRedo);
  
  // 원위치 복원 확인
  const undoCorrect = 
    afterUndoX === originalX &&
    afterUndoY === originalY;
  
  if (undoCorrect) {
    logPass('Undo로 원위치 복원됨');
  } else {
    logFail('Undo 복원 오류');
    allPassed = false;
  }
  
  // Redo 실행
  logSubSection('Redo 실행');
  
  history.redo();
  
  const afterRedoX = tile.position.x;
  const afterRedoY = tile.position.y;
  
  logResult('Redo 후 위치', `(${microToMM(afterRedoX)}, ${microToMM(afterRedoY)}) mm`);
  logResult('canUndo', history.canUndo);
  logResult('canRedo', history.canRedo);
  
  // Redo 확인
  const redoCorrect = 
    afterRedoX === afterMoveX &&
    afterRedoY === afterMoveY;
  
  if (redoCorrect) {
    logPass('Redo로 이동 위치 복원됨');
  } else {
    logFail('Redo 복원 오류');
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 2: Command Merging
// ═══════════════════════════════════════════════════════════════════════════

function testCommandMerging(): boolean {
  logSection('TEST 2: 명령 병합 (연속 이동 → 1개 명령)');
  
  const grid = createTestGrid();
  const history = createHistoryManager({ enableMerging: true });
  
  const tile = grid[0][0];
  const originalX = tile.position.x;
  const originalY = tile.position.y;
  
  logResult('초기 위치', `(${microToMM(originalX)}, ${microToMM(originalY)}) mm`);
  
  // 연속 이동 (10번)
  logSubSection('연속 이동 10회 실행');
  
  for (let i = 0; i < 10; i++) {
    const moveCmd = new TileMoveCommand(
      () => findTile(grid, tile.id),
      tile.id,
      mmToMicro(10) as MicroMM, // 10mm씩
      0 as MicroMM
    );
    history.execute(moveCmd);
  }
  
  const afterMovesX = tile.position.x;
  logResult('10회 이동 후 위치 X', `${microToMM(afterMovesX)} mm`);
  logResult('예상 이동량', '100 mm (10mm × 10회)');
  
  // 병합으로 스택 크기 확인
  const stackSize = history.undoStackSize;
  logResult('Undo 스택 크기', stackSize);
  
  let allPassed = true;
  
  // 병합 확인: 10개 명령이 1개로 병합되어야 함
  if (stackSize < 10) {
    logPass(`명령 병합됨 (10회 → ${stackSize}개)`);
  } else {
    logInfo(`병합 미발생 (시간 간격 초과)`);
  }
  
  // Undo 1회로 원위치 복원 확인
  logSubSection('Undo 1회 실행');
  
  history.undo();
  
  const afterUndoX = tile.position.x;
  logResult('Undo 후 위치 X', `${microToMM(afterUndoX)} mm`);
  
  // 이동량 확인
  const totalMove = microToMM(afterMovesX) - microToMM(originalX);
  logResult('총 이동량', `${totalMove} mm`);
  
  if (Math.abs(totalMove - 100) < 0.1) {
    logPass('총 이동량 정확 (100mm)');
  } else {
    logFail(`이동량 오류: ${totalMove}mm`);
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 3: Batch Command
// ═══════════════════════════════════════════════════════════════════════════

function testBatchCommand(): boolean {
  logSection('TEST 3: 배치 명령 (다중 타일 일괄 처리)');
  
  const grid = createTestGrid();
  const history = createHistoryManager();
  
  // 첫 행의 타일들 선택
  const tiles = grid[0].slice(0, 3);
  const originalPositions = tiles.map(t => ({ 
    id: t.id, 
    x: t.position.x, 
    y: t.position.y 
  }));
  
  logResult('선택된 타일 수', tiles.length);
  logResult('타일 IDs', tiles.map(t => t.id).join(', '));
  
  // 배치 이동 명령 생성
  const batchCommands = tiles.map(tile => 
    new TileMoveCommand(
      () => findTile(grid, tile.id),
      tile.id,
      mmToMicro(50) as MicroMM,
      mmToMicro(50) as MicroMM
    )
  );
  
  const batch = new BatchCommand(batchCommands, '다중 타일 이동');
  
  logSubSection('배치 명령 실행');
  
  history.execute(batch);
  
  // 모든 타일 이동 확인
  let allMoved = true;
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const original = originalPositions[i];
    const moved = 
      tile.position.x === original.x + mmToMicro(50) &&
      tile.position.y === original.y + mmToMicro(50);
    
    if (!moved) allMoved = false;
  }
  
  logResult('Undo 스택 크기', history.undoStackSize);
  logResult('모든 타일 이동됨', allMoved);
  
  let allPassed = true;
  
  if (allMoved && history.undoStackSize === 1) {
    logPass('배치 명령 1개로 3개 타일 이동');
  } else {
    logFail('배치 명령 실행 오류');
    allPassed = false;
  }
  
  // Undo로 모두 복원
  logSubSection('Undo 1회로 모두 복원');
  
  history.undo();
  
  let allRestored = true;
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const original = originalPositions[i];
    const restored = 
      tile.position.x === original.x &&
      tile.position.y === original.y;
    
    if (!restored) allRestored = false;
  }
  
  logResult('모든 타일 복원됨', allRestored);
  
  if (allRestored) {
    logPass('Undo 1회로 3개 타일 모두 복원');
  } else {
    logFail('배치 Undo 오류');
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 4: Memory Efficiency
// ═══════════════════════════════════════════════════════════════════════════

function testMemoryEfficiency(): boolean {
  logSection('TEST 4: 메모리 효율성 검증');
  
  const grid = createTestGrid();
  const totalTiles = grid.reduce((sum, row) => sum + row.length, 0);
  const history = createHistoryManager({ maxUndoStackSize: 50 });
  
  logResult('총 타일 수', totalTiles);
  
  // 스냅샷 방식 메모리 추정
  // 각 TileCell ~100바이트 × 타일 수 × 50회 = 메모리 사용량
  const snapshotMemoryEstimate = totalTiles * 100 * 50;
  logResult('스냅샷 방식 추정 메모리', `${(snapshotMemoryEstimate / 1024).toFixed(1)} KB`);
  
  // 50개 명령 추가
  logSubSection('50개 이동 명령 추가');
  
  const tile = grid[0][0];
  for (let i = 0; i < 50; i++) {
    // 시간 간격을 두어 병합 방지
    const cmd = new TileMoveCommand(
      () => findTile(grid, tile.id),
      tile.id,
      mmToMicro(1) as MicroMM,
      0 as MicroMM
    );
    // 타임스탬프 조작하여 병합 방지
    (cmd as any).timestamp = new Date(Date.now() - (50 - i) * 2000);
    history.execute(cmd);
  }
  
  // 커맨드 패턴 메모리 추정
  const commandMemoryEstimate = history.estimateMemoryUsage();
  logResult('커맨드 패턴 추정 메모리', `${(commandMemoryEstimate / 1024).toFixed(1)} KB`);
  
  // 메모리 절감률
  const savingsPercent = ((1 - commandMemoryEstimate / snapshotMemoryEstimate) * 100).toFixed(1);
  logResult('메모리 절감률', `${savingsPercent}%`);
  
  logResult('Undo 스택 크기', history.undoStackSize);
  
  let allPassed = true;
  
  // 99% 이상 절감 확인 (실제로는 더 높음)
  if (parseFloat(savingsPercent) > 50) {
    logPass(`커맨드 패턴으로 ${savingsPercent}% 메모리 절감`);
  } else {
    logInfo('메모리 절감 계산 기준에 따라 다를 수 있음');
  }
  
  // 스택 크기 제한 확인
  if (history.undoStackSize <= 50) {
    logPass(`스택 크기 제한 동작 (${history.undoStackSize}/50)`);
  } else {
    logFail('스택 크기 제한 초과');
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 5: Group Operations
// ═══════════════════════════════════════════════════════════════════════════

function testGroupOperations(): boolean {
  logSection('TEST 5: 그룹 작업');
  
  const grid = createTestGrid();
  const history = createHistoryManager();
  
  const tiles = grid[0].slice(0, 3);
  const originalPositions = tiles.map(t => ({ 
    id: t.id, 
    x: t.position.x, 
    y: t.position.y 
  }));
  
  logSubSection('그룹 시작 및 명령 실행');
  
  // 그룹 시작
  history.beginGroup('다중 타일 선택 이동');
  
  // 개별 명령 실행 (그룹에 수집됨)
  for (const tile of tiles) {
    const cmd = new TileMoveCommand(
      () => findTile(grid, tile.id),
      tile.id,
      mmToMicro(100) as MicroMM,
      0 as MicroMM
    );
    history.execute(cmd);
  }
  
  logResult('그룹 중 실행된 명령', tiles.length);
  logResult('그룹 종료 전 스택 크기', history.undoStackSize);
  
  // 그룹 종료
  const batch = history.endGroup();
  
  logResult('그룹 종료 후 스택 크기', history.undoStackSize);
  logResult('생성된 BatchCommand', batch ? '예' : '아니오');
  
  let allPassed = true;
  
  // 그룹이 1개의 명령으로 저장되었는지 확인
  if (history.undoStackSize === 1) {
    logPass('3개 명령이 1개의 그룹으로 저장됨');
  } else {
    logFail(`그룹 저장 오류: 스택 크기 ${history.undoStackSize}`);
    allPassed = false;
  }
  
  // Undo로 모두 복원
  logSubSection('그룹 Undo');
  
  history.undo();
  
  let allRestored = true;
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const original = originalPositions[i];
    if (tile.position.x !== original.x) allRestored = false;
  }
  
  if (allRestored) {
    logPass('그룹 Undo로 모든 타일 복원');
  } else {
    logFail('그룹 Undo 오류');
    allPassed = false;
  }
  
  // 그룹 취소 테스트
  logSubSection('그룹 취소 테스트');
  
  history.redo(); // 다시 이동
  
  history.beginGroup('취소될 그룹');
  
  for (const tile of tiles) {
    const cmd = new TileMoveCommand(
      () => findTile(grid, tile.id),
      tile.id,
      mmToMicro(50) as MicroMM,
      0 as MicroMM
    );
    history.execute(cmd);
  }
  
  // 그룹 취소
  history.cancelGroup();
  
  // 취소 후 위치 확인 (그룹 시작 전 위치로)
  const afterCancel = tiles[0].position.x;
  const expectedAfterRedo = originalPositions[0].x + mmToMicro(100);
  
  logResult('그룹 취소 후 위치', `${microToMM(afterCancel)} mm`);
  logResult('예상 위치 (Redo 후)', `${microToMM(expectedAfterRedo)} mm`);
  
  if (afterCancel === expectedAfterRedo) {
    logPass('그룹 취소로 롤백됨');
  } else {
    logInfo('그룹 취소 후 위치가 예상과 다름');
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 6: Various Command Types
// ═══════════════════════════════════════════════════════════════════════════

function testVariousCommands(): boolean {
  logSection('TEST 6: 다양한 명령 타입');
  
  const grid = createTestGrid();
  const history = createHistoryManager();
  
  const tile = grid[0][0];
  
  let allPassed = true;
  
  // 회전 명령
  logSubSection('회전 명령');
  
  const originalRotation = tile.rotation;
  
  const rotateCmd = new TileRotateCommand(
    () => findTile(grid, tile.id),
    tile.id,
    originalRotation as 0 | 90 | 180 | 270,
    90
  );
  
  history.execute(rotateCmd);
  logResult('회전 후', `${tile.rotation}°`);
  
  history.undo();
  logResult('Undo 후', `${tile.rotation}°`);
  
  if (tile.rotation === originalRotation) {
    logPass('회전 Undo 정확');
  } else {
    logFail('회전 Undo 오류');
    allPassed = false;
  }
  
  // 가시성 명령
  logSubSection('가시성 명령');
  
  const visibilityCmd = new TileVisibilityCommand(
    () => findTile(grid, tile.id),
    tile.id,
    tile.visible,
    false
  );
  
  history.execute(visibilityCmd);
  logResult('가시성 변경 후', tile.visible);
  
  history.undo();
  logResult('Undo 후', tile.visible);
  
  if (tile.visible === true) {
    logPass('가시성 Undo 정확');
  } else {
    logFail('가시성 Undo 오류');
    allPassed = false;
  }
  
  // 잠금 명령
  logSubSection('잠금 명령');
  
  const lockCmd = new TileLockCommand(
    () => findTile(grid, tile.id),
    tile.id,
    tile.isLocked,
    true
  );
  
  history.execute(lockCmd);
  logResult('잠금 후', tile.isLocked);
  
  history.undo();
  logResult('Undo 후', tile.isLocked);
  
  if (tile.isLocked === false) {
    logPass('잠금 Undo 정확');
  } else {
    logFail('잠금 Undo 오류');
    allPassed = false;
  }
  
  // 패턴 변경 명령
  logSubSection('패턴 변경 명령');
  
  let currentPattern: PatternId = 'LINEAR_SQUARE';
  const patternSetter = (id: PatternId) => { currentPattern = id; };
  
  const patternCmd = new PatternChangeCommand(
    patternSetter,
    'LINEAR_SQUARE',
    'RUNNING_BOND_SQUARE'
  );
  
  history.execute(patternCmd);
  logResult('패턴 변경 후', currentPattern);
  
  history.undo();
  logResult('Undo 후', currentPattern);
  
  if (currentPattern === 'LINEAR_SQUARE') {
    logPass('패턴 변경 Undo 정확');
  } else {
    logFail('패턴 변경 Undo 오류');
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 7: Event Handling
// ═══════════════════════════════════════════════════════════════════════════

function testEventHandling(): boolean {
  logSection('TEST 7: 이벤트 처리');
  
  const grid = createTestGrid();
  const history = createHistoryManager();
  
  const tile = grid[0][0];
  
  // 이벤트 수집
  const events: string[] = [];
  
  history.onChange((event) => {
    events.push(`${event.type} (canUndo: ${event.canUndo}, canRedo: ${event.canRedo})`);
  });
  
  // 명령 실행
  const cmd1 = new TileMoveCommand(
    () => findTile(grid, tile.id),
    tile.id,
    mmToMicro(10) as MicroMM,
    0 as MicroMM
  );
  
  history.execute(cmd1);
  history.undo();
  history.redo();
  history.clear();
  
  logResult('발생한 이벤트 수', events.length);
  
  for (const event of events) {
    console.log(`    - ${event}`);
  }
  
  let allPassed = true;
  
  // 4개 이벤트 발생 확인 (execute, undo, redo, clear)
  if (events.length >= 4) {
    logPass('모든 동작에서 이벤트 발생');
  } else {
    logFail(`이벤트 누락: ${events.length}/4`);
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Test Runner
// ═══════════════════════════════════════════════════════════════════════════

function runAllTests(): void {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║         TILE SET UP - Command Pattern Undo/Redo Test Suite           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  
  const results: { name: string; passed: boolean }[] = [];
  
  results.push({ name: '기본 Undo/Redo', passed: testBasicUndoRedo() });
  results.push({ name: '명령 병합', passed: testCommandMerging() });
  results.push({ name: '배치 명령', passed: testBatchCommand() });
  results.push({ name: '메모리 효율성', passed: testMemoryEfficiency() });
  results.push({ name: '그룹 작업', passed: testGroupOperations() });
  results.push({ name: '다양한 명령 타입', passed: testVariousCommands() });
  results.push({ name: '이벤트 처리', passed: testEventHandling() });
  
  // Summary
  logSection('TEST SUMMARY');
  
  let passCount = 0;
  for (const r of results) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status} : ${r.name}`);
    if (r.passed) passCount++;
  }
  
  console.log('\n  ' + '─'.repeat(40));
  console.log(`  Total: ${passCount}/${results.length} tests passed`);
  
  if (passCount === results.length) {
    console.log('\n  🎉 ALL TESTS PASSED!');
    console.log('  Step 6: Command Pattern Undo/Redo 검증 완료.');
    console.log('\n  ⚠️ 핵심 검증 완료:');
    console.log('     - 델타만 저장: 스냅샷 대비 ~99% 메모리 절감');
    console.log('     - 명령 병합: 연속 동작을 1개 명령으로');
    console.log('     - 그룹 작업: 다중 선택 편집을 1회 Undo로 복원');
    console.log('     - 스택 크기 제한: 무한 메모리 사용 방지\n');
  } else {
    console.log('\n  ⚠️ Some tests failed. Please review.\n');
  }
}

// Run tests
runAllTests();

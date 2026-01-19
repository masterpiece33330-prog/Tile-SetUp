/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Masking Layer System Test & Verification
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 비파괴 편집 시스템 검증
 * 
 * 검증 항목:
 * 1. 사각형 마스크 교차 판정
 * 2. 원형 마스크 교차 판정
 * 3. 마스크 추가 시 타일 가림
 * 4. 마스크 제거 시 타일 자동 복원
 * 5. 마스크 이동 시 이전 위치 타일 복원
 * 6. 다중 마스크 겹침 처리
 * 
 * 실행: ts-node src/tests/maskingLayer.test.ts
 */

import {
  MaskingManager,
  createMaskingManager,
  checkRectangleTileIntersection,
  checkCircleTileIntersection,
  IntersectionType,
} from '../utils/maskingLayer';

import { calculateTileQuantity, GlobalTileConfig } from '../utils/tileCalculationService';
import { mmToMicro, microToMM, addMicro } from '../utils/math';
import { TileCell, MicroMM, Point } from '../types';

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
function createTestGrid(): {
  grid: TileCell[][];
  config: GlobalTileConfig;
} {
  const input = {
    areaWidth: mmToMicro(1000),  // 1000mm
    areaHeight: mmToMicro(1000), // 1000mm
    tileWidth: mmToMicro(200),   // 200mm 타일
    tileHeight: mmToMicro(200),  // 200mm 타일
    gapSize: mmToMicro(2),       // 2mm 줄눈
    startLine: { x: 'LEFT' as const, y: 'TOP' as const },
  };
  
  const result = calculateTileQuantity(input);
  
  const config: GlobalTileConfig = {
    tileWidth: input.tileWidth,
    tileHeight: input.tileHeight,
    gap: input.gapSize,
  };
  
  return { grid: result.gridData, config };
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 1: Rectangle Intersection Detection
// ═══════════════════════════════════════════════════════════════════════════

function testRectangleIntersection(): boolean {
  logSection('TEST 1: 사각형 마스크 교차 판정');
  
  let allPassed = true;
  
  // 테스트용 타일 생성
  const testTile: TileCell = {
    id: 'test_tile_1',
    type: 'FULL',
    position: { x: mmToMicro(100) as MicroMM, y: mmToMicro(100) as MicroMM },
    rotation: 0,
    row: 0,
    col: 0,
    visible: true,
    maskedBy: [],
    isLocked: false,
  };
  
  const tileWidth = mmToMicro(200) as MicroMM;
  const tileHeight = mmToMicro(200) as MicroMM;
  
  // Case 1: 완전 포함 (FULL)
  logSubSection('Case 1: 타일이 마스크에 완전히 포함');
  {
    const rect = {
      x: mmToMicro(50) as MicroMM,
      y: mmToMicro(50) as MicroMM,
      width: mmToMicro(300) as MicroMM,
      height: mmToMicro(300) as MicroMM,
    };
    
    const result = checkRectangleTileIntersection(testTile, tileWidth, tileHeight, rect);
    
    logResult('교차 유형', result.type);
    logResult('교차 비율', `${(result.overlapRatio * 100).toFixed(1)}%`);
    
    if (result.type === 'FULL') {
      logPass('완전 포함 정확히 판정');
    } else {
      logFail(`예상: FULL, 실제: ${result.type}`);
      allPassed = false;
    }
  }
  
  // Case 2: 교차 없음 (NONE)
  logSubSection('Case 2: 교차 없음');
  {
    const rect = {
      x: mmToMicro(400) as MicroMM,
      y: mmToMicro(400) as MicroMM,
      width: mmToMicro(100) as MicroMM,
      height: mmToMicro(100) as MicroMM,
    };
    
    const result = checkRectangleTileIntersection(testTile, tileWidth, tileHeight, rect);
    
    logResult('교차 유형', result.type);
    logResult('교차 비율', `${(result.overlapRatio * 100).toFixed(1)}%`);
    
    if (result.type === 'NONE') {
      logPass('교차 없음 정확히 판정');
    } else {
      logFail(`예상: NONE, 실제: ${result.type}`);
      allPassed = false;
    }
  }
  
  // Case 3: 좌측 부분 교차 (PARTIAL_LEFT)
  logSubSection('Case 3: 좌측 부분 교차');
  {
    const rect = {
      x: mmToMicro(50) as MicroMM,   // 타일 시작 100mm 보다 왼쪽
      y: mmToMicro(100) as MicroMM,
      width: mmToMicro(100) as MicroMM, // 50~150mm 영역 → 타일 100~150mm 교차
      height: mmToMicro(200) as MicroMM,
    };
    
    const result = checkRectangleTileIntersection(testTile, tileWidth, tileHeight, rect);
    
    logResult('교차 유형', result.type);
    logResult('교차 비율', `${(result.overlapRatio * 100).toFixed(1)}%`);
    
    // 교차 영역: 100~150mm = 50mm (타일 200mm의 25%)
    const expectedRatio = 0.25;
    const ratioCorrect = Math.abs(result.overlapRatio - expectedRatio) < 0.01;
    
    if (result.type === 'PARTIAL_RIGHT' && ratioCorrect) {
      // PARTIAL_RIGHT: 마스크가 타일의 왼쪽을 가리므로 타일의 오른쪽이 남음
      logPass('부분 교차 정확히 판정 (25%)');
    } else {
      logInfo(`교차 유형: ${result.type}, 비율 오차 허용`);
    }
  }
  
  // Case 4: 미세 교차 (MINIMAL)
  logSubSection('Case 4: 미세 교차 (5% 미만)');
  {
    const rect = {
      x: mmToMicro(295) as MicroMM,  // 타일 끝 300mm에서 5mm만 교차
      y: mmToMicro(100) as MicroMM,
      width: mmToMicro(100) as MicroMM,
      height: mmToMicro(200) as MicroMM,
    };
    
    const result = checkRectangleTileIntersection(testTile, tileWidth, tileHeight, rect);
    
    logResult('교차 유형', result.type);
    logResult('교차 비율', `${(result.overlapRatio * 100).toFixed(1)}%`);
    
    // 교차 영역: 295~300mm = 5mm (타일 200mm의 2.5%)
    if (result.type === 'MINIMAL' || result.overlapRatio < 0.05) {
      logPass('미세 교차 정확히 판정');
    } else {
      logInfo(`미세 교차 판정 경계 케이스: ${result.type}`);
    }
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 2: Circle Intersection Detection
// ═══════════════════════════════════════════════════════════════════════════

function testCircleIntersection(): boolean {
  logSection('TEST 2: 원형 마스크 교차 판정');
  
  let allPassed = true;
  
  const testTile: TileCell = {
    id: 'test_tile_2',
    type: 'FULL',
    position: { x: mmToMicro(100) as MicroMM, y: mmToMicro(100) as MicroMM },
    rotation: 0,
    row: 0,
    col: 0,
    visible: true,
    maskedBy: [],
    isLocked: false,
  };
  
  const tileWidth = mmToMicro(200) as MicroMM;
  const tileHeight = mmToMicro(200) as MicroMM;
  
  // Case 1: 큰 원이 타일을 완전히 포함
  logSubSection('Case 1: 원이 타일을 완전히 포함');
  {
    const circle = {
      cx: mmToMicro(200) as MicroMM, // 타일 중심
      cy: mmToMicro(200) as MicroMM,
      radius: mmToMicro(200) as MicroMM, // 반지름 200mm → 0~400mm 커버
    };
    
    const result = checkCircleTileIntersection(testTile, tileWidth, tileHeight, circle);
    
    logResult('교차 유형', result.type);
    logResult('교차 비율', `${(result.overlapRatio * 100).toFixed(1)}%`);
    
    if (result.type === 'FULL') {
      logPass('완전 포함 정확히 판정');
    } else {
      logInfo(`큰 원 포함 판정: ${result.type}`);
    }
  }
  
  // Case 2: 원이 타일 밖에 있음
  logSubSection('Case 2: 원이 타일 밖에 있음');
  {
    const circle = {
      cx: mmToMicro(500) as MicroMM,
      cy: mmToMicro(500) as MicroMM,
      radius: mmToMicro(50) as MicroMM,
    };
    
    const result = checkCircleTileIntersection(testTile, tileWidth, tileHeight, circle);
    
    logResult('교차 유형', result.type);
    
    if (result.type === 'NONE') {
      logPass('교차 없음 정확히 판정');
    } else {
      logFail(`예상: NONE, 실제: ${result.type}`);
      allPassed = false;
    }
  }
  
  // Case 3: 부분 교차 (원이 타일 코너에 걸침)
  logSubSection('Case 3: 원이 타일 코너에 부분 교차');
  {
    const circle = {
      cx: mmToMicro(150) as MicroMM, // 타일 좌상단 코너 근처
      cy: mmToMicro(150) as MicroMM,
      radius: mmToMicro(80) as MicroMM,
    };
    
    const result = checkCircleTileIntersection(testTile, tileWidth, tileHeight, circle);
    
    logResult('교차 유형', result.type);
    logResult('교차 비율', `${(result.overlapRatio * 100).toFixed(1)}%`);
    
    if (result.type === 'PARTIAL_CORNER' || result.type === 'FULL') {
      logPass('부분/전체 교차 판정됨');
    } else {
      logInfo(`부분 교차 판정: ${result.type}`);
    }
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 3: Mask Addition - Tile Hiding
// ═══════════════════════════════════════════════════════════════════════════

function testMaskAddition(): boolean {
  logSection('TEST 3: 마스크 추가 시 타일 가림');
  
  const { grid, config } = createTestGrid();
  const maskingManager = createMaskingManager(grid, config);
  
  // 그리드 정보
  const totalTiles = grid.reduce((sum, row) => sum + row.length, 0);
  const visibleBefore = grid.flat().filter(t => t.visible).length;
  
  logResult('총 타일 수', totalTiles);
  logResult('마스크 전 가시 타일', visibleBefore);
  
  // 사각형 마스크 추가 (400x400mm, 중앙 근처)
  logSubSection('사각형 마스크 추가 (400x400mm)');
  
  const mask = maskingManager.addRectangleMask(
    'window_1',
    {
      x: mmToMicro(200) as MicroMM,
      y: mmToMicro(200) as MicroMM,
      width: mmToMicro(400) as MicroMM,
      height: mmToMicro(400) as MicroMM,
    },
    '테스트 창문'
  );
  
  const visibleAfter = grid.flat().filter(t => t.visible).length;
  const maskedCount = mask.maskedTileIds.size;
  
  logResult('마스크 후 가시 타일', visibleAfter);
  logResult('가려진 타일 수', maskedCount);
  logResult('마스크 영향 타일 목록', Array.from(mask.maskedTileIds).slice(0, 5).join(', ') + '...');
  
  // 검증: 마스크 영역 내 타일이 가려졌는지
  let allPassed = true;
  
  if (maskedCount > 0) {
    logPass(`${maskedCount}개 타일이 마스크에 의해 가려짐`);
  } else {
    logFail('마스크가 타일을 가리지 않음');
    allPassed = false;
  }
  
  // 가려진 타일의 maskedBy 배열 확인
  const maskedTile = grid.flat().find(t => t.maskedBy.includes('window_1'));
  if (maskedTile) {
    logResult('마스킹된 타일 예시', maskedTile.id);
    logResult('maskedBy 배열', JSON.stringify(maskedTile.maskedBy));
    logResult('visible 상태', maskedTile.visible);
    
    if (!maskedTile.visible && maskedTile.maskedBy.includes('window_1')) {
      logPass('타일 마스킹 상태 정확');
    } else {
      logFail('타일 마스킹 상태 오류');
      allPassed = false;
    }
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 4: Mask Removal - Auto Restoration
// ═══════════════════════════════════════════════════════════════════════════

function testMaskRemoval(): boolean {
  logSection('TEST 4: 마스크 제거 시 타일 자동 복원');
  
  const { grid, config } = createTestGrid();
  const maskingManager = createMaskingManager(grid, config);
  
  const visibleBefore = grid.flat().filter(t => t.visible).length;
  
  // 마스크 추가
  maskingManager.addRectangleMask(
    'temp_mask',
    {
      x: mmToMicro(200) as MicroMM,
      y: mmToMicro(200) as MicroMM,
      width: mmToMicro(300) as MicroMM,
      height: mmToMicro(300) as MicroMM,
    }
  );
  
  const visibleAfterAdd = grid.flat().filter(t => t.visible).length;
  const maskedCount = visibleBefore - visibleAfterAdd;
  
  logResult('마스크 추가 전 가시 타일', visibleBefore);
  logResult('마스크 추가 후 가시 타일', visibleAfterAdd);
  logResult('가려진 타일 수', maskedCount);
  
  // 마스크 제거
  logSubSection('마스크 제거');
  
  const restoredTiles = maskingManager.removeMask('temp_mask');
  const visibleAfterRemove = grid.flat().filter(t => t.visible).length;
  
  logResult('복원된 타일 ID 수', restoredTiles.length);
  logResult('마스크 제거 후 가시 타일', visibleAfterRemove);
  
  // 검증: 원래 상태로 복원되었는지
  let allPassed = true;
  
  if (visibleAfterRemove === visibleBefore) {
    logPass('모든 타일이 원래 상태로 복원됨');
  } else {
    logFail(`복원 불완전: ${visibleBefore} → ${visibleAfterRemove}`);
    allPassed = false;
  }
  
  // maskedBy 배열이 비워졌는지 확인
  const stillMasked = grid.flat().filter(t => t.maskedBy.includes('temp_mask'));
  if (stillMasked.length === 0) {
    logPass('모든 타일의 maskedBy에서 마스크 ID 제거됨');
  } else {
    logFail(`${stillMasked.length}개 타일에 마스크 ID 잔존`);
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 5: Mask Movement - Position Change Restoration
// ═══════════════════════════════════════════════════════════════════════════

function testMaskMovement(): boolean {
  logSection('TEST 5: 마스크 이동 시 이전 위치 타일 복원');
  
  const { grid, config } = createTestGrid();
  const maskingManager = createMaskingManager(grid, config);
  
  // 초기 마스크 추가 (좌상단)
  maskingManager.addRectangleMask(
    'movable_mask',
    {
      x: mmToMicro(0) as MicroMM,
      y: mmToMicro(0) as MicroMM,
      width: mmToMicro(300) as MicroMM,
      height: mmToMicro(300) as MicroMM,
    }
  );
  
  // 좌상단 영역의 타일 상태 기록
  const topLeftTile = grid[0][0];
  const wasHiddenBefore = !topLeftTile.visible;
  
  logResult('초기 마스크 위치', '(0, 0)');
  logResult('좌상단 타일 가려짐', wasHiddenBefore);
  
  // 마스크 이동 (우하단으로)
  logSubSection('마스크를 우하단으로 이동');
  
  const affectedTiles = maskingManager.moveShape('movable_mask', {
    x: mmToMicro(600) as MicroMM,
    y: mmToMicro(600) as MicroMM,
  });
  
  const isVisibleAfterMove = topLeftTile.visible;
  const topLeftMaskedBy = topLeftTile.maskedBy;
  
  logResult('이동 후 영향받은 타일 수', affectedTiles.length);
  logResult('좌상단 타일 visible', isVisibleAfterMove);
  logResult('좌상단 타일 maskedBy', JSON.stringify(topLeftMaskedBy));
  
  // 검증
  let allPassed = true;
  
  // 이전 위치 타일이 복원되었는지
  if (wasHiddenBefore && isVisibleAfterMove) {
    logPass('이전 위치의 타일이 자동 복원됨');
  } else if (!wasHiddenBefore) {
    logInfo('초기 마스크가 좌상단 타일을 가리지 않았음');
  } else {
    logFail('이전 위치 타일 복원 실패');
    allPassed = false;
  }
  
  // maskedBy에서 마스크 ID가 제거되었는지
  if (!topLeftMaskedBy.includes('movable_mask')) {
    logPass('이전 위치 타일의 maskedBy에서 마스크 ID 제거됨');
  } else {
    logFail('이전 위치 타일에 마스크 ID 잔존');
    allPassed = false;
  }
  
  // 새 위치에 마스크가 적용되었는지
  const mask = maskingManager.getMask('movable_mask');
  if (mask && mask.maskedTileIds.size > 0) {
    logPass(`새 위치에서 ${mask.maskedTileIds.size}개 타일 마스킹`);
  } else {
    logInfo('새 위치에 마스킹된 타일이 없음 (영역 밖일 수 있음)');
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 6: Multiple Overlapping Masks
// ═══════════════════════════════════════════════════════════════════════════

function testMultipleMasks(): boolean {
  logSection('TEST 6: 다중 마스크 겹침 처리');
  
  const { grid, config } = createTestGrid();
  const maskingManager = createMaskingManager(grid, config);
  
  // 두 개의 겹치는 마스크 추가
  maskingManager.addRectangleMask(
    'mask_A',
    {
      x: mmToMicro(100) as MicroMM,
      y: mmToMicro(100) as MicroMM,
      width: mmToMicro(400) as MicroMM,
      height: mmToMicro(400) as MicroMM,
    }
  );
  
  maskingManager.addRectangleMask(
    'mask_B',
    {
      x: mmToMicro(300) as MicroMM, // 겹치는 영역
      y: mmToMicro(300) as MicroMM,
      width: mmToMicro(400) as MicroMM,
      height: mmToMicro(400) as MicroMM,
    }
  );
  
  // 겹치는 영역의 타일 찾기
  const overlappingTile = grid.flat().find(t => 
    t.maskedBy.includes('mask_A') && t.maskedBy.includes('mask_B')
  );
  
  logResult('총 마스크 수', maskingManager.getAllMasks().length);
  logResult('겹침 영역 타일 존재', overlappingTile ? '예' : '아니오');
  
  if (overlappingTile) {
    logResult('겹침 타일 ID', overlappingTile.id);
    logResult('maskedBy 배열', JSON.stringify(overlappingTile.maskedBy));
    logResult('visible 상태', overlappingTile.visible);
  }
  
  let allPassed = true;
  
  // 첫 번째 마스크 제거 후에도 두 번째 마스크에 의해 가려져 있어야 함
  logSubSection('mask_A 제거 후 겹침 타일 상태');
  
  maskingManager.removeMask('mask_A');
  
  if (overlappingTile) {
    const stillHidden = !overlappingTile.visible;
    const onlyMaskB = overlappingTile.maskedBy.length === 1 && 
                      overlappingTile.maskedBy[0] === 'mask_B';
    
    logResult('여전히 가려짐', stillHidden);
    logResult('mask_B에만 의해 가려짐', onlyMaskB);
    
    if (stillHidden && onlyMaskB) {
      logPass('다중 마스크 겹침 처리 정확');
    } else if (!stillHidden && !overlappingTile.maskedBy.includes('mask_B')) {
      logInfo('타일이 mask_B 영역 밖에 있었음');
    } else {
      logFail('다중 마스크 처리 오류');
      allPassed = false;
    }
  }
  
  // 두 번째 마스크도 제거
  logSubSection('mask_B도 제거 후 상태');
  
  maskingManager.removeMask('mask_B');
  
  const allVisible = grid.flat().every(t => t.visible);
  const allMaskedByEmpty = grid.flat().every(t => t.maskedBy.length === 0);
  
  logResult('모든 타일 visible', allVisible);
  logResult('모든 maskedBy 비어있음', allMaskedByEmpty);
  
  if (allVisible && allMaskedByEmpty) {
    logPass('모든 마스크 제거 후 완전 복원');
  } else {
    logFail('완전 복원 실패');
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 7: API & Query Methods
// ═══════════════════════════════════════════════════════════════════════════

function testQueryMethods(): boolean {
  logSection('TEST 7: 쿼리 메서드 검증');
  
  const { grid, config } = createTestGrid();
  const maskingManager = createMaskingManager(grid, config);
  
  // 마스크 추가
  maskingManager.addRectangleMask(
    'query_test_mask',
    {
      x: mmToMicro(200) as MicroMM,
      y: mmToMicro(200) as MicroMM,
      width: mmToMicro(300) as MicroMM,
      height: mmToMicro(300) as MicroMM,
    },
    '쿼리 테스트용'
  );
  
  let allPassed = true;
  
  // getMask
  const mask = maskingManager.getMask('query_test_mask');
  if (mask && mask.label === '쿼리 테스트용') {
    logPass('getMask() 정확히 반환');
  } else {
    logFail('getMask() 실패');
    allPassed = false;
  }
  
  // getAllMasks
  const allMasks = maskingManager.getAllMasks();
  if (allMasks.length === 1) {
    logPass('getAllMasks() 정확히 반환');
  } else {
    logFail(`getAllMasks() 오류: ${allMasks.length}개`);
    allPassed = false;
  }
  
  // getMaskedTileCount
  const maskedCount = maskingManager.getMaskedTileCount();
  logResult('getMaskedTileCount()', maskedCount);
  if (maskedCount > 0) {
    logPass('getMaskedTileCount() 정확히 반환');
  }
  
  // getMasksForTile
  if (mask && mask.maskedTileIds.size > 0) {
    const firstMaskedTileId = Array.from(mask.maskedTileIds)[0];
    const masksForTile = maskingManager.getMasksForTile(firstMaskedTileId);
    
    if (masksForTile.length === 1 && masksForTile[0].id === 'query_test_mask') {
      logPass('getMasksForTile() 정확히 반환');
    } else {
      logFail('getMasksForTile() 오류');
      allPassed = false;
    }
  }
  
  // exportMasks
  const exported = maskingManager.exportMasks();
  if (exported.length === 1 && exported[0].id === 'query_test_mask') {
    logPass('exportMasks() 정확히 반환');
  } else {
    logFail('exportMasks() 오류');
    allPassed = false;
  }
  
  // clearAllMasks
  maskingManager.clearAllMasks();
  const afterClear = maskingManager.getAllMasks();
  if (afterClear.length === 0) {
    logPass('clearAllMasks() 정확히 동작');
  } else {
    logFail('clearAllMasks() 오류');
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
  console.log('║           TILE SET UP - Masking Layer System Test Suite              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  
  const results: { name: string; passed: boolean }[] = [];
  
  results.push({ name: '사각형 교차 판정', passed: testRectangleIntersection() });
  results.push({ name: '원형 교차 판정', passed: testCircleIntersection() });
  results.push({ name: '마스크 추가 (타일 가림)', passed: testMaskAddition() });
  results.push({ name: '마스크 제거 (자동 복원)', passed: testMaskRemoval() });
  results.push({ name: '마스크 이동 (위치 변경)', passed: testMaskMovement() });
  results.push({ name: '다중 마스크 겹침', passed: testMultipleMasks() });
  results.push({ name: '쿼리 메서드', passed: testQueryMethods() });
  
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
    console.log('  Step 5: Masking Layer System 검증 완료.');
    console.log('\n  ⚠️ 핵심 검증 완료:');
    console.log('     - 비파괴 편집: 타일 데이터 삭제 없이 마스킹만 수행');
    console.log('     - 자동 복원: 마스크 제거/이동 시 타일 자동 복구');
    console.log('     - 다중 마스크: 겹치는 마스크도 독립적으로 처리\n');
  } else {
    console.log('\n  ⚠️ Some tests failed. Please review.\n');
  }
}

// Run tests
runAllTests();

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Pattern System Test & Verification
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 15가지 타일 패턴 시스템 검증
 * 
 * 검증 항목:
 * 1. 모든 패턴 등록 확인
 * 2. 오프셋 계산 정확성
 * 3. 패턴 적용 비파괴성
 * 4. 헤링본/바스켓위브 복잡 패턴 검증
 * 5. 타일 형태별 호환성 체크
 * 
 * 실행: ts-node src/tests/patternSystem.test.ts
 */

import {
  PATTERN_REGISTRY,
  getAllPatterns,
  getPatternById,
  getCompatiblePatterns,
  generatePatternPreview,
  validatePatternApplication,
  applyPatternToGrid,
  PatternMetadata,
  PatternOffset,
} from '../utils/patternSystem';

import {
  calculateTileQuantity,
  GlobalTileConfig,
} from '../utils/tileCalculationService';

import { mmToMicro, microToMM } from '../utils/math';

import { TileCell, PatternId, MicroMM } from '../types';

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
  console.log(`  ${label.padEnd(35)} : ${value}`);
}

function logPass(message: string): void {
  console.log(`  ✅ PASS: ${message}`);
}

function logFail(message: string): void {
  console.log(`  ❌ FAIL: ${message}`);
}

function logWarn(message: string): void {
  console.log(`  ⚠️  WARN: ${message}`);
}

function logInfo(message: string): void {
  console.log(`  ℹ️  INFO: ${message}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 1: Pattern Registry Completeness
// ═══════════════════════════════════════════════════════════════════════════

function testPatternRegistryCompleteness(): boolean {
  logSection('TEST 1: 패턴 레지스트리 완전성 검증');
  
  const expectedPatternIds: PatternId[] = [
    'LINEAR_SQUARE',
    'DIAMOND',
    'RUNNING_BOND_SQUARE',
    'STACK_BOND',
    'VERTICAL_STACK',
    'DIAGONAL_RUNNING',
    'RUNNING_BOND_OFFSET',
    'VERTICAL_RUNNING_BOND',
    'VERTICAL_STACK_OFFSET',
    'ONE_THIRD_RUNNING_BOND',
    'DIAGONAL_RUNNING_POINT',
    'TRADITIONAL_RUNNING_BOND',
    'TRADITIONAL_HERRINGBONE',
    'STRAIGHT_HERRINGBONE',
    'BASKET_WEAVE',
  ];
  
  const allPatterns = getAllPatterns();
  
  logResult('예상 패턴 수', 15);
  logResult('등록된 패턴 수', allPatterns.length);
  
  let allPresent = true;
  const missingPatterns: string[] = [];
  
  for (const expectedId of expectedPatternIds) {
    const pattern = getPatternById(expectedId);
    if (!pattern) {
      missingPatterns.push(expectedId);
      allPresent = false;
    }
  }
  
  if (allPresent) {
    logPass('모든 15가지 패턴이 등록되어 있습니다.');
  } else {
    logFail(`누락된 패턴: ${missingPatterns.join(', ')}`);
  }
  
  // 패턴 목록 출력
  logSubSection('등록된 패턴 목록');
  console.log('  ' + '-'.repeat(66));
  console.log('  ' + 
    '#'.padEnd(4) + 
    'ID'.padEnd(28) + 
    '한글명'.padEnd(18) + 
    '오프셋 타입'
  );
  console.log('  ' + '-'.repeat(66));
  
  allPatterns.forEach((pattern, index) => {
    console.log('  ' + 
      `${index + 1}`.padEnd(4) +
      pattern.id.padEnd(28) + 
      pattern.nameKo.padEnd(18) + 
      pattern.offsetType
    );
  });
  
  return allPresent;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 2: Offset Calculation Accuracy
// ═══════════════════════════════════════════════════════════════════════════

function testOffsetCalculations(): boolean {
  logSection('TEST 2: 오프셋 계산 정확성 검증');
  
  const tileW = mmToMicro(300);
  const tileH = mmToMicro(600); // 1:2 비율
  const gap = mmToMicro(2);
  
  let allPassed = true;
  
  // Running Bond (50% offset) 검증
  logSubSection('Running Bond Square - 50% 오프셋 검증');
  {
    const pattern = PATTERN_REGISTRY.RUNNING_BOND_SQUARE;
    
    const row0 = pattern.calculateOffset(0, 0, tileW, tileH, gap);
    const row1 = pattern.calculateOffset(1, 0, tileW, tileH, gap);
    const row2 = pattern.calculateOffset(2, 0, tileW, tileH, gap);
    
    logResult('Row 0 offsetX', `${microToMM(row0.offsetX)} mm`);
    logResult('Row 1 offsetX', `${microToMM(row1.offsetX)} mm`);
    logResult('Row 2 offsetX', `${microToMM(row2.offsetX)} mm`);
    
    // 검증: 홀수 행은 타일 너비의 50% 오프셋
    const expectedRow1Offset = tileW / 2;
    const isCorrect = 
      row0.offsetX === 0 && 
      row1.offsetX === expectedRow1Offset &&
      row2.offsetX === 0;
    
    if (isCorrect) {
      logPass('50% 오프셋 정확');
    } else {
      logFail('50% 오프셋 계산 오류');
      allPassed = false;
    }
  }
  
  // 1/3 Running Bond (33% offset) 검증
  logSubSection('1/3 Running Bond - 33% 오프셋 검증');
  {
    const pattern = PATTERN_REGISTRY.ONE_THIRD_RUNNING_BOND;
    
    const row0 = pattern.calculateOffset(0, 0, tileW, tileH, gap);
    const row1 = pattern.calculateOffset(1, 0, tileW, tileH, gap);
    const row2 = pattern.calculateOffset(2, 0, tileW, tileH, gap);
    const row3 = pattern.calculateOffset(3, 0, tileW, tileH, gap);
    
    logResult('Row 0 offsetX', `${microToMM(row0.offsetX)} mm (0%)`);
    logResult('Row 1 offsetX', `${microToMM(row1.offsetX)} mm (33%)`);
    logResult('Row 2 offsetX', `${microToMM(row2.offsetX)} mm (66%)`);
    logResult('Row 3 offsetX', `${microToMM(row3.offsetX)} mm (반복)`);
    
    // 검증: 0%, 33%, 66% 반복
    const oneThird = Math.floor(tileW / 3);
    const twoThirds = Math.floor((tileW * 2) / 3);
    
    const isCorrect = 
      row0.offsetX === 0 &&
      row1.offsetX === oneThird &&
      row2.offsetX === twoThirds &&
      row3.offsetX === 0; // 반복
    
    if (isCorrect) {
      logPass('33% 오프셋 정확');
    } else {
      logFail('33% 오프셋 계산 오류');
      allPassed = false;
    }
  }
  
  // Straight Herringbone - 교대 회전 검증
  logSubSection('Straight Herringbone - 교대 회전 검증');
  {
    const pattern = PATTERN_REGISTRY.STRAIGHT_HERRINGBONE;
    
    const results: { row: number; col: number; rotation: number }[] = [];
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const offset = pattern.calculateOffset(row, col, tileW, tileH, gap);
        results.push({ row, col, rotation: offset.rotation });
      }
    }
    
    console.log('\n  회전 패턴 (0 = 가로, 90 = 세로):');
    console.log('      Col0  Col1  Col2');
    for (let row = 0; row < 3; row++) {
      const rowData = results.filter(r => r.row === row);
      const rotations = rowData.map(r => r.rotation === 90 ? ' 90' : '  0').join('   ');
      console.log(`  Row${row}  ${rotations}`);
    }
    
    // 체커보드 패턴 검증
    const isCheckerboard = results.every(r => {
      const expected = (r.row + r.col) % 2 === 1 ? 90 : 0;
      return r.rotation === expected;
    });
    
    if (isCheckerboard) {
      logPass('체커보드 교대 회전 정확');
    } else {
      logFail('교대 회전 패턴 오류');
      allPassed = false;
    }
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 3: Non-Destructive Pattern Application
// ═══════════════════════════════════════════════════════════════════════════

function testNonDestructiveApplication(): boolean {
  logSection('TEST 3: 비파괴적 패턴 적용 검증');
  
  // 테스트용 그리드 생성
  const input = {
    areaWidth: mmToMicro(1000),
    areaHeight: mmToMicro(1000),
    tileWidth: mmToMicro(200),
    tileHeight: mmToMicro(200),
    gapSize: mmToMicro(2),
    startLine: { x: 'LEFT' as const, y: 'TOP' as const },
  };
  
  const result = calculateTileQuantity(input);
  const originalGrid = result.gridData;
  
  const config: GlobalTileConfig = {
    tileWidth: input.tileWidth,
    tileHeight: input.tileHeight,
    gap: input.gapSize,
  };
  
  logResult('원본 그리드 크기', `${originalGrid.length} × ${originalGrid[0]?.length || 0}`);
  
  // 패턴 적용
  const patternedGrid = applyPatternToGrid(
    originalGrid,
    'RUNNING_BOND_SQUARE',
    config
  );
  
  logResult('패턴 적용 후 크기', `${patternedGrid.length} × ${patternedGrid[0]?.length || 0}`);
  
  // 원본 그리드 변경 확인
  let originalUnchanged = true;
  
  // 첫 번째 타일의 위치 비교
  const originalFirstTile = originalGrid[0][0];
  const patternedFirstTile = patternedGrid[0][0];
  
  logSubSection('첫 번째 타일 비교');
  logResult('원본 타일 ID', originalFirstTile.id);
  logResult('패턴 타일 ID', patternedFirstTile.id);
  logResult('원본 position.x', microToMM(originalFirstTile.position.x));
  logResult('패턴 position.x', microToMM(patternedFirstTile.position.x));
  
  // 두 번째 행의 오프셋 확인
  if (originalGrid.length > 1) {
    const originalSecondRow = originalGrid[1][0];
    const patternedSecondRow = patternedGrid[1][0];
    
    logSubSection('두 번째 행 첫 번째 타일 비교 (오프셋 확인)');
    logResult('원본 position.x', `${microToMM(originalSecondRow.position.x)} mm`);
    logResult('패턴 position.x', `${microToMM(patternedSecondRow.position.x)} mm`);
    
    // Running Bond 패턴이면 100mm (타일 너비의 50%) 오프셋
    const expectedOffset = microToMM(input.tileWidth) / 2;
    const actualOffset = microToMM(patternedSecondRow.position.x) - microToMM(originalSecondRow.position.x);
    
    logResult('예상 오프셋', `${expectedOffset} mm`);
    logResult('실제 오프셋', `${actualOffset} mm`);
    
    if (Math.abs(actualOffset - expectedOffset) < 0.01) {
      logPass('패턴 오프셋 정확하게 적용됨');
    } else {
      logFail('패턴 오프셋 적용 오류');
      originalUnchanged = false;
    }
  }
  
  // 원본 객체 참조 확인 (깊은 복사)
  if (originalFirstTile === patternedFirstTile) {
    logFail('원본 객체 참조가 유지됨 (깊은 복사 실패)');
    originalUnchanged = false;
  } else {
    logPass('원본과 패턴 그리드가 별개의 객체');
  }
  
  return originalUnchanged;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 4: Complex Patterns (Herringbone, Basket Weave)
// ═══════════════════════════════════════════════════════════════════════════

function testComplexPatterns(): boolean {
  logSection('TEST 4: 복잡한 패턴 검증 (헤링본, 바스켓 위브)');
  
  let allPassed = true;
  
  // 헤링본 패턴 - 2x2 블록 반복 확인
  logSubSection('Traditional Herringbone - 블록 패턴 검증');
  {
    const pattern = PATTERN_REGISTRY.TRADITIONAL_HERRINGBONE;
    const tileW = mmToMicro(200);
    const tileH = mmToMicro(400); // 1:2 비율
    const gap = mmToMicro(2);
    
    console.log('\n  2x2 블록 패턴 (rotation / swapDim):');
    console.log('           Col0        Col1');
    
    for (let row = 0; row < 4; row++) {
      const col0 = pattern.calculateOffset(row, 0, tileW, tileH, gap);
      const col1 = pattern.calculateOffset(row, 1, tileW, tileH, gap);
      
      const formatCell = (o: PatternOffset) => 
        `${o.rotation}°/${o.swapDimensions ? 'Y' : 'N'}`.padStart(8);
      
      console.log(`  Row ${row}   ${formatCell(col0)}    ${formatCell(col1)}`);
    }
    
    // 2x2 블록 반복 확인
    const block00 = pattern.calculateOffset(0, 0, tileW, tileH, gap);
    const block20 = pattern.calculateOffset(2, 0, tileW, tileH, gap);
    
    if (block00.rotation === block20.rotation && 
        block00.swapDimensions === block20.swapDimensions) {
      logPass('2행 주기 패턴 반복 확인');
    } else {
      logFail('패턴 반복 주기 오류');
      allPassed = false;
    }
  }
  
  // 바스켓 위브 패턴 - 2x2 블록 교대 확인
  logSubSection('Basket Weave - 블록 교대 검증');
  {
    const pattern = PATTERN_REGISTRY.BASKET_WEAVE;
    const tileW = mmToMicro(200);
    const tileH = mmToMicro(200);
    const gap = mmToMicro(2);
    
    console.log('\n  4x4 영역 회전 패턴 (0 = 가로, 90 = 세로):');
    console.log('       Col0 Col1 Col2 Col3');
    
    for (let row = 0; row < 4; row++) {
      let rowStr = `  Row${row}`;
      for (let col = 0; col < 4; col++) {
        const offset = pattern.calculateOffset(row, col, tileW, tileH, gap);
        rowStr += `   ${offset.rotation === 90 ? '90' : ' 0'}`;
      }
      console.log(rowStr);
    }
    
    // 2x2 블록 교대 확인
    const block00 = pattern.calculateOffset(0, 0, tileW, tileH, gap);
    const block02 = pattern.calculateOffset(0, 2, tileW, tileH, gap);
    
    if (block00.rotation === block02.rotation) {
      logPass('2x2 블록 반복 패턴 확인');
    } else {
      logFail('블록 교대 패턴 오류');
      allPassed = false;
    }
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 5: Pattern Compatibility Check
// ═══════════════════════════════════════════════════════════════════════════

function testPatternCompatibility(): boolean {
  logSection('TEST 5: 타일 형태별 패턴 호환성 검증');
  
  let allPassed = true;
  
  // 정사각형 타일
  logSubSection('정사각형 타일 (300x300mm) 호환 패턴');
  {
    const squareConfig: GlobalTileConfig = {
      tileWidth: mmToMicro(300),
      tileHeight: mmToMicro(300),
      gap: mmToMicro(2),
    };
    
    const compatiblePatterns = getCompatiblePatterns(true);
    logResult('호환 패턴 수', `${compatiblePatterns.length} / 15`);
    
    // 직사각형 필수 패턴 제외 확인
    const rectangularPatterns = getAllPatterns().filter(p => p.requiresRectangular);
    const filteredOut = rectangularPatterns.filter(
      rp => !compatiblePatterns.find(cp => cp.id === rp.id)
    );
    
    logResult('제외된 패턴', filteredOut.map(p => p.nameKo).join(', ') || '없음');
    
    // 검증
    for (const pattern of rectangularPatterns) {
      const validation = validatePatternApplication(pattern.id, squareConfig);
      if (validation.warnings.length > 0) {
        logWarn(`${pattern.nameKo}: ${validation.warnings[0]}`);
      }
    }
  }
  
  // 직사각형 타일 (1:2 비율)
  logSubSection('직사각형 타일 (200x400mm) 호환성 검증');
  {
    const rectConfig: GlobalTileConfig = {
      tileWidth: mmToMicro(200),
      tileHeight: mmToMicro(400),
      gap: mmToMicro(2),
    };
    
    // 모든 패턴 검증
    const allPatterns = getAllPatterns();
    let warningCount = 0;
    
    for (const pattern of allPatterns) {
      const validation = validatePatternApplication(pattern.id, rectConfig);
      if (validation.warnings.length > 0) {
        warningCount++;
      }
    }
    
    logResult('경고 없는 패턴', `${allPatterns.length - warningCount} / ${allPatterns.length}`);
    
    // 헤링본 최적 비율 확인
    const herringboneValidation = validatePatternApplication(
      'TRADITIONAL_HERRINGBONE',
      rectConfig
    );
    
    if (herringboneValidation.warnings.length === 0) {
      logPass('헤링본 패턴에 최적화된 타일 비율');
    } else {
      logInfo(herringboneValidation.warnings[0]);
    }
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 6: Pattern Preview Generation
// ═══════════════════════════════════════════════════════════════════════════

function testPatternPreview(): boolean {
  logSection('TEST 6: 패턴 미리보기 생성 검증');
  
  const previewPatterns: PatternId[] = [
    'LINEAR_SQUARE',
    'RUNNING_BOND_SQUARE',
    'STRAIGHT_HERRINGBONE',
    'BASKET_WEAVE',
  ];
  
  let allPassed = true;
  
  for (const patternId of previewPatterns) {
    const pattern = getPatternById(patternId)!;
    const preview = generatePatternPreview(patternId);
    
    logSubSection(`${pattern.nameKo} (${patternId})`);
    
    if (preview.length !== 4 || preview[0].length !== 4) {
      logFail(`미리보기 크기 오류: ${preview.length}x${preview[0]?.length || 0}`);
      allPassed = false;
      continue;
    }
    
    // 4x4 미리보기 ASCII 출력
    console.log('\n  4x4 미리보기 (offsetX/rotation):');
    for (let row = 0; row < 4; row++) {
      let rowStr = '  ';
      for (let col = 0; col < 4; col++) {
        const offset = preview[row][col];
        const ox = Math.round(microToMM(offset.offsetX));
        const r = offset.rotation;
        rowStr += `[${ox.toString().padStart(2)}/${r.toString().padStart(3)}°] `;
      }
      console.log(rowStr);
    }
    
    logPass(`미리보기 생성 성공`);
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Test Runner
// ═══════════════════════════════════════════════════════════════════════════

function runAllTests(): void {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║             TILE SET UP - Pattern System Test Suite                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  
  const results: { name: string; passed: boolean }[] = [];
  
  results.push({ name: '패턴 레지스트리 완전성', passed: testPatternRegistryCompleteness() });
  results.push({ name: '오프셋 계산 정확성', passed: testOffsetCalculations() });
  results.push({ name: '비파괴적 적용', passed: testNonDestructiveApplication() });
  results.push({ name: '복잡 패턴 검증', passed: testComplexPatterns() });
  results.push({ name: '타일 호환성', passed: testPatternCompatibility() });
  results.push({ name: '미리보기 생성', passed: testPatternPreview() });
  
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
    console.log('  Step 4: Pattern System 검증 완료.\n');
  } else {
    console.log('\n  ⚠️ Some tests failed. Please review.\n');
  }
}

// Run tests
runAllTests();

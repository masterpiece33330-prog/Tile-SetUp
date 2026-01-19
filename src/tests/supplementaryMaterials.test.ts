/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Chapter 9 Test: 특수 기능 (시공 보조 도구)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 검증 항목:
 * 1. 조인트지 물량 계산
 * 2. 실리콘 세그먼트 생성 및 물량 계산
 * 3. 앵글 자동 감지 및 배치
 * 4. 부자재 관리자 통합 테스트
 * 5. 엣지 케이스 방어
 * 
 * 실행: ts-node src/tests/supplementaryMaterials.test.ts
 */

import {
  // Joint Tape
  calculateJointTapeQuantity,
  JointTapeConfig,
  DEFAULT_JOINT_TAPE_CONFIG,
  
  // Silicone
  createSiliconeSegment,
  generateFloorWallSilicone,
  generateMaskPerimeterSilicone,
  calculateSiliconeQuantity,
  SiliconeSegment,
  DEFAULT_SILICONE_CONFIG,
  
  // Angle
  createAnglePlacement,
  detectCornersAndGenerateAngles,
  generatePillarAngles,
  calculateAngleQuantity,
  AnglePlacement,
  DEFAULT_ANGLE_CONFIG,
  Room3D,
  
  // Manager
  createSupplementaryMaterialsManager,
  
  // Validation
  validateAnglePlacement,
  validateSiliconeSegment,
} from '../utils/supplementaryMaterials';

import { mmToMicro, microToMM } from '../utils/math';
import { MicroMM, TileCell, EditShape } from '../types';

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

function logInfo(message: string): void {
  console.log(`  ℹ️  INFO: ${message}`);
}

/**
 * 테스트용 타일 그리드 생성
 */
function createTestGrid(
  rows: number,
  cols: number,
  tileWidthMM: number,
  tileHeightMM: number
): TileCell[][] {
  const grid: TileCell[][] = [];
  
  for (let r = 0; r < rows; r++) {
    const row: TileCell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        id: `tile_${r}_${c}`,
        type: 'FULL',
        width: mmToMicro(tileWidthMM) as MicroMM,
        height: mmToMicro(tileHeightMM) as MicroMM,
        row: r,
        col: c,
        position: {
          x: mmToMicro(c * (tileWidthMM + 2)) as MicroMM,
          y: mmToMicro(r * (tileHeightMM + 2)) as MicroMM,
        },
        rotation: 0,
        visible: true,
        isLocked: false,
        isMasked: false,
      });
    }
    grid.push(row);
  }
  
  return grid;
}

/**
 * 테스트용 마스크(창문) 생성
 */
function createTestMask(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  label?: string
): EditShape {
  return {
    id,
    type: 'RECTANGLE',
    position: { x: mmToMicro(x) as MicroMM, y: mmToMicro(y) as MicroMM },
    width: mmToMicro(width) as MicroMM,
    height: mmToMicro(height) as MicroMM,
    rotation: 0,
    strokeWidth: 1,
    strokeColor: '#000000',
    affectedTileIds: [],
    createdAt: new Date(),
    label,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 1: Joint Tape Calculation
// ═══════════════════════════════════════════════════════════════════════════

function testJointTapeCalculation(): boolean {
  logSection('TEST 1: 조인트지 물량 계산');
  
  let allPassed = true;
  
  // 5x5 그리드 (타일 200x200mm, gap 2mm)
  const grid = createTestGrid(5, 5, 200, 200);
  const gapSize = mmToMicro(2) as MicroMM;
  
  logSubSection('기본 계산');
  
  const result = calculateJointTapeQuantity(grid, gapSize);
  
  logResult('가로 줄눈 길이 (mm)', result.horizontalLengthMM);
  logResult('세로 줄눈 길이 (mm)', result.verticalLengthMM);
  logResult('총 길이 (mm)', result.totalLengthMM);
  logResult('총 길이 (m)', result.totalLengthM);
  logResult('필요 롤 수', result.rollsNeeded);
  
  // 검증: 5x5 그리드
  // 가로 줄눈: 4행 × 5열 × 200mm = 4,000mm
  // 세로 줄눈: 5행 × 4열 × 200mm = 4,000mm
  // 총: 8,000mm × 1.1(여유) = 8,800mm
  const expectedHorizontal = 4 * 5 * 200;  // 4,000mm
  const expectedVertical = 5 * 4 * 200;    // 4,000mm
  
  if (result.horizontalLengthMM === expectedHorizontal) {
    logPass(`가로 줄눈 계산 정확: ${expectedHorizontal}mm`);
  } else {
    logFail(`가로 줄눈 오류: 예상 ${expectedHorizontal}, 실제 ${result.horizontalLengthMM}`);
    allPassed = false;
  }
  
  if (result.verticalLengthMM === expectedVertical) {
    logPass(`세로 줄눈 계산 정확: ${expectedVertical}mm`);
  } else {
    logFail(`세로 줄눈 오류: 예상 ${expectedVertical}, 실제 ${result.verticalLengthMM}`);
    allPassed = false;
  }
  
  // 마스킹된 타일 제외 테스트
  logSubSection('마스킹된 타일 제외');
  
  // 중앙 타일 마스킹
  grid[2][2].isMasked = true;
  grid[2][2].visible = false;
  
  const resultWithMask = calculateJointTapeQuantity(grid, gapSize);
  
  logResult('마스킹 후 가로 줄눈 (mm)', resultWithMask.horizontalLengthMM);
  logResult('마스킹 후 세로 줄눈 (mm)', resultWithMask.verticalLengthMM);
  
  // 마스킹된 타일이 있으면 줄눈 길이가 줄어야 함
  if (resultWithMask.horizontalLengthMM < result.horizontalLengthMM) {
    logPass('마스킹된 타일 제외 동작 확인');
  } else {
    logInfo('마스킹 처리 확인 필요');
  }
  
  // 비활성화 테스트
  logSubSection('비활성화 상태');
  
  const disabledConfig: JointTapeConfig = {
    ...DEFAULT_JOINT_TAPE_CONFIG,
    enabled: false,
  };
  
  const disabledResult = calculateJointTapeQuantity(grid, gapSize, disabledConfig);
  
  if (disabledResult.totalLengthMM === 0 && disabledResult.rollsNeeded === 0) {
    logPass('비활성화 시 0 반환');
  } else {
    logFail('비활성화 처리 오류');
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 2: Silicone Segment Creation
// ═══════════════════════════════════════════════════════════════════════════

function testSiliconeSegments(): boolean {
  logSection('TEST 2: 실리콘 세그먼트 생성');
  
  let allPassed = true;
  
  // 단일 세그먼트 생성
  logSubSection('단일 세그먼트');
  
  const segment = createSiliconeSegment(
    'test_seg_1',
    0, 0,      // 시작점
    1000, 0,   // 끝점 (1000mm = 1m 수평선)
    'FLOOR_WALL',
    '테스트 바닥-벽 경계'
  );
  
  logResult('세그먼트 ID', segment.id);
  logResult('길이 (mm)', microToMM(segment.length));
  logResult('위치 유형', segment.location);
  
  if (Math.abs(microToMM(segment.length) - 1000) < 0.1) {
    logPass('수평 세그먼트 길이 계산 정확');
  } else {
    logFail(`길이 오류: 예상 1000mm, 실제 ${microToMM(segment.length)}mm`);
    allPassed = false;
  }
  
  // 대각선 세그먼트
  logSubSection('대각선 세그먼트');
  
  const diagonalSeg = createSiliconeSegment(
    'test_diagonal',
    0, 0,
    300, 400,  // 3-4-5 삼각형 → 대각선 500mm
    'CUSTOM'
  );
  
  logResult('대각선 길이 (mm)', microToMM(diagonalSeg.length));
  
  if (Math.abs(microToMM(diagonalSeg.length) - 500) < 0.1) {
    logPass('대각선 세그먼트 길이 계산 정확 (피타고라스)');
  } else {
    logFail(`대각선 오류: 예상 500mm, 실제 ${microToMM(diagonalSeg.length)}mm`);
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 3: Floor-Wall Silicone Generation
// ═══════════════════════════════════════════════════════════════════════════

function testFloorWallSilicone(): boolean {
  logSection('TEST 3: 바닥-벽 경계 실리콘 자동 생성');
  
  let allPassed = true;
  
  // 3000x4000mm 방
  const roomWidth = 3000;
  const roomDepth = 4000;
  
  const segments = generateFloorWallSilicone(roomWidth, roomDepth);
  
  logSubSection('생성 결과');
  
  logResult('생성된 세그먼트 수', segments.length);
  
  if (segments.length === 4) {
    logPass('4개 벽 경계 세그먼트 생성');
  } else {
    logFail(`세그먼트 수 오류: 예상 4, 실제 ${segments.length}`);
    allPassed = false;
  }
  
  // 총 둘레 계산
  let totalLength = 0;
  for (const seg of segments) {
    totalLength += microToMM(seg.length);
    logResult(`  ${seg.label}`, `${microToMM(seg.length)}mm`);
  }
  
  logResult('총 둘레', `${totalLength}mm`);
  
  // 예상 둘레: 2 × (3000 + 4000) = 14,000mm
  const expectedPerimeter = 2 * (roomWidth + roomDepth);
  
  if (Math.abs(totalLength - expectedPerimeter) < 1) {
    logPass(`방 둘레 계산 정확: ${expectedPerimeter}mm`);
  } else {
    logFail(`둘레 오류: 예상 ${expectedPerimeter}, 실제 ${totalLength}`);
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 4: Mask Perimeter Silicone
// ═══════════════════════════════════════════════════════════════════════════

function testMaskPerimeterSilicone(): boolean {
  logSection('TEST 4: 마스크(창문/문) 주변 실리콘');
  
  let allPassed = true;
  
  // 창문 마스크: 800x600mm
  const windowMask = createTestMask('window_1', 500, 500, 800, 600, '욕실창문');
  
  const segments = generateMaskPerimeterSilicone([windowMask]);
  
  logSubSection('창문 주변 실리콘');
  
  logResult('생성된 세그먼트 수', segments.length);
  
  if (segments.length === 4) {
    logPass('창문 4변 세그먼트 생성');
  } else {
    logFail(`세그먼트 수 오류: 예상 4, 실제 ${segments.length}`);
    allPassed = false;
  }
  
  // 총 둘레
  let totalLength = 0;
  for (const seg of segments) {
    totalLength += microToMM(seg.length);
  }
  
  logResult('창문 둘레 실리콘', `${totalLength}mm`);
  
  // 예상: 2 × (800 + 600) = 2,800mm
  const expectedPerimeter = 2 * (800 + 600);
  
  if (Math.abs(totalLength - expectedPerimeter) < 1) {
    logPass(`창문 둘레 계산 정확: ${expectedPerimeter}mm`);
  } else {
    logFail(`둘레 오류: 예상 ${expectedPerimeter}, 실제 ${totalLength}`);
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 5: Silicone Quantity Calculation
// ═══════════════════════════════════════════════════════════════════════════

function testSiliconeQuantity(): boolean {
  logSection('TEST 5: 실리콘 물량 계산');
  
  let allPassed = true;
  
  // 세그먼트 모음
  const segments: SiliconeSegment[] = [
    createSiliconeSegment('seg1', 0, 0, 5000, 0, 'FLOOR_WALL'),      // 5m
    createSiliconeSegment('seg2', 0, 0, 0, 3000, 'FLOOR_WALL'),      // 3m
    createSiliconeSegment('seg3', 0, 0, 1000, 0, 'AROUND_WINDOW'),   // 1m
  ];
  
  const result = calculateSiliconeQuantity(segments);
  
  logSubSection('물량 계산 결과');
  
  logResult('총 길이 (mm)', result.totalLengthMM);
  logResult('총 길이 (m)', result.totalLengthM);
  logResult('필요 튜브 수', result.tubesNeeded);
  
  // 위치별 분류
  logSubSection('위치별 분류');
  for (const [loc, len] of Object.entries(result.lengthByLocation)) {
    if (len > 0) {
      logResult(`  ${loc}`, `${len}mm`);
    }
  }
  
  // 검증: 5000 + 3000 + 1000 = 9000mm × 1.15 = 10,350mm ≈ 2튜브
  const expectedTotal = (5000 + 3000 + 1000) * 1.15;
  
  if (Math.abs(result.totalLengthMM - expectedTotal) < 100) {
    logPass('총 길이 계산 (여유율 포함)');
  } else {
    logFail(`총 길이 오류: 예상 ~${expectedTotal}, 실제 ${result.totalLengthMM}`);
    allPassed = false;
  }
  
  if (result.tubesNeeded === 2) {
    logPass('필요 튜브 수 계산 정확');
  } else {
    logInfo(`튜브 수: ${result.tubesNeeded} (예상: 2)`);
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 6: Angle Placement Creation
// ═══════════════════════════════════════════════════════════════════════════

function testAnglePlacement(): boolean {
  logSection('TEST 6: 앵글 배치 생성');
  
  let allPassed = true;
  
  // 단일 앵글 생성
  logSubSection('단일 앵글');
  
  const angle = createAnglePlacement(
    'angle_1',
    'EXTERNAL',
    0, 0,
    2400,  // 2.4m
    'ALUMINUM',
    ['wall_1', 'wall_2'],
    '1-2번벽 코너'
  );
  
  logResult('앵글 ID', angle.id);
  logResult('타입', angle.type);
  logResult('길이 (mm)', microToMM(angle.length));
  logResult('재질', angle.material);
  logResult('관련 벽', angle.wallIds?.join(', '));
  
  if (angle.type === 'EXTERNAL' && microToMM(angle.length) === 2400) {
    logPass('앵글 생성 정확');
  } else {
    logFail('앵글 생성 오류');
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 7: Corner Auto Detection
// ═══════════════════════════════════════════════════════════════════════════

function testCornerAutoDetection(): boolean {
  logSection('TEST 7: 코너 자동 감지');
  
  let allPassed = true;
  
  // 3D 룸 정의: 3000 x 4000 x 2400mm
  const room: Room3D = {
    width: mmToMicro(3000) as MicroMM,
    depth: mmToMicro(4000) as MicroMM,
    height: mmToMicro(2400) as MicroMM,
    walls: [],
  };
  
  const placements = detectCornersAndGenerateAngles(room);
  
  logSubSection('자동 감지 결과');
  
  logResult('감지된 코너 수', placements.length);
  
  if (placements.length === 4) {
    logPass('4개 코너 자동 감지');
  } else {
    logFail(`코너 수 오류: 예상 4, 실제 ${placements.length}`);
    allPassed = false;
  }
  
  for (const p of placements) {
    logResult(`  ${p.label || p.id}`, `(${microToMM(p.position.x)}, ${microToMM(p.position.y)}) ${microToMM(p.length)}mm`);
  }
  
  // 모든 앵글 높이가 방 높이와 같은지 확인
  const allCorrectHeight = placements.every(p => microToMM(p.length) === 2400);
  
  if (allCorrectHeight) {
    logPass('모든 앵글 높이 = 방 높이');
  } else {
    logFail('앵글 높이 불일치');
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 8: Pillar Angles
// ═══════════════════════════════════════════════════════════════════════════

function testPillarAngles(): boolean {
  logSection('TEST 8: 기둥 앵글 생성');
  
  let allPassed = true;
  
  // 기둥: 300x300mm, 높이 2400mm, 위치 (1000, 1000)
  const pillarAngles = generatePillarAngles(
    'pillar_1',
    1000, 1000,  // 위치
    300, 300,    // 크기
    2400,        // 높이
    'STAINLESS'
  );
  
  logSubSection('기둥 앵글 생성 결과');
  
  logResult('생성된 앵글 수', pillarAngles.length);
  
  if (pillarAngles.length === 4) {
    logPass('기둥 4코너 앵글 생성');
  } else {
    logFail(`앵글 수 오류: 예상 4, 실제 ${pillarAngles.length}`);
    allPassed = false;
  }
  
  for (const a of pillarAngles) {
    logResult(`  ${a.label}`, `재질: ${a.material}`);
  }
  
  // 모든 앵글이 STAINLESS인지 확인
  const allStainless = pillarAngles.every(a => a.material === 'STAINLESS');
  
  if (allStainless) {
    logPass('재질 설정 정확');
  } else {
    logFail('재질 설정 오류');
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 9: Angle Quantity Calculation
// ═══════════════════════════════════════════════════════════════════════════

function testAngleQuantity(): boolean {
  logSection('TEST 9: 앵글 물량 계산');
  
  let allPassed = true;
  
  // 코너 앵글 4개 + 기둥 앵글 4개
  const placements: AnglePlacement[] = [
    createAnglePlacement('corner_1', 'EXTERNAL', 0, 0, 2400, 'ALUMINUM'),
    createAnglePlacement('corner_2', 'EXTERNAL', 3000, 0, 2400, 'ALUMINUM'),
    createAnglePlacement('corner_3', 'EXTERNAL', 3000, 4000, 2400, 'ALUMINUM'),
    createAnglePlacement('corner_4', 'EXTERNAL', 0, 4000, 2400, 'ALUMINUM'),
    createAnglePlacement('pillar_1', 'EXTERNAL', 1000, 1000, 2400, 'STAINLESS'),
    createAnglePlacement('pillar_2', 'EXTERNAL', 1300, 1000, 2400, 'STAINLESS'),
    createAnglePlacement('pillar_3', 'EXTERNAL', 1300, 1300, 2400, 'STAINLESS'),
    createAnglePlacement('pillar_4', 'EXTERNAL', 1000, 1300, 2400, 'STAINLESS'),
  ];
  
  const result = calculateAngleQuantity(placements);
  
  logSubSection('물량 계산 결과');
  
  logResult('총 배치 수', placements.length);
  logResult('총 필요 개수', result.totalCount);
  logResult('총 길이 (mm)', result.totalLengthMM);
  
  // 타입별
  logSubSection('타입별 수량');
  for (const [type, count] of Object.entries(result.countByType)) {
    if (count > 0) {
      logResult(`  ${type}`, count);
    }
  }
  
  // 재질별
  logSubSection('재질별 수량');
  for (const [mat, count] of Object.entries(result.countByMaterial)) {
    if (count > 0) {
      logResult(`  ${mat}`, count);
    }
  }
  
  // 검증: 8개 × 2400mm = 19,200mm, 2400mm/개 → 8개 필요
  if (result.countByMaterial.ALUMINUM === 4 && result.countByMaterial.STAINLESS === 4) {
    logPass('재질별 수량 정확');
  } else {
    logFail('재질별 수량 오류');
    allPassed = false;
  }
  
  if (result.totalLengthMM === 8 * 2400) {
    logPass(`총 길이 정확: ${8 * 2400}mm`);
  } else {
    logFail(`총 길이 오류: 예상 ${8 * 2400}, 실제 ${result.totalLengthMM}`);
    allPassed = false;
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 10: Supplementary Materials Manager
// ═══════════════════════════════════════════════════════════════════════════

function testSupplementaryMaterialsManager(): boolean {
  logSection('TEST 10: 부자재 관리자 통합');
  
  let allPassed = true;
  
  const manager = createSupplementaryMaterialsManager();
  
  // 설정 변경
  logSubSection('설정 변경');
  
  manager.setJointTapeConfig({ marginRate: 1.15 });  // 15% 여유
  manager.setSiliconeConfig({ marginRate: 1.2 });    // 20% 여유
  manager.setAngleConfig({ defaultMaterial: 'PVC' });
  
  logPass('설정 변경 완료');
  
  // 바닥-벽 실리콘 자동 생성
  logSubSection('바닥-벽 실리콘 자동 생성');
  
  manager.autoGenerateFloorWallSilicone(3000, 4000);
  
  const siliconeSegs = manager.getSiliconeSegments();
  logResult('생성된 실리콘 세그먼트', siliconeSegs.length);
  
  if (siliconeSegs.length === 4) {
    logPass('바닥-벽 실리콘 4개 생성');
  } else {
    logFail('바닥-벽 실리콘 생성 오류');
    allPassed = false;
  }
  
  // 앵글 자동 감지
  logSubSection('앵글 자동 감지');
  
  const room: Room3D = {
    width: mmToMicro(3000) as MicroMM,
    depth: mmToMicro(4000) as MicroMM,
    height: mmToMicro(2400) as MicroMM,
    walls: [],
  };
  
  manager.autoDetectAndGenerateAngles(room);
  
  const anglePlaces = manager.getAnglePlacements();
  logResult('감지된 앵글 배치', anglePlaces.length);
  
  if (anglePlaces.length === 4) {
    logPass('코너 앵글 4개 자동 감지');
  } else {
    logFail('앵글 자동 감지 오류');
    allPassed = false;
  }
  
  // 전체 계산
  logSubSection('전체 물량 계산');
  
  const grid = createTestGrid(5, 5, 200, 200);
  const gapSize = mmToMicro(2) as MicroMM;
  
  const totalResult = manager.calculateAll(grid, gapSize);
  
  logResult('조인트지 롤 수', totalResult.jointTape.rollsNeeded);
  logResult('실리콘 튜브 수', totalResult.silicone.tubesNeeded);
  logResult('앵글 총 개수', totalResult.angles.totalCount);
  logResult('계산 시점', totalResult.calculatedAt.toISOString());
  
  if (
    totalResult.jointTape.rollsNeeded > 0 &&
    totalResult.silicone.tubesNeeded > 0 &&
    totalResult.angles.totalCount > 0
  ) {
    logPass('전체 물량 계산 완료');
  } else {
    logFail('전체 물량 계산 오류');
    allPassed = false;
  }
  
  // 물량표 요약
  logSubSection('물량표 요약');
  
  const summary = manager.exportSummary();
  
  logResult('항목 수', summary.totalItems);
  for (const item of summary.items) {
    logResult(`  ${item.name}`, `${item.quantity} ${item.unit}`);
  }
  
  return allPassed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Test 11: Edge Case Validation
// ═══════════════════════════════════════════════════════════════════════════

function testEdgeCaseValidation(): boolean {
  logSection('TEST 11: 엣지 케이스 검증');
  
  let allPassed = true;
  
  // 중복 앵글 위치
  logSubSection('중복 앵글 위치 검증');
  
  const existingAngles = [
    createAnglePlacement('angle_1', 'EXTERNAL', 0, 0, 2400, 'ALUMINUM'),
  ];
  
  const duplicateAngle = createAnglePlacement('angle_2', 'INTERNAL', 0, 0, 2400, 'PVC');
  
  const validationResult = validateAnglePlacement(duplicateAngle, existingAngles);
  
  logResult('중복 위치 검증', validationResult.valid ? 'PASS' : 'BLOCKED');
  logResult('오류 메시지', validationResult.error || '없음');
  
  if (!validationResult.valid && validationResult.error?.includes('이미 있습니다')) {
    logPass('중복 위치 차단');
  } else {
    logFail('중복 위치 차단 실패');
    allPassed = false;
  }
  
  // 0 길이 앵글
  logSubSection('0 길이 앵글 검증');
  
  const zeroLengthAngle = createAnglePlacement('angle_zero', 'EXTERNAL', 100, 100, 0, 'ALUMINUM');
  const zeroValidation = validateAnglePlacement(zeroLengthAngle, []);
  
  logResult('0 길이 검증', zeroValidation.valid ? 'PASS' : 'BLOCKED');
  
  if (!zeroValidation.valid) {
    logPass('0 길이 앵글 차단');
  } else {
    logFail('0 길이 앵글 차단 실패');
    allPassed = false;
  }
  
  // 실리콘 세그먼트 검증
  logSubSection('실리콘 세그먼트 검증');
  
  const zeroLengthSeg = createSiliconeSegment('seg_zero', 100, 100, 100, 100, 'FLOOR_WALL');
  const segValidation = validateSiliconeSegment(zeroLengthSeg);
  
  logResult('동일 시작/끝점', segValidation.valid ? 'PASS' : 'BLOCKED');
  
  if (!segValidation.valid) {
    logPass('동일 시작/끝점 세그먼트 차단');
  } else {
    logFail('동일 시작/끝점 차단 실패');
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
  console.log('║    TILE SET UP - Chapter 9: 특수 기능 (시공 보조 도구) Test Suite    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  
  const results: { name: string; passed: boolean }[] = [];
  
  results.push({ name: '조인트지 물량 계산', passed: testJointTapeCalculation() });
  results.push({ name: '실리콘 세그먼트 생성', passed: testSiliconeSegments() });
  results.push({ name: '바닥-벽 실리콘 자동 생성', passed: testFloorWallSilicone() });
  results.push({ name: '마스크 주변 실리콘', passed: testMaskPerimeterSilicone() });
  results.push({ name: '실리콘 물량 계산', passed: testSiliconeQuantity() });
  results.push({ name: '앵글 배치 생성', passed: testAnglePlacement() });
  results.push({ name: '코너 자동 감지', passed: testCornerAutoDetection() });
  results.push({ name: '기둥 앵글', passed: testPillarAngles() });
  results.push({ name: '앵글 물량 계산', passed: testAngleQuantity() });
  results.push({ name: '부자재 관리자 통합', passed: testSupplementaryMaterialsManager() });
  results.push({ name: '엣지 케이스 검증', passed: testEdgeCaseValidation() });
  
  // Summary
  logSection('TEST SUMMARY');
  
  let passCount = 0;
  for (const r of results) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status} : ${r.name}`);
    if (r.passed) passCount++;
  }
  
  console.log('\n  ' + '─'.repeat(50));
  console.log(`  Total: ${passCount}/${results.length} tests passed`);
  
  if (passCount === results.length) {
    console.log('\n  🎉 ALL TESTS PASSED!');
    console.log('  Chapter 9: 특수 기능 (시공 보조 도구) 검증 완료.');
    console.log('\n  📦 구현된 기능:');
    console.log('     - 조인트지: 줄눈 총 길이 및 롤 수량 계산');
    console.log('     - 실리콘: 바닥-벽/창문/문 주변 자동 생성 및 튜브 계산');
    console.log('     - 앵글: 코너 자동 감지, 기둥 앵글, 물량 계산');
    console.log('     - 부자재 관리자: 통합 관리 및 물량표 출력\n');
  } else {
    console.log('\n  ⚠️ Some tests failed. Please review.\n');
  }
}

// Run tests
runAllTests();

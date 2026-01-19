/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - MicroUnit Conversion Utilities
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Engineering Principle #1: INTEGER MATH ONLY
 * 
 * This module provides type-safe conversion between human-readable units (mm)
 * and internal MicroUnits (1mm = 1000 MicroUnits) to prevent floating-point
 * arithmetic errors that would otherwise cause tile alignment issues.
 * 
 * CRITICAL: All tile calculations must use these converters. Direct number
 * operations on mm values are prohibited.
 */

import {
  MicroUnit,
  DeciDegree,
  Point2D,
  Point3D,
  Dimensions2D,
  Dimensions3D,
  MICRO_UNITS_PER_MM,
  MICRO_UNITS_PER_CM,
  MICRO_UNITS_PER_M,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: MicroUnit Creation & Conversion
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert millimeters to MicroUnits
 * @param mm - Value in millimeters (can be decimal, e.g., 1.5mm for gap)
 * @returns MicroUnit value (integer)
 * 
 * @example
 * const tileWidth = mmToMicro(300);  // 300mm → 300000 MicroUnits
 * const gap = mmToMicro(1.5);        // 1.5mm → 1500 MicroUnits
 */
export function mmToMicro(mm: number): MicroUnit {
  // Round to nearest integer to prevent floating-point residue
  return Math.round(mm * MICRO_UNITS_PER_MM) as MicroUnit;
}

/**
 * Convert centimeters to MicroUnits
 * @param cm - Value in centimeters
 */
export function cmToMicro(cm: number): MicroUnit {
  return Math.round(cm * MICRO_UNITS_PER_CM) as MicroUnit;
}

/**
 * Convert meters to MicroUnits
 * @param m - Value in meters
 */
export function mToMicro(m: number): MicroUnit {
  return Math.round(m * MICRO_UNITS_PER_M) as MicroUnit;
}

/**
 * Convert MicroUnits to millimeters for display
 * @param micro - Value in MicroUnits
 * @param decimalPlaces - Number of decimal places (default: 1)
 */
export function microToMM(micro: MicroUnit, decimalPlaces: number = 1): number {
  const value = micro / MICRO_UNITS_PER_MM;
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}

/**
 * Convert MicroUnits to centimeters for display
 */
export function microToCM(micro: MicroUnit, decimalPlaces: number = 2): number {
  const value = micro / MICRO_UNITS_PER_CM;
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}

/**
 * Convert MicroUnits to meters for display
 */
export function microToM(micro: MicroUnit, decimalPlaces: number = 3): number {
  const value = micro / MICRO_UNITS_PER_M;
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}

/**
 * Create a MicroUnit from a raw integer (use with caution)
 * Only use when you're certain the value is already in MicroUnits
 */
export function asMicro(value: number): MicroUnit {
  if (!Number.isInteger(value)) {
    console.warn(`asMicro received non-integer: ${value}. Rounding.`);
    return Math.round(value) as MicroUnit;
  }
  return value as MicroUnit;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: DeciDegree (Angle) Conversion
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert degrees to DeciDegrees (0.1° precision)
 * @param degrees - Angle in degrees
 * @returns DeciDegree value (integer, degrees × 10)
 * 
 * @example
 * const rotation = degToDeciDeg(90);   // 90° → 900 DeciDegrees
 * const precise = degToDeciDeg(45.5);  // 45.5° → 455 DeciDegrees
 */
export function degToDeciDeg(degrees: number): DeciDegree {
  return Math.round(degrees * 10) as DeciDegree;
}

/**
 * Convert DeciDegrees to degrees for display
 */
export function deciDegToDeg(deciDeg: DeciDegree): number {
  return deciDeg / 10;
}

/**
 * Convert DeciDegrees to radians for trigonometric calculations
 */
export function deciDegToRad(deciDeg: DeciDegree): number {
  return (deciDeg / 10) * (Math.PI / 180);
}

/**
 * Convert radians to DeciDegrees
 */
export function radToDeciDeg(radians: number): DeciDegree {
  return Math.round((radians * 180 / Math.PI) * 10) as DeciDegree;
}

/**
 * Normalize DeciDegree to 0-3600 range (0°-360°)
 */
export function normalizeDeciDeg(deciDeg: DeciDegree): DeciDegree {
  let normalized = deciDeg % 3600;
  if (normalized < 0) normalized += 3600;
  return normalized as DeciDegree;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: Point & Dimension Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a Point2D from mm values
 */
export function point2D(xMM: number, yMM: number): Point2D {
  return {
    x: mmToMicro(xMM),
    y: mmToMicro(yMM),
  };
}

/**
 * Create a Point2D from MicroUnit values
 */
export function point2DMicro(x: MicroUnit, y: MicroUnit): Point2D {
  return { x, y };
}

/**
 * Create a Point3D from mm values
 */
export function point3D(xMM: number, yMM: number, zMM: number): Point3D {
  return {
    x: mmToMicro(xMM),
    y: mmToMicro(yMM),
    z: mmToMicro(zMM),
  };
}

/**
 * Create Dimensions2D from mm values
 */
export function dimensions2D(widthMM: number, heightMM: number): Dimensions2D {
  return {
    width: mmToMicro(widthMM),
    height: mmToMicro(heightMM),
  };
}

/**
 * Create Dimensions3D from mm values
 */
export function dimensions3D(
  widthMM: number,
  heightMM: number,
  depthMM: number
): Dimensions3D {
  return {
    width: mmToMicro(widthMM),
    height: mmToMicro(heightMM),
    depth: mmToMicro(depthMM),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: Safe Arithmetic Operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add two MicroUnit values
 */
export function microAdd(a: MicroUnit, b: MicroUnit): MicroUnit {
  return (a + b) as MicroUnit;
}

/**
 * Subtract MicroUnit values (a - b)
 */
export function microSub(a: MicroUnit, b: MicroUnit): MicroUnit {
  return (a - b) as MicroUnit;
}

/**
 * Multiply MicroUnit by a scalar (result rounded to integer)
 */
export function microMul(a: MicroUnit, scalar: number): MicroUnit {
  return Math.round(a * scalar) as MicroUnit;
}

/**
 * Divide MicroUnit by a scalar (result rounded to integer)
 * Includes division-by-zero protection
 */
export function microDiv(a: MicroUnit, scalar: number): MicroUnit {
  if (scalar === 0) {
    console.error('microDiv: Division by zero attempted');
    return 0 as MicroUnit;
  }
  return Math.round(a / scalar) as MicroUnit;
}

/**
 * Calculate modulo with MicroUnits
 */
export function microMod(a: MicroUnit, b: MicroUnit): MicroUnit {
  if (b === 0) {
    console.error('microMod: Modulo by zero attempted');
    return 0 as MicroUnit;
  }
  return (a % b) as MicroUnit;
}

/**
 * Calculate ceiling division (tiles needed to cover area)
 * This is the corrected formula accounting for n-1 gaps
 * 
 * Ref: Engineering Constraint #4 - Logic Correction
 * 
 * @param areaSize - Total area dimension (MicroUnits)
 * @param tileSize - Single tile dimension (MicroUnits)
 * @param gapSize - Gap between tiles (MicroUnits)
 * @returns Number of tiles needed
 */
export function calculateTileCount(
  areaSize: MicroUnit,
  tileSize: MicroUnit,
  gapSize: MicroUnit
): number {
  // Corrected formula: area ≤ (n × tile) + ((n-1) × gap)
  // Solving for n: n = ceil((area + gap) / (tile + gap))
  
  if (tileSize <= 0) {
    console.error('calculateTileCount: Invalid tile size');
    return 0;
  }
  
  const effectiveUnit = tileSize + gapSize;
  const adjustedArea = areaSize + gapSize; // Add one gap to compensate for n-1
  
  return Math.ceil(adjustedArea / effectiveUnit);
}

/**
 * Calculate the remainder (cut piece size) at edges
 * Accounts for start line position (LEFT, CENTER, RIGHT)
 * 
 * Ref: Chapter 1 Logic Correction - Start Line Distribution
 * 
 * @param areaSize - Total area dimension (MicroUnits)
 * @param tileSize - Single tile dimension (MicroUnits)
 * @param gapSize - Gap between tiles (MicroUnits)
 * @param alignment - Start line position
 * @returns Object with left/right or top/bottom remainders
 */
export function calculateEdgeRemainders(
  areaSize: MicroUnit,
  tileSize: MicroUnit,
  gapSize: MicroUnit,
  alignment: 'LEFT' | 'CENTER' | 'RIGHT' | 'TOP' | 'BOTTOM'
): { start: MicroUnit; end: MicroUnit } {
  const tileCount = calculateTileCount(areaSize, tileSize, gapSize);
  
  // Total space occupied by full tiles and gaps (n tiles, n-1 gaps)
  const occupiedSpace = (tileCount * tileSize) + ((tileCount - 1) * gapSize);
  
  // Total remainder to distribute
  const totalRemainder = areaSize - occupiedSpace;
  
  // If perfectly fits or overflows, no remainder
  if (totalRemainder <= 0) {
    return { start: asMicro(0), end: asMicro(0) };
  }
  
  switch (alignment) {
    case 'LEFT':
    case 'TOP':
      // All remainder goes to the end (right or bottom)
      return { start: asMicro(0), end: totalRemainder as MicroUnit };
      
    case 'RIGHT':
    case 'BOTTOM':
      // All remainder goes to the start (left or top)
      return { start: totalRemainder as MicroUnit, end: asMicro(0) };
      
    case 'CENTER':
      // Split remainder evenly between both sides
      const half = Math.floor(totalRemainder / 2);
      const otherHalf = totalRemainder - half;
      return {
        start: half as MicroUnit,
        end: otherHalf as MicroUnit,
      };
      
    default:
      return { start: asMicro(0), end: totalRemainder as MicroUnit };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: Area Calculations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate area in MicroUnits² (for piece classification)
 * Returns result in MicroUnits² (not display units)
 */
export function calculateArea(width: MicroUnit, height: MicroUnit): number {
  return width * height; // Result is MicroUnit²
}

/**
 * Calculate area ratio (for large/small piece classification)
 * Returns percentage as integer (0-100)
 * 
 * Ref: Chapter 1.2.3 - Piece Classification (50% threshold)
 */
export function calculateAreaRatio(
  pieceWidth: MicroUnit,
  pieceHeight: MicroUnit,
  fullWidth: MicroUnit,
  fullHeight: MicroUnit
): number {
  const pieceArea = calculateArea(pieceWidth, pieceHeight);
  const fullArea = calculateArea(fullWidth, fullHeight);
  
  if (fullArea === 0) return 0;
  
  return Math.round((pieceArea / fullArea) * 100);
}

/**
 * Classify a cut tile piece as LARGE or SMALL based on area ratio
 * Ref: Chapter 1.2.3 - 50% threshold
 */
export function classifyPieceType(
  pieceWidth: MicroUnit,
  pieceHeight: MicroUnit,
  fullWidth: MicroUnit,
  fullHeight: MicroUnit
): 'FULL' | 'LARGE' | 'SMALL' {
  // Check if it's a full tile
  if (pieceWidth === fullWidth && pieceHeight === fullHeight) {
    return 'FULL';
  }
  
  const ratio = calculateAreaRatio(pieceWidth, pieceHeight, fullWidth, fullHeight);
  return ratio >= 50 ? 'LARGE' : 'SMALL';
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: Display Formatting
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format MicroUnits for display with unit suffix
 */
export function formatLength(
  micro: MicroUnit,
  unit: 'mm' | 'cm' | 'm' = 'mm'
): string {
  switch (unit) {
    case 'mm':
      return `${microToMM(micro, 1)}mm`;
    case 'cm':
      return `${microToCM(micro, 2)}cm`;
    case 'm':
      return `${microToM(micro, 3)}m`;
  }
}

/**
 * Format area for display (MicroUnits² to display units)
 */
export function formatArea(
  microSquared: number,
  unit: 'mm2' | 'cm2' | 'm2' = 'm2'
): string {
  switch (unit) {
    case 'mm2':
      return `${(microSquared / (MICRO_UNITS_PER_MM * MICRO_UNITS_PER_MM)).toFixed(0)}mm²`;
    case 'cm2':
      return `${(microSquared / (MICRO_UNITS_PER_CM * MICRO_UNITS_PER_CM)).toFixed(2)}cm²`;
    case 'm2':
      return `${(microSquared / (MICRO_UNITS_PER_M * MICRO_UNITS_PER_M)).toFixed(4)}m²`;
  }
}

/**
 * Format angle for display
 */
export function formatAngle(deciDeg: DeciDegree): string {
  return `${deciDegToDeg(deciDeg)}°`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: Validation Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a MicroUnit value is within valid range
 */
export function isValidMicroRange(
  value: MicroUnit,
  minMM: number,
  maxMM: number
): boolean {
  const minMicro = mmToMicro(minMM);
  const maxMicro = mmToMicro(maxMM);
  return value >= minMicro && value <= maxMicro;
}

/**
 * Clamp MicroUnit value to valid range
 */
export function clampMicro(
  value: MicroUnit,
  minMM: number,
  maxMM: number
): MicroUnit {
  const minMicro = mmToMicro(minMM);
  const maxMicro = mmToMicro(maxMM);
  return Math.max(minMicro, Math.min(maxMicro, value)) as MicroUnit;
}

/**
 * Validation limits from Chapter 1.1.2
 */
export const VALIDATION_LIMITS = {
  AREA_MIN_MM: 100,
  AREA_MAX_MM: 99_999_999,
  TILE_MIN_MM: 10,
  TILE_MAX_MM: 9_999,
  GAP_MIN_MM: 0,
  GAP_MAX_MM: 50,
} as const;

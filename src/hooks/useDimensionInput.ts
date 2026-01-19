/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - useDimensionInput Hook
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 치수 입력 화면에서 공통으로 사용되는 로직을 제공하는 커스텀 훅입니다.
 * 
 * 제공 기능:
 * - 값 상태 관리
 * - 키패드 입력 처리
 * - 유효성 검사
 * - 에러 애니메이션
 * - 포맷팅 (천 단위 콤마, mm→m 변환)
 * 
 * @ref Chapter 1.2 - Input Validation Rules
 */

import { useState, useCallback, useMemo } from 'react';
import { useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

// Design System
import { triggerErrorFeedback, triggerSnapFeedback } from '@/design';


// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DimensionInputOptions {
  /** 최소값 (mm) */
  minValue?: number;
  
  /** 최대값 (mm) */
  maxValue?: number;
  
  /** 소수점 허용 여부 */
  allowDecimal?: boolean;
  
  /** 소수점 최대 자릿수 */
  maxDecimalPlaces?: number;
  
  /** 초기값 */
  initialValue?: string;
}

export interface DimensionInputResult {
  /** 현재 값 (문자열) */
  value: string;
  
  /** 값 설정 함수 */
  setValue: (value: string) => void;
  
  /** 키패드 입력 핸들러 */
  handleKeyPress: (key: string) => void;
  
  /** 흔들림 애니메이션 값 */
  shakeAnimation: ReturnType<typeof useSharedValue>;
  
  /** 숫자 값 (파싱된) */
  numericValue: number;
  
  /** 포맷된 표시 문자열 (콤마 포함) */
  formattedValue: string;
  
  /** mm → m 변환 문자열 */
  meterConversion: string | null;
  
  /** 유효성 여부 */
  isValid: boolean;
  
  /** 소수점이 입력되었는지 */
  hasDecimal: boolean;
  
  /** 값 초기화 */
  clear: () => void;
}


// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 문자열을 숫자로 파싱 (빈 문자열은 0)
 */
const parseValue = (value: string): number => {
  if (!value || value === '' || value === '.') {
    return 0;
  }
  return parseFloat(value) || 0;
};

/**
 * 숫자를 천 단위 콤마로 포맷
 */
const formatWithCommas = (value: string): string => {
  if (!value || value === '') return '0';
  
  const parts = value.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  const formattedInteger = parseInt(integerPart || '0').toLocaleString();
  
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  }
  
  if (value.endsWith('.')) {
    return `${formattedInteger}.`;
  }
  
  return formattedInteger;
};

/**
 * mm를 m로 변환하여 문자열 반환
 */
const convertToMeters = (mm: number): string | null => {
  if (mm <= 0) return null;
  return `= ${(mm / 1000).toFixed(mm >= 1000 ? 2 : 3)} m`;
};


// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useDimensionInput(options: DimensionInputOptions = {}): DimensionInputResult {
  const {
    minValue = 0,
    maxValue = 99999,
    allowDecimal = false,
    maxDecimalPlaces = 1,
    initialValue = '',
  } = options;

  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────
  
  const [value, setValue] = useState<string>(initialValue);
  const shakeAnimation = useSharedValue(0);

  // ─────────────────────────────────────────────────────────────────────────
  // Computed Values
  // ─────────────────────────────────────────────────────────────────────────
  
  const numericValue = useMemo(() => parseValue(value), [value]);
  
  const formattedValue = useMemo(() => formatWithCommas(value), [value]);
  
  const meterConversion = useMemo(
    () => convertToMeters(numericValue),
    [numericValue]
  );
  
  const isValid = useMemo(
    () => numericValue >= minValue && value !== '' && value !== '.',
    [numericValue, minValue, value]
  );
  
  const hasDecimal = useMemo(() => value.includes('.'), [value]);

  // ─────────────────────────────────────────────────────────────────────────
  // Animation
  // ─────────────────────────────────────────────────────────────────────────
  
  const triggerShake = useCallback(() => {
    shakeAnimation.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeAnimation]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleKeyPress = useCallback(async (key: string) => {
    // Clear - 전체 삭제
    if (key === 'C') {
      setValue('');
      return;
    }
    
    // Backspace - 마지막 문자 삭제
    if (key === '⌫') {
      setValue(prev => prev.slice(0, -1));
      return;
    }
    
    // 소수점 입력
    if (key === '.') {
      // 소수점 허용 안 함
      if (!allowDecimal) {
        await triggerErrorFeedback();
        return;
      }
      
      // 이미 소수점이 있음
      if (hasDecimal) {
        await triggerErrorFeedback();
        return;
      }
      
      // 빈 값에서 소수점 시작 → "0."
      if (value === '') {
        setValue('0.');
        return;
      }
      
      setValue(prev => prev + '.');
      return;
    }
    
    // 숫자 입력
    const digit = key;
    let newValue = value + digit;
    
    // 앞자리 0 처리
    if (value === '' && digit === '0') {
      // 첫 자리가 0이면 그냥 "0"
      newValue = '0';
    } else if (value === '0' && digit !== '.') {
      // "0" 다음에 숫자가 오면 대체
      newValue = digit;
    }
    
    // 소수점 자릿수 제한
    if (allowDecimal && hasDecimal) {
      const decimalPart = value.split('.')[1] || '';
      if (decimalPart.length >= maxDecimalPlaces) {
        await triggerErrorFeedback();
        triggerShake();
        return;
      }
    }
    
    // 최대값 체크
    const newNumericValue = parseValue(newValue);
    if (newNumericValue > maxValue) {
      await triggerErrorFeedback();
      triggerShake();
      return;
    }
    
    setValue(newValue);
  }, [value, hasDecimal, allowDecimal, maxDecimalPlaces, maxValue, triggerShake]);

  const clear = useCallback(() => {
    setValue('');
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────────────────
  
  return {
    value,
    setValue,
    handleKeyPress,
    shakeAnimation,
    numericValue,
    formattedValue,
    meterConversion,
    isValid,
    hasDecimal,
    clear,
  };
}


export default useDimensionInput;

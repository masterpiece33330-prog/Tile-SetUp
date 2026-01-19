/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - HeroInput Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Toss/KakaoBank 스타일의 대형 숫자 입력 표시 컴포넌트입니다.
 * 화면의 50%를 차지하는 큰 숫자와 단위를 표시합니다.
 * 
 * 특징:
 * - 96px 크기의 대형 숫자 표시
 * - 천 단위 콤마 자동 포맷
 * - 단위 접미사 (mm, m 등)
 * - 보조 변환 표시 (mm → m)
 * - 흔들림 애니메이션 (에러 시)
 * 
 * @ref component-blueprint.md - Hero Input Display
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

// Design System
import { colors, typography, spacing } from '@/design';


// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface HeroInputProps {
  /** 표시할 값 (문자열) */
  value: string;
  
  /** 라벨 텍스트 (예: "가로 (W)") */
  label?: string;
  
  /** 단위 텍스트 (예: "mm") */
  unit?: string;
  
  /** 보조 변환 텍스트 (예: "= 4.5 m") */
  conversion?: string;
  
  /** 플레이스홀더 (값이 없을 때) */
  placeholder?: string;
  
  /** 애니메이션용 SharedValue (흔들림 등) */
  shakeAnimation?: SharedValue<number>;
  
  /** 커스텀 스타일 */
  style?: ViewStyle;
  
  /** 포커스 상태 (강조 표시) */
  isFocused?: boolean;
}


// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 숫자를 천 단위 콤마로 포맷
 * @param value - 포맷할 숫자 문자열
 * @returns 콤마가 포함된 문자열
 */
const formatNumber = (value: string): string => {
  if (!value || value === '') return '';
  
  // 소수점이 있는 경우 정수부와 소수부 분리
  const parts = value.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // 정수부에 콤마 추가
  const formattedInteger = parseInt(integerPart || '0').toLocaleString();
  
  // 소수부가 있으면 다시 붙이기
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  }
  
  // 입력 중인 소수점 처리 (예: "123.")
  if (value.endsWith('.')) {
    return `${formattedInteger}.`;
  }
  
  return formattedInteger;
};


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const HeroInput: React.FC<HeroInputProps> = ({
  value,
  label,
  unit = 'mm',
  conversion,
  placeholder = '0',
  shakeAnimation,
  style,
  isFocused = true,
}) => {
  // 표시할 값 결정
  const displayValue = useMemo(() => {
    if (!value || value === '') {
      return placeholder;
    }
    return formatNumber(value);
  }, [value, placeholder]);

  // 값이 비어있는지 확인
  const isEmpty = !value || value === '';

  // 흔들림 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => {
    if (!shakeAnimation) {
      return {};
    }
    return {
      transform: [{ translateX: shakeAnimation.value }],
    };
  }, [shakeAnimation]);

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {/* 라벨 */}
      {label && (
        <Text style={[
          styles.label,
          isFocused && styles.labelFocused,
        ]}>
          {label}
        </Text>
      )}
      
      {/* 메인 숫자 + 단위 */}
      <View style={styles.valueContainer}>
        <Text
          style={[
            styles.value,
            isEmpty && styles.valuePlaceholder,
            isFocused && styles.valueFocused,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {displayValue}
        </Text>
        
        {unit && (
          <Text style={[
            styles.unit,
            isEmpty && styles.unitPlaceholder,
          ]}>
            {unit}
          </Text>
        )}
      </View>
      
      {/* 보조 변환 표시 */}
      {conversion && !isEmpty && (
        <Text style={styles.conversion}>
          {conversion}
        </Text>
      )}
    </Animated.View>
  );
};


// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  
  // Label
  label: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.tertiary,
    marginBottom: spacing[2],
  },
  labelFocused: {
    color: colors.primary.lime,
  },
  
  // Value Container
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  
  // Value
  value: {
    fontSize: typography.fontSize['7xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  valuePlaceholder: {
    color: colors.text.disabled,
  },
  valueFocused: {
    color: colors.text.primary,
  },
  
  // Unit
  unit: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.normal,
    color: colors.text.tertiary,
    marginLeft: spacing[2],
  },
  unitPlaceholder: {
    color: colors.text.disabled,
  },
  
  // Conversion
  conversion: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    marginTop: spacing[2],
  },
});


export default HeroInput;

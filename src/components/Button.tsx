/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Button Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 재사용 가능한 버튼 컴포넌트입니다.
 * 다양한 변형(variant)과 크기(size)를 지원합니다.
 * 
 * 변형:
 * - primary: 주요 액션 (라임 그린 배경)
 * - secondary: 보조 액션 (어두운 배경)
 * - ghost: 텍스트만 (투명 배경)
 * - danger: 위험 액션 (빨간 배경)
 * 
 * @ref component-blueprint.md - Button Specifications
 */

import React, { useCallback } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// Design System
import { 
  colors, 
  typography, 
  spacing, 
  borderRadius,
  componentTokens,
  reanimatedPresets,
} from '@/design';
import { triggerButtonPressFeedback } from '@/design';


// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  /** 버튼 텍스트 */
  children: string;
  
  /** 클릭 핸들러 */
  onPress: () => void;
  
  /** 버튼 변형 */
  variant?: ButtonVariant;
  
  /** 버튼 크기 */
  size?: ButtonSize;
  
  /** 비활성화 상태 */
  disabled?: boolean;
  
  /** 로딩 상태 */
  loading?: boolean;
  
  /** 전체 너비 사용 */
  fullWidth?: boolean;
  
  /** 아이콘 (좌측) */
  leftIcon?: React.ReactNode;
  
  /** 아이콘 (우측) */
  rightIcon?: React.ReactNode;
  
  /** 커스텀 스타일 */
  style?: ViewStyle;
  
  /** 커스텀 텍스트 스타일 */
  textStyle?: TextStyle;
  
  /** 햅틱 피드백 사용 여부 */
  haptic?: boolean;
}


// ═══════════════════════════════════════════════════════════════════════════
// STYLE CONFIGS
// ═══════════════════════════════════════════════════════════════════════════

const variantStyles: Record<ButtonVariant, {
  background: string;
  backgroundPressed: string;
  text: string;
  border?: string;
}> = {
  primary: {
    background: colors.primary.lime,
    backgroundPressed: colors.primary.limePressed,
    text: colors.text.onPrimary,
  },
  secondary: {
    background: colors.surface.elevated,
    backgroundPressed: colors.surface.pressed,
    text: colors.text.primary,
    border: colors.border.subtle,
  },
  ghost: {
    background: 'transparent',
    backgroundPressed: colors.surface.pressed,
    text: colors.primary.lime,
  },
  danger: {
    background: colors.semantic.error,
    backgroundPressed: '#CC352E',
    text: colors.text.primary,
  },
};

const sizeStyles: Record<ButtonSize, {
  height: number;
  paddingHorizontal: number;
  fontSize: number;
  borderRadius: number;
}> = {
  small: {
    height: 40,
    paddingHorizontal: spacing[4],
    fontSize: typography.fontSize.sm,
    borderRadius: borderRadius.md,
  },
  medium: {
    height: 48,
    paddingHorizontal: spacing[6],
    fontSize: typography.fontSize.base,
    borderRadius: borderRadius.md,
  },
  large: {
    height: 56,
    paddingHorizontal: spacing[8],
    fontSize: typography.fontSize.lg,
    borderRadius: borderRadius.md,
  },
};


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  haptic = true,
}) => {
  const scale = useSharedValue(1);

  // 스타일 설정 가져오기
  const variantConfig = variantStyles[variant];
  const sizeConfig = sizeStyles[size];

  // 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Press 핸들러
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, reanimatedPresets.buttonPress);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, reanimatedPresets.buttonPress);
  }, [scale]);

  const handlePress = useCallback(async () => {
    if (disabled || loading) return;
    
    if (haptic) {
      await triggerButtonPressFeedback();
    }
    onPress();
  }, [disabled, loading, haptic, onPress]);

  // 동적 스타일 계산
  const containerStyle: ViewStyle[] = [
    styles.container,
    {
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      borderRadius: sizeConfig.borderRadius,
      backgroundColor: disabled 
        ? colors.surface.disabled 
        : variantConfig.background,
    },
    variantConfig.border && !disabled && {
      borderWidth: 1,
      borderColor: variantConfig.border,
    },
    fullWidth && styles.fullWidth,
    style,
  ].filter(Boolean) as ViewStyle[];

  const labelStyle: TextStyle[] = [
    styles.label,
    {
      fontSize: sizeConfig.fontSize,
      color: disabled ? colors.text.disabled : variantConfig.text,
    },
    textStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <AnimatedTouchable
      style={[containerStyle, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator 
          color={disabled ? colors.text.disabled : variantConfig.text} 
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text style={labelStyle}>{children}</Text>
          {rightIcon}
        </>
      )}
    </AnimatedTouchable>
  );
};


// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
});


export default Button;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - NumberKeypad Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 숫자 입력을 위한 커스텀 키패드 컴포넌트입니다.
 * 장갑을 착용한 상태에서도 쉽게 사용할 수 있도록 큰 터치 영역을 제공합니다.
 * 
 * 특징:
 * - 최소 72px 터치 영역 (장갑 착용 대응)
 * - 햅틱 피드백
 * - 소수점 입력 지원 (옵션)
 * - 커스텀 액션 버튼 지원
 * 
 * @ref component-blueprint.md - Keypad Specification
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
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
import { triggerSliderFeedback, triggerErrorFeedback } from '@/design';


// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface NumberKeypadProps {
  /** 키 입력 콜백 */
  onKeyPress: (key: string) => void;
  
  /** 소수점 입력 허용 여부 */
  allowDecimal?: boolean;
  
  /** 소수점이 이미 입력되었는지 (소수점 버튼 비활성화용) */
  hasDecimal?: boolean;
  
  /** 커스텀 스타일 */
  style?: ViewStyle;
  
  /** 특정 키 비활성화 */
  disabledKeys?: string[];
}

/** 키패드 버튼 타입 */
type KeyType = 'number' | 'action' | 'clear' | 'delete' | 'decimal';

interface KeyConfig {
  value: string;
  type: KeyType;
  label?: string;
}


// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** 기본 키패드 레이아웃 (소수점 없음) */
const DEFAULT_LAYOUT: KeyConfig[][] = [
  [
    { value: '1', type: 'number' },
    { value: '2', type: 'number' },
    { value: '3', type: 'number' },
  ],
  [
    { value: '4', type: 'number' },
    { value: '5', type: 'number' },
    { value: '6', type: 'number' },
  ],
  [
    { value: '7', type: 'number' },
    { value: '8', type: 'number' },
    { value: '9', type: 'number' },
  ],
  [
    { value: 'C', type: 'clear', label: 'C' },
    { value: '0', type: 'number' },
    { value: '⌫', type: 'delete', label: '⌫' },
  ],
];

/** 소수점 포함 키패드 레이아웃 */
const DECIMAL_LAYOUT: KeyConfig[][] = [
  [
    { value: '1', type: 'number' },
    { value: '2', type: 'number' },
    { value: '3', type: 'number' },
  ],
  [
    { value: '4', type: 'number' },
    { value: '5', type: 'number' },
    { value: '6', type: 'number' },
  ],
  [
    { value: '7', type: 'number' },
    { value: '8', type: 'number' },
    { value: '9', type: 'number' },
  ],
  [
    { value: '.', type: 'decimal', label: '.' },
    { value: '0', type: 'number' },
    { value: '⌫', type: 'delete', label: '⌫' },
  ],
];


// ═══════════════════════════════════════════════════════════════════════════
// KEYPAD BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface KeypadButtonProps {
  config: KeyConfig;
  onPress: (value: string) => void;
  disabled?: boolean;
}

const KeypadButton: React.FC<KeypadButtonProps> = ({ 
  config, 
  onPress, 
  disabled = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, reanimatedPresets.buttonPress);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, reanimatedPresets.buttonPress);
  }, [scale]);

  const handlePress = useCallback(async () => {
    if (disabled) {
      await triggerErrorFeedback();
      return;
    }
    await triggerSliderFeedback();
    onPress(config.value);
  }, [config.value, disabled, onPress]);

  // 버튼 스타일 결정
  const buttonStyle = useMemo(() => {
    const baseStyle = [styles.button];
    
    if (config.type === 'clear') {
      baseStyle.push(styles.buttonClear);
    } else if (config.type === 'delete') {
      baseStyle.push(styles.buttonDelete);
    } else if (config.type === 'decimal') {
      baseStyle.push(styles.buttonDecimal);
    }
    
    if (disabled) {
      baseStyle.push(styles.buttonDisabled);
    }
    
    return baseStyle;
  }, [config.type, disabled]);

  // 텍스트 스타일 결정
  const textStyle = useMemo(() => {
    const baseStyle = [styles.buttonText];
    
    if (config.type === 'clear') {
      baseStyle.push(styles.buttonTextClear);
    } else if (config.type === 'delete' || config.type === 'decimal') {
      baseStyle.push(styles.buttonTextAction);
    }
    
    if (disabled) {
      baseStyle.push(styles.buttonTextDisabled);
    }
    
    return baseStyle;
  }, [config.type, disabled]);

  return (
    <Animated.View style={[styles.buttonWrapper, animatedStyle]}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text style={textStyle}>
          {config.label ?? config.value}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const NumberKeypad: React.FC<NumberKeypadProps> = ({
  onKeyPress,
  allowDecimal = false,
  hasDecimal = false,
  style,
  disabledKeys = [],
}) => {
  // 레이아웃 선택
  const layout = allowDecimal ? DECIMAL_LAYOUT : DEFAULT_LAYOUT;

  // 키가 비활성화되었는지 확인
  const isKeyDisabled = useCallback((key: string): boolean => {
    // 명시적으로 비활성화된 키
    if (disabledKeys.includes(key)) {
      return true;
    }
    
    // 소수점이 이미 있으면 소수점 버튼 비활성화
    if (key === '.' && hasDecimal) {
      return true;
    }
    
    return false;
  }, [disabledKeys, hasDecimal]);

  return (
    <View style={[styles.container, style]}>
      {layout.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((keyConfig) => (
            <KeypadButton
              key={keyConfig.value}
              config={keyConfig}
              onPress={onKeyPress}
              disabled={isKeyDisabled(keyConfig.value)}
            />
          ))}
        </View>
      ))}
    </View>
  );
};


// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    aspectRatio: 1.5,
    maxHeight: componentTokens.keypad.button.size,
    minHeight: spacing.semantic.touchTargetMin,
    backgroundColor: colors.surface.elevated,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonClear: {
    backgroundColor: colors.surface.default,
  },
  buttonDelete: {
    backgroundColor: colors.surface.default,
  },
  buttonDecimal: {
    backgroundColor: colors.surface.default,
  },
  buttonDisabled: {
    backgroundColor: colors.surface.disabled,
    opacity: 0.5,
  },
  buttonText: {
    fontSize: componentTokens.keypad.button.fontSize,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  buttonTextClear: {
    color: colors.semantic.error,
    fontSize: typography.fontSize['2xl'],
  },
  buttonTextAction: {
    color: colors.text.secondary,
    fontSize: typography.fontSize['2xl'],
  },
  buttonTextDisabled: {
    color: colors.text.disabled,
  },
});


export default NumberKeypad;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - StepIndicator Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 다단계 입력 플로우의 진행 상태를 표시하는 인디케이터입니다.
 * 
 * @ref component-blueprint.md - Step Indicator
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';

// Design System
import { colors, spacing } from '@/design';


// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface StepIndicatorProps {
  /** 전체 단계 수 */
  totalSteps: number;
  
  /** 현재 단계 (1-based) */
  currentStep: number;
  
  /** 커스텀 스타일 */
  style?: ViewStyle;
}


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  totalSteps,
  currentStep,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isPending = stepNumber > currentStep;
        
        return (
          <View
            key={index}
            style={[
              styles.dot,
              isCompleted && styles.dotCompleted,
              isCurrent && styles.dotCurrent,
              isPending && styles.dotPending,
            ]}
          />
        );
      })}
    </View>
  );
};


// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
  },
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface.elevated,
  },
  
  dotCompleted: {
    backgroundColor: colors.primary.lime,
  },
  
  dotCurrent: {
    width: 24,
    backgroundColor: colors.primary.lime,
  },
  
  dotPending: {
    backgroundColor: colors.surface.elevated,
  },
});


export default StepIndicator;

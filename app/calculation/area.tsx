/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Area Input Screen
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 물량 계산 플로우의 첫 번째 화면입니다.
 * 시공면적의 가로(W)와 세로(H) 치수를 입력받습니다.
 * 
 * 디자인 철학:
 * - Toss/KakaoBank 스타일의 "Hero Input" 패턴
 * - 화면의 50%를 숫자 입력 영역으로 할당
 * - 장갑 착용 상태에서도 쉽게 입력할 수 있는 큰 키패드
 * 
 * @ref Chapter 1.2 - Area Dimension Input
 * @ref component-blueprint.md - Quantity Input Screen
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';

// Design System
import { colors, spacing } from '@/design';
import { triggerButtonPressFeedback } from '@/design';

// Components
import { NumberKeypad } from '@/components/NumberKeypad';
import { HeroInput } from '@/components/HeroInput';
import { FieldSelector, FieldOption } from '@/components/FieldSelector';
import { StepIndicator } from '@/components/StepIndicator';
import { Button } from '@/components/Button';

// Hooks
import { useDimensionInput } from '@/hooks/useDimensionInput';


// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TOTAL_STEPS = 5;
const CURRENT_STEP = 1;

/** 입력 제한 (mm 단위) */
const INPUT_LIMITS = {
  MIN: 100,          // 최소 100mm (10cm)
  MAX: 99999,        // 최대 99,999mm (약 100m)
};

/** 필드 타입 */
type InputField = 'width' | 'height';


// ═══════════════════════════════════════════════════════════════════════════
// AREA INPUT SCREEN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AreaInputScreen() {
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────
  
  const [activeField, setActiveField] = useState<InputField>('width');
  
  // 가로 입력 상태
  const widthInput = useDimensionInput({
    minValue: INPUT_LIMITS.MIN,
    maxValue: INPUT_LIMITS.MAX,
  });
  
  // 세로 입력 상태
  const heightInput = useDimensionInput({
    minValue: INPUT_LIMITS.MIN,
    maxValue: INPUT_LIMITS.MAX,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Computed Values
  // ─────────────────────────────────────────────────────────────────────────
  
  const currentInput = activeField === 'width' ? widthInput : heightInput;
  
  const isNextEnabled = widthInput.isValid && heightInput.isValid;

  // 필드 선택 옵션
  const fieldOptions: FieldOption<InputField>[] = useMemo(() => [
    {
      id: 'width',
      label: '가로 (W)',
      value: widthInput.value ? `${widthInput.formattedValue} mm` : undefined,
      isValid: widthInput.isValid,
    },
    {
      id: 'height',
      label: '세로 (H)',
      value: heightInput.value ? `${heightInput.formattedValue} mm` : undefined,
      isValid: heightInput.isValid,
    },
  ], [widthInput, heightInput]);

  // ─────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleFieldSelect = useCallback((field: InputField) => {
    setActiveField(field);
  }, []);

  const handleNext = useCallback(async () => {
    if (!isNextEnabled) return;
    
    await triggerButtonPressFeedback();
    
    // TODO: Store에 값 저장
    // const store = useTileSetupStore.getState();
    // store.setAreaWidth(widthInput.numericValue * 1000);  // mm to MicroMM
    // store.setAreaHeight(heightInput.numericValue * 1000);
    
    router.push('/calculation/tile');
  }, [isNextEnabled, widthInput, heightInput]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Step Indicator */}
        <StepIndicator totalSteps={TOTAL_STEPS} currentStep={CURRENT_STEP} />

        {/* Hero Input Display */}
        <HeroInput
          value={currentInput.value}
          label={activeField === 'width' ? '가로 (W)' : '세로 (H)'}
          unit="mm"
          conversion={currentInput.meterConversion ?? undefined}
          shakeAnimation={currentInput.shakeAnimation}
          isFocused={true}
        />

        {/* Field Selection Tabs */}
        <FieldSelector
          options={fieldOptions}
          selectedId={activeField}
          onSelect={handleFieldSelect}
          style={styles.fieldSelector}
        />

        {/* Keypad */}
        <NumberKeypad
          onKeyPress={currentInput.handleKeyPress}
          style={styles.keypad}
        />

        {/* Next Button */}
        <Button
          variant="primary"
          onPress={handleNext}
          disabled={!isNextEnabled}
          style={styles.nextButton}
        >
          다음
        </Button>
      </View>
    </SafeAreaView>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.semantic.screenPadding,
  },

  fieldSelector: {
    marginBottom: spacing[6],
  },

  keypad: {
    marginBottom: spacing[4],
  },

  nextButton: {
    marginTop: 'auto',
    marginBottom: spacing[4],
  },
});

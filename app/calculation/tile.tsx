/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Tile Input Screen
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 물량 계산 플로우의 두 번째 화면입니다.
 * 타일의 가로(W)와 세로(H) 치수를 입력받습니다.
 * 
 * 특징:
 * - Hero Input 패턴 (Toss 스타일)
 * - 일반 타일 규격 프리셋 제공
 * - 가로/세로 전환 기능
 * 
 * @ref Chapter 1.2 - Tile Dimension Input
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';

// Design System
import { colors, typography, spacing, borderRadius } from '@/design';
import { triggerSnapFeedback, triggerButtonPressFeedback } from '@/design';

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
const CURRENT_STEP = 2;

/** 입력 제한 */
const INPUT_LIMITS = {
  MIN: 50,      // 최소 50mm (5cm) - 모자이크 타일
  MAX: 3000,    // 최대 3000mm (3m) - 대형 슬라브
};

/** 타일 프리셋 (일반 규격) */
const TILE_PRESETS = [
  { label: '200×200', width: 200, height: 200 },
  { label: '300×300', width: 300, height: 300 },
  { label: '300×600', width: 300, height: 600 },
  { label: '400×400', width: 400, height: 400 },
  { label: '600×600', width: 600, height: 600 },
  { label: '600×1200', width: 600, height: 1200 },
];

/** 필드 타입 */
type InputField = 'width' | 'height';


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function TileInputScreen() {
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
  // Computed
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
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleFieldSelect = useCallback((field: InputField) => {
    setActiveField(field);
  }, []);

  const handlePresetSelect = useCallback(async (preset: typeof TILE_PRESETS[0]) => {
    await triggerSnapFeedback('medium');
    widthInput.setValue(String(preset.width));
    heightInput.setValue(String(preset.height));
  }, [widthInput, heightInput]);

  const handleNext = useCallback(async () => {
    if (!isNextEnabled) return;
    
    await triggerButtonPressFeedback();
    
    // TODO: Store에 값 저장
    // const store = useTileSetupStore.getState();
    // store.setTileWidth(widthInput.numericValue * 1000);  // mm to MicroMM
    // store.setTileHeight(heightInput.numericValue * 1000);
    
    router.push('/calculation/gap');
  }, [isNextEnabled, widthInput, heightInput]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Step Indicator */}
        <StepIndicator totalSteps={TOTAL_STEPS} currentStep={CURRENT_STEP} />

        {/* Hero Input */}
        <HeroInput
          value={currentInput.value}
          label={activeField === 'width' ? '가로 (W)' : '세로 (H)'}
          unit="mm"
          conversion={currentInput.meterConversion ?? undefined}
          shakeAnimation={currentInput.shakeAnimation}
          isFocused={true}
        />

        {/* Field Selector */}
        <FieldSelector
          options={fieldOptions}
          selectedId={activeField}
          onSelect={handleFieldSelect}
          style={styles.fieldSelector}
        />

        {/* Presets */}
        <View style={styles.presetsSection}>
          <Text style={styles.presetsTitle}>일반 규격</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsScrollContent}
          >
            {TILE_PRESETS.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetButton}
                onPress={() => handlePresetSelect(preset)}
                activeOpacity={0.7}
              >
                <Text style={styles.presetText}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Keypad */}
        <NumberKeypad
          onKeyPress={currentInput.handleKeyPress}
          style={styles.keypad}
        />

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <Button
            variant="secondary"
            onPress={handleBack}
            style={styles.backButton}
          >
            이전
          </Button>
          
          <Button
            variant="primary"
            onPress={handleNext}
            disabled={!isNextEnabled}
            style={styles.nextButton}
          >
            다음
          </Button>
        </View>
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
    marginBottom: spacing[4],
  },

  // Presets
  presetsSection: {
    marginBottom: spacing[4],
  },
  presetsTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing[2],
  },
  presetsScrollContent: {
    gap: spacing[2],
  },
  presetButton: {
    backgroundColor: colors.surface.elevated,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  presetText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },

  keypad: {
    marginBottom: spacing[4],
  },

  // Navigation
  navigationButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: 'auto',
    marginBottom: spacing[4],
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Gap Input Screen
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 물량 계산 플로우의 세 번째 화면입니다.
 * 줄눈(Gap) 크기를 입력받습니다. 소수점 입력을 지원합니다.
 * 
 * 특징:
 * - 소수점 1자리까지 입력 가능 (예: 2.5mm)
 * - 일반 줄눈 규격 프리셋 제공
 * - 단일 값 입력 (가로/세로 구분 없음)
 * 
 * @ref Chapter 1.2 - Gap Size Input
 */

import React, { useCallback, useMemo } from 'react';
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
import { StepIndicator } from '@/components/StepIndicator';
import { Button } from '@/components/Button';

// Hooks
import { useDimensionInput } from '@/hooks/useDimensionInput';


// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TOTAL_STEPS = 5;
const CURRENT_STEP = 3;

/** 입력 제한 */
const INPUT_LIMITS = {
  MIN: 0,       // 최소 0mm (줄눈 없음 가능)
  MAX: 20,      // 최대 20mm
};

/** Gap 프리셋 (일반 규격) */
const GAP_PRESETS = [
  { label: '없음', value: 0 },
  { label: '1mm', value: 1 },
  { label: '1.5mm', value: 1.5 },
  { label: '2mm', value: 2 },
  { label: '2.5mm', value: 2.5 },
  { label: '3mm', value: 3 },
  { label: '4mm', value: 4 },
  { label: '5mm', value: 5 },
];


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function GapInputScreen() {
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────
  
  const gapInput = useDimensionInput({
    minValue: INPUT_LIMITS.MIN,
    maxValue: INPUT_LIMITS.MAX,
    allowDecimal: true,
    maxDecimalPlaces: 1,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Computed
  // ─────────────────────────────────────────────────────────────────────────
  
  // Gap은 0도 유효 (줄눈 없음)
  const isNextEnabled = gapInput.value !== '' && gapInput.value !== '.';
  
  // 현재 선택된 프리셋 (있으면)
  const selectedPreset = useMemo(() => {
    return GAP_PRESETS.find(p => p.value === gapInput.numericValue);
  }, [gapInput.numericValue]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  
  const handlePresetSelect = useCallback(async (preset: typeof GAP_PRESETS[0]) => {
    await triggerSnapFeedback('medium');
    
    // 정수면 정수로, 소수면 소수로 설정
    const valueStr = preset.value % 1 === 0 
      ? String(preset.value) 
      : preset.value.toFixed(1);
    
    gapInput.setValue(valueStr);
  }, [gapInput]);

  const handleNext = useCallback(async () => {
    if (!isNextEnabled) return;
    
    await triggerButtonPressFeedback();
    
    // TODO: Store에 값 저장
    // const store = useTileSetupStore.getState();
    // store.setGap(gapInput.numericValue * 1000);  // mm to MicroMM
    
    router.push('/calculation/pattern');
  }, [isNextEnabled, gapInput]);

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
          value={gapInput.value}
          label="줄눈 (Gap)"
          unit="mm"
          placeholder="0"
          shakeAnimation={gapInput.shakeAnimation}
          isFocused={true}
        />

        {/* Info Text */}
        <Text style={styles.infoText}>
          타일 사이의 줄눈(간격) 크기를 입력하세요.{'\n'}
          0을 입력하면 줄눈 없이 계산합니다.
        </Text>

        {/* Presets */}
        <View style={styles.presetsSection}>
          <Text style={styles.presetsTitle}>일반 규격</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsScrollContent}
          >
            {GAP_PRESETS.map((preset, index) => {
              const isSelected = selectedPreset?.value === preset.value;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.presetButton,
                    isSelected && styles.presetButtonSelected,
                  ]}
                  onPress={() => handlePresetSelect(preset)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.presetText,
                    isSelected && styles.presetTextSelected,
                  ]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Keypad - 소수점 허용 */}
        <NumberKeypad
          onKeyPress={gapInput.handleKeyPress}
          allowDecimal={true}
          hasDecimal={gapInput.hasDecimal}
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

  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetButtonSelected: {
    borderColor: colors.primary.lime,
    backgroundColor: colors.primary.limeMuted,
  },
  presetText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  presetTextSelected: {
    color: colors.primary.lime,
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

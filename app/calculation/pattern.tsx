/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Pattern Selection Screen
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 물량 계산 플로우의 네 번째 화면입니다.
 * 15가지 타일 패턴 중 하나를 선택합니다.
 * 
 * @ref Chapter 3 - Pattern System
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
import { StepIndicator } from '@/components/StepIndicator';
import { Button } from '@/components/Button';


// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TOTAL_STEPS = 5;
const CURRENT_STEP = 4;

/** 패턴 카테고리 */
type PatternCategory = 'basic' | 'brick' | 'diagonal' | 'special';

/** 패턴 정보 */
interface PatternInfo {
  id: string;
  name: string;
  nameEn: string;
  category: PatternCategory;
  emoji: string;
  description: string;
}

/** 패턴 목록 (15가지) */
const PATTERNS: PatternInfo[] = [
  // Basic
  { id: 'GRID', name: '일자 배열', nameEn: 'Grid', category: 'basic', emoji: '▦', description: '가장 기본적인 격자 배열' },
  { id: 'STACK_VERTICAL', name: '세로 쌓기', nameEn: 'Stack V', category: 'basic', emoji: '▥', description: '세로 방향으로 정렬' },
  
  // Brick
  { id: 'BRICK_HALF', name: '벽돌 1/2', nameEn: 'Brick ½', category: 'brick', emoji: '🧱', description: '반 칸씩 엇갈림' },
  { id: 'BRICK_THIRD', name: '벽돌 1/3', nameEn: 'Brick ⅓', category: 'brick', emoji: '🧱', description: '1/3 칸씩 엇갈림' },
  { id: 'BRICK_RANDOM', name: '랜덤 벽돌', nameEn: 'Random', category: 'brick', emoji: '🎲', description: '불규칙 엇갈림' },
  
  // Diagonal
  { id: 'DIAGONAL_45', name: '대각선 45°', nameEn: 'Diagonal', category: 'diagonal', emoji: '◇', description: '45도 회전 배열' },
  { id: 'HERRINGBONE', name: '헤링본', nameEn: 'Herringbone', category: 'diagonal', emoji: '⟨⟩', description: '물고기 뼈 패턴' },
  { id: 'HERRINGBONE_90', name: '헤링본 90°', nameEn: 'Herring 90', category: 'diagonal', emoji: '⟩⟨', description: '90도 헤링본' },
  { id: 'CHEVRON', name: '쉐브론', nameEn: 'Chevron', category: 'diagonal', emoji: '⌃', description: 'V자 화살표 패턴' },
  
  // Special
  { id: 'BASKET_WEAVE', name: '바구니', nameEn: 'Basket', category: 'special', emoji: '🧺', description: '바구니 짜기 패턴' },
  { id: 'PINWHEEL', name: '바람개비', nameEn: 'Pinwheel', category: 'special', emoji: '🎡', description: '회전하는 바람개비' },
  { id: 'VERSAILLES', name: '베르사유', nameEn: 'Versailles', category: 'special', emoji: '🏰', description: '프랑스 궁전 스타일' },
  { id: 'HOPSCOTCH', name: '사방치기', nameEn: 'Hopscotch', category: 'special', emoji: '🎯', description: '놀이판 패턴' },
  { id: 'WINDMILL', name: '풍차', nameEn: 'Windmill', category: 'special', emoji: '💨', description: '풍차 회전 패턴' },
  { id: 'CORRIDOR', name: '복도', nameEn: 'Corridor', category: 'special', emoji: '🚪', description: '긴 복도 스타일' },
];

/** 카테고리 정보 */
const CATEGORIES: { id: PatternCategory; name: string }[] = [
  { id: 'basic', name: '기본' },
  { id: 'brick', name: '벽돌' },
  { id: 'diagonal', name: '대각선' },
  { id: 'special', name: '특수' },
];


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function PatternSelectionScreen() {
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────
  
  const [selectedPatternId, setSelectedPatternId] = useState<string>('GRID');
  const [selectedCategory, setSelectedCategory] = useState<PatternCategory | 'all'>('all');

  // ─────────────────────────────────────────────────────────────────────────
  // Computed
  // ─────────────────────────────────────────────────────────────────────────
  
  const filteredPatterns = useMemo(() => {
    if (selectedCategory === 'all') return PATTERNS;
    return PATTERNS.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const selectedPattern = useMemo(() => {
    return PATTERNS.find(p => p.id === selectedPatternId);
  }, [selectedPatternId]);

  const isNextEnabled = selectedPatternId !== null;

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  
  const handlePatternSelect = useCallback(async (patternId: string) => {
    await triggerSnapFeedback('medium');
    setSelectedPatternId(patternId);
  }, []);

  const handleCategorySelect = useCallback(async (category: PatternCategory | 'all') => {
    await triggerSnapFeedback('light');
    setSelectedCategory(category);
  }, []);

  const handleNext = useCallback(async () => {
    if (!isNextEnabled) return;
    
    await triggerButtonPressFeedback();
    
    // TODO: Store에 패턴 저장
    // const store = useTileSetupStore.getState();
    // store.setPattern(selectedPatternId);
    
    router.push('/calculation/result');
  }, [isNextEnabled, selectedPatternId]);

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

        {/* Selected Pattern Preview */}
        {selectedPattern && (
          <View style={styles.previewCard}>
            <Text style={styles.previewEmoji}>{selectedPattern.emoji}</Text>
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>{selectedPattern.name}</Text>
              <Text style={styles.previewNameEn}>{selectedPattern.nameEn}</Text>
              <Text style={styles.previewDescription}>{selectedPattern.description}</Text>
            </View>
          </View>
        )}

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'all' && styles.categoryButtonSelected,
            ]}
            onPress={() => handleCategorySelect('all')}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === 'all' && styles.categoryTextSelected,
            ]}>
              전체
            </Text>
          </TouchableOpacity>
          
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryButton,
                selectedCategory === cat.id && styles.categoryButtonSelected,
              ]}
              onPress={() => handleCategorySelect(cat.id)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextSelected,
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pattern Grid */}
        <ScrollView 
          style={styles.patternScrollView}
          contentContainerStyle={styles.patternGrid}
          showsVerticalScrollIndicator={false}
        >
          {filteredPatterns.map((pattern) => {
            const isSelected = pattern.id === selectedPatternId;
            
            return (
              <TouchableOpacity
                key={pattern.id}
                style={[
                  styles.patternCard,
                  isSelected && styles.patternCardSelected,
                ]}
                onPress={() => handlePatternSelect(pattern.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.patternEmoji}>{pattern.emoji}</Text>
                <Text style={[
                  styles.patternName,
                  isSelected && styles.patternNameSelected,
                ]}>
                  {pattern.name}
                </Text>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
            계산 결과 보기
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

  // Preview Card
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.limeMuted,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.primary.lime,
  },
  previewEmoji: {
    fontSize: 48,
    marginRight: spacing[4],
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  previewNameEn: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.lime,
    marginBottom: spacing[1],
  },
  previewDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },

  // Category Filter
  categoryScroll: {
    flexGrow: 0,
    marginBottom: spacing[4],
  },
  categoryContent: {
    gap: spacing[2],
  },
  categoryButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.default,
  },
  categoryButtonSelected: {
    backgroundColor: colors.primary.lime,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  categoryTextSelected: {
    color: colors.text.onPrimary,
  },

  // Pattern Grid
  patternScrollView: {
    flex: 1,
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    paddingBottom: spacing[4],
  },
  patternCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.surface.default,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[2],
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  patternCardSelected: {
    borderColor: colors.primary.lime,
    backgroundColor: colors.primary.limeMuted,
  },
  patternEmoji: {
    fontSize: 28,
    marginBottom: spacing[1],
  },
  patternName: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  patternNameSelected: {
    color: colors.primary.lime,
    fontWeight: typography.fontWeight.semibold,
  },
  selectedBadge: {
    position: 'absolute',
    top: spacing[1],
    right: spacing[1],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.lime,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    fontSize: 12,
    color: colors.text.onPrimary,
    fontWeight: typography.fontWeight.bold,
  },

  // Navigation
  navigationButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});

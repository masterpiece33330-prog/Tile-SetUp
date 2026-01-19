/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Calculation Result Screen
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 물량 계산 플로우의 최종 화면입니다.
 * 계산된 타일 수량을 표시하고 2D/3D 뷰어로 이동할 수 있습니다.
 * 
 * 표시 정보:
 * - 전체 타일 수량
 * - 큰 조각 (>50% 면적) 수량
 * - 작은 조각 (<50% 면적) 수량
 * - 여유분 권장량
 * - 예상 비용 (옵션)
 * 
 * @ref Chapter 1.4 - Calculation Result Display
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';

import { colors, typography, spacing, borderRadius, componentTokens, shadows } from '@/design';
import { triggerSuccessFeedback } from '@/design';


// 임시 계산 결과 (실제로는 Store에서 가져옴)
const MOCK_RESULT = {
  totalTiles: 28,
  fullTiles: 15,
  largePieces: 8,
  smallPieces: 5,
  
  areaWidth: 4000,   // mm
  areaHeight: 3000,  // mm
  tileWidth: 300,    // mm
  tileHeight: 350,   // mm
  gap: 3,            // mm
  
  recommendedSpare: 3, // 여유분
};


export default function ResultScreen() {
  React.useEffect(() => {
    // 결과 화면 진입 시 성공 피드백
    triggerSuccessFeedback();
  }, []);

  /**
   * 2D 뷰어로 이동
   */
  const handleView2D = () => {
    router.push('/viewer/grid2d');
  };

  /**
   * 3D 뷰어로 이동
   */
  const handleView3D = () => {
    router.push('/viewer/scene3d');
  };

  /**
   * 홈으로 이동
   */
  const handleGoHome = () => {
    router.replace('/');
  };

  /**
   * 새 프로젝트 시작
   */
  const handleNewProject = () => {
    router.replace('/calculation/area');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Success Header */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <View style={styles.successHeader}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>계산 완료!</Text>
        </View>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Main Result Card */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <View style={styles.mainResultCard}>
          <Text style={styles.mainResultLabel}>필요한 타일 수량</Text>
          <View style={styles.mainResultValueContainer}>
            <Text style={styles.mainResultValue}>
              {MOCK_RESULT.totalTiles + MOCK_RESULT.recommendedSpare}
            </Text>
            <Text style={styles.mainResultUnit}>장</Text>
          </View>
          <Text style={styles.mainResultNote}>
            (기본 {MOCK_RESULT.totalTiles}장 + 여유분 {MOCK_RESULT.recommendedSpare}장)
          </Text>
        </View>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Breakdown Cards */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>상세 내역</Text>
          
          <View style={styles.breakdownGrid}>
            {/* 온장 */}
            <View style={[styles.breakdownCard, styles.breakdownCardFull]}>
              <Text style={styles.breakdownEmoji}>⬜</Text>
              <Text style={styles.breakdownLabel}>온장</Text>
              <Text style={styles.breakdownValue}>{MOCK_RESULT.fullTiles}</Text>
              <Text style={styles.breakdownUnit}>장</Text>
            </View>
            
            {/* 큰 조각 */}
            <View style={[styles.breakdownCard, styles.breakdownCardLarge]}>
              <Text style={styles.breakdownEmoji}>🟪</Text>
              <Text style={styles.breakdownLabel}>큰 조각</Text>
              <Text style={styles.breakdownValue}>{MOCK_RESULT.largePieces}</Text>
              <Text style={styles.breakdownUnit}>장</Text>
            </View>
            
            {/* 작은 조각 */}
            <View style={[styles.breakdownCard, styles.breakdownCardSmall]}>
              <Text style={styles.breakdownEmoji}>🟧</Text>
              <Text style={styles.breakdownLabel}>작은 조각</Text>
              <Text style={styles.breakdownValue}>{MOCK_RESULT.smallPieces}</Text>
              <Text style={styles.breakdownUnit}>장</Text>
            </View>
          </View>
        </View>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Input Summary */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>입력 정보</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>시공면적</Text>
              <Text style={styles.summaryValue}>
                {MOCK_RESULT.areaWidth} × {MOCK_RESULT.areaHeight} mm
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>타일 크기</Text>
              <Text style={styles.summaryValue}>
                {MOCK_RESULT.tileWidth} × {MOCK_RESULT.tileHeight} mm
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>줄눈 크기</Text>
              <Text style={styles.summaryValue}>{MOCK_RESULT.gap} mm</Text>
            </View>
          </View>
        </View>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* View Actions */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <View style={styles.viewActionsSection}>
          <Text style={styles.sectionTitle}>시뮬레이션 보기</Text>
          
          <View style={styles.viewActionsRow}>
            <TouchableOpacity
              style={styles.viewActionButton}
              onPress={handleView2D}
              activeOpacity={0.8}
            >
              <Text style={styles.viewActionEmoji}>📐</Text>
              <Text style={styles.viewActionLabel}>2D 도면</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.viewActionButton}
              onPress={handleView3D}
              activeOpacity={0.8}
            >
              <Text style={styles.viewActionEmoji}>🏠</Text>
              <Text style={styles.viewActionLabel}>3D 시뮬레이션</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Bottom Actions */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleNewProject}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>새 계산</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGoHome}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>완료</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.semantic.screenPadding,
    paddingBottom: spacing[24],
  },

  // Success Header
  successHeader: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: spacing[2],
  },
  successTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.semantic.success,
  },

  // Main Result Card
  mainResultCard: {
    backgroundColor: colors.primary.limeMuted,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[6],
    borderWidth: 2,
    borderColor: colors.primary.lime,
  },
  mainResultLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  mainResultValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mainResultValue: {
    fontSize: typography.fontSize['6xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.primary.lime,
    fontVariant: ['tabular-nums'],
  },
  mainResultUnit: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.medium,
    color: colors.primary.lime,
    marginLeft: spacing[2],
  },
  mainResultNote: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing[2],
  },

  // Breakdown Section
  breakdownSection: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  breakdownGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: colors.surface.default,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    alignItems: 'center',
  },
  breakdownCardFull: {
    borderLeftWidth: 3,
    borderLeftColor: colors.tile.fullTile,
  },
  breakdownCardLarge: {
    borderLeftWidth: 3,
    borderLeftColor: colors.tile.largePiece,
  },
  breakdownCardSmall: {
    borderLeftWidth: 3,
    borderLeftColor: colors.tile.smallPiece,
  },
  breakdownEmoji: {
    fontSize: 24,
    marginBottom: spacing[1],
  },
  breakdownLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  },
  breakdownValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  breakdownUnit: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },

  // Summary Section
  summarySection: {
    marginBottom: spacing[6],
  },
  summaryCard: {
    backgroundColor: colors.surface.default,
    borderRadius: borderRadius.md,
    padding: spacing[4],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  summaryLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },

  // View Actions Section
  viewActionsSection: {
    marginBottom: spacing[6],
  },
  viewActionsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  viewActionButton: {
    flex: 1,
    backgroundColor: colors.surface.elevated,
    borderRadius: borderRadius.md,
    padding: spacing[5],
    alignItems: 'center',
    ...shadows.sm,
  },
  viewActionEmoji: {
    fontSize: 32,
    marginBottom: spacing[2],
  },
  viewActionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing.semantic.screenPadding,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface.elevated,
    borderRadius: borderRadius.md,
    height: componentTokens.button.secondary.height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary.lime,
    borderRadius: borderRadius.md,
    height: componentTokens.button.primary.height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.onPrimary,
  },
});

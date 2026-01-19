/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Home Screen (Index)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 앱의 메인 화면입니다.
 * 새 프로젝트 시작 또는 기존 프로젝트 열기 기능을 제공합니다.
 * 
 * @ref Chapter 6 - Project Management
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

// Design System
import { colors, typography, spacing, borderRadius, shadows } from '@/design';
import { triggerButtonPressFeedback } from '@/design';


// ═══════════════════════════════════════════════════════════════════════════
// HOME SCREEN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function HomeScreen() {
  // ─────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────────────────
  
  /**
   * 새 프로젝트 시작
   * 물량 계산 플로우의 첫 번째 화면으로 이동
   */
  const handleNewProject = async () => {
    await triggerButtonPressFeedback();
    router.push('/calculation/area');
  };

  /**
   * 최근 프로젝트 열기
   * TODO: 프로젝트 목록 화면 구현 후 연결
   */
  const handleOpenProject = async () => {
    await triggerButtonPressFeedback();
    // router.push('/projects');
    console.log('Open recent project');
  };

  /**
   * 설정 화면 열기
   */
  const handleSettings = async () => {
    await triggerButtonPressFeedback();
    router.push('/settings');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Header Section */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.appName}>Tile Set Up</Text>
          <Text style={styles.tagline}>
            전문가를 위한 정밀 타일 시공 시뮬레이션
          </Text>
        </View>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Main Actions */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <View style={styles.actionsContainer}>
          {/* New Project Button - Primary CTA */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNewProject}
            activeOpacity={0.8}
          >
            <View style={styles.buttonIcon}>
              <Text style={styles.buttonIconText}>+</Text>
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.primaryButtonTitle}>새 프로젝트</Text>
              <Text style={styles.primaryButtonSubtitle}>
                물량 계산부터 시작하기
              </Text>
            </View>
          </TouchableOpacity>

          {/* Open Recent Project Button */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleOpenProject}
            activeOpacity={0.8}
          >
            <View style={styles.buttonIcon}>
              <Text style={styles.buttonIconText}>📁</Text>
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.secondaryButtonTitle}>최근 프로젝트</Text>
              <Text style={styles.secondaryButtonSubtitle}>
                저장된 프로젝트 열기
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Quick Stats / Info Cards */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>주요 기능</Text>
          
          <View style={styles.featureCards}>
            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>📐</Text>
              <Text style={styles.featureTitle}>정밀 계산</Text>
              <Text style={styles.featureDesc}>0.001mm 정밀도</Text>
            </View>
            
            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>🎨</Text>
              <Text style={styles.featureTitle}>15가지 패턴</Text>
              <Text style={styles.featureDesc}>다양한 배열 방식</Text>
            </View>
            
            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>🏠</Text>
              <Text style={styles.featureTitle}>3D 시뮬레이션</Text>
              <Text style={styles.featureDesc}>실감나는 미리보기</Text>
            </View>
          </View>
        </View>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Settings Link */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.settingsLink}
          onPress={handleSettings}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsLinkText}>⚙️  설정</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={styles.versionText}>v1.0.0</Text>
      </ScrollView>
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
  },
  contentContainer: {
    padding: spacing.semantic.screenPadding,
    paddingTop: spacing[12],
    paddingBottom: spacing[8],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Header
  // ─────────────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: spacing[12],
  },
  appName: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.primary.lime,
    letterSpacing: typography.letterSpacing.tight,
    marginBottom: spacing[2],
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Action Buttons
  // ─────────────────────────────────────────────────────────────────────────
  actionsContainer: {
    gap: spacing[4],
    marginBottom: spacing[10],
  },
  
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.lime,
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    minHeight: spacing.semantic.touchTargetComfort,
    ...shadows.md,
  },
  primaryButtonTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.onPrimary,
  },
  primaryButtonSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.onPrimary,
    opacity: 0.8,
    marginTop: spacing[0.5],
  },

  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    minHeight: spacing.semantic.touchTargetComfort,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  secondaryButtonTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  secondaryButtonSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing[0.5],
  },

  buttonIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  buttonIconText: {
    fontSize: typography.fontSize['2xl'],
  },
  buttonContent: {
    flex: 1,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Feature Cards
  // ─────────────────────────────────────────────────────────────────────────
  infoSection: {
    marginBottom: spacing[8],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
  featureCards: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  featureCard: {
    flex: 1,
    backgroundColor: colors.surface.default,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 28,
    marginBottom: spacing[2],
  },
  featureTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing[1],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Footer
  // ─────────────────────────────────────────────────────────────────────────
  settingsLink: {
    alignItems: 'center',
    padding: spacing[4],
  },
  settingsLinkText: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
  },
  versionText: {
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
    marginTop: spacing[2],
  },
});

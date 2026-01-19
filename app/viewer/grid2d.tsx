/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - 2D Grid Viewer (Placeholder)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 2D 타일 그리드 뷰어 화면입니다.
 * 
 * TODO: Step 13에서 구현 예정
 * - 타일 그리드 캔버스 렌더링
 * - Pan/Zoom 제스처
 * - 타일 선택 및 편집
 * - 마스크 편집 도구
 * 
 * @ref Chapter 4.1 - 2D Grid View
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';

import { colors, typography, spacing, borderRadius } from '@/design';


export default function Grid2DViewerScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Canvas Area Placeholder */}
        <View style={styles.canvasPlaceholder}>
          <View style={styles.gridPreview}>
            {/* Mock Grid */}
            {Array.from({ length: 5 }, (_, row) => (
              <View key={row} style={styles.gridRow}>
                {Array.from({ length: 4 }, (_, col) => (
                  <View 
                    key={col} 
                    style={[
                      styles.gridCell,
                      (row + col) % 2 === 0 && styles.gridCellAlt,
                    ]} 
                  />
                ))}
              </View>
            ))}
          </View>
          
          <View style={styles.placeholderOverlay}>
            <Text style={styles.placeholderEmoji}>📐</Text>
            <Text style={styles.placeholderTitle}>2D 그리드 뷰어</Text>
            <Text style={styles.placeholderDesc}>
              Step 13에서 구현 예정{'\n'}
              Pan, Zoom, 타일 선택 기능
            </Text>
          </View>
        </View>

        {/* Toolbar Placeholder */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolButton}>
            <Text style={styles.toolButtonText}>✋</Text>
            <Text style={styles.toolLabel}>이동</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolButton}>
            <Text style={styles.toolButtonText}>🔲</Text>
            <Text style={styles.toolLabel}>선택</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolButton}>
            <Text style={styles.toolButtonText}>✂️</Text>
            <Text style={styles.toolLabel}>커팅</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolButton}>
            <Text style={styles.toolButtonText}>⬜</Text>
            <Text style={styles.toolLabel}>마스크</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Action */}
        <TouchableOpacity
          style={styles.switchViewButton}
          onPress={() => router.replace('/viewer/scene3d')}
          activeOpacity={0.8}
        >
          <Text style={styles.switchViewButtonText}>🏠 3D 뷰로 전환</Text>
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
    padding: spacing.semantic.screenPadding,
  },

  // Canvas
  canvasPlaceholder: {
    flex: 1,
    backgroundColor: colors.surface.default,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  gridPreview: {
    flex: 1,
    padding: spacing[4],
    opacity: 0.3,
  },
  gridRow: {
    flexDirection: 'row',
    flex: 1,
  },
  gridCell: {
    flex: 1,
    backgroundColor: colors.tile.fullTile,
    margin: 1,
    borderRadius: 2,
  },
  gridCellAlt: {
    backgroundColor: colors.tile.largePiece,
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  placeholderTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  placeholderDesc: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing[4],
    marginTop: spacing[4],
    backgroundColor: colors.surface.default,
    borderRadius: borderRadius.md,
  },
  toolButton: {
    alignItems: 'center',
    padding: spacing[2],
  },
  toolButtonText: {
    fontSize: 24,
    marginBottom: spacing[1],
  },
  toolLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },

  // Switch View
  switchViewButton: {
    backgroundColor: colors.surface.elevated,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    alignItems: 'center',
    marginTop: spacing[4],
  },
  switchViewButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
});

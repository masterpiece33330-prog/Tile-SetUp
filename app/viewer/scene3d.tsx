/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - 3D Scene Viewer (Placeholder)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 3D 타일 시뮬레이션 뷰어 화면입니다.
 * 
 * TODO: Step 14에서 구현 예정
 * - Three.js/R3F 기반 3D 렌더링
 * - 바닥 + 벽면 타일 시뮬레이션
 * - 카메라 Orbit 컨트롤
 * - 벽면 자동 투명화 (Wall Culling)
 * - LOD 시스템
 * 
 * @ref Chapter 4.2 - 3D Scene View
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


export default function Scene3DViewerScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 3D Canvas Placeholder */}
        <View style={styles.canvasPlaceholder}>
          {/* Mock 3D Perspective */}
          <View style={styles.perspective3d}>
            {/* Floor */}
            <View style={styles.floor}>
              <View style={styles.floorGrid}>
                {Array.from({ length: 4 }, (_, i) => (
                  <View key={i} style={styles.floorRow} />
                ))}
              </View>
            </View>
            
            {/* Back Wall */}
            <View style={styles.backWall}>
              <View style={styles.wallGrid}>
                {Array.from({ length: 3 }, (_, i) => (
                  <View key={i} style={styles.wallRow} />
                ))}
              </View>
            </View>
          </View>
          
          <View style={styles.placeholderOverlay}>
            <Text style={styles.placeholderEmoji}>🏠</Text>
            <Text style={styles.placeholderTitle}>3D 시뮬레이션</Text>
            <Text style={styles.placeholderDesc}>
              Step 14에서 구현 예정{'\n'}
              Three.js + React Three Fiber{'\n'}
              카메라 회전, 벽면 투명화
            </Text>
          </View>
        </View>

        {/* View Controls Placeholder */}
        <View style={styles.viewControls}>
          <TouchableOpacity style={styles.viewControlButton}>
            <Text style={styles.viewControlIcon}>🔄</Text>
            <Text style={styles.viewControlLabel}>회전</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.viewControlButton}>
            <Text style={styles.viewControlIcon}>🔍</Text>
            <Text style={styles.viewControlLabel}>확대</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.viewControlButton}>
            <Text style={styles.viewControlIcon}>📷</Text>
            <Text style={styles.viewControlLabel}>리셋</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.viewControlButton}>
            <Text style={styles.viewControlIcon}>💡</Text>
            <Text style={styles.viewControlLabel}>조명</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>기술 스택</Text>
          <Text style={styles.infoText}>
            • Three.js - 3D 렌더링 엔진{'\n'}
            • React Three Fiber - React 바인딩{'\n'}
            • expo-gl - OpenGL ES 컨텍스트{'\n'}
            • InstancedMesh - 성능 최적화
          </Text>
        </View>

        {/* Switch View */}
        <TouchableOpacity
          style={styles.switchViewButton}
          onPress={() => router.replace('/viewer/grid2d')}
          activeOpacity={0.8}
        >
          <Text style={styles.switchViewButtonText}>📐 2D 도면으로 전환</Text>
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
  
  // Mock 3D Perspective
  perspective3d: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: spacing[8],
    opacity: 0.4,
  },
  floor: {
    width: '80%',
    height: '40%',
    backgroundColor: colors.tile.fullTile,
    transform: [{ perspective: 500 }, { rotateX: '60deg' }],
    borderRadius: 4,
  },
  floorGrid: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  floorRow: {
    height: 2,
    backgroundColor: colors.tile.gap,
  },
  backWall: {
    position: 'absolute',
    top: '20%',
    width: '60%',
    height: '35%',
    backgroundColor: colors.tile.largePiece,
    borderRadius: 4,
  },
  wallGrid: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  wallRow: {
    height: 2,
    backgroundColor: colors.tile.gap,
  },

  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  placeholderEmoji: {
    fontSize: 56,
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
    lineHeight: 24,
  },

  // View Controls
  viewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing[3],
    marginTop: spacing[4],
    backgroundColor: colors.surface.default,
    borderRadius: borderRadius.md,
  },
  viewControlButton: {
    alignItems: 'center',
    padding: spacing[2],
  },
  viewControlIcon: {
    fontSize: 24,
    marginBottom: spacing[1],
  },
  viewControlLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.surface.elevated,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginTop: spacing[4],
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    lineHeight: 22,
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

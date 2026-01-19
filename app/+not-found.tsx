/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Not Found Screen
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 존재하지 않는 경로에 접근했을 때 표시되는 화면입니다.
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

import { colors, typography, spacing, borderRadius, componentTokens } from '@/design';


export default function NotFoundScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>페이지를 찾을 수 없습니다</Text>
        <Text style={styles.description}>
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>홈으로 돌아가기</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.semantic.screenPadding,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  button: {
    backgroundColor: colors.primary.lime,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[8],
    height: componentTokens.button.primary.height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.onPrimary,
  },
});

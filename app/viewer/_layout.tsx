/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Viewer Layout
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 2D/3D 뷰어 화면들의 네비게이션 레이아웃입니다.
 * 
 * @ref Chapter 4 - 2D/3D View System
 */

import React from 'react';
import { Stack } from 'expo-router';

import { colors, typography } from '@/design';


export default function ViewerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: typography.fontWeight.semibold,
          fontSize: typography.fontSize.lg,
        },
        headerShadowVisible: false,
        animation: 'fade',
        contentStyle: {
          backgroundColor: colors.background.primary,
        },
      }}
    >
      <Stack.Screen
        name="grid2d"
        options={{
          title: '2D 도면',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="scene3d"
        options={{
          title: '3D 시뮬레이션',
          headerShown: true,
        }}
      />
    </Stack>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Calculation Flow Layout
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 물량 계산 플로우의 네비게이션 레이아웃입니다.
 * 단계별 입력 화면(시공면적 → 타일크기 → Gap → 결과)을 관리합니다.
 * 
 * 화면 구성:
 * 1. /calculation/area - 시공면적 입력
 * 2. /calculation/tile - 타일 크기 입력
 * 3. /calculation/gap - 줄눈(Gap) 입력
 * 4. /calculation/pattern - 패턴 선택
 * 5. /calculation/result - 계산 결과
 * 
 * @ref Chapter 1 - Quantity Calculation
 */

import React from 'react';
import { Stack } from 'expo-router';

// Design System
import { colors, typography } from '@/design';


// ═══════════════════════════════════════════════════════════════════════════
// CALCULATION FLOW LAYOUT
// ═══════════════════════════════════════════════════════════════════════════

export default function CalculationLayout() {
  return (
    <Stack
      screenOptions={{
        // 공통 헤더 스타일
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: typography.fontWeight.semibold,
          fontSize: typography.fontSize.lg,
        },
        headerShadowVisible: false,
        
        // 화면 전환
        animation: 'slide_from_right',
        
        // 컨텐츠 배경
        contentStyle: {
          backgroundColor: colors.background.primary,
        },
        
        // 뒤로가기 버튼
        headerBackTitle: '',
        headerBackTitleVisible: false,
      }}
    >
      {/* Step 1: 시공면적 입력 */}
      <Stack.Screen
        name="area"
        options={{
          title: '시공면적 입력',
          headerShown: true,
        }}
      />
      
      {/* Step 2: 타일 크기 입력 */}
      <Stack.Screen
        name="tile"
        options={{
          title: '타일 크기 입력',
          headerShown: true,
        }}
      />
      
      {/* Step 3: Gap(줄눈) 입력 */}
      <Stack.Screen
        name="gap"
        options={{
          title: '줄눈 입력',
          headerShown: true,
        }}
      />
      
      {/* Step 4: 패턴 선택 */}
      <Stack.Screen
        name="pattern"
        options={{
          title: '패턴 선택',
          headerShown: true,
        }}
      />
      
      {/* Step 5: 계산 결과 */}
      <Stack.Screen
        name="result"
        options={{
          title: '계산 결과',
          headerShown: true,
          // 결과 화면에서는 뒤로가기 대신 홈으로 가는 버튼 제공
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}

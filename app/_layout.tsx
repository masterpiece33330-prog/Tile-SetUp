/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Root Layout
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Expo Router의 루트 레이아웃 파일입니다.
 * 모든 화면에 공통으로 적용되는 설정을 정의합니다.
 * 
 * 주요 역할:
 * 1. 전역 Provider 설정 (Theme, i18n, Store)
 * 2. 네비게이션 컨테이너 구성
 * 3. 시스템 UI 설정 (상태바, 배경색)
 * 4. 폰트 로딩
 * 5. Splash Screen 관리
 * 
 * @ref Chapter 7 - Navigation System
 */

import { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Design System
import { colors } from '@/design';

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();


// ═══════════════════════════════════════════════════════════════════════════
// FONT LOADING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 커스텀 폰트 로딩
 * Pretendard (한글 최적화) 및 숫자 전용 폰트
 */
const useFonts = () => {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // Pretendard - 한글 최적화 폰트
          // 실제 배포 시 폰트 파일 추가 필요
          // 'Pretendard-Regular': require('@/assets/fonts/Pretendard-Regular.otf'),
          // 'Pretendard-Medium': require('@/assets/fonts/Pretendard-Medium.otf'),
          // 'Pretendard-SemiBold': require('@/assets/fonts/Pretendard-SemiBold.otf'),
          // 'Pretendard-Bold': require('@/assets/fonts/Pretendard-Bold.otf'),
          // 'Pretendard-ExtraBold': require('@/assets/fonts/Pretendard-ExtraBold.otf'),
          
          // Digital LED 스타일 폰트 (숫자 입력용)
          // 'DSEG7-Classic': require('@/assets/fonts/DSEG7Classic-Regular.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.warn('Font loading failed:', error);
        // 폰트 로딩 실패 시에도 앱 실행 (시스템 폰트 사용)
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  return fontsLoaded;
};


// ═══════════════════════════════════════════════════════════════════════════
// ROOT LAYOUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';

export default function RootLayout() {
  const fontsLoaded = useFonts();

  // Splash Screen 숨기기
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // 로딩 중에는 아무것도 렌더링하지 않음 (Splash Screen 유지)
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      {/* 상태바 설정 - 다크 모드 */}
      <StatusBar style="light" backgroundColor={colors.background.primary} />
      
      {/* 네비게이션 스택 */}
      <Stack
        screenOptions={{
          // 전역 헤더 스타일
          headerStyle: {
            backgroundColor: colors.background.primary,
          },
          headerTintColor: colors.text.primary,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerShadowVisible: false,
          
          // 화면 전환 애니메이션
          animation: 'slide_from_right',
          
          // 컨텐츠 배경
          contentStyle: {
            backgroundColor: colors.background.primary,
          },
          
          // 제스처 설정
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        {/* 
          Expo Router는 파일 기반 라우팅을 사용합니다.
          app/ 폴더 내의 파일 구조가 자동으로 라우트가 됩니다.
          
          예시:
          - app/index.tsx → "/" (홈)
          - app/(tabs)/index.tsx → 탭 네비게이션 홈
          - app/calculation/area.tsx → "/calculation/area"
        */}
        
        {/* 홈 (인덱스) */}
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            title: 'Tile Set Up',
          }} 
        />
        
        {/* 탭 네비게이션 그룹 */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
          }} 
        />
        
        {/* 물량 계산 플로우 */}
        <Stack.Screen 
          name="calculation" 
          options={{ 
            headerShown: false,
            presentation: 'card',
          }} 
        />
        
        {/* 2D/3D 뷰어 */}
        <Stack.Screen 
          name="viewer" 
          options={{ 
            headerShown: false,
            presentation: 'fullScreenModal',
          }} 
        />
        
        {/* 설정 */}
        <Stack.Screen 
          name="settings" 
          options={{
            title: '설정',
            presentation: 'modal',
          }} 
        />
        
        {/* 404 Not Found */}
        <Stack.Screen 
          name="+not-found" 
          options={{
            title: '페이지를 찾을 수 없습니다',
          }} 
        />
      </Stack>
    </GestureHandlerRootView>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});

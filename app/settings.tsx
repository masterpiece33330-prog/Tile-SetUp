/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - Settings Screen
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 앱 설정 화면입니다.
 * 언어, 햅틱, 단위 등의 사용자 설정을 관리합니다.
 * 
 * @ref Chapter 11 - Internationalization
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import { router } from 'expo-router';

import { colors, typography, spacing, borderRadius } from '@/design';
import { isHapticsEnabled, setHapticsEnabled, triggerToggleFeedback } from '@/design';


export default function SettingsScreen() {
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────
  
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled());
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [autoSaveOn, setAutoSaveOn] = useState(true);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleHapticsToggle = async (value: boolean) => {
    setHapticsOn(value);
    setHapticsEnabled(value);
    if (value) {
      await triggerToggleFeedback();
    }
  };

  const handleLanguageChange = (lang: 'ko' | 'en') => {
    setLanguage(lang);
    // TODO: i18n 언어 변경 구현
  };

  const handleClose = () => {
    router.back();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* ───────────────────────────────────────────────────────────────── */}
        {/* General Settings */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>일반</Text>
          
          {/* Language */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>언어 / Language</Text>
              <Text style={styles.settingDesc}>앱 표시 언어를 선택합니다</Text>
            </View>
            <View style={styles.languageButtons}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === 'ko' && styles.languageButtonActive,
                ]}
                onPress={() => handleLanguageChange('ko')}
              >
                <Text style={[
                  styles.languageButtonText,
                  language === 'ko' && styles.languageButtonTextActive,
                ]}>
                  한국어
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === 'en' && styles.languageButtonActive,
                ]}
                onPress={() => handleLanguageChange('en')}
              >
                <Text style={[
                  styles.languageButtonText,
                  language === 'en' && styles.languageButtonTextActive,
                ]}>
                  English
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Haptics */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>햅틱 피드백</Text>
              <Text style={styles.settingDesc}>버튼, 슬라이더 터치 시 진동</Text>
            </View>
            <Switch
              value={hapticsOn}
              onValueChange={handleHapticsToggle}
              trackColor={{
                false: colors.surface.elevated,
                true: colors.primary.limeMuted,
              }}
              thumbColor={hapticsOn ? colors.primary.lime : colors.text.disabled}
            />
          </View>
          
          {/* Auto Save */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>자동 저장</Text>
              <Text style={styles.settingDesc}>변경사항을 30초마다 자동 저장</Text>
            </View>
            <Switch
              value={autoSaveOn}
              onValueChange={setAutoSaveOn}
              trackColor={{
                false: colors.surface.elevated,
                true: colors.primary.limeMuted,
              }}
              thumbColor={autoSaveOn ? colors.primary.lime : colors.text.disabled}
            />
          </View>
        </View>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* About Section */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>정보</Text>
          
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>버전</Text>
            </View>
            <Text style={styles.settingValue}>1.0.0</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>개발자</Text>
            </View>
            <Text style={styles.settingValue}>Tile Set Up Team</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>라이선스</Text>
            </View>
            <Text style={styles.settingValue}>오픈소스 라이선스 →</Text>
          </TouchableOpacity>
        </View>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* Development Info (Temporary) */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>개발 정보 (임시)</Text>
          
          <View style={styles.devInfoCard}>
            <Text style={styles.devInfoText}>
              📊 현재 진행률: Step 10 / ~20{'\n'}
              ✅ 엔진 완성: 계산, 패턴, 마스킹, Undo{'\n'}
              ⏳ 다음: UI 컴포넌트 구현{'\n'}
              📱 첫 폰 테스트: Step 11 예정
            </Text>
          </View>
        </View>
        
        {/* Bottom Padding */}
        <View style={{ height: spacing[8] }} />
      </ScrollView>
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

  // Section
  section: {
    padding: spacing.semantic.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[4],
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    minHeight: 56,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing[4],
  },
  settingLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  settingDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing[0.5],
  },
  settingValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
  },

  // Language Buttons
  languageButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  languageButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.elevated,
  },
  languageButtonActive: {
    backgroundColor: colors.primary.limeMuted,
    borderWidth: 1,
    borderColor: colors.primary.lime,
  },
  languageButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  languageButtonTextActive: {
    color: colors.primary.lime,
  },

  // Dev Info
  devInfoCard: {
    backgroundColor: colors.surface.default,
    borderRadius: borderRadius.md,
    padding: spacing[4],
  },
  devInfoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
});

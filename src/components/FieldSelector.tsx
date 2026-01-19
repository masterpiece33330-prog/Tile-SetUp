/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE SET UP - FieldSelector Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 여러 입력 필드 간 전환을 위한 탭 스타일 선택기입니다.
 * 주로 가로/세로 치수 입력에 사용됩니다.
 * 
 * @ref component-blueprint.md - Field Selection Tabs
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

// Design System
import { colors, typography, spacing, borderRadius } from '@/design';
import { triggerSnapFeedback } from '@/design';


// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FieldOption<T extends string> {
  /** 필드 ID */
  id: T;
  
  /** 표시 라벨 */
  label: string;
  
  /** 현재 값 (포맷된 문자열) */
  value?: string;
  
  /** 값이 유효한지 (체크 표시용) */
  isValid?: boolean;
}

export interface FieldSelectorProps<T extends string> {
  /** 선택 가능한 필드 옵션들 */
  options: FieldOption<T>[];
  
  /** 현재 선택된 필드 ID */
  selectedId: T;
  
  /** 선택 변경 핸들러 */
  onSelect: (id: T) => void;
  
  /** 커스텀 스타일 */
  style?: ViewStyle;
}


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function FieldSelector<T extends string>({
  options,
  selectedId,
  onSelect,
  style,
}: FieldSelectorProps<T>) {
  
  const handleSelect = useCallback(async (id: T) => {
    if (id !== selectedId) {
      await triggerSnapFeedback('light');
      onSelect(id);
    }
  }, [selectedId, onSelect]);

  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isSelected = option.id === selectedId;
        
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.tab,
              isSelected && styles.tabSelected,
            ]}
            onPress={() => handleSelect(option.id)}
            activeOpacity={0.7}
          >
            {/* 라벨 */}
            <Text style={[
              styles.tabLabel,
              isSelected && styles.tabLabelSelected,
            ]}>
              {option.label}
            </Text>
            
            {/* 값 */}
            <Text style={[
              styles.tabValue,
              isSelected && styles.tabValueSelected,
            ]}>
              {option.value || '-'}
            </Text>
            
            {/* 유효 체크 표시 */}
            {option.isValid && (
              <View style={styles.checkBadge}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  
  tab: {
    flex: 1,
    backgroundColor: colors.surface.default,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  tabSelected: {
    borderColor: colors.primary.lime,
    backgroundColor: colors.primary.limeMuted,
  },
  
  tabLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  },
  tabLabelSelected: {
    color: colors.primary.lime,
  },
  
  tabValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  tabValueSelected: {
    color: colors.text.primary,
  },
  
  checkBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
  },
  checkText: {
    fontSize: typography.fontSize.sm,
    color: colors.semantic.success,
  },
});


export default FieldSelector;

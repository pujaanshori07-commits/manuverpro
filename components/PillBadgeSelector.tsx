import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/DesignSystem';
import { Option } from '../constants/ProfileOptions';

interface PillBadgeSelectorProps {
  options: readonly Option[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  multiSelect?: boolean;
  selectedValues?: string[];
}

export default function PillBadgeSelector({ 
  options, selectedValue, onSelect, multiSelect = false, selectedValues = [] 
}: PillBadgeSelectorProps) {
  const isSelected = (value: string) => 
    multiSelect ? selectedValues.includes(value) : selectedValue === value;

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const active = isSelected(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={opt.icon} 
              size={16} 
              color={active ? '#FFFFFF' : COLORS.secondaryText} 
            />
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: { ...TYPOGRAPHY.bodySmall, color: COLORS.secondaryText, fontWeight: '600' },
  pillTextActive: { color: '#FFFFFF', fontWeight: '700' },
});

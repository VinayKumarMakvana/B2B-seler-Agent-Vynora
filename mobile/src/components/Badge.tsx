import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface BadgeProps {
  label: string;
  type?: 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ label, type = 'info' }: BadgeProps) {
  let bgColor = colors.surface;
  let textColor = colors.textPrimary;
  let borderColor = colors.surfaceBorder;

  if (type === 'success') {
    bgColor = colors.successBg;
    textColor = colors.success;
    borderColor = colors.success;
  } else if (type === 'warning') {
    bgColor = colors.warningBg;
    textColor = colors.warning;
    borderColor = colors.warning;
  } else if (type === 'danger') {
    bgColor = colors.dangerBg;
    textColor = colors.danger;
    borderColor = colors.danger;
  } else if (type === 'info') {
    bgColor = colors.badgeContactedBg;
    textColor = colors.accent;
    borderColor = colors.accent;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  }
});

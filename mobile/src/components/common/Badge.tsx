import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, FONT_SIZES, SPACING } from '../../utils/constants';

type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'muted';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: COLORS.primaryLight, text: COLORS.primary },
  success: { bg: COLORS.successLight, text: COLORS.success },
  danger: { bg: COLORS.dangerLight, text: COLORS.danger },
  warning: { bg: '#fffbeb', text: COLORS.warning },
  muted: { bg: '#f1f5f9', text: COLORS.muted },
};

export default function Badge({ label, variant = 'primary', style }: BadgeProps) {
  const colors = VARIANT_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Category } from '../../types';
import { COLORS, BORDER_RADIUS } from '../../utils/constants';

interface CategoryIconProps {
  category?: Category;
  size?: number;
  showLabel?: boolean;
}

const ICON_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  restaurant: 'restaurant',
  car: 'directions-car',
  'shopping-bag': 'shopping-bag',
  'receipt-long': 'receipt-long',
  movie: 'movie',
  'local-hospital': 'local-hospital',
  school: 'school',
  work: 'work',
  'more-horiz': 'more-horiz',
  circle: 'circle',
  home: 'home',
  flight: 'flight',
  sports: 'sports',
  fitness: 'fitness-center',
  pets: 'pets',
  gift: 'card-giftcard',
  savings: 'savings',
};

export default function CategoryIcon({ category, size = 20, showLabel = false }: CategoryIconProps) {
  const iconName = category?.icon
    ? (ICON_MAP[category.icon] || 'category')
    : 'category';
  const bgColor = category?.color || COLORS.primary;
  const iconSize = size * 0.6;
  const containerSize = size + 12;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: bgColor + '20',
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
          },
        ]}
      >
        <MaterialIcons
          name={iconName as any}
          size={iconSize + 4}
          color={bgColor}
        />
      </View>
      {showLabel && category && (
        <Text style={styles.label} numberOfLines={1}>
          {category.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 4,
    maxWidth: 56,
    textAlign: 'center',
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Expense } from '../../types';
import CategoryIcon from './CategoryIcon';
import { formatCurrency } from '../../utils/currency';
import { formatTime } from '../../utils/date';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../utils/constants';

interface ExpenseItemProps {
  expense: Expense;
  onPress?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  showDate?: boolean;
}

export default function ExpenseItem({ expense, onPress, onDelete, showDate = false }: ExpenseItemProps) {
  const isIncome = expense.type === 'income';
  const amountColor = isIncome ? COLORS.success : COLORS.danger;
  const amountPrefix = isIncome ? '+' : '-';

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.description || 'this expense'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(expense),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(expense)}
      activeOpacity={0.7}
    >
      <CategoryIcon category={expense.category} size={22} />
      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={1}>
          {expense.description || expense.category?.name || 'Expense'}
        </Text>
        <Text style={styles.meta}>
          {expense.category?.name || 'Uncategorized'}
          {showDate ? ` • ${formatTime(expense.created_at)}` : ` • ${formatTime(expense.created_at)}`}
          {expense.short_term_budget_name ? ` • 💼 ${expense.short_term_budget_name}` : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}{formatCurrency(expense.amount)}
        </Text>
        {onDelete && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <MaterialIcons name="delete-outline" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  meta: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 2,
  },
});

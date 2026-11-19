import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Expense } from '../../types';
import ExpenseItem from './ExpenseItem';
import EmptyState from '../common/EmptyState';
import { getRelativeDate } from '../../utils/date';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';
import dayjs from 'dayjs';

interface GroupedExpenses {
  date: string;
  label: string;
  data: Expense[];
}

interface ExpenseListProps {
  expenses: Expense[];
  refreshing?: boolean;
  onRefresh?: () => void;
  onPressExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expense: Expense) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  ListHeaderComponent?: React.ReactElement;
}

function groupExpensesByDate(expenses: Expense[]): GroupedExpenses[] {
  const groups: Record<string, Expense[]> = {};
  expenses.forEach((expense) => {
    const date = expense.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(expense);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => dayjs(b).valueOf() - dayjs(a).valueOf())
    .map(([date, data]) => ({
      date,
      label: getRelativeDate(date),
      data,
    }));
}

export default function ExpenseList({
  expenses,
  refreshing = false,
  onRefresh,
  onPressExpense,
  onDeleteExpense,
  emptyTitle = 'No expenses yet',
  emptySubtitle = 'Tap the + button to add your first expense',
  ListHeaderComponent,
}: ExpenseListProps) {
  const grouped = groupExpensesByDate(expenses);

  const flatData: Array<{ type: 'header'; label: string } | { type: 'item'; expense: Expense }> = [];
  grouped.forEach((group) => {
    flatData.push({ type: 'header', label: group.label });
    group.data.forEach((expense) => flatData.push({ type: 'item', expense }));
  });

  if (expenses.length === 0 && !refreshing) {
    return (
      <View style={{ flex: 1 }}>
        {ListHeaderComponent}
        <EmptyState
          icon="receipt-long"
          title={emptyTitle}
          subtitle={emptySubtitle}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={flatData}
      keyExtractor={(item, index) =>
        item.type === 'header' ? `header-${item.label}` : `expense-${item.expense.id}`
      }
      ListHeaderComponent={ListHeaderComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        ) : undefined
      }
      renderItem={({ item }) => {
        if (item.type === 'header') {
          return <Text style={styles.dateHeader}>{item.label}</Text>;
        }
        return (
          <ExpenseItem
            expense={item.expense}
            onPress={onPressExpense}
            onDelete={onDeleteExpense}
          />
        );
      }}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 100,
  },
  dateHeader: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
});

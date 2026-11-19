import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { FAB, Searchbar } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useExpenseStore } from '../store/expenseStore';
import { Expense, ExpenseFilter } from '../types';
import { RootStackParamList } from '../navigation/types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';
import { getStartOfToday, getStartOfWeek, getStartOfMonth, today } from '../utils/date';
import ExpenseList from '../components/expense/ExpenseList';
import LoadingSpinner from '../components/common/LoadingSpinner';

type Nav = StackNavigationProp<RootStackParamList>;

const FILTER_OPTIONS: { label: string; value: ExpenseFilter }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All', value: 'all' },
];

export default function ExpensesScreen() {
  const navigation = useNavigation<Nav>();
  const { expenses, loading, refreshing, fetchExpenses, refresh, deleteExpense } = useExpenseStore();

  const [filter, setFilter] = useState<ExpenseFilter>('month');
  const [search, setSearch] = useState('');

  const getDateRange = (f: ExpenseFilter): { start_date?: string; end_date?: string } => {
    switch (f) {
      case 'today':
        return { start_date: today(), end_date: today() };
      case 'week':
        return { start_date: getStartOfWeek(), end_date: today() };
      case 'month':
        return { start_date: getStartOfMonth(), end_date: today() };
      default:
        return {};
    }
  };

  const loadData = (f: ExpenseFilter = filter) => {
    fetchExpenses({ ...getDateRange(f), limit: 100 });
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [filter])
  );

  const handleFilterChange = (f: ExpenseFilter) => {
    setFilter(f);
    fetchExpenses({ ...getDateRange(f), limit: 100 });
  };

  const onRefresh = () => {
    refresh({ ...getDateRange(filter), limit: 100 });
  };

  const onDeleteExpense = async (expense: Expense) => {
    await deleteExpense(expense.id);
  };

  const filteredExpenses = search.trim()
    ? expenses.filter(
        (e) =>
          e.description?.toLowerCase().includes(search.toLowerCase()) ||
          e.category?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : expenses;

  const ListHeader = (
    <View>
      <Searchbar
        placeholder="Search expenses..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchBar}
        inputStyle={{ fontSize: FONT_SIZES.md }}
        iconColor={COLORS.muted}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.filterChip, filter === opt.value && styles.filterChipActive]}
            onPress={() => handleFilterChange(opt.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === opt.value && styles.filterChipTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <Text style={styles.headerCount}>{filteredExpenses.length} records</Text>
      </View>

      {loading && expenses.length === 0 ? (
        <LoadingSpinner fullScreen />
      ) : (
        <ExpenseList
          expenses={filteredExpenses}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onPressExpense={(expense) => navigation.navigate('EditExpense', { expense })}
          onDeleteExpense={onDeleteExpense}
          emptyTitle="No expenses found"
          emptySubtitle="Try a different filter or add your first expense"
          ListHeaderComponent={ListHeader}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        color="#fff"
        onPress={() => navigation.navigate('AddExpense')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 56,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  headerTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text },
  headerCount: { fontSize: FONT_SIZES.sm, color: COLORS.muted },
  searchBar: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.card,
    elevation: 0,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterRow: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.muted },
  filterChipTextActive: { color: '#fff' },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
  },
});

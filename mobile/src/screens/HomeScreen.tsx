import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { FAB, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useExpenseStore } from '../store/expenseStore';
import { useCategoryStore } from '../store/categoryStore';
import { useUserStore } from '../store/userStore';
import { summaryApi } from '../api/summary';
import { ExpenseSummary } from '../types';
import { RootStackParamList } from '../navigation/types';
import { formatCurrency } from '../utils/currency';
import { getGreeting, getStartOfMonth, today } from '../utils/date';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';
import ExpenseItem from '../components/expense/ExpenseItem';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import CategoryChart from '../components/charts/CategoryChart';

type Nav = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { recentExpenses, fetchRecentExpenses, deleteExpense } = useExpenseStore();
  const { fetchCategories } = useCategoryStore();
  const { name, monthlyBudget, loadUserData } = useUserStore();

  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [todaySummary, setTodaySummary] = useState<ExpenseSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [monthSummary, daySum] = await Promise.all([
        summaryApi.getSummary({}).catch(() => null),
        summaryApi.getSummary({ start_date: today(), end_date: today() }).catch(() => null),
        fetchRecentExpenses(),
        fetchCategories(),
        loadUserData(),
      ]);
      if (monthSummary?.data) setSummary(monthSummary.data);
      if (daySum?.data) setTodaySummary(daySum.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const monthlySpent = summary ? Number(summary.total_expenses) : 0;
  const budgetProgress = monthlyBudget > 0 ? Math.min(monthlySpent / monthlyBudget, 1) : 0;
  const budgetRemaining = Math.max(monthlyBudget - monthlySpent, 0);
  const todaySpent = todaySummary ? Number(todaySummary.total_expenses) : 0;

  const greeting = getGreeting();

  const progressColor =
    budgetProgress > 0.9 ? COLORS.danger : budgetProgress > 0.7 ? COLORS.warning : COLORS.success;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        contentContainerStyle={styles.scroll}
      >
        {/* Header Gradient */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.userName}>{name} 👋</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn}>
              <MaterialIcons name="notifications-none" size={24} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>

          {/* Today's spending card */}
          <View style={styles.todayCard}>
            <Text style={styles.todayLabel}>Today's Spending</Text>
            <Text style={styles.todayAmount}>{formatCurrency(todaySpent)}</Text>
            <View style={styles.todayMeta}>
              {todaySummary && todaySummary.total_income > 0 && (
                <View style={styles.todayBadge}>
                  <MaterialIcons name="arrow-upward" size={12} color={COLORS.success} />
                  <Text style={[styles.todayBadgeText, { color: COLORS.success }]}>
                    {formatCurrency(todaySummary.total_income)} income
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Budget Progress Card */}
          <Card style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.sectionTitle}>Monthly Budget</Text>
              <Text style={styles.budgetPercent}>{(budgetProgress * 100).toFixed(0)}% used</Text>
            </View>
            <ProgressBar
              progress={budgetProgress}
              color={progressColor}
              style={styles.progressBar}
            />
            <View style={styles.budgetFooter}>
              <View>
                <Text style={styles.budgetLabel}>Spent</Text>
                <Text style={[styles.budgetValue, { color: COLORS.danger }]}>
                  {formatCurrency(monthlySpent)}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.budgetLabel}>Budget</Text>
                <Text style={[styles.budgetValue, { color: COLORS.text }]}>
                  {formatCurrency(monthlyBudget)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.budgetLabel}>Remaining</Text>
                <Text style={[styles.budgetValue, { color: COLORS.success }]}>
                  {formatCurrency(budgetRemaining)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <Card style={[styles.statCard, { flex: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: COLORS.successLight }]}>
                <MaterialIcons name="arrow-downward" size={16} color={COLORS.success} />
              </View>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={[styles.statValue, { color: COLORS.success }]}>
                {formatCurrency(summary?.total_income || 0)}
              </Text>
            </Card>
            <View style={{ width: SPACING.sm }} />
            <Card style={[styles.statCard, { flex: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: COLORS.dangerLight }]}>
                <MaterialIcons name="arrow-upward" size={16} color={COLORS.danger} />
              </View>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={[styles.statValue, { color: COLORS.danger }]}>
                {formatCurrency(summary?.total_expenses || 0)}
              </Text>
            </Card>
          </View>

          {/* Category Breakdown */}
          {summary && summary.by_category && summary.by_category.length > 0 && (
            <Card style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Category Breakdown</Text>
              <View style={{ marginTop: SPACING.sm }}>
                <CategoryChart data={summary.by_category} />
              </View>
            </Card>
          )}

          {/* Recent Expenses */}
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Expenses' } as any)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentExpenses.length === 0 ? (
            <EmptyState
              icon="receipt-long"
              title="No expenses yet"
              subtitle="Start tracking your expenses!"
            />
          ) : (
            recentExpenses.map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                onPress={(e) => navigation.navigate('EditExpense', { expense: e })}
                onDelete={(e) => deleteExpense(e.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

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
  scroll: { paddingBottom: 100 },
  header: {
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: SPACING.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: { fontSize: FONT_SIZES.md, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: '#fff' },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  todayLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZES.md },
  todayAmount: { fontSize: 42, fontWeight: '800', color: '#fff', marginTop: 4 },
  todayMeta: { flexDirection: 'row', marginTop: 8, gap: SPACING.sm },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  todayBadgeText: { fontSize: FONT_SIZES.xs, fontWeight: '600' },
  content: { padding: SPACING.md },
  budgetCard: { marginBottom: SPACING.md },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text },
  budgetPercent: { fontSize: FONT_SIZES.sm, color: COLORS.muted, fontWeight: '600' },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  budgetLabel: { fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 2 },
  budgetValue: { fontSize: FONT_SIZES.md, fontWeight: '700' },
  statsRow: { flexDirection: 'row', marginBottom: SPACING.md },
  statCard: { padding: SPACING.md },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.muted, marginBottom: 2 },
  statValue: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  chartCard: { marginBottom: SPACING.md },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  seeAll: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 90,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
  },
});

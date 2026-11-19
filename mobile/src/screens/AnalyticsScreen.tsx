import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import dayjs from 'dayjs';

import { summaryApi } from '../api/summary';
import { ExpenseSummary, DailySummary } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatMonthYear, getDaysInMonth } from '../utils/date';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CategoryChart from '../components/charts/CategoryChart';
import SpendingChart from '../components/charts/SpendingChart';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (m = month, y = year) => {
    try {
      const [sumRes, dailyRes] = await Promise.all([
        summaryApi.getSummary({ month: m, year: y }).catch(() => null),
        summaryApi.getDaily({ month: m, year: y }).catch(() => null),
      ]);
      if (sumRes?.data) setSummary(sumRes.data);
      if (dailyRes?.data) setDailyData(dailyRes.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [month, year])
  );

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
      loadData(12, year - 1);
    } else {
      setMonth((m) => m - 1);
      loadData(month - 1, year);
    }
  };

  const nextMonth = () => {
    const now = dayjs();
    if (year > now.year() || (year === now.year() && month >= now.month() + 1)) return;
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
      loadData(1, year + 1);
    } else {
      setMonth((m) => m + 1);
      loadData(month + 1, year);
    }
  };

  const currentMonthStr = dayjs(`${year}-${month}-01`).format('MMMM YYYY');
  const isCurrentMonth = month === dayjs().month() + 1 && year === dayjs().year();

  const net = summary ? Number(summary.total_income) - Number(summary.total_expenses) : 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
            <MaterialIcons name="chevron-left" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.monthText}>{currentMonthStr}</Text>
          <TouchableOpacity
            onPress={nextMonth}
            style={[styles.monthBtn, isCurrentMonth && { opacity: 0.3 }]}
            disabled={isCurrentMonth}
          >
            <MaterialIcons name="chevron-right" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Summary Stats */}
            <View style={styles.statsRow}>
              <Card style={[styles.statCard, { flex: 1 }]}>
                <Text style={styles.statLabel}>Income</Text>
                <Text style={[styles.statAmount, { color: COLORS.success }]}>
                  {formatCurrency(summary?.total_income || 0)}
                </Text>
                <Text style={styles.statCount}>{summary?.income_count || 0} transactions</Text>
              </Card>
              <View style={{ width: SPACING.sm }} />
              <Card style={[styles.statCard, { flex: 1 }]}>
                <Text style={styles.statLabel}>Expenses</Text>
                <Text style={[styles.statAmount, { color: COLORS.danger }]}>
                  {formatCurrency(summary?.total_expenses || 0)}
                </Text>
                <Text style={styles.statCount}>{summary?.expense_count || 0} transactions</Text>
              </Card>
            </View>

            {/* Net Balance */}
            <Card style={styles.netCard}>
              <View style={styles.netRow}>
                <View style={[styles.netIcon, { backgroundColor: net >= 0 ? COLORS.successLight : COLORS.dangerLight }]}>
                  <MaterialIcons
                    name={net >= 0 ? 'trending-up' : 'trending-down'}
                    size={24}
                    color={net >= 0 ? COLORS.success : COLORS.danger}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={styles.netLabel}>Net Balance</Text>
                  <Text style={[styles.netAmount, { color: net >= 0 ? COLORS.success : COLORS.danger }]}>
                    {net >= 0 ? '+' : ''}{formatCurrency(net)}
                  </Text>
                </View>
                <Text style={styles.netNote}>{net >= 0 ? '🎉 Saving well!' : '⚠️ Over budget'}</Text>
              </View>
            </Card>

            {/* Daily Spending Chart */}
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>Daily Spending</Text>
              <Text style={styles.chartSubtitle}>{currentMonthStr}</Text>
              {dailyData.length > 0 ? (
                <View style={{ marginTop: SPACING.sm }}>
                  <SpendingChart data={dailyData} month={month} year={year} />
                </View>
              ) : (
                <View style={styles.noDataContainer}>
                  <MaterialIcons name="bar-chart" size={48} color={COLORS.border} />
                  <Text style={styles.noDataText}>No spending data for this month</Text>
                </View>
              )}
            </Card>

            {/* Category Breakdown */}
            {summary && summary.by_category && summary.by_category.length > 0 && (
              <Card style={styles.chartCard}>
                <Text style={styles.chartTitle}>By Category</Text>
                <Text style={styles.chartSubtitle}>Expense distribution</Text>
                <View style={{ marginTop: SPACING.sm }}>
                  <CategoryChart data={summary.by_category} />
                </View>
              </Card>
            )}

            {/* Income vs Expense comparison bar */}
            {summary && (
              <Card style={styles.compCard}>
                <Text style={styles.chartTitle}>Income vs Expenses</Text>
                <View style={styles.compRow}>
                  <View style={styles.compItem}>
                    <Text style={styles.compLabel}>Income</Text>
                    <View style={styles.compBarBg}>
                      <View
                        style={[
                          styles.compBarFill,
                          {
                            width: `${
                              summary.total_income + summary.total_expenses > 0
                                ? (summary.total_income / (summary.total_income + summary.total_expenses)) * 100
                                : 50
                            }%`,
                            backgroundColor: COLORS.success,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.compAmount, { color: COLORS.success }]}>
                      {formatCurrency(summary.total_income)}
                    </Text>
                  </View>
                  <View style={styles.compItem}>
                    <Text style={styles.compLabel}>Expenses</Text>
                    <View style={styles.compBarBg}>
                      <View
                        style={[
                          styles.compBarFill,
                          {
                            width: `${
                              summary.total_income + summary.total_expenses > 0
                                ? (summary.total_expenses / (summary.total_income + summary.total_expenses)) * 100
                                : 50
                            }%`,
                            backgroundColor: COLORS.danger,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.compAmount, { color: COLORS.danger }]}>
                      {formatCurrency(summary.total_expenses)}
                    </Text>
                  </View>
                </View>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 56,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text },
  scroll: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  monthBtn: { padding: SPACING.xs },
  monthText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text },
  statsRow: { flexDirection: 'row', marginBottom: SPACING.md },
  statCard: { padding: SPACING.md },
  statLabel: { fontSize: FONT_SIZES.sm, color: COLORS.muted, marginBottom: 4 },
  statAmount: { fontSize: FONT_SIZES.xl, fontWeight: '800' },
  statCount: { fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 },
  netCard: { marginBottom: SPACING.md, padding: SPACING.md },
  netRow: { flexDirection: 'row', alignItems: 'center' },
  netIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  netLabel: { fontSize: FONT_SIZES.sm, color: COLORS.muted, marginBottom: 2 },
  netAmount: { fontSize: FONT_SIZES.xl, fontWeight: '800' },
  netNote: { fontSize: FONT_SIZES.sm },
  chartCard: { marginBottom: SPACING.md, padding: SPACING.md },
  chartTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text },
  chartSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.muted, marginBottom: 4 },
  noDataContainer: { alignItems: 'center', paddingVertical: SPACING.xl },
  noDataText: { color: COLORS.muted, marginTop: SPACING.sm },
  compCard: { marginBottom: SPACING.md, padding: SPACING.md },
  compRow: { gap: SPACING.sm, marginTop: SPACING.sm },
  compItem: {},
  compLabel: { fontSize: FONT_SIZES.sm, color: COLORS.muted, marginBottom: 4 },
  compBarBg: { height: 10, borderRadius: 5, backgroundColor: COLORS.border, marginBottom: 4 },
  compBarFill: { height: 10, borderRadius: 5 },
  compAmount: { fontSize: FONT_SIZES.md, fontWeight: '700' },
});

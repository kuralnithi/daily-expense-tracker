import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { ShortTermBudget } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../utils/constants';

interface ShortTermBudgetCardProps {
  budget: ShortTermBudget;
  onPress?: () => void;
  onAddFunds?: () => void;
  onAddExpense?: () => void;
}

export default function ShortTermBudgetCard({
  budget,
  onPress,
  onAddFunds,
  onAddExpense,
}: ShortTermBudgetCardProps) {
  const totalAmount = Number(budget.total_amount) || 0;
  const spentAmount = Number(budget.total_spent) || 0;
  const remainingAmount = totalAmount - spentAmount;
  const rawRatio = totalAmount > 0 ? spentAmount / totalAmount : 0;
  const progressRatio = Math.min(Math.max(rawRatio, 0), 1);
  const percentage = Math.round(rawRatio * 100);

  // Status colors based on remaining balance
  const isOverspent = remainingAmount < 0;
  const isWarning = !isOverspent && remainingAmount <= totalAmount * 0.2;

  const statusColor = isOverspent
    ? COLORS.danger
    : isWarning
    ? '#f59e0b'
    : COLORS.success;

  const statusBg = isOverspent
    ? '#fef2f2'
    : isWarning
    ? '#fffbeb'
    : '#f0fdf4';

  const statusLabel = isOverspent
    ? `Exceeded by ${formatCurrency(Math.abs(remainingAmount))}`
    : `${formatCurrency(remainingAmount)} Remaining`;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconCircle, { backgroundColor: budget.color || COLORS.primary }]}>
            <MaterialIcons name="account-balance-wallet" size={20} color="#fff" />
          </View>
          <View style={styles.titleInfo}>
            <Text style={styles.budgetName} numberOfLines={1}>
              {budget.name}
            </Text>
            {budget.description ? (
              <Text style={styles.budgetDesc} numberOfLines={1}>
                {budget.description}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Status Pill */}
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {percentage}% used
          </Text>
        </View>
      </View>

      {/* Main Remaining Amount Banner */}
      <View style={[styles.remainingBanner, { backgroundColor: statusBg, borderColor: statusColor + '30' }]}>
        <View>
          <Text style={styles.remainingSubtitle}>REMAINING BALANCE</Text>
          <Text style={[styles.remainingMainText, { color: statusColor }]}>
            {formatCurrency(remainingAmount)}
          </Text>
        </View>
        <View style={styles.remainingPillBadge}>
          <Text style={[styles.remainingBadgeText, { color: statusColor }]}>
            {isOverspent ? 'Over Budget' : 'Available'}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={progressRatio}
          color={statusColor}
          style={styles.progressBar}
        />
      </View>

      {/* Stats Breakdown Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Added Budget</Text>
          <Text style={styles.statValueBudget}>{formatCurrency(totalAmount)}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Spent</Text>
          <Text style={styles.statValueSpent}>{formatCurrency(spentAmount)}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={styles.statValueCount}>{budget.expense_count || 0} items</Text>
        </View>
      </View>

      {/* Quick Action Footer */}
      {(onAddFunds || onAddExpense) && (
        <View style={styles.actionsRow}>
          {onAddFunds && (
            <TouchableOpacity
              style={styles.addFundsBtn}
              onPress={onAddFunds}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={16} color={COLORS.primary} />
              <Text style={styles.addFundsText}>Add Funds</Text>
            </TouchableOpacity>
          )}

          {onAddExpense && (
            <TouchableOpacity
              style={styles.addExpenseBtn}
              onPress={onAddExpense}
              activeOpacity={0.8}
            >
              <MaterialIcons name="receipt" size={16} color="#fff" />
              <Text style={styles.addExpenseText}>+ Expense</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.xs + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  titleInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  budgetDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  remainingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginVertical: SPACING.xs,
  },
  remainingSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.muted,
    marginBottom: 2,
  },
  remainingMainText: {
    fontSize: 22,
    fontWeight: '800',
  },
  remainingPillBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#fff',
  },
  remainingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressContainer: {
    marginVertical: SPACING.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 2,
  },
  statValueBudget: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  statValueSpent: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.danger,
  },
  statValueCount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  addFundsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#f5f3ff',
  },
  addFundsText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 3,
  },
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  addExpenseText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 3,
  },
});

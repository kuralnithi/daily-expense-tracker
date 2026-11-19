import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useShortTermBudgetStore } from '../store/shortTermBudgetStore';
import { ShortTermBudget, Expense } from '../types';
import { RootStackParamList } from '../navigation/types';
import { formatCurrency } from '../utils/currency';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';
import ShortTermBudgetCard from '../components/budget/ShortTermBudgetCard';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ExpenseItem from '../components/expense/ExpenseItem';

type Nav = StackNavigationProp<RootStackParamList>;

export default function ShortTermBudgetsScreen() {
  const navigation = useNavigation<Nav>();
  const {
    budgets,
    loading,
    fetchBudgets,
    fetchBudgetById,
    createBudget,
    addFunds,
    deleteBudget,
  } = useShortTermBudgetStore();

  const [refreshing, setRefreshing] = useState(false);

  // Create Modal state
  const [createVisible, setCreateVisible] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [submitting, setSubmitting] = useState(false);

  // Add Funds Modal state
  const [fundsVisible, setFundsVisible] = useState(false);
  const [fundsAmount, setFundsAmount] = useState('');
  const [targetBudget, setTargetBudget] = useState<ShortTermBudget | null>(null);

  // Detail Modal state
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailedBudget, setDetailedBudget] = useState<ShortTermBudget | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const colors = ['#6366f1', '#ec4899', '#f97316', '#10b981', '#3b82f6', '#8b5cf6'];

  const loadData = async () => {
    await fetchBudgets();
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBudgets();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a budget name');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Required', 'Please enter a valid budget amount');
      return;
    }

    setSubmitting(true);
    const success = await createBudget({
      name: name.trim(),
      total_amount: numAmount,
      description: description.trim() || undefined,
      color: selectedColor,
    });
    setSubmitting(false);

    if (success) {
      setCreateVisible(false);
      setName('');
      setAmount('');
      setDescription('');
    } else {
      Alert.alert('Error', 'Failed to create budget');
    }
  };

  const handleAddFunds = async () => {
    if (!targetBudget) return;
    const num = parseFloat(fundsAmount);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Required', 'Please enter a valid amount to add');
      return;
    }

    setSubmitting(true);
    const success = await addFunds(targetBudget.id, num);
    setSubmitting(false);

    if (success) {
      setFundsVisible(false);
      setFundsAmount('');
      setTargetBudget(null);
    } else {
      Alert.alert('Error', 'Failed to add funds');
    }
  };

  const openDetails = async (budget: ShortTermBudget) => {
    setDetailVisible(true);
    setLoadingDetail(true);
    const full = await fetchBudgetById(budget.id);
    setDetailedBudget(full || budget);
    setLoadingDetail(false);
  };

  const handleDeleteBudget = (id: string, budgetName: string) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete "${budgetName}"? Expenses tagged to it will remain preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteBudget(id);
            setDetailVisible(false);
          },
        },
      ]
    );
  };

  // Aggregated totals
  const totalAllocated = budgets.reduce((acc, b) => acc + (Number(b.total_amount) || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (Number(b.total_spent) || 0), 0);
  const totalRemaining = totalAllocated - totalSpent;

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Short-Term Budgets</Text>
        <Text style={styles.screenSubtitle}>
          Track trips, events, shopping & see remaining balance
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overall Summary Card */}
        {budgets.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryHeaderLabel}>TOTAL ACROSS ALL SHORT-TERM BUDGETS</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryValLabel}>Allocated</Text>
                <Text style={styles.summaryValBudget}>{formatCurrency(totalAllocated)}</Text>
              </View>
              <View style={styles.summaryColDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryValLabel}>Total Spent</Text>
                <Text style={styles.summaryValSpent}>{formatCurrency(totalSpent)}</Text>
              </View>
              <View style={styles.summaryColDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryValLabel}>Remaining</Text>
                <Text
                  style={[
                    styles.summaryValRemaining,
                    { color: totalRemaining < 0 ? COLORS.danger : COLORS.success },
                  ]}
                >
                  {formatCurrency(totalRemaining)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Budgets List */}
        {loading && !refreshing ? (
          <LoadingSpinner />
        ) : budgets.length === 0 ? (
          <EmptyState
            icon="account-balance-wallet"
            title="No Short-Term Budgets Yet"
            description="Create a short-term budget for a trip, event, or shopping to track expenses and live remaining balance!"
            actionLabel="+ Create Budget"
            onAction={() => setCreateVisible(true)}
          />
        ) : (
          budgets.map((b) => (
            <ShortTermBudgetCard
              key={b.id}
              budget={b}
              onPress={() => openDetails(b)}
              onAddFunds={() => {
                setTargetBudget(b);
                setFundsVisible(true);
              }}
              onAddExpense={() => {
                navigation.navigate('AddExpense', { prefilledBudgetId: b.id });
              }}
            />
          ))
        )}
      </ScrollView>

      {/* FAB to create new budget */}
      <FAB
        icon="plus"
        label="New Budget"
        style={styles.fab}
        color="#fff"
        onPress={() => setCreateVisible(true)}
      />

      {/* Modal: Create Short-Term Budget */}
      <Portal>
        <Modal
          visible={createVisible}
          onDismiss={() => setCreateVisible(false)}
          contentContainerStyle={styles.modalCard}
        >
          <Text style={styles.modalTitle}>Create Short-Term Budget</Text>
          <Text style={styles.modalSubtitle}>
            Allocate a fixed amount and track expenses under it
          </Text>

          <TextInput
            label="Budget Name (e.g. Goa Trip, Party, Shopping)"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
          />

          <TextInput
            label="Total Amount Added (₹)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
          />

          <TextInput
            label="Description / Note (optional)"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
          />

          {/* Color Selector */}
          <Text style={styles.colorLabel}>Theme Color</Text>
          <View style={styles.colorRow}>
            {colors.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorDotSelected,
                ]}
                onPress={() => setSelectedColor(c)}
              />
            ))}
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setCreateVisible(false)}
              textColor={COLORS.muted}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreate}
              loading={submitting}
              buttonColor={COLORS.primary}
            >
              Create Budget
            </Button>
          </View>
        </Modal>

        {/* Modal: Add Funds / Top-up */}
        <Modal
          visible={fundsVisible}
          onDismiss={() => setFundsVisible(false)}
          contentContainerStyle={styles.modalCard}
        >
          <Text style={styles.modalTitle}>Add Funds to Budget</Text>
          <Text style={styles.modalSubtitle}>
            Add more money to "{targetBudget?.name}"
          </Text>

          <TextInput
            label="Amount to Add (₹)"
            value={fundsAmount}
            onChangeText={setFundsAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
          />

          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setFundsVisible(false)}
              textColor={COLORS.muted}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddFunds}
              loading={submitting}
              buttonColor={COLORS.primary}
            >
              Add Amount
            </Button>
          </View>
        </Modal>

        {/* Modal: Budget Details & Linked Expenses */}
        <Modal
          visible={detailVisible}
          onDismiss={() => setDetailVisible(false)}
          contentContainerStyle={[styles.modalCard, styles.detailModal]}
        >
          {loadingDetail ? (
            <ActivityIndicator color={COLORS.primary} style={{ margin: 30 }} />
          ) : detailedBudget ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailTitle}>{detailedBudget.name}</Text>
                  {detailedBudget.description ? (
                    <Text style={styles.detailDesc}>{detailedBudget.description}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteBudget(detailedBudget.id, detailedBudget.name)}
                >
                  <MaterialIcons name="delete-outline" size={24} color={COLORS.danger} />
                </TouchableOpacity>
              </View>

              {/* Balance Box */}
              <View style={styles.detailBalanceBox}>
                <View style={styles.detailBalanceCol}>
                  <Text style={styles.detailBalLabel}>Allocated</Text>
                  <Text style={styles.detailBalVal}>
                    {formatCurrency(detailedBudget.total_amount)}
                  </Text>
                </View>
                <View style={styles.summaryColDivider} />
                <View style={styles.detailBalanceCol}>
                  <Text style={styles.detailBalLabel}>Spent</Text>
                  <Text style={[styles.detailBalVal, { color: COLORS.danger }]}>
                    {formatCurrency(detailedBudget.total_spent || 0)}
                  </Text>
                </View>
                <View style={styles.summaryColDivider} />
                <View style={styles.detailBalanceCol}>
                  <Text style={styles.detailBalLabel}>Remaining</Text>
                  <Text
                    style={[
                      styles.detailBalVal,
                      {
                        color:
                          (detailedBudget.remaining_amount || 0) < 0
                            ? COLORS.danger
                            : COLORS.success,
                      },
                    ]}
                  >
                    {formatCurrency(detailedBudget.remaining_amount || 0)}
                  </Text>
                </View>
              </View>

              {/* Expenses List */}
              <Text style={styles.expensesListTitle}>
                Expenses under this Budget ({detailedBudget.expenses?.length || 0})
              </Text>

              {detailedBudget.expenses && detailedBudget.expenses.length > 0 ? (
                detailedBudget.expenses.map((exp) => (
                  <ExpenseItem key={exp.id} expense={exp} />
                ))
              ) : (
                <Text style={styles.noExpensesText}>
                  No expenses added under this budget yet. Tap "+ Add Expense" below!
                </Text>
              )}

              <View style={styles.detailActionsRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setDetailVisible(false);
                    setTargetBudget(detailedBudget);
                    setFundsVisible(true);
                  }}
                  textColor={COLORS.primary}
                  style={{ flex: 1, marginRight: SPACING.xs }}
                >
                  + Add Funds
                </Button>
                <Button
                  mode="contained"
                  buttonColor={COLORS.primary}
                  onPress={() => {
                    setDetailVisible(false);
                    navigation.navigate('AddExpense', { prefilledBudgetId: detailedBudget.id });
                  }}
                  style={{ flex: 1 }}
                >
                  + Add Expense
                </Button>
              </View>
            </ScrollView>
          ) : null}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg + 10,
    paddingBottom: SPACING.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  screenTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  screenSubtitle: {
    fontSize: FONT_SIZES.xs + 1,
    color: COLORS.muted,
    marginTop: 2,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 90,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.muted,
    marginBottom: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryColDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  summaryValLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 2,
  },
  summaryValBudget: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  summaryValSpent: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.danger,
  },
  summaryValRemaining: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md + 10,
    backgroundColor: COLORS.primary,
  },
  modalCard: {
    backgroundColor: '#fff',
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    maxHeight: '85%',
  },
  detailModal: {
    maxHeight: '88%',
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  input: {
    marginBottom: SPACING.sm,
    backgroundColor: '#fff',
  },
  colorLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  colorRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  detailDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    marginTop: 2,
  },
  detailBalanceBox: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  detailBalanceCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailBalLabel: {
    fontSize: 10,
    color: COLORS.muted,
  },
  detailBalVal: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  expensesListTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  noExpensesText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    textAlign: 'center',
    marginVertical: SPACING.lg,
  },
  detailActionsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
});

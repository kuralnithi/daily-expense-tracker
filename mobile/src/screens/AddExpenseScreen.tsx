import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Button, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import dayjs from 'dayjs';

import { useExpenseStore } from '../store/expenseStore';
import { useCategoryStore } from '../store/categoryStore';
import { useShortTermBudgetStore } from '../store/shortTermBudgetStore';
import { Category } from '../types';
import { RootStackParamList } from '../navigation/types';
import { formatDateForInput, today } from '../utils/date';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';
import CategoryIcon from '../components/expense/CategoryIcon';
import LoadingSpinner from '../components/common/LoadingSpinner';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'AddExpense'> | RouteProp<RootStackParamList, 'EditExpense'>;

export default function AddExpenseScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const editingExpense = (route.params as any)?.expense ?? null;
  const prefilledBudgetId = (route.params as any)?.prefilledBudgetId ?? null;

  const { createExpense, updateExpense } = useExpenseStore();
  const { categories, expenseCategories, incomeCategories, fetchCategories, loading: catLoading } = useCategoryStore();
  const { budgets, fetchBudgets } = useShortTermBudgetStore();

  const [type, setType] = useState<'expense' | 'income'>(editingExpense?.type || 'expense');
  const [amount, setAmount] = useState(editingExpense ? String(editingExpense.amount) : '');
  const [description, setDescription] = useState(editingExpense?.description || '');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    editingExpense?.category || null
  );
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(
    editingExpense?.short_term_budget_id || prefilledBudgetId || null
  );
  const [date, setDate] = useState(editingExpense?.date || today());
  const [saving, setSaving] = useState(false);

  const displayCategories = type === 'expense' ? expenseCategories : incomeCategories;

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
    fetchBudgets();
  }, []);

  useEffect(() => {
    // Reset category when type changes
    if (selectedCategory && selectedCategory.type !== type) {
      setSelectedCategory(null);
    }
  }, [type]);

  const handleAmountPress = (key: string) => {
    if (key === 'back') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) setAmount((prev) => prev + '.');
    } else {
      if (amount.length >= 10) return;
      setAmount((prev) => (prev === '0' ? key : prev + key));
    }
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        amount: numAmount,
        description: description.trim() || undefined,
        category_id: selectedCategory?.id,
        short_term_budget_id: selectedBudgetId || undefined,
        date,
        type,
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
      } else {
        await createExpense(payload);
      }
      fetchBudgets(); // Refresh budgets calculations
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const numpadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'back'],
  ];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingExpense ? 'Edit Expense' : 'Add Expense'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Type Toggle */}
      <View style={styles.typeToggle}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
          onPress={() => setType('expense')}
        >
          <MaterialIcons name="arrow-upward" size={16} color={type === 'expense' ? '#fff' : COLORS.muted} />
          <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'income' && styles.typeBtnIncomeActive]}
          onPress={() => setType('income')}
        >
          <MaterialIcons name="arrow-downward" size={16} color={type === 'income' ? '#fff' : COLORS.muted} />
          <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Income</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Amount Display */}
        <View style={styles.amountDisplay}>
          <Text style={styles.currencySymbol}>₹</Text>
          <Text style={styles.amountText}>{amount || '0'}</Text>
        </View>

        {/* Numpad */}
        <View style={styles.numpad}>
          {numpadKeys.map((row, ri) => (
            <View key={ri} style={styles.numpadRow}>
              {row.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.numpadKey}
                  onPress={() => handleAmountPress(key)}
                  activeOpacity={0.7}
                >
                  {key === 'back' ? (
                    <MaterialIcons name="backspace" size={22} color={COLORS.text} />
                  ) : (
                    <Text style={styles.numpadKeyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <Divider style={styles.divider} />

        {/* Description */}
        <View style={styles.fieldRow}>
          <MaterialIcons name="notes" size={20} color={COLORS.muted} />
          <TextInput
            style={styles.input}
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={COLORS.muted}
          />
        </View>

        <Divider />

        {/* Date */}
        <View style={styles.fieldRow}>
          <MaterialIcons name="calendar-today" size={20} color={COLORS.muted} />
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.muted}
          />
        </View>

        <Divider style={styles.divider} />

        {/* Category Selector */}
        <Text style={styles.catLabel}>Category</Text>
        {catLoading ? (
          <LoadingSpinner size="small" />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            {displayCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catItem,
                  selectedCategory?.id === cat.id && {
                    borderColor: cat.color,
                    backgroundColor: cat.color + '15',
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <CategoryIcon category={cat} size={20} showLabel={true} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Short-Term Budget Selector (Only for expenses) */}
        {type === 'expense' && budgets.length > 0 && (
          <View style={{ marginTop: SPACING.md }}>
            <Text style={styles.catLabel}>Link to Short-Term Budget (Optional)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.budgetChipScroll}
            >
              <TouchableOpacity
                style={[
                  styles.budgetChip,
                  selectedBudgetId === null && styles.budgetChipActive,
                ]}
                onPress={() => setSelectedBudgetId(null)}
              >
                <Text
                  style={[
                    styles.budgetChipText,
                    selectedBudgetId === null && styles.budgetChipTextActive,
                  ]}
                >
                  None (General)
                </Text>
              </TouchableOpacity>

              {budgets.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.budgetChip,
                    selectedBudgetId === b.id && {
                      backgroundColor: b.color || COLORS.primary,
                      borderColor: b.color || COLORS.primary,
                    },
                  ]}
                  onPress={() => setSelectedBudgetId(b.id)}
                >
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={14}
                    color={selectedBudgetId === b.id ? '#fff' : COLORS.text}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.budgetChipText,
                      selectedBudgetId === b.id && styles.budgetChipTextActive,
                    ]}
                  >
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving || !amount}
          style={styles.saveBtn}
          contentStyle={styles.saveBtnContent}
          labelStyle={styles.saveBtnLabel}
          buttonColor={type === 'income' ? COLORS.success : COLORS.primary}
        >
          {editingExpense ? 'Update' : 'Save'} {type === 'income' ? 'Income' : 'Expense'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.card },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text },
  typeToggle: {
    flexDirection: 'row',
    margin: SPACING.md,
    backgroundColor: '#f1f5f9',
    borderRadius: BORDER_RADIUS.full,
    padding: 4,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
  },
  typeBtnActive: { backgroundColor: COLORS.danger },
  typeBtnIncomeActive: { backgroundColor: COLORS.success },
  typeBtnText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.muted },
  typeBtnTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  currencySymbol: { fontSize: 32, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  amountText: { fontSize: 56, fontWeight: '800', color: COLORS.text, marginLeft: 4 },
  numpad: { paddingHorizontal: SPACING.xl },
  numpadRow: { flexDirection: 'row', marginBottom: SPACING.xs },
  numpadKey: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: 4,
  },
  numpadKeyText: { fontSize: FONT_SIZES.xxl, fontWeight: '500', color: COLORS.text },
  divider: { marginVertical: SPACING.sm },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  catLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  catScroll: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  catItem: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    minWidth: 68,
  },
  budgetChipScroll: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs + 2,
  },
  budgetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
  },
  budgetChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  budgetChipText: {
    fontSize: FONT_SIZES.xs + 1,
    color: COLORS.text,
    fontWeight: '600',
  },
  budgetChipTextActive: {
    color: '#fff',
  },
  footer: {
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  saveBtn: { borderRadius: BORDER_RADIUS.full },
  saveBtnContent: { paddingVertical: SPACING.xs },
  saveBtnLabel: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
});

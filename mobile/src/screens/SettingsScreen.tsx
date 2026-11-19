import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { List, Divider, Switch } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

import { useUserStore } from '../store/userStore';
import { formatCurrency } from '../utils/currency';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/constants';
import Card from '../components/common/Card';

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const { name, currency, monthlyBudget, setName, setCurrency, setMonthlyBudget } = useUserStore();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget));
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('Invalid Name', 'Name cannot be empty');
      return;
    }
    await setName(trimmed);
    setEditingName(false);
    Alert.alert('Saved', 'Name updated successfully');
  };

  const saveBudget = async () => {
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Budget', 'Enter a valid monthly budget amount');
      return;
    }
    await setMonthlyBudget(amount);
    setEditingBudget(false);
    Alert.alert('Saved', 'Budget updated successfully');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileCurrency}>{currency} • Monthly Budget: {formatCurrency(monthlyBudget)}</Text>
        </Card>

        {/* Profile Section */}
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <Card style={styles.card}>
          {/* Name */}
          {editingName ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                placeholder="Your name"
                placeholderTextColor={COLORS.muted}
              />
              <TouchableOpacity onPress={saveName} style={styles.saveAction}>
                <Text style={styles.saveActionText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingName(false); setNameInput(name); }} style={styles.cancelAction}>
                <Text style={styles.cancelActionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.listItem} onPress={() => setEditingName(true)}>
              <MaterialIcons name="person-outline" size={22} color={COLORS.primary} />
              <View style={styles.listItemContent}>
                <Text style={styles.listItemLabel}>Your Name</Text>
                <Text style={styles.listItemValue}>{name}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          )}

          <Divider />

          {/* Currency */}
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => Alert.alert('Currency', 'Currently only INR (₹) is supported')}
          >
            <MaterialIcons name="currency-rupee" size={22} color={COLORS.primary} />
            <View style={styles.listItemContent}>
              <Text style={styles.listItemLabel}>Currency</Text>
              <Text style={styles.listItemValue}>{currency} (₹)</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </Card>

        {/* Budget Section */}
        <Text style={styles.sectionLabel}>BUDGET</Text>
        <Card style={styles.card}>
          {editingBudget ? (
            <View style={styles.editRow}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={[styles.editInput, { flex: 1 }]}
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="numeric"
                autoFocus
                placeholder="50000"
                placeholderTextColor={COLORS.muted}
              />
              <TouchableOpacity onPress={saveBudget} style={styles.saveAction}>
                <Text style={styles.saveActionText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingBudget(false); setBudgetInput(String(monthlyBudget)); }} style={styles.cancelAction}>
                <Text style={styles.cancelActionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.listItem} onPress={() => setEditingBudget(true)}>
              <MaterialIcons name="account-balance-wallet" size={22} color={COLORS.primary} />
              <View style={styles.listItemContent}>
                <Text style={styles.listItemLabel}>Monthly Budget</Text>
                <Text style={styles.listItemValue}>{formatCurrency(monthlyBudget)}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </Card>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <Card style={styles.card}>
          <View style={styles.listItem}>
            <MaterialIcons name="notifications-none" size={22} color={COLORS.primary} />
            <View style={styles.listItemContent}>
              <Text style={styles.listItemLabel}>Daily Reminders</Text>
              <Text style={styles.listItemSubLabel}>Get reminded to log expenses</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              color={COLORS.primary}
            />
          </View>
        </Card>

        {/* About */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <Card style={styles.card}>
          <View style={styles.listItem}>
            <MaterialIcons name="info-outline" size={22} color={COLORS.primary} />
            <View style={styles.listItemContent}>
              <Text style={styles.listItemLabel}>Version</Text>
              <Text style={styles.listItemValue}>{APP_VERSION}</Text>
            </View>
          </View>
          <Divider />
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => Alert.alert('Daily Expense Tracker', 'Built with ❤️ using React Native + Expo')}
          >
            <MaterialIcons name="favorite-outline" size={22} color={COLORS.primary} />
            <View style={styles.listItemContent}>
              <Text style={styles.listItemLabel}>About This App</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.muted} />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => Alert.alert('API', 'Connected to Railway backend')}
          >
            <MaterialIcons name="cloud" size={22} color={COLORS.primary} />
            <View style={styles.listItemContent}>
              <Text style={styles.listItemLabel}>Backend API</Text>
              <Text style={styles.listItemSubLabel}>Railway Cloud</Text>
            </View>
            <View style={styles.onlineDot} />
          </TouchableOpacity>
        </Card>

        <View style={{ height: 40 }} />
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
  scroll: { paddingHorizontal: SPACING.md, paddingBottom: 40 },
  profileCard: {
    alignItems: 'center',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text },
  profileCurrency: { fontSize: FONT_SIZES.sm, color: COLORS.muted, marginTop: 4 },
  sectionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  card: { marginBottom: SPACING.md, padding: 0, overflow: 'hidden' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  listItemContent: { flex: 1 },
  listItemLabel: { fontSize: FONT_SIZES.md, color: COLORS.text, fontWeight: '500' },
  listItemValue: { fontSize: FONT_SIZES.sm, color: COLORS.muted, marginTop: 2 },
  listItemSubLabel: { fontSize: FONT_SIZES.xs, color: COLORS.muted, marginTop: 2 },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  editInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingVertical: 4,
  },
  saveAction: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
  },
  saveActionText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#fff' },
  cancelAction: { paddingHorizontal: SPACING.xs },
  cancelActionText: { fontSize: FONT_SIZES.sm, color: COLORS.muted },
  currencyPrefix: { fontSize: FONT_SIZES.lg, color: COLORS.text, fontWeight: '700' },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
});

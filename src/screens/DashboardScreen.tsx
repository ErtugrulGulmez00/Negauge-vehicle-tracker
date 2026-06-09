import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { COLORS } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Expense } from '../types';
import * as Haptics from 'expo-haptics';
import { t, getCurrencySymbol } from '../localization/i18n';

interface DashboardScreenProps {
  onAddExpensePress: () => void;
  onNavigateToVehicles: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onAddExpensePress,
  onNavigateToVehicles,
}) => {
  const { selectedVehicle, expenses, deleteExpense, updateVehicle } = useVehicles();
  const [quickOdo, setQuickOdo] = useState('');
  const [showOdoEdit, setShowOdoEdit] = useState(false);

  // Filter expenses for selected vehicle
  const vehicleExpenses = useMemo(() => {
    if (!selectedVehicle) return [];
    return expenses.filter(e => e.vehicleId === selectedVehicle.id);
  }, [expenses, selectedVehicle]);

  // Calculations
  const stats = useMemo(() => {
    if (!selectedVehicle || vehicleExpenses.length === 0) {
      return { total: 0, monthly: 0, costPerKm: 0, distance: 0 };
    }

    const total = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Monthly Calculation
    const currentMonthStr = new Date().toISOString().substring(0, 7); // "YYYY-MM"
    const monthly = vehicleExpenses
      .filter(e => e.date.substring(0, 7) === currentMonthStr)
      .reduce((sum, e) => sum + e.amount, 0);

    // Cost Per KM
    const distance = selectedVehicle.currentOdometer - selectedVehicle.initialOdometer;
    const costPerKm = distance > 0 ? total / distance : 0;

    return { total, monthly, costPerKm, distance };
  }, [selectedVehicle, vehicleExpenses]);

  const handleUpdateOdometer = async () => {
    if (!selectedVehicle) return;
    const nextOdo = Number(quickOdo);
    
    if (isNaN(nextOdo) || nextOdo < selectedVehicle.currentOdometer) {
      Alert.alert(t('db_invalid_odo_title'), t('exp_error_odometer_less', { minOdometer: selectedVehicle.currentOdometer }));
      return;
    }

    await updateVehicle({
      ...selectedVehicle,
      currentOdometer: nextOdo,
    });

    setQuickOdo('');
    setShowOdoEdit(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleDeleteExpense = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(
      t('db_delete_expense_title'),
      t('db_delete_expense_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteExpense(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ]
    );
  };

  const getCategoryDetails = (category: string) => {
    switch (category) {
      case 'fuel':
        return { label: t('cat_fuel'), icon: 'speedometer-outline', color: COLORS.primary };
      case 'maintenance':
        return { label: t('cat_maintenance'), icon: 'construct-outline', color: COLORS.info };
      case 'insurance':
        return { label: t('cat_insurance'), icon: 'shield-checkmark-outline', color: '#8B5CF6' };
      case 'tax':
        return { label: t('cat_tax'), icon: 'receipt-outline', color: '#EC4899' };
      case 'wash':
        return { label: t('cat_wash'), icon: 'water-outline', color: '#10B981' };
      default:
        return { label: t('cat_other'), icon: 'ellipsis-horizontal-outline', color: COLORS.textSecondary };
    }
  };

  if (!selectedVehicle) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="car-outline" size={72} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>{t('v_empty_vehicles')}</Text>
        <Text style={styles.emptyDesc}>
          {t('v_add_first_vehicle')}
        </Text>
        <Button
          title={t('v_add_vehicle')}
          onPress={onNavigateToVehicles}
          style={styles.emptyBtn}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Bar / Active Vehicle Summary */}
      <Card style={styles.vehicleHeaderCard} onPress={onNavigateToVehicles}>
        <View style={styles.vehicleRow}>
          <View style={[styles.avatar, { backgroundColor: selectedVehicle.color + '20' }]}>
            <Ionicons name={selectedVehicle.icon as any} size={26} color={selectedVehicle.color} />
          </View>
          <View style={styles.vehicleTextContainer}>
            <Text style={styles.vehicleName}>{selectedVehicle.name}</Text>
            <Text style={styles.vehiclePlate}>{selectedVehicle.plate || '-'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </View>
      </Card>

      {/* Grid Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statsColumn}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>{t('db_total_spend')}</Text>
            <Text style={styles.statValue}>
              {getCurrencySymbol()}{stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.statSubText}>{t('db_all_time')}</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>{t('db_cost_per_km')}</Text>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>
              {getCurrencySymbol()}{stats.costPerKm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.statSubText}>
              {stats.distance > 0 ? t('db_based_on_distance', { distance: stats.distance.toLocaleString() }) : t('db_no_distance')}
            </Text>
          </Card>
        </View>
        
        <View style={styles.statsColumn}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>{t('db_monthly_spend')}</Text>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {getCurrencySymbol()}{stats.monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.statSubText}>{t('db_current_month')}</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.odoHeader}>
              <Text style={styles.statLabel}>{t('db_odometer_title')}</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setShowOdoEdit(!showOdoEdit);
                }}
              >
                <Ionicons name="create-outline" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            {showOdoEdit ? (
              <View style={styles.odoEditRow}>
                <Input
                  placeholder={String(selectedVehicle.currentOdometer)}
                  value={quickOdo}
                  onChangeText={setQuickOdo}
                  keyboardType="numeric"
                  style={{ marginBottom: 0, flex: 1, height: 40 }}
                  inputStyle={{ fontSize: 14 }}
                />
                <TouchableOpacity style={styles.odoSaveBtn} onPress={handleUpdateOdometer}>
                  <Ionicons name="checkmark" size={18} color="#000" />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.statValue}>{selectedVehicle.currentOdometer.toLocaleString()}</Text>
            )}
            <Text style={styles.statSubText}>{t('db_current_odometer')}</Text>
          </Card>
        </View>
      </View>

      {/* Quick Action Button */}
      <Button
        title={t('db_add_expense_btn')}
        onPress={onAddExpensePress}
        style={styles.addBtn}
      />

      {/* Recent Activity List */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle}>{t('db_recent_expenses')}</Text>
        {vehicleExpenses.length > 0 && (
          <Text style={styles.countText}>{t('db_count_records', { count: vehicleExpenses.length })}</Text>
        )}
      </View>

      {vehicleExpenses.length === 0 ? (
        <Card style={styles.noExpensesCard}>
          <Ionicons name="receipt-outline" size={40} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
          <Text style={styles.noExpensesText}>{t('db_no_expenses')}</Text>
          <Text style={styles.noExpensesSubText}>
            {t('db_no_expenses_sub')}
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {vehicleExpenses.slice(0, 10).map(item => {
            const cat = getCategoryDetails(item.category);
            return (
              <Card key={item.id} style={styles.expenseItem}>
                <View style={styles.expenseLeft}>
                  <View style={[styles.categoryIcon, { backgroundColor: cat.color + '15' }]}>
                    <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                  </View>
                  <View style={styles.expenseDetails}>
                    <Text style={styles.expenseLabelText}>{cat.label}</Text>
                    {item.notes ? (
                      <Text style={styles.expenseNotes} numberOfLines={1}>
                        {item.notes}
                      </Text>
                    ) : null}
                    <Text style={styles.expenseMeta}>
                      {item.date} • {item.odometer.toLocaleString()} KM
                    </Text>
                  </View>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>
                    {getCurrencySymbol()}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteExpense(item.id)}
                    style={styles.trashBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  vehicleHeaderCard: {
    marginBottom: 20,
    padding: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleTextContainer: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  vehiclePlate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsColumn: {
    width: '48%',
  },
  statCard: {
    marginBottom: 16,
    padding: 14,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statSubText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  odoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  odoEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    height: 38,
  },
  odoSaveBtn: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  addBtn: {
    marginBottom: 24,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  countText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  noExpensesCard: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noExpensesText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  noExpensesSubText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  list: {
    marginTop: 4,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 12,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  expenseNotes: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  expenseMeta: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  expenseRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  trashBtn: {
    padding: 4,
    marginTop: 4,
  },
  // Empty states
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyBtn: {
    width: '80%',
  },
});

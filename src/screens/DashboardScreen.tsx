import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { COLORS, DARK_COLORS, LIGHT_COLORS } from '../theme/colors';
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
  const { selectedVehicle, expenses, deleteExpense, updateVehicle, theme } = useVehicles();
  const [quickOdo, setQuickOdo] = useState('');
  const [showOdoEdit, setShowOdoEdit] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const styles = getStyles(theme);
  const currentColors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

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
        return { label: t('cat_fuel'), icon: 'speedometer-outline', color: currentColors.primary };
      case 'maintenance':
        return { label: t('cat_maintenance'), icon: 'construct-outline', color: currentColors.info };
      case 'insurance':
        return { label: t('cat_insurance'), icon: 'shield-checkmark-outline', color: '#8B5CF6' };
      case 'tax':
        return { label: t('cat_tax'), icon: 'receipt-outline', color: '#EC4899' };
      case 'wash':
        return { label: t('cat_wash'), icon: 'water-outline', color: '#10B981' };
      default:
        return { label: t('cat_other'), icon: 'ellipsis-horizontal-outline', color: currentColors.textSecondary };
    }
  };

  if (!selectedVehicle) {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={72} color={currentColors.textMuted} />
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
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Modern Greeting & Active Vehicle Pill */}
        <View style={styles.headerWelcomeRow}>
          <View>
            <Text style={styles.welcomeSubtitle}>Negauge</Text>
            <Text style={styles.welcomeTitle}>{t('tab_dashboard')}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNavigateToVehicles}
            style={[
              styles.miniVehiclePill,
              {
                borderColor: selectedVehicle.color + '40',
                backgroundColor: selectedVehicle.color + '15',
              }
            ]}
          >
            <View style={[styles.miniIconWrapper, { backgroundColor: selectedVehicle.color }]}>
              <Ionicons name={selectedVehicle.icon as any} size={11} color="#0F172A" />
            </View>
            <Text style={[styles.miniVehicleText, { color: selectedVehicle.color }]}>{selectedVehicle.name}</Text>
            <Ionicons name="chevron-forward" size={12} color={selectedVehicle.color} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>

        {/* Hero Card: Total Spend */}
        <Card
          style={[
            styles.heroCard,
            {
              borderColor: selectedVehicle.color + '30',
              borderWidth: 1,
              shadowColor: selectedVehicle.color,
            }
          ]}
          onPress={onNavigateToVehicles}
        >
          <View style={[styles.heroGradientLine, { backgroundColor: selectedVehicle.color }]} />
          <View style={styles.heroContent}>
            <View style={styles.heroHeader}>
              <Text style={styles.heroLabel}>{t('db_total_spend')}</Text>
              <View style={[styles.heroIconContainer, { backgroundColor: selectedVehicle.color + '15' }]}>
                <Ionicons name="wallet" size={20} color={selectedVehicle.color} />
              </View>
            </View>
            <Text style={styles.heroValue}>
              {getCurrencySymbol()}{stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <View style={styles.heroFooter}>
              <Ionicons name="time-outline" size={13} color={currentColors.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.heroSubText}>{t('db_all_time')}</Text>
            </View>
          </View>
        </Card>

        {/* Grid Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statsColumn}>
            <Card style={[styles.statCard, { borderLeftColor: currentColors.primary, borderLeftWidth: 3 }]}>
              <Text style={styles.statLabel}>{t('db_cost_per_km')}</Text>
              <Text style={styles.statValue}>
                {getCurrencySymbol()}{stats.costPerKm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.statSubText}>{t('db_cost_unit')}</Text>
            </Card>
          </View>
          
          <View style={styles.statsColumn}>
            <Card style={[styles.statCard, { borderLeftColor: currentColors.success, borderLeftWidth: 3 }]}>
              <Text style={styles.statLabel}>{t('db_monthly_spend')}</Text>
              <Text style={styles.statValue}>
                {getCurrencySymbol()}{stats.monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.statSubText}>{t('db_current_month')}</Text>
            </Card>
          </View>
        </View>

        {/* Full Width Odometer Card */}
        <Card style={[styles.odoCard, { borderColor: currentColors.info + '30', borderWidth: 1, marginBottom: 20 }]}>
          <View style={styles.odoCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.odoIconContainer, { backgroundColor: currentColors.info + '15' }]}>
                <Ionicons name="speedometer" size={18} color={currentColors.info} />
              </View>
              <Text style={styles.odoCardTitle}>{t('db_odometer_title')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowOdoEdit(!showOdoEdit);
              }}
              style={[styles.odoEditBadge, { backgroundColor: currentColors.primary + '15' }]}
            >
              <Ionicons name={showOdoEdit ? "close-circle" : "create-outline"} size={13} color={currentColors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.odoEditText, { color: currentColors.primary }]}>{showOdoEdit ? t('cancel') : t('edit')}</Text>
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
              <TouchableOpacity style={[styles.odoSaveBtn, { backgroundColor: currentColors.primary }]} onPress={handleUpdateOdometer}>
                <Ionicons name="checkmark" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.odoValue}>{selectedVehicle.currentOdometer.toLocaleString()} KM</Text>
          )}
          <Text style={styles.odoSubText}>
            <Ionicons name="trending-up-outline" size={11} color={currentColors.textMuted} /> {t('db_based_on_distance', { distance: stats.distance.toLocaleString() })}
          </Text>
        </Card>

        {/* Quick Action Button */}
        <Button
          title={t('db_add_expense_btn')}
          onPress={onAddExpensePress}
          style={styles.addBtn}
        />

        {/* Recent Activity List */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionTitle}>{t('db_recent_expenses')}</Text>
          <Text style={styles.countText}>{t('db_count_records', { count: vehicleExpenses.length })}</Text>
        </View>

        {vehicleExpenses.length === 0 ? (
          <Card style={styles.noExpensesCard}>
            <Ionicons name="receipt-outline" size={36} color={currentColors.textMuted} style={{ marginBottom: 8 }} />
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
                      <Ionicons name={cat.icon as any} size={18} color={cat.color} />
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
                      <Ionicons name="trash-outline" size={16} color={currentColors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

let memoizedStyles: any = null;
let memoizedTheme: string = '';

const getStyles = (theme: 'dark' | 'light') => {
  if (memoizedTheme === theme && memoizedStyles) return memoizedStyles;
  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  memoizedTheme = theme;
  memoizedStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 40,
    },
    headerWelcomeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 8,
    },
    welcomeSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    welcomeTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 2,
    },
    miniVehiclePill: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 20,
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    miniIconWrapper: {
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    miniVehicleText: {
      fontSize: 12,
      fontWeight: '700',
    },
    heroCard: {
      marginBottom: 20,
      padding: 0,
      overflow: 'hidden',
      position: 'relative',
      borderRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 3,
    },
    heroGradientLine: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
    heroContent: {
      padding: 20,
    },
    heroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    heroLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    heroIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroValue: {
      fontSize: 32,
      fontWeight: '900',
      color: colors.textPrimary,
      marginBottom: 10,
      letterSpacing: -0.5,
    },
    heroFooter: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    heroSubText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statsColumn: {
      width: '48%',
    },
    statCard: {
      marginBottom: 0,
      padding: 16,
      borderRadius: 14,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statValue: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    statSubText: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '600',
    },
    odoCard: {
      padding: 16,
      borderRadius: 16,
    },
    odoCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    odoIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    odoCardTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    odoEditBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    odoEditText: {
      fontSize: 11,
      fontWeight: '700',
    },
    odoValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    odoSubText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
    },
    odoEditRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
      height: 40,
    },
    odoSaveBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
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
      color: colors.textPrimary,
    },
    countText: {
      fontSize: 12,
      color: colors.textSecondary,
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
      color: colors.textPrimary,
      marginBottom: 4,
    },
    noExpensesSubText: {
      fontSize: 12,
      color: colors.textMuted,
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
      color: colors.textPrimary,
    },
    expenseNotes: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    expenseMeta: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 3,
    },
    expenseRight: {
      alignItems: 'flex-end',
      marginLeft: 10,
    },
    expenseAmount: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    trashBtn: {
      padding: 4,
      marginTop: 4,
    },
    emptyContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 20,
      marginBottom: 8,
    },
    emptyDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    emptyBtn: {
      width: '80%',
    },
  });
  return memoizedStyles;
};

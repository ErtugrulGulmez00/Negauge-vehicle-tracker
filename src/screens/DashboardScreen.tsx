import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Modal, FlatList, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { DARK_COLORS, LIGHT_COLORS } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Expense } from '../types';
import * as Haptics from 'expo-haptics';
import { t, getCurrencySymbol } from '../localization/i18n';
import { getLocalMonthString, getLocalDateDaysAgo } from '../utils/date';
import { VehicleVisual } from '../components/VehicleVisual';
import { exportExpensesToCSV } from '../utils/export';

// Memoized Expense Row for list performance optimization
const MemoizedExpenseRow = React.memo<{
  item: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  theme: 'dark' | 'light';
  fuelCons: { [id: string]: string };
  selectedVehicle: any;
  language: string;
  getCategoryDetails: (cat: string) => { label: string; icon: string; color: string };
  getCurrencySymbol: () => string;
  colors: any;
  rowStyles: any;
}>(({ item, onEdit, onDelete, theme, fuelCons, selectedVehicle, language, getCategoryDetails, getCurrencySymbol, colors, rowStyles }) => {
  const cat = getCategoryDetails(item.category);
  return (
    <Card style={rowStyles.expenseItem}>
      <View style={rowStyles.expenseLeft}>
        <View style={[rowStyles.categoryIcon, { backgroundColor: (item.category === 'fuel' && selectedVehicle?.isElectric ? '#10B981' : cat.color) + '15' }]}>
          <Ionicons 
            name={(item.category === 'fuel' && selectedVehicle?.isElectric ? 'flash-outline' : cat.icon) as any} 
            size={18} 
            color={item.category === 'fuel' && selectedVehicle?.isElectric ? '#10B981' : cat.color} 
          />
        </View>
        <View style={rowStyles.expenseDetails}>
          <Text style={rowStyles.expenseLabelText}>
            {item.category === 'fuel' && selectedVehicle?.isElectric
              ? (language === 'tr' ? 'Şarj (Elektrik)' : 'Charging (EV)')
              : cat.label}
          </Text>
          {item.notes ? (
            <Text style={rowStyles.expenseNotes} numberOfLines={1}>
              {item.notes}
            </Text>
          ) : null}
          <Text style={rowStyles.expenseMeta}>
            {item.date} • {item.odometer.toLocaleString()} KM{item.category === 'fuel' && item.liters ? ` • ${item.liters} ${selectedVehicle?.isElectric ? 'kWh' : 'Lt'}` : ''}{fuelCons[item.id] ? ` • ${fuelCons[item.id]}` : ''}
          </Text>
        </View>
      </View>
      <View style={rowStyles.expenseRight}>
        <Text style={rowStyles.expenseAmount}>
          {getCurrencySymbol()}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
        <View style={rowStyles.actionRow}>
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={rowStyles.editBtn}
          >
            <Ionicons name="create-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            style={rowStyles.trashBtn}
          >
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
});

interface DashboardScreenProps {
  onAddExpensePress: () => void;
  onEditExpensePress: (expense: Expense) => void;
  onNavigateToVehicles: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onAddExpensePress,
  onEditExpensePress,
  onNavigateToVehicles,
}) => {
  const { selectedVehicle, expenses, deleteExpense, updateVehicle, language, theme } = useVehicles();
  const [quickOdo, setQuickOdo] = useState('');
  const [showOdoEdit, setShowOdoEdit] = useState(false);
  const [budgetVal, setBudgetVal] = useState('');
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | '1m' | '3m' | '6m'>('all');
  const [isExporting, setIsExporting] = useState(false);

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

  // Fuel consumptions calculation
  const fuelConsumptions = useMemo(() => {
    const fuelExpenses = vehicleExpenses
      .filter(e => e.category === 'fuel')
      .sort((a, b) => a.odometer - b.odometer);
    
    const map: { [id: string]: string } = {};
    
    for (let i = 1; i < fuelExpenses.length; i++) {
      const current = fuelExpenses[i];
      const prev = fuelExpenses[i - 1];
      const dist = current.odometer - prev.odometer;
      
      if (dist > 0 && current.liters && current.liters > 0) {
        const consumption = (current.liters / dist) * 100;
        map[current.id] = selectedVehicle?.isElectric
          ? `${consumption.toFixed(1)} kWh/100km`
          : `${consumption.toFixed(1)} L/100km`;
      }
    }
    
    return map;
  }, [vehicleExpenses, selectedVehicle]);

  const filteredExpenses = useMemo(() => {
    return vehicleExpenses.filter(e => {
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const matchesNote = e.notes?.toLowerCase().includes(query);
        const matchesOdo = String(e.odometer).includes(query);
        const matchesAmount = String(e.amount).includes(query);
        const matchesDate = e.date.includes(query);
        const catDetails = getCategoryDetails(e.category);
        const matchesCategory = catDetails.label.toLowerCase().includes(query);
        
        if (!matchesNote && !matchesOdo && !matchesAmount && !matchesDate && !matchesCategory) {
          return false;
        }
      }
      if (selectedCategory && selectedCategory !== 'all' && e.category !== selectedCategory) {
        return false;
      }
      if (selectedDateRange !== 'all') {
        const today = new Date();
        let limitDate = new Date();
        if (selectedDateRange === '1m') {
          limitDate.setMonth(today.getMonth() - 1);
        } else if (selectedDateRange === '3m') {
          limitDate.setMonth(today.getMonth() - 3);
        } else if (selectedDateRange === '6m') {
          limitDate.setMonth(today.getMonth() - 6);
        }
        const limitStr = limitDate.toISOString().split('T')[0];
        if (e.date < limitStr) {
          return false;
        }
      }
      return true;
    });
  }, [vehicleExpenses, searchText, selectedCategory, selectedDateRange, language]);

  // Calculations
  const stats = useMemo(() => {
    if (!selectedVehicle || vehicleExpenses.length === 0) {
      return { total: 0, monthly: 0, weekly: 0, costPerKm: 0, distance: 0 };
    }

    const total = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Monthly Calculation
    const currentMonthStr = getLocalMonthString(); // "YYYY-MM"
    const monthly = vehicleExpenses
      .filter(e => e.date.substring(0, 7) === currentMonthStr)
      .reduce((sum, e) => sum + e.amount, 0);

    // Weekly Calculation (last 7 days)
    const oneWeekAgoStr = getLocalDateDaysAgo(7); // "YYYY-MM-DD"
    const weekly = vehicleExpenses
      .filter(e => e.date >= oneWeekAgoStr)
      .reduce((sum, e) => sum + e.amount, 0);

    // Cost Per KM
    const distance = selectedVehicle.currentOdometer - selectedVehicle.initialOdometer;
    const costPerKm = distance > 0 ? total / distance : 0;

    return { total, monthly, weekly, costPerKm, distance };
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

  const handleUpdateBudget = async () => {
    if (!selectedVehicle) return;
    const nextBudget = Number(budgetVal);
    
    if (isNaN(nextBudget) || nextBudget < 0) {
      Alert.alert(
        language === 'tr' ? 'Geçersiz Bütçe' : 'Invalid Budget', 
        language === 'tr' ? 'Lütfen sıfırdan büyük geçerli bir sayı girin.' : 'Please enter a valid positive number.'
      );
      return;
    }

    await updateVehicle({
      ...selectedVehicle,
      monthlyBudget: nextBudget > 0 ? nextBudget : undefined,
    });

    setBudgetVal('');
    setShowBudgetEdit(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleExportCSV = async () => {
    if (!selectedVehicle) return;
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const success = await exportExpensesToCSV(filteredExpenses, selectedVehicle);
    setIsExporting(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
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
      case 'fine':
        return { label: t('cat_fine'), icon: 'warning-outline', color: '#EF4444' };
      case 'parking':
        return { label: t('cat_parking'), icon: 'pin-outline', color: '#3B82F6' };
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
        {/* Premium Vehicle Visual Showcase Card */}
        <Card
          style={[
            styles.visualShowcaseCard,
            {
              borderColor: selectedVehicle.color + '25',
              shadowColor: selectedVehicle.color,
            }
          ]}
          onPress={onNavigateToVehicles}
        >
          <View style={styles.visualCardBackground} />
          
          <View style={styles.visualHeader}>
            <View>
              <Text style={styles.visualVehicleName} numberOfLines={1}>{selectedVehicle.name}</Text>
              {selectedVehicle.plate ? (
                <View style={styles.trPlateBadge}>
                  <View style={styles.trPlateBlue}><Text style={styles.trPlateBlueText}>TR</Text></View>
                  <Text style={styles.trPlateText}>{selectedVehicle.plate.toUpperCase()}</Text>
                </View>
              ) : (
                <Text style={[styles.visualVehicleSub, { color: currentColors.textMuted }]}>
                  {selectedVehicle.year ? `${selectedVehicle.year}` : '---'}
                </Text>
              )}
            </View>
            <View style={[styles.visualYearBadge, { backgroundColor: selectedVehicle.color + '15' }]}>
              <Text style={[styles.visualYearText, { color: selectedVehicle.color }]}>
                {selectedVehicle.year || '----'}
              </Text>
            </View>
          </View>

          {/* SVG Vehicle Visual representation! */}
          <VehicleVisual type={selectedVehicle.icon} color={selectedVehicle.color} width={320} height={150} imageUri={selectedVehicle.imageUri} />

          {/* Card footer details */}
          <View style={styles.visualFooter}>
            <View style={styles.visualFooterCol}>
              <Text style={[styles.visualFooterLabel, { color: currentColors.textMuted }]}>{t('db_odometer_title')}</Text>
              <Text style={styles.visualFooterVal}>{selectedVehicle.currentOdometer.toLocaleString()} KM</Text>
            </View>
            <View style={styles.visualFooterDivider} />
            <View style={styles.visualFooterCol}>
              <Text style={[styles.visualFooterLabel, { color: currentColors.textMuted }]}>{t('db_monthly_spend')}</Text>
              <Text style={[styles.visualFooterVal, { color: selectedVehicle.color }]}>
                {getCurrencySymbol()}{stats.monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
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
              <Text style={styles.statLabel}>{t('db_weekly_spend')}</Text>
              <Text style={styles.statValue}>
                {getCurrencySymbol()}{stats.weekly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.statSubText}>{t('db_current_week')}</Text>
            </Card>
          </View>
        </View>

        {/* Monthly Budget Card */}
        <Card style={[styles.odoCard, { borderColor: selectedVehicle.color + '25', borderWidth: 1, marginBottom: 20 }]}>
          <View style={styles.odoCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.odoIconContainer, { backgroundColor: selectedVehicle.color + '15' }]}>
                <Ionicons name="pie-chart" size={18} color={selectedVehicle.color} />
              </View>
              <Text style={styles.odoCardTitle}>
                {language === 'tr' ? 'Aylık Harcama Hedefi' : 'Monthly Spending Budget'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowBudgetEdit(!showBudgetEdit);
                if (!showBudgetEdit) {
                  setBudgetVal(selectedVehicle.monthlyBudget ? String(selectedVehicle.monthlyBudget) : '');
                }
              }}
              style={[styles.odoEditBadge, { backgroundColor: selectedVehicle.color + '15' }]}
            >
              <Ionicons name={showBudgetEdit ? "close-circle" : "create-outline"} size={13} color={selectedVehicle.color} style={{ marginRight: 4 }} />
              <Text style={[styles.odoEditText, { color: selectedVehicle.color }]}>{showBudgetEdit ? t('cancel') : t('edit')}</Text>
            </TouchableOpacity>
          </View>

          {showBudgetEdit ? (
            <View style={styles.odoEditRow}>
              <Input
                placeholder={selectedVehicle.monthlyBudget ? String(selectedVehicle.monthlyBudget) : (language === 'tr' ? 'Hedef Bütçe girin...' : 'Set budget limit...')}
                value={budgetVal}
                onChangeText={setBudgetVal}
                keyboardType="numeric"
                style={{ marginBottom: 0, flex: 1, height: 40 }}
                inputStyle={{ fontSize: 14 }}
              />
              <TouchableOpacity style={[styles.odoSaveBtn, { backgroundColor: selectedVehicle.color }]} onPress={handleUpdateBudget}>
                <Ionicons name="checkmark" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
          ) : selectedVehicle.monthlyBudget ? (() => {
              const spent = stats.monthly;
              const limit = selectedVehicle.monthlyBudget;
              const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
              
              let statusColor = '#10B981'; // Green
              if (percent >= 90) {
                statusColor = '#EF4444'; // Red
              } else if (percent >= 70) {
                statusColor = '#F59E0B'; // Orange
              }

              const isExceeded = spent > limit;
              const diff = Math.abs(limit - spent);

              return (
                <View style={styles.budgetBody}>
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetValue}>
                      {getCurrencySymbol()}{spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <Text style={styles.budgetLimit}> / {getCurrencySymbol()}{limit.toLocaleString()}</Text>
                    </Text>
                    <Text style={[styles.budgetPercentText, { color: statusColor }]}>
                      {language === 'tr' ? '%' : ''}{percent.toFixed(0)}{language === 'tr' ? '' : '%'}
                    </Text>
                  </View>
                  
                  {/* Progress Bar */}
                  <View style={styles.budgetBarBg}>
                    <View style={[styles.budgetBarFill, { width: `${percent}%`, backgroundColor: statusColor }]} />
                  </View>

                  <Text style={[styles.budgetSubText, { color: isExceeded ? '#EF4444' : currentColors.textMuted }]}>
                    <Ionicons name={isExceeded ? "alert-circle" : "checkmark-circle"} size={12} color={isExceeded ? '#EF4444' : statusColor} />
                    {' '}
                    {isExceeded 
                      ? (language === 'tr' ? `Bütçe limitinizi ${getCurrencySymbol()}${diff.toLocaleString(undefined, { maximumFractionDigits: 0 })} aştınız!` : `Exceeded budget limit by ${getCurrencySymbol()}${diff.toLocaleString(undefined, { maximumFractionDigits: 0 })}!`)
                      : (language === 'tr' ? `Kalan aylık limitiniz: ${getCurrencySymbol()}${diff.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `Remaining limit: ${getCurrencySymbol()}${diff.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)}
                  </Text>
                </View>
              );
            })() : (
              <View style={styles.budgetEmptyContainer}>
                <Text style={styles.budgetEmptyText}>
                  {language === 'tr' 
                    ? 'Bu araç için henüz aylık harcama limiti belirlemediniz. Bütçenizi kontrol altında tutmak için şimdi bir limit belirleyin.' 
                    : 'You haven\'t set a monthly spending limit for this vehicle. Set a limit now to keep your expenses in check.'}
                </Text>
                <TouchableOpacity 
                  style={[styles.budgetSetBtn, { borderColor: selectedVehicle.color }]} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setShowBudgetEdit(true);
                  }}
                >
                  <Text style={[styles.budgetSetBtnText, { color: selectedVehicle.color }]}>
                    {language === 'tr' ? 'Limit Belirle' : 'Set Limit'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
        </Card>

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
          {vehicleExpenses.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowHistoryModal(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.viewAllText}>{language === 'tr' ? 'Tümünü Gör' : 'View All'}</Text>
                <Ionicons name="chevron-forward" size={14} color={currentColors.primary} style={{ marginLeft: 2 }} />
              </View>
            </TouchableOpacity>
          )}
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
                    <View style={[styles.categoryIcon, { backgroundColor: (item.category === 'fuel' && selectedVehicle?.isElectric ? '#10B981' : cat.color) + '15' }]}>
                      <Ionicons 
                        name={(item.category === 'fuel' && selectedVehicle?.isElectric ? 'flash-outline' : cat.icon) as any} 
                        size={18} 
                        color={item.category === 'fuel' && selectedVehicle?.isElectric ? '#10B981' : cat.color} 
                      />
                    </View>
                    <View style={styles.expenseDetails}>
                      <Text style={styles.expenseLabelText}>
                        {item.category === 'fuel' && selectedVehicle?.isElectric
                          ? (language === 'tr' ? 'Şarj (Elektrik)' : 'Charging (EV)')
                          : cat.label}
                      </Text>
                      {item.notes ? (
                        <Text style={styles.expenseNotes} numberOfLines={1}>
                          {item.notes}
                        </Text>
                      ) : null}
                      <Text style={styles.expenseMeta}>
                        {item.date} • {item.odometer.toLocaleString()} KM{item.category === 'fuel' && item.liters ? ` • ${item.liters} ${selectedVehicle?.isElectric ? 'kWh' : 'Lt'}` : ''}{fuelConsumptions[item.id] ? ` • ${fuelConsumptions[item.id]}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>
                      {getCurrencySymbol()}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        onPress={() => onEditExpensePress(item)}
                        style={styles.editBtn}
                      >
                        <Ionicons name="create-outline" size={16} color={currentColors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteExpense(item.id)}
                        style={styles.trashBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color={currentColors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Search & Filter History Modal (Feature 5 & 7) */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.historyModalContainer}>
          {/* Modal Header */}
          <View style={styles.historyModalHeader}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowHistoryModal(false);
              }}
              style={styles.historyCloseButton}
            >
              <Ionicons name="close" size={24} color={currentColors.textPrimary} />
            </TouchableOpacity>
            
            <Text style={styles.historyModalTitle}>
              {language === 'tr' ? 'Harcama Geçmişi' : 'Expense History'}
            </Text>
            
            <TouchableOpacity
              onPress={handleExportCSV}
              disabled={filteredExpenses.length === 0 || isExporting}
              style={[
                styles.historyExportButton,
                filteredExpenses.length === 0 && { opacity: 0.5 }
              ]}
            >
              <Ionicons name="share-outline" size={22} color={currentColors.primary} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.historySearchWrapper}>
            <Ionicons name="search-outline" size={18} color={currentColors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.historySearchInput, { color: currentColors.textPrimary }]}
              placeholder={language === 'tr' ? 'Detaylarda veya KM\'de ara...' : 'Search in details, KM...'}
              placeholderTextColor={currentColors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={16} color={currentColors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Date range selection */}
          <View style={styles.historyDateSelectorRow}>
            {(['all', '1m', '3m', '6m'] as const).map((range) => {
              const label = range === 'all' 
                ? (language === 'tr' ? 'Tümü' : 'All')
                : range === '1m'
                ? (language === 'tr' ? 'Son 1 Ay' : '1 Month')
                : range === '3m'
                ? (language === 'tr' ? 'Son 3 Ay' : '3 Months')
                : (language === 'tr' ? 'Son 6 Ay' : '6 Months');
              
              return (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.historyDateButton,
                    selectedDateRange === range && styles.historyDateButtonActive
                  ]}
                  onPress={() => setSelectedDateRange(range)}
                >
                  <Text style={[
                    styles.historyDateText,
                    selectedDateRange === range && styles.historyDateTextActive
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Category Horizontal Pills */}
          <View style={styles.historyCatContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyCatScroll}>
              {(['all', 'fuel', 'maintenance', 'insurance', 'tax', 'wash', 'fine', 'parking', 'other'] as const).map((cat) => {
                const label = cat === 'all' 
                  ? (language === 'tr' ? 'Tüm Kategoriler' : 'All Categories')
                  : cat === 'fuel'
                  ? (selectedVehicle?.isElectric ? (language === 'tr' ? 'Şarj (EV)' : 'Charging') : t('cat_fuel'))
                  : t(`cat_${cat}` as any);

                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.historyCatPill,
                      (selectedCategory === cat || (cat === 'all' && !selectedCategory)) && styles.historyCatPillActive
                    ]}
                    onPress={() => setSelectedCategory(cat === 'all' ? null : cat)}
                  >
                    <Text style={[
                      styles.historyCatPillText,
                      (selectedCategory === cat || (cat === 'all' && !selectedCategory)) && styles.historyCatPillTextActive
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* FlatList for performance (Feature 7) */}
          <FlatList
            data={filteredExpenses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.historyFlatListContent}
            initialNumToRender={15}
            maxToRenderPerBatch={15}
            windowSize={10}
            removeClippedSubviews={Platform.OS === 'android'}
            getItemLayout={(data, index) => ({
              length: 84,
              offset: 84 * index,
              index
            })}
            renderItem={({ item }) => (
              <MemoizedExpenseRow
                item={item}
                onEdit={(exp) => {
                  setShowHistoryModal(false);
                  onEditExpensePress(exp);
                }}
                onDelete={handleDeleteExpense}
                theme={theme}
                fuelCons={fuelConsumptions}
                selectedVehicle={selectedVehicle}
                language={language}
                getCategoryDetails={getCategoryDetails}
                getCurrencySymbol={getCurrencySymbol}
                colors={currentColors}
                rowStyles={styles}
              />
            )}
            ListEmptyComponent={
              <View style={styles.historyEmptyContainer}>
                <Ionicons name="search-outline" size={48} color={currentColors.textMuted} style={{ marginBottom: 12 }} />
                <Text style={styles.historyEmptyTitle}>
                  {language === 'tr' ? 'Sonuç Bulunamadı' : 'No Results Found'}
                </Text>
                <Text style={styles.historyEmptySub}>
                  {language === 'tr' ? 'Filtreleri veya arama kelimesini değiştirmeyi deneyin.' : 'Try changing filters or search terms.'}
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
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
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 8,
      position: 'relative',
      width: '100%',
    },
    headerTitleContainer: {
      alignItems: 'center',
    },
    welcomeSubtitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 4,
    },
    miniVehiclePill: {
      position: 'absolute',
      right: 0,
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
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    editBtn: {
      padding: 4,
      marginRight: 8,
    },
    trashBtn: {
      padding: 4,
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
    visualShowcaseCard: {
      padding: 16,
      marginBottom: 20,
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
      position: 'relative',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 6,
    },
    visualCardBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
      opacity: 0.25,
    },
    visualHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    visualVehicleName: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    visualVehicleSub: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 2,
    },
    trPlateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      borderRadius: 4,
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
      marginTop: 6,
      alignSelf: 'flex-start',
      overflow: 'hidden',
    },
    trPlateBlue: {
      backgroundColor: '#003399',
      paddingHorizontal: 4,
      paddingVertical: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    trPlateBlueText: {
      color: '#FFFFFF',
      fontSize: 8,
      fontWeight: '800',
    },
    trPlateText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textPrimary,
      paddingHorizontal: 6,
      letterSpacing: 0.5,
    },
    visualYearBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    visualYearText: {
      fontSize: 11,
      fontWeight: '800',
    },
    visualFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      paddingTop: 12,
      marginTop: 8,
    },
    visualFooterCol: {
      flex: 1,
      alignItems: 'center',
    },
    visualFooterDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.cardBorder,
    },
    visualFooterLabel: {
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    visualFooterVal: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    budgetBody: {
      marginTop: 8,
    },
    budgetRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 8,
    },
    budgetValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    budgetLimit: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    budgetPercentText: {
      fontSize: 14,
      fontWeight: '800',
    },
    budgetBarBg: {
      height: 8,
      backgroundColor: theme === 'dark' ? '#1E293B' : '#E2E8F0',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 10,
    },
    budgetBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    budgetSubText: {
      fontSize: 11,
      fontWeight: '600',
      flexDirection: 'row',
      alignItems: 'center',
    },
    budgetEmptyContainer: {
      marginTop: 6,
      alignItems: 'center',
      paddingVertical: 10,
    },
    budgetEmptyText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 12,
    },
    budgetSetBtn: {
      borderWidth: 1.5,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 16,
    },
    budgetSetBtnText: {
      fontSize: 12,
      fontWeight: '700',
    },
    viewAllButton: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    viewAllText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    historyModalContainer: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === 'ios' ? 48 : 20,
    },
    historyModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    historyModalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    historyCloseButton: {
      padding: 4,
    },
    historyExportButton: {
      padding: 4,
    },
    historySearchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
      marginHorizontal: 20,
      marginVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
      height: 40,
    },
    historySearchInput: {
      flex: 1,
      fontSize: 14,
      paddingVertical: 8,
    },
    historyDateSelectorRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: 20,
      marginBottom: 10,
    },
    historyDateButton: {
      flex: 1,
      paddingVertical: 6,
      alignItems: 'center',
      borderRadius: 8,
      marginHorizontal: 4,
      backgroundColor: theme === 'dark' ? '#1E293B40' : '#F1F5F940',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    historyDateButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    historyDateText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    historyDateTextActive: {
      color: '#0F172A',
    },
    historyCatContainer: {
      marginBottom: 12,
    },
    historyCatScroll: {
      paddingHorizontal: 16,
    },
    historyCatPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      marginHorizontal: 4,
      backgroundColor: colors.cardBackground,
    },
    historyCatPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    historyCatPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    historyCatPillTextActive: {
      color: '#0F172A',
    },
    historyFlatListContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    historyEmptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    historyEmptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    historyEmptySub: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
  return memoizedStyles;
};

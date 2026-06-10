import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { DARK_COLORS, LIGHT_COLORS } from '../theme/colors';
import { Card } from '../components/Card';
import { DonutChart } from '../components/DonutChart';
import { ExpenseCategory } from '../types';
import { t, getCurrencySymbol, getShortMonthName } from '../localization/i18n';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const AnalyticsScreen: React.FC = () => {
  const { selectedVehicle, expenses, language, theme } = useVehicles();
  
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

  // 1. Calculate Monthly Trend (Last 6 Months)
  const monthlyTrendData = useMemo(() => {
    const data: { monthLabel: string; amount: number }[] = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}`; // "YYYY-MM"
      
      const label = getShortMonthName(d.getMonth(), language);
      
      const sum = vehicleExpenses
        .filter(e => e.date.startsWith(prefix))
        .reduce((acc, curr) => acc + curr.amount, 0);

      data.push({ monthLabel: label, amount: sum });
    }

    return data;
  }, [vehicleExpenses]);

  // Max value for scaling monthly bars
  const maxMonthlyAmount = useMemo(() => {
    const max = Math.max(...monthlyTrendData.map(d => d.amount));
    return max > 0 ? max : 1000; // avoid division by 0
  }, [monthlyTrendData]);

  // 2. Calculate Category Breakdown
  const categoryData = useMemo(() => {
    const total = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
    const breakdown: { [key in ExpenseCategory]?: number } = {};
    
    vehicleExpenses.forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
    });

    const categoriesList: { type: ExpenseCategory; label: string; icon: string; color: string }[] = [
      { type: 'fuel', label: t('cat_fuel'), icon: 'speedometer-outline', color: currentColors.primary },
      { type: 'maintenance', label: t('cat_maintenance'), icon: 'construct-outline', color: currentColors.info },
      { type: 'insurance', label: t('cat_insurance'), icon: 'shield-checkmark-outline', color: '#8B5CF6' },
      { type: 'tax', label: t('cat_tax'), icon: 'receipt-outline', color: '#EC4899' },
      { type: 'wash', label: t('cat_wash'), icon: 'water-outline', color: '#10B981' },
      { type: 'fine', label: t('cat_fine'), icon: 'alert-circle-outline', color: '#EF4444' },
      { type: 'parking', label: t('cat_parking'), icon: 'location-outline', color: '#06B6D4' },
      { type: 'other', label: t('cat_other'), icon: 'ellipsis-horizontal-outline', color: currentColors.textSecondary },
    ];

    return categoriesList
      .map(cat => {
        const amount = breakdown[cat.type] || 0;
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        return {
          ...cat,
          amount,
          percentage,
        };
      })
      .filter(c => c.amount > 0) // Only show categories with expenses
      .sort((a, b) => b.amount - a.amount); // Sort by highest spend
  }, [vehicleExpenses]);

  // 3. Stats Summary
  const analyticsSummary = useMemo(() => {
    if (vehicleExpenses.length === 0) return { total: 0, avg: 0, highest: '-' };
    const total = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
    const avg = total / 6; // Average of last 6 months
    
    const highestCat = categoryData.length > 0 ? categoryData[0].label : '-';

    return { total, avg, highest: highestCat };
  }, [vehicleExpenses, categoryData]);

  if (!selectedVehicle) {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={72} color={currentColors.textMuted} />
          <Text style={styles.emptyText}>{t('an_no_vehicle')}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('an_title')}</Text>
          <Text style={styles.subtitle}>{t('an_header_desc', { name: selectedVehicle.name })}</Text>
        </View>

        {vehicleExpenses.length === 0 ? (
          <Card style={styles.noDataCard}>
            <Ionicons name="bar-chart-outline" size={56} color={currentColors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.noDataTitle}>{t('an_no_data')}</Text>
            <Text style={styles.noDataDesc}>
              {t('an_no_data_desc')}
            </Text>
          </Card>
        ) : (
          <>
            {/* Quick Stats Grid */}
            <View style={styles.summaryGrid}>
              <Card style={[styles.summaryCard, { borderLeftColor: selectedVehicle.color, borderLeftWidth: 3 }]}>
                <Text style={styles.summaryLabel}>{t('an_monthly_average')}</Text>
                <Text style={styles.summaryValue}>
                  {getCurrencySymbol()}{analyticsSummary.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.summarySub}>{t('an_last_6_months')}</Text>
              </Card>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t('an_most_spent')}</Text>
                {categoryData.length > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 6 }}>
                    <View style={[styles.miniCatBadge, { backgroundColor: categoryData[0].color + '15' }]}>
                      <Ionicons name={categoryData[0].icon as any} size={13} color={categoryData[0].color} />
                    </View>
                    <Text style={[styles.summaryValue, { color: categoryData[0].color, marginLeft: 6, marginBottom: 0, flex: 1 }]} numberOfLines={1}>
                      {categoryData[0].label}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.summaryValue}>-</Text>
                )}
                <Text style={styles.summarySub}>{t('an_category_based')}</Text>
              </Card>
            </View>

            {/* Monthly Trend Chart */}
            <Card style={[styles.chartCard, { borderColor: selectedVehicle.color + '20', borderWidth: 1 }]}>
              <Text style={styles.chartTitle}>{t('an_monthly_trend')}</Text>
              <View style={styles.chartContainer}>
                <View style={styles.barsContainer}>
                  {monthlyTrendData.map((d, index) => {
                    const barHeight = (d.amount / maxMonthlyAmount) * 120; // max height 120
                    return (
                      <View key={index} style={styles.barColumn}>
                        <View style={styles.barValueWrapper}>
                          {d.amount > 0 && (
                            <Text style={styles.barValueText}>
                              {d.amount > 999 ? `${(d.amount / 1000).toFixed(1)}k` : d.amount.toFixed(0)}
                            </Text>
                          )}
                        </View>
                        <View style={[styles.barBack]}>
                          <View style={[styles.barFill, { height: Math.max(barHeight, 4), backgroundColor: selectedVehicle.color }]} />
                        </View>
                        <Text style={styles.barLabel}>{d.monthLabel}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Card>

            {/* Category Distribution Chart */}
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t('an_category_breakdown')}</Text>
              
              <DonutChart
                data={categoryData.map(c => ({
                  name: c.label,
                  amount: c.amount,
                  percentage: c.percentage,
                  color: c.color,
                }))}
                totalAmount={analyticsSummary.total}
                currencySymbol={getCurrencySymbol()}
                theme={theme}
              />

              <View style={styles.breakdownList}>
                {categoryData.map(cat => (
                  <View key={cat.type} style={styles.breakdownRow}>
                    <View style={styles.breakdownLabelRow}>
                      <View style={styles.categoryInfo}>
                        <View style={[styles.catIconBox, { backgroundColor: cat.color + '15' }]}>
                          <Ionicons name={cat.icon as any} size={16} color={cat.color} />
                        </View>
                        <Text style={styles.catName}>{cat.label}</Text>
                      </View>
                      <View style={styles.categoryValues}>
                        <Text style={styles.catAmount}>
                          {getCurrencySymbol()}{cat.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </Text>
                        <Text style={styles.catPercent}>
                          {getCurrencySymbol() === '₺' ? '%' : ''}{cat.percentage.toFixed(0)}{getCurrencySymbol() === '₺' ? '' : '%'}
                        </Text>
                      </View>
                    </View>
                    {/* Progress Bar */}
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </>
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
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: 4,
    },
    summaryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    summaryCard: {
      width: '48%',
      padding: 14,
    },
    miniCatBadge: {
      width: 22,
      height: 22,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    summarySub: {
      fontSize: 10,
      color: colors.textMuted,
    },
    chartCard: {
      marginBottom: 20,
      padding: 16,
    },
    chartTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 20,
      letterSpacing: 0.3,
    },
    chartContainer: {
      height: 170,
      justifyContent: 'flex-end',
      paddingBottom: 10,
    },
    barsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 150,
    },
    barColumn: {
      alignItems: 'center',
      width: 44,
    },
    barValueWrapper: {
      height: 20,
      justifyContent: 'center',
      marginBottom: 4,
    },
    barValueText: {
      fontSize: 9,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    barBack: {
      height: 120,
      width: 14,
      backgroundColor: theme === 'dark' ? '#0F172A' : '#E2E8F0',
      borderRadius: 7,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    barFill: {
      width: '100%',
      borderRadius: 7,
    },
    barLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 8,
      fontWeight: '600',
    },
    breakdownList: {
      marginTop: 4,
    },
    breakdownRow: {
      marginBottom: 16,
    },
    breakdownLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    catIconBox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    catName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    categoryValues: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    catAmount: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginRight: 8,
    },
    catPercent: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
      width: 28,
      textAlign: 'right',
    },
    progressBarBg: {
      height: 8,
      backgroundColor: theme === 'dark' ? '#0F172A' : '#E2E8F0',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    emptyContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
      marginTop: 16,
    },
    noDataCard: {
      padding: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noDataTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    noDataDesc: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
  return memoizedStyles;
};

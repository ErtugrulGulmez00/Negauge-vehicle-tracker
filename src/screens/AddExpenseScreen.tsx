import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { COLORS } from '../theme/colors';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ExpenseCategory } from '../types';
import * as Haptics from 'expo-haptics';
import { t, getCurrencySymbol } from '../localization/i18n';

interface AddExpenseScreenProps {
  onSuccess: () => void;
}

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({ onSuccess }) => {
  const { selectedVehicle, addExpense } = useVehicles();
  
  // Form States
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [odometer, setOdometer] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories: { type: ExpenseCategory; label: string; icon: string; color: string }[] = [
    { type: 'fuel', label: t('cat_fuel'), icon: 'speedometer-outline', color: COLORS.primary },
    { type: 'maintenance', label: t('cat_maintenance'), icon: 'construct-outline', color: COLORS.info },
    { type: 'insurance', label: t('cat_insurance'), icon: 'shield-checkmark-outline', color: '#8B5CF6' },
    { type: 'tax', label: t('cat_tax'), icon: 'receipt-outline', color: '#EC4899' },
    { type: 'wash', label: t('cat_wash'), icon: 'water-outline', color: '#10B981' },
    { type: 'other', label: t('cat_other'), icon: 'ellipsis-horizontal-outline', color: COLORS.textSecondary },
  ];

  // Set today's date by default in YYYY-MM-DD format
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
    
    if (selectedVehicle) {
      setOdometer(String(selectedVehicle.currentOdometer));
    }
  }, [selectedVehicle]);

  const setPresetDate = (daysAgo: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = t('exp_error_amount');
    }
    if (!odometer.trim() || isNaN(Number(odometer)) || Number(odometer) < 0) {
      newErrors.odometer = t('exp_error_odometer');
    } else if (selectedVehicle && Number(odometer) < selectedVehicle.initialOdometer) {
      newErrors.odometer = t('exp_error_odometer_less', { minOdometer: selectedVehicle.initialOdometer });
    }
    
    // Simple Date validation regex YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date.trim() || !dateRegex.test(date)) {
      newErrors.date = t('exp_error_date');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!selectedVehicle) {
      Alert.alert(t('error'), t('v_empty_vehicles'));
      return;
    }
    
    if (!validate()) return;
    
    await addExpense({
      vehicleId: selectedVehicle.id,
      amount: Number(amount),
      category,
      odometer: Number(odometer),
      date,
      notes: notes.trim() || undefined,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onSuccess();
  };

  if (!selectedVehicle) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="car-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.errorText}>{t('v_empty_vehicles')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('exp_title')}</Text>
        <Text style={styles.vehicleSubtitle}>{selectedVehicle.name}</Text>
      </View>

      <Card style={styles.card}>
        {/* Category Selector */}
        <Text style={styles.sectionLabel}>{t('exp_category_label')}</Text>
        <View style={styles.categoryGrid}>
          {categories.map(cat => {
            const isSelected = category === cat.type;
            return (
              <TouchableOpacity
                key={cat.type}
                style={[
                  styles.categoryBtn,
                  isSelected && { borderColor: cat.color, backgroundColor: '#0F172A' },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setCategory(cat.type);
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: cat.color + '15' }]}>
                  <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                </View>
                <Text
                  style={[
                    styles.categoryText,
                    isSelected ? { color: COLORS.textPrimary, fontWeight: '700' } : { color: COLORS.textSecondary },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Amount Input */}
        <Input
          label={`${t('exp_amount', { currency: getCurrencySymbol() })} *`}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          error={errors.amount}
        />

        {/* Odometer Input */}
        <Input
          label={`${t('exp_odometer')} *`}
          placeholder={`${t('db_current_odometer')}: ${selectedVehicle.currentOdometer}`}
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
          error={errors.odometer}
        />

        {/* Date Input with Presets */}
        <View style={styles.dateLabelRow}>
          <Text style={styles.dateLabel}>{t('exp_date')} *</Text>
          <View style={styles.presetsRow}>
            <TouchableOpacity style={styles.presetBtn} onPress={() => setPresetDate(0)}>
              <Text style={styles.presetText}>{t('today')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => setPresetDate(1)}>
              <Text style={styles.presetText}>{t('yesterday')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Input
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
          error={errors.date}
        />

        {/* Notes Input */}
        <Input
          label={t('exp_notes_optional')}
          placeholder={t('exp_notes_placeholder')}
          value={notes}
          onChangeText={setNotes}
        />

        <View style={styles.actionButtons}>
          <Button
            title={t('cancel')}
            variant="secondary"
            onPress={onSuccess}
            style={{ flex: 1, marginRight: 12 }}
          />
          <Button
            title={t('save')}
            onPress={handleSave}
            style={{ flex: 1.5 }}
          />
        </View>
      </Card>
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
  headerRow: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    marginTop: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryBtn: {
    width: '48%',
    height: 76,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  dateLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  presetsRow: {
    flexDirection: 'row',
  },
  presetBtn: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 8,
  },
  presetText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
});

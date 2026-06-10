import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { DARK_COLORS, LIGHT_COLORS } from '../theme/colors';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Reminder } from '../types';
import * as Haptics from 'expo-haptics';
import { t, TranslationKey } from '../localization/i18n';
import { getLocalDateString } from '../utils/date';

export const RemindersScreen: React.FC = () => {
  const { selectedVehicle, reminders, addReminder, updateReminder, toggleReminder, deleteReminder, language, theme } = useVehicles();
  const [showAddForm, setShowAddForm] = useState(false);
  const [reminderToEdit, setReminderToEdit] = useState<Reminder | null>(null);

  const handleEditClick = (reminder: Reminder) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setReminderToEdit(reminder);
    setTitle(reminder.title);
    setType(reminder.type);
    setTargetDate(reminder.targetDate || '');
    setTargetOdometer(reminder.targetOdometer ? String(reminder.targetOdometer) : '');
    setShowAddForm(true);
  };

  // Form States
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'date' | 'odometer'>('date');
  const [targetDate, setTargetDate] = useState('');
  const [targetOdometer, setTargetOdometer] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Presets States
  const [selectedPresetCat, setSelectedPresetCat] = useState<'all' | 'legal' | 'maintenance' | 'seasonal' | 'moto' | 'life'>('all');

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

  // Get active vehicle reminders
  const activeReminders = reminders.filter(r => r.vehicleId === selectedVehicle?.id);

  interface ReminderPreset {
    id: string;
    category: 'legal' | 'maintenance' | 'seasonal' | 'moto' | 'life';
    titleKey: TranslationKey;
    type: 'date' | 'odometer';
    icon: string;
    color: string;
  }

  const presetsList: ReminderPreset[] = [
    // Resmi & Yasal
    { id: 'muayene', category: 'legal', titleKey: 'preset_muayene', type: 'date', icon: 'shield-outline', color: '#EF4444' },
    { id: 'sigorta', category: 'legal', titleKey: 'preset_sigorta', type: 'date', icon: 'document-text-outline', color: '#3B82F6' },
    { id: 'kasko', category: 'legal', titleKey: 'preset_kasko', type: 'date', icon: 'document-attach-outline', color: '#8B5CF6' },
    { id: 'mtv', category: 'legal', titleKey: 'preset_mtv', type: 'date', icon: 'cash-outline', color: '#EC4899' },
    { id: 'egzoz', category: 'legal', titleKey: 'preset_egzoz', type: 'date', icon: 'leaf-outline', color: '#10B981' },
    
    // Periyodik & KM
    { id: 'yag', category: 'maintenance', titleKey: 'preset_yag', type: 'odometer', icon: 'water-outline', color: '#F59E0B' },
    { id: 'triger', category: 'maintenance', titleKey: 'preset_triger', type: 'odometer', icon: 'cog-outline', color: '#3B82F6' },
    { id: 'balata', category: 'maintenance', titleKey: 'preset_balata', type: 'odometer', icon: 'disc-outline', color: '#10B981' },
    { id: 'buji', category: 'maintenance', titleKey: 'preset_buji', type: 'odometer', icon: 'flash-outline', color: '#EC4899' },
    
    // Mevsimsel & Güvenlik
    { id: 'lastik_degisim', category: 'seasonal', titleKey: 'preset_lastik_degisim', type: 'date', icon: 'snow-outline', color: '#3B82F6' },
    { id: 'lastik_omru', category: 'seasonal', titleKey: 'preset_lastik_omru', type: 'date', icon: 'time-outline', color: '#EF4444' },
    { id: 'lastik_basinç', category: 'seasonal', titleKey: 'preset_lastik_basinç', type: 'date', icon: 'speedometer-outline', color: '#10B981' },
    { id: 'antifriz', category: 'seasonal', titleKey: 'preset_antifriz', type: 'date', icon: 'thermometer-outline', color: '#8B5CF6' },
    
    // Motosiklet Özel
    { id: 'zincir_yag', category: 'moto', titleKey: 'preset_zincir_yag', type: 'odometer', icon: 'git-commit-outline', color: '#F59E0B' },
    { id: 'zincir_gerginlik', category: 'moto', titleKey: 'preset_zincir_gerginlik', type: 'odometer', icon: 'git-compare-outline', color: '#10B981' },
    { id: 'kask_omru', category: 'moto', titleKey: 'preset_kask_omru', type: 'date', icon: 'ribbon-outline', color: '#8B5CF6' },
    
    // Akıllı & Yaşam
    { id: 'otopark', category: 'life', titleKey: 'preset_otopark', type: 'date', icon: 'pin-outline', color: '#3B82F6' },
    { id: 'ilkyardim', category: 'life', titleKey: 'preset_ilkyardim', type: 'date', icon: 'medkit-outline', color: '#EF4444' },
  ];

  const isMotorcycle = selectedVehicle?.icon === 'bicycle';
  
  const presetCategories: { id: 'all' | 'legal' | 'maintenance' | 'seasonal' | 'moto' | 'life'; labelKey: TranslationKey }[] = [
    { id: 'all', labelKey: 'rem_cat_all' },
    { id: 'legal', labelKey: 'rem_cat_legal' },
    { id: 'maintenance', labelKey: 'rem_cat_maintenance' },
    { id: 'seasonal', labelKey: 'rem_cat_seasonal' },
    ...(isMotorcycle ? [{ id: 'moto' as const, labelKey: 'rem_cat_moto' as const }] : []),
    { id: 'life', labelKey: 'rem_cat_life' },
  ];

  const filteredPresets = presetsList.filter(preset => {
    if (preset.category === 'moto' && !isMotorcycle) return false;
    if (selectedPresetCat === 'all') return true;
    return preset.category === selectedPresetCat;
  });

  const handlePresetClick = (preset: ReminderPreset) => {
    if (!selectedVehicle) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setTitle(t(preset.titleKey));
    setType(preset.type);
    
    const today = new Date();
    
    if (preset.type === 'date') {
      let calcDateStr = '';
      
      switch (preset.id) {
        case 'muayene':
        case 'egzoz': {
          const d = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
          calcDateStr = d.toISOString().split('T')[0];
          break;
        }
        case 'sigorta':
        case 'kasko':
        case 'ilkyardim': {
          const d = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
          calcDateStr = d.toISOString().split('T')[0];
          break;
        }
        case 'mtv': {
          const currentMonth = today.getMonth();
          let targetYear = today.getFullYear();
          let targetMonth = 6; // July
          if (currentMonth >= 6) {
            targetYear += 1;
            targetMonth = 0; // January
          }
          const d = new Date(targetYear, targetMonth, 1);
          calcDateStr = d.toISOString().split('T')[0];
          break;
        }
        case 'lastik_degisim': {
          const currentMonth = today.getMonth();
          let targetYear = today.getFullYear();
          let targetMonth = 3; // April
          if (currentMonth >= 3 && currentMonth < 11) {
            targetMonth = 11; // December
          } else if (currentMonth >= 11) {
            targetYear += 1;
            targetMonth = 3; // April
          }
          const d = new Date(targetYear, targetMonth, 1);
          calcDateStr = d.toISOString().split('T')[0];
          break;
        }
        case 'lastik_omru': {
          const d = new Date(today.getFullYear() + 4, today.getMonth(), today.getDate());
          calcDateStr = d.toISOString().split('T')[0];
          break;
        }
        case 'lastik_basinç': {
          const d = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
          calcDateStr = d.toISOString().split('T')[0];
          break;
        }
        case 'antifriz': {
          const currentMonth = today.getMonth();
          let targetYear = today.getFullYear();
          if (currentMonth >= 9 && today.getDate() > 15) {
            targetYear += 1;
          }
          const d = new Date(targetYear, 9, 15); // Oct 15
          calcDateStr = d.toISOString().split('T')[0];
          break;
        }
        case 'kask_omru': {
          const d = new Date(today.getFullYear() + 5, today.getMonth(), today.getDate());
          calcDateStr = d.toISOString().split('T')[0];
          break;
        }
        case 'otopark': {
          calcDateStr = today.toISOString().split('T')[0];
          break;
        }
        default: {
          const d = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
          calcDateStr = d.toISOString().split('T')[0];
          break;
        }
      }
      
      setTargetDate(calcDateStr);
      setTargetOdometer('');
    } else {
      let calcKm = 0;
      switch (preset.id) {
        case 'yag':
          calcKm = selectedVehicle.currentOdometer + 10000;
          break;
        case 'triger':
          calcKm = selectedVehicle.currentOdometer + 60000;
          break;
        case 'balata':
          calcKm = selectedVehicle.currentOdometer + 30000;
          break;
        case 'buji':
          calcKm = selectedVehicle.currentOdometer + 40000;
          break;
        case 'zincir_yag':
          calcKm = selectedVehicle.currentOdometer + 500;
          break;
        case 'zincir_gerginlik':
          calcKm = selectedVehicle.currentOdometer + 1000;
          break;
        default:
          calcKm = selectedVehicle.currentOdometer + 10000;
          break;
      }
      setTargetOdometer(String(calcKm));
      setTargetDate('');
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = t('rem_error_title');
    
    if (type === 'date') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!targetDate.trim() || !dateRegex.test(targetDate)) {
        newErrors.targetDate = t('exp_error_date');
      }
    } else {
      if (!targetOdometer.trim() || isNaN(Number(targetOdometer)) || Number(targetOdometer) <= 0) {
        newErrors.targetOdometer = t('rem_error_target_km');
      } else if (selectedVehicle && Number(targetOdometer) <= selectedVehicle.currentOdometer) {
        newErrors.targetOdometer = t('rem_error_target_km_less', { currentOdometer: selectedVehicle.currentOdometer });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveReminder = async () => {
    if (!selectedVehicle) return;
    if (!validate()) return;

    if (reminderToEdit) {
      await updateReminder({
        ...reminderToEdit,
        title: title.trim(),
        type,
        targetDate: type === 'date' ? targetDate : undefined,
        targetOdometer: type === 'odometer' ? Number(targetOdometer) : undefined,
      });
    } else {
      await addReminder({
        vehicleId: selectedVehicle.id,
        title: title.trim(),
        type,
        targetDate: type === 'date' ? targetDate : undefined,
        targetOdometer: type === 'odometer' ? Number(targetOdometer) : undefined,
      });
    }

    setTitle('');
    setTargetDate('');
    setTargetOdometer('');
    setReminderToEdit(null);
    setShowAddForm(false);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleReminder(id);
  };

  const handleDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(t('rem_delete_confirm_title'), t('rem_delete_confirm_desc'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteReminder(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        },
      },
    ]);
  };

  const isReminderDue = (reminder: Reminder) => {
    if (!selectedVehicle || reminder.isCompleted) return false;
    
    if (reminder.type === 'date' && reminder.targetDate) {
      const today = getLocalDateString(); // YYYY-MM-DD
      return today >= reminder.targetDate;
    }
    
    if (reminder.type === 'odometer' && reminder.targetOdometer) {
      return selectedVehicle.currentOdometer >= reminder.targetOdometer;
    }

    return false;
  };

  if (!selectedVehicle) {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={72} color={currentColors.textMuted} />
          <Text style={styles.emptyText}>{t('rem_no_vehicle')}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('rem_title')}</Text>
          {!showAddForm && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowAddForm(true);
              }}
            >
              <Ionicons name="add" size={24} color={currentColors.primary} />
              <Text style={styles.addButtonText}>{t('add')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {showAddForm ? (
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {reminderToEdit ? (language === 'tr' ? 'Hatırlatıcıyı Düzenle' : 'Edit Reminder') : t('rem_add_reminder')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setShowAddForm(false);
                  setReminderToEdit(null);
                  setTitle('');
                  setTargetDate('');
                  setTargetOdometer('');
                }}
              >
                <Ionicons name="close" size={24} color={currentColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Presets Selection */}
            {!reminderToEdit && (
              <View style={styles.presetSection}>
                <Text style={styles.sectionLabel}>{t('rem_presets_title')}</Text>
                
                {/* Horizontal Category Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetCatsScroll}>
                  {presetCategories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.presetCatChip,
                        selectedPresetCat === cat.id && styles.presetCatChipActive
                      ]}
                      onPress={() => setSelectedPresetCat(cat.id as any)}
                    >
                      <Text style={[
                        styles.presetCatText,
                        selectedPresetCat === cat.id && styles.presetCatTextActive
                      ]}>
                        {t(cat.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Presets grid */}
                <View style={styles.presetsGrid}>
                  {filteredPresets.map(preset => (
                    <TouchableOpacity
                      key={preset.id}
                      style={styles.presetItemCard}
                      onPress={() => handlePresetClick(preset)}
                    >
                      <View style={[styles.presetIconBox, { backgroundColor: preset.color + '15' }]}>
                        <Ionicons name={preset.icon as any} size={16} color={preset.color} />
                      </View>
                      <Text style={styles.presetItemText} numberOfLines={2}>
                        {t(preset.titleKey)}
                      </Text>
                      <View style={styles.presetBadge}>
                        <Text style={[styles.presetBadgeText, { color: preset.type === 'date' ? '#8B5CF6' : '#F59E0B' }]}>
                          {preset.type === 'date' ? (language === 'tr' ? 'Tarih' : 'Date') : 'KM'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Input
              label={`${t('rem_name_placeholder')} *`}
              placeholder={t('rem_name_placeholder')}
              value={title}
              onChangeText={setTitle}
              error={errors.title}
            />

            {/* Type Selector Toggle */}
            <Text style={styles.sectionLabel}>{t('rem_type')}</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, type === 'date' && styles.toggleBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setType('date');
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={type === 'date' ? '#0F172A' : currentColors.textSecondary}
                />
                <Text style={[styles.toggleText, type === 'date' && styles.toggleTextActive]}>{t('rem_type_date')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, type === 'odometer' && styles.toggleBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setType('odometer');
                }}
              >
                <Ionicons
                  name="speedometer-outline"
                  size={18}
                  color={type === 'odometer' ? '#0F172A' : currentColors.textSecondary}
                />
                <Text style={[styles.toggleText, type === 'odometer' && styles.toggleTextActive]}>{t('rem_type_km')}</Text>
              </TouchableOpacity>
            </View>

            {type === 'date' ? (
              <Input
                label={`${t('rem_target_date')} (YYYY-MM-DD) *`}
                placeholder="YYYY-MM-DD"
                value={targetDate}
                onChangeText={setTargetDate}
                error={errors.targetDate}
              />
            ) : (
              <Input
                label={`${t('rem_target_km')} *`}
                placeholder={`Örn: ${(selectedVehicle.currentOdometer + 10000)}`}
                value={targetOdometer}
                onChangeText={setTargetOdometer}
                keyboardType="numeric"
                error={errors.targetOdometer}
              />
            )}

            <Button
              title={reminderToEdit ? (language === 'tr' ? 'Güncelle' : 'Update') : t('rem_add_reminder')}
              onPress={handleSaveReminder}
              style={styles.submitBtn}
            />
          </Card>
        ) : activeReminders.length === 0 ? (
          <Card style={styles.emptyListCard}>
            <Ionicons name="notifications-off-outline" size={48} color={currentColors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyListTitle}>{t('rem_empty')}</Text>
            <Text style={styles.emptyListDesc}>
              {t('rem_empty_desc')}
            </Text>
          </Card>
        ) : (
          <View style={styles.list}>
            {activeReminders.map(item => {
              const due = isReminderDue(item);
              return (
                <Card
                  key={item.id}
                  style={[
                    styles.reminderItem,
                    item.isCompleted ? styles.completedItem : null,
                    due ? styles.dueItem : null,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.checkArea}
                    onPress={() => handleToggle(item.id)}
                  >
                    <View
                      style={[
                        styles.checkBox,
                        item.isCompleted && { backgroundColor: currentColors.success, borderColor: currentColors.success },
                        due && !item.isCompleted && { borderColor: currentColors.warning },
                      ]}
                    >
                      {item.isCompleted && <Ionicons name="checkmark" size={14} color="#0F172A" />}
                    </View>
                    <View style={styles.reminderInfo}>
                      <Text
                        style={[
                          styles.reminderTitle,
                          item.isCompleted && styles.completedText,
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.reminderTarget}>
                        {item.type === 'date'
                          ? `${t('rem_target_date')}: ${item.targetDate}`
                          : `${t('rem_target_km')}: ${item.targetOdometer?.toLocaleString()} KM`}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.actionArea}>
                    {due && !item.isCompleted && (
                      <View style={styles.dueBadge}>
                        <Text style={styles.dueText}>{t('rem_status_due').toUpperCase()}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => handleEditClick(item)}
                      style={styles.editBtn}
                    >
                      <Ionicons name="create-outline" size={18} color={currentColors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      style={styles.trashBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color={currentColors.textMuted} />
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    addButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
      marginLeft: 4,
    },
    formCard: {
      marginTop: 10,
    },
    formHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    formTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 10,
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: theme === 'dark' ? '#0F172A' : '#F1F5F9',
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    toggleBtn: {
      flex: 1,
      height: 40,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
    },
    toggleBtnActive: {
      backgroundColor: colors.primary,
    },
    toggleText: {
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 6,
    },
    toggleTextActive: {
      color: '#0F172A',
      fontWeight: '700',
    },
    submitBtn: {
      marginTop: 10,
    },
    emptyListCard: {
      padding: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    emptyListTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    emptyListDesc: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    list: {
      marginTop: 10,
    },
    reminderItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      padding: 14,
    },
    completedItem: {
      opacity: 0.5,
    },
    dueItem: {
      borderColor: colors.warning + '50',
      borderWidth: 1,
    },
    checkArea: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    checkBox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    reminderInfo: {
      flex: 1,
    },
    reminderTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    completedText: {
      textDecorationLine: 'line-through',
    },
    reminderTarget: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    actionArea: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dueBadge: {
      backgroundColor: colors.warning + '20',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 6,
      marginRight: 10,
    },
    dueText: {
      fontSize: 9,
      color: colors.warning,
      fontWeight: '800',
    },
    editBtn: {
      padding: 6,
      marginRight: 6,
    },
    trashBtn: {
      padding: 6,
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
    presetSection: {
      marginTop: 10,
      marginBottom: 20,
    },
    presetCatsScroll: {
      flexDirection: 'row',
      marginVertical: 10,
    },
    presetCatChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    presetCatChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    presetCatText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    presetCatTextActive: {
      color: '#0F172A',
      fontWeight: '700',
    },
    presetsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
      marginTop: 6,
    },
    presetItemCard: {
      flexBasis: '30.5%',
      flexGrow: 1,
      margin: 4,
      padding: 10,
      borderRadius: 10,
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
    },
    presetIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    presetItemText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      lineHeight: 12,
      height: 24,
    },
    presetBadge: {
      marginTop: 6,
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
      backgroundColor: theme === 'dark' ? '#0F172A' : '#E2E8F0',
    },
    presetBadgeText: {
      fontSize: 8,
      fontWeight: '800',
    },
  });
  return memoizedStyles;
};

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { COLORS, DARK_COLORS, LIGHT_COLORS } from '../theme/colors';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Reminder } from '../types';
import * as Haptics from 'expo-haptics';
import { t } from '../localization/i18n';

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
      const today = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
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
  });
  return memoizedStyles;
};

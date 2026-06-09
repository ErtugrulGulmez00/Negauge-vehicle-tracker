import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { COLORS } from '../theme/colors';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Reminder } from '../types';
import * as Haptics from 'expo-haptics';

export const RemindersScreen: React.FC = () => {
  const { selectedVehicle, reminders, addReminder, toggleReminder, deleteReminder } = useVehicles();
  const [showAddForm, setShowAddForm] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'date' | 'odometer'>('date');
  const [targetDate, setTargetDate] = useState('');
  const [targetOdometer, setTargetOdometer] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Get active vehicle reminders
  const activeReminders = reminders.filter(r => r.vehicleId === selectedVehicle?.id);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = 'Hatırlatıcı başlığı girmelisiniz';
    
    if (type === 'date') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!targetDate.trim() || !dateRegex.test(targetDate)) {
        newErrors.targetDate = 'Tarih formatı YYYY-MM-DD şeklinde olmalıdır';
      }
    } else {
      if (!targetOdometer.trim() || isNaN(Number(targetOdometer)) || Number(targetOdometer) <= 0) {
        newErrors.targetOdometer = 'Geçerli bir hedef kilometre girmelisiniz';
      } else if (selectedVehicle && Number(targetOdometer) <= selectedVehicle.currentOdometer) {
        newErrors.targetOdometer = `Hedef kilometre mevcut kilometreden (${selectedVehicle.currentOdometer} KM) büyük olmalıdır`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddReminder = async () => {
    if (!selectedVehicle) return;
    if (!validate()) return;

    await addReminder({
      vehicleId: selectedVehicle.id,
      title: title.trim(),
      type,
      targetDate: type === 'date' ? targetDate : undefined,
      targetOdometer: type === 'odometer' ? Number(targetOdometer) : undefined,
    });

    setTitle('');
    setTargetDate('');
    setTargetOdometer('');
    setShowAddForm(false);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleReminder(id);
  };

  const handleDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert('Hatırlatıcıyı Sil', 'Bu hatırlatıcıyı silmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
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
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-outline" size={72} color={COLORS.textMuted} />
        <Text style={styles.emptyText}>Hatırlatıcıları yönetmek için aktif bir aracınızın olması gerekir.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Hatırlatıcılar</Text>
        {!showAddForm && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setShowAddForm(true);
            }}
          >
            <Ionicons name="add" size={24} color={COLORS.primary} />
            <Text style={styles.addButtonText}>Yeni Ekle</Text>
          </TouchableOpacity>
        )}
      </View>

      {showAddForm ? (
        <Card style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Yeni Hatırlatıcı Ekle</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowAddForm(false);
              }}
            >
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Input
            label="Hatırlatıcı Başlığı *"
            placeholder="Örn: Periyodik Bakım, Kasko Yenileme"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
          />

          {/* Type Selector Toggle */}
          <Text style={styles.sectionLabel}>Hatırlatıcı Türü</Text>
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
                color={type === 'date' ? '#0F172A' : COLORS.textSecondary}
              />
              <Text style={[styles.toggleText, type === 'date' && styles.toggleTextActive]}>Tarih Bazlı</Text>
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
                color={type === 'odometer' ? '#0F172A' : COLORS.textSecondary}
              />
              <Text style={[styles.toggleText, type === 'odometer' && styles.toggleTextActive]}>KM Bazlı</Text>
            </TouchableOpacity>
          </View>

          {type === 'date' ? (
            <Input
              label="Hedef Tarih (YYYY-MM-DD) *"
              placeholder="Örn: 2026-12-31"
              value={targetDate}
              onChangeText={setTargetDate}
              error={errors.targetDate}
            />
          ) : (
            <Input
              label="Hedef Kilometre (KM) *"
              placeholder={`Örn: ${(selectedVehicle.currentOdometer + 10000)}`}
              value={targetOdometer}
              onChangeText={setTargetOdometer}
              keyboardType="numeric"
              error={errors.targetOdometer}
            />
          )}

          <Button
            title="Hatırlatıcıyı Ekle"
            onPress={handleAddReminder}
            style={styles.submitBtn}
          />
        </Card>
      ) : activeReminders.length === 0 ? (
        <Card style={styles.emptyListCard}>
          <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyListTitle}>Hatırlatıcı Bulunmuyor</Text>
          <Text style={styles.emptyListDesc}>
            Aracınızın sigorta tarihini veya periyodik yağ değişim kilometresini kaçırmamak için sağ üstten hatırlatıcı ekleyebilirsiniz.
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
                      item.isCompleted && { backgroundColor: COLORS.success, borderColor: COLORS.success },
                      due && !item.isCompleted && { borderColor: COLORS.warning },
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
                        ? `Hedef Tarih: ${item.targetDate}`
                        : `Hedef KM: ${item.targetOdometer?.toLocaleString('tr-TR')} KM`}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.actionArea}>
                  {due && !item.isCompleted && (
                    <View style={styles.dueBadge}>
                      <Text style={styles.dueText}>VAKTİ GELDİ</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={styles.trashBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  addButtonText: {
    color: COLORS.primary,
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
    color: COLORS.textPrimary,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
    backgroundColor: COLORS.primary,
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
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptyListDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
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
    borderColor: COLORS.warning + '50',
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
    borderColor: COLORS.cardBorder,
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
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  reminderTarget: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  actionArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueBadge: {
    backgroundColor: COLORS.warning + '20',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  dueText: {
    fontSize: 9,
    color: COLORS.warning,
    fontWeight: '800',
  },
  trashBtn: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 16,
  },
});

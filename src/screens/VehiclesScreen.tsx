import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { COLORS } from '../theme/colors';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import * as Haptics from 'expo-haptics';

export const VehiclesScreen: React.FC = () => {
  const { vehicles, selectedVehicleId, selectVehicle, addVehicle, deleteVehicle } = useVehicles();
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState('');
  const [odometer, setOdometer] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS.vehicleColors[0]);
  const [selectedIcon, setSelectedIcon] = useState('car');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const iconOptions = [
    { name: 'car', label: 'Otomobil' },
    { name: 'bicycle', label: 'Motosiklet' },
    { name: 'bus', label: 'Otobüs' },
    { name: 'boat', label: 'Tekne' },
  ];

  const handleSelectVehicle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    selectVehicle(id);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Araç adı boş bırakılamaz';
    if (!odometer.trim() || isNaN(Number(odometer)) || Number(odometer) < 0) {
      newErrors.odometer = 'Geçerli bir kilometre giriniz';
    }
    if (year.trim() && (isNaN(Number(year)) || Number(year) < 1900 || Number(year) > 2030)) {
      newErrors.year = 'Geçerli bir yıl giriniz';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddVehicle = async () => {
    if (!validate()) return;
    
    await addVehicle(
      name.trim(),
      plate.trim(),
      selectedColor,
      selectedIcon,
      year ? Number(year) : 0,
      Number(odometer)
    );

    // Reset Form
    setName('');
    setPlate('');
    setYear('');
    setOdometer('');
    setSelectedColor(COLORS.vehicleColors[0]);
    setSelectedIcon('car');
    setShowAddForm(false);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleDelete = (id: string, vehicleName: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(
      'Aracı Sil',
      `"${vehicleName}" aracını ve buna ait tüm masraf verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, Sil',
          style: 'destructive',
          onPress: async () => {
            await deleteVehicle(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Araçlarım</Text>
        {!showAddForm && vehicles.length > 0 && (
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

      {showAddForm || vehicles.length === 0 ? (
        <Card style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {vehicles.length === 0 ? 'İlk Aracınızı Ekleyin' : 'Yeni Araç Ekle'}
            </Text>
            {vehicles.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setShowAddForm(false);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <Input
            label="Araç Marka / Model *"
            placeholder="Örn: Volkswagen Golf"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />

          <View style={styles.row}>
            <Input
              label="Plaka (Opsiyonel)"
              placeholder="Örn: 34 ABC 123"
              value={plate}
              onChangeText={setPlate}
              style={{ flex: 1, marginRight: 12 }}
            />
            <Input
              label="Model Yılı (Opsiyonel)"
              placeholder="Örn: 2019"
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              maxLength={4}
              error={errors.year}
              style={{ width: 120 }}
            />
          </View>

          <Input
            label="Başlangıç Kilometresi (KM) *"
            placeholder="Örn: 94000"
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            error={errors.odometer}
          />

          {/* Icon Selection */}
          <Text style={styles.sectionLabel}>Araç Tipi</Text>
          <View style={styles.iconContainer}>
            {iconOptions.map(option => (
              <TouchableOpacity
                key={option.name}
                style={[
                  styles.iconButton,
                  selectedIcon === option.name && { borderColor: selectedColor, backgroundColor: '#0F172A' },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSelectedIcon(option.name);
                }}
              >
                <Ionicons
                  name={option.name as any}
                  size={24}
                  color={selectedIcon === option.name ? selectedColor : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.iconText,
                    selectedIcon === option.name ? { color: COLORS.textPrimary, fontWeight: '700' } : { color: COLORS.textMuted },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Color Selection */}
          <Text style={styles.sectionLabel}>Renk Teması</Text>
          <View style={styles.colorContainer}>
            {COLORS.vehicleColors.map(color => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorDotSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSelectedColor(color);
                }}
              />
            ))}
          </View>

          <Button
            title="Aracı Kaydet"
            onPress={handleAddVehicle}
            style={styles.submitBtn}
          />
        </Card>
      ) : (
        <View style={styles.listContainer}>
          {vehicles.map(vehicle => {
            const isSelected = vehicle.id === selectedVehicleId;
            return (
              <Card
                key={vehicle.id}
                onPress={() => handleSelectVehicle(vehicle.id)}
                style={[
                  styles.vehicleCard,
                  isSelected ? { borderColor: vehicle.color, borderWidth: 1.5 } : null,
                ]}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.avatar, { backgroundColor: vehicle.color + '20' }]}>
                    <Ionicons name={vehicle.icon as any} size={28} color={vehicle.color} />
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    {vehicle.plate && <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>}
                    <Text style={styles.vehicleOdo}>
                      Kilometre: {vehicle.currentOdometer.toLocaleString('tr-TR')} KM
                    </Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  {isSelected ? (
                    <View style={[styles.statusBadge, { backgroundColor: vehicle.color + '30' }]}>
                      <Text style={[styles.statusText, { color: vehicle.color }]}>Aktif</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleDelete(vehicle.id, vehicle.name)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                  )}
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
  row: {
    flexDirection: 'row',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 12,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconButton: {
    flex: 1,
    height: 70,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  iconText: {
    fontSize: 11,
    marginTop: 4,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  colorDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#FFF',
    transform: [{ scale: 1.1 }],
  },
  submitBtn: {
    marginTop: 10,
  },
  listContainer: {
    marginTop: 10,
  },
  vehicleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  vehiclePlate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  vehicleOdo: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cardRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EF444415',
    borderRadius: 10,
  },
});

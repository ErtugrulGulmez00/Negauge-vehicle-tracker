import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Modal, FlatList, TextInput, ActivityIndicator, Image, Share } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { VehicleVisual } from '../components/VehicleVisual';
import * as ImagePicker from 'expo-image-picker';
import { useVehicles } from '../context/VehicleContext';
import { DARK_COLORS, LIGHT_COLORS } from '../theme/colors';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import * as Haptics from 'expo-haptics';
import { t, getCurrencySymbol } from '../localization/i18n';
import { Vehicle } from '../types';
import { VEHICLE_CATALOG, CatalogBrand } from '../data/vehicleCatalog';

const getMaterialIconName = (iconName: string) => {
  switch (iconName) {
    case 'car':
      return 'car';
    case 'bicycle':
    case 'motorbike':
      return 'motorbike';
    case 'suv':
    case 'car-suv':
      return 'jeep';
    case 'van':
    case 'van-utility':
      return 'truck-delivery';
    case 'truck':
    case 'truck-trailer':
      return 'truck';
    default:
      return 'car';
  }
};

export const VehiclesScreen: React.FC = () => {
  const { vehicles, selectedVehicleId, selectVehicle, addVehicle, updateVehicle, deleteVehicle, expenses, reminders, language, theme } = useVehicles();
  const [showAddForm, setShowAddForm] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  
  // Form States
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState('');
  const [odometer, setOdometer] = useState('');
  const [selectedColor, setSelectedColor] = useState(theme === 'dark' ? DARK_COLORS.vehicleColors[0] : LIGHT_COLORS.vehicleColors[0]);
  const [selectedIcon, setSelectedIcon] = useState('car');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  interface SelectedBrandWithModels {
    name: string;
    type: 'car' | 'motorcycle';
    models: string[];
  }

  // Catalog Modal States
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogBrand, setSelectedCatalogBrand] = useState<SelectedBrandWithModels | null>(null);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineSearchError, setOnlineSearchError] = useState('');

  const fetchModelsForBrand = async (brandName: string, type: 'car' | 'motorcycle') => {
    setIsSearchingOnline(true);
    setOnlineSearchError('');
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(brandName)}?format=json`);
      const data = await response.json();
      
      if (data && data.Results && data.Results.length > 0) {
        const rawModels = data.Results.map((r: any) => r.Model_Name as string);
        const uniqueModels = Array.from(new Set(rawModels)).sort() as string[];
        const officialMake = data.Results[0].Make_Name || brandName;

        const brandWithModels: SelectedBrandWithModels = {
          name: officialMake,
          type: type,
          models: uniqueModels,
        };
        
        setSelectedCatalogBrand(brandWithModels);
        setCatalogSearch('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        setOnlineSearchError(language === 'tr' ? 'Bu marka için model bulunamadı.' : 'No models found for this brand.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
    } catch (error) {
      setOnlineSearchError(language === 'tr' ? 'İnternet bağlantısı hatası oluştu.' : 'Network connection error occurred.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const handleSearchOnline = async (query: string) => {
    if (!query) return;
    const isMoto = query.toLowerCase().includes('moto') || 
                   query.toLowerCase().includes('yamaha') || 
                   query.toLowerCase().includes('honda') || 
                   query.toLowerCase().includes('kawasaki') || 
                   query.toLowerCase().includes('ktm') || 
                   query.toLowerCase().includes('vespa');
    await fetchModelsForBrand(query, isMoto ? 'motorcycle' : 'car');
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'tr' ? 'İzin Gerekli' : 'Permission Required',
          language === 'tr' 
            ? 'Araç fotoğrafı yüklemek için galeri erişim iznine ihtiyacımız var.' 
            : 'We need gallery access permission to upload a vehicle photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (error) {
      Alert.alert(
        language === 'tr' ? 'Hata' : 'Error',
        language === 'tr' ? 'Fotoğraf seçilirken bir hata oluştu.' : 'An error occurred while selecting the photo.'
      );
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'tr' ? 'İzin Gerekli' : 'Permission Required',
          language === 'tr' 
            ? 'Araç fotoğrafı çekmek için kamera erişim iznine ihtiyacımız var.' 
            : 'We need camera access permission to take a vehicle photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (error) {
      Alert.alert(
        language === 'tr' ? 'Hata' : 'Error',
        language === 'tr' ? 'Fotoğraf çekilirken bir hata oluştu.' : 'An error occurred while taking the photo.'
      );
    }
  };

  const handleImagePickOptions = () => {
    const options = [
      {
        text: language === 'tr' ? 'Galeriden Seç' : 'Choose from Gallery',
        onPress: handlePickImage,
      },
      {
        text: language === 'tr' ? 'Kamerayı Aç' : 'Take a Photo',
        onPress: handleTakePhoto,
      },
    ];

    if (imageUri) {
      options.push({
        text: language === 'tr' ? 'Mevcut Fotoğrafı Kaldır' : 'Remove Photo',
        onPress: () => {
          setImageUri(null);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        },
      } as any);
    }

    options.push({
      text: language === 'tr' ? 'İptal' : 'Cancel',
      style: 'cancel',
    } as any);

    Alert.alert(
      language === 'tr' ? 'Araç Fotoğrafı' : 'Vehicle Photo',
      language === 'tr' ? 'Bir fotoğraf kaynağı seçin' : 'Select a photo source',
      options as any
    );
  };

  const handleEditClick = (vehicle: Vehicle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setVehicleToEdit(vehicle);
    setName(vehicle.name);
    setPlate(vehicle.plate || '');
    setYear(vehicle.year ? String(vehicle.year) : '');
    setOdometer(String(vehicle.initialOdometer));
    setSelectedColor(vehicle.color);
    setSelectedIcon(vehicle.icon);
    setImageUri(vehicle.imageUri || null);
    setShowAddForm(true);
  };

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

  const iconOptions = [
    { name: 'car', label: t('v_type_car') },
    { name: 'bicycle', label: t('v_type_motorcycle') },
    { name: 'suv', label: t('v_type_suv') },
    { name: 'van', label: t('v_type_van') },
    { name: 'truck', label: t('v_type_truck') },
  ];

  const handleSelectVehicle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    selectVehicle(id);
  };

  const handleShareReport = async (vehicle: Vehicle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    
    // Filter expenses and reminders for this vehicle
    const vehicleExpenses = expenses.filter(e => e.vehicleId === vehicle.id);
    const vehicleReminders = reminders.filter(r => r.vehicleId === vehicle.id);
    
    const totalSpend = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
    const currency = getCurrencySymbol();
    
    let reportText = language === 'tr' 
      ? `🚗 NEGAUGE DİJİTAL BAKIM KARNESİ 🚗\n`
      : `🚗 NEGAUGE DIGITAL VEHICLE REPORT 🚗\n`;
    reportText += `---------------------------------\n`;
    reportText += `${language === 'tr' ? 'Araç' : 'Vehicle'}: ${vehicle.name}\n`;
    if (vehicle.plate) reportText += `${language === 'tr' ? 'Plaka' : 'Plate'}: ${vehicle.plate.toUpperCase()}\n`;
    if (vehicle.year) reportText += `${language === 'tr' ? 'Model Yılı' : 'Year'}: ${vehicle.year}\n`;
    reportText += `${language === 'tr' ? 'Güncel Kilometre' : 'Current Odometer'}: ${vehicle.currentOdometer.toLocaleString()} KM\n`;
    reportText += `${language === 'tr' ? 'Toplam Masraf' : 'Total Expense'}: ${currency}${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\n`;
    
    // 1. Service / Maintenance History
    const mainExpenses = vehicleExpenses.filter(e => e.category === 'maintenance');
    if (mainExpenses.length > 0) {
      reportText += language === 'tr' ? `🔧 BAKIM & ONARIM GEÇMİŞİ\n` : `🔧 SERVICE & MAINTENANCE HISTORY\n`;
      reportText += `---------------------------------\n`;
      [...mainExpenses].sort((a, b) => b.date.localeCompare(a.date)).forEach(e => {
        reportText += `• ${e.date} | ${e.odometer.toLocaleString()} KM | ${currency}${e.amount.toLocaleString()} ${e.notes ? `\n  ${language === 'tr' ? 'Not' : 'Note'}: ${e.notes}` : ''}\n`;
      });
      reportText += `\n`;
    }
    
    // 2. Fuel Log & Efficiency
    const fuelExpenses = vehicleExpenses.filter(e => e.category === 'fuel');
    if (fuelExpenses.length > 0) {
      reportText += language === 'tr' ? `⛽ YAKIT ALIM GEÇMİŞİ\n` : `⛽ FUEL LOG & EFFICIENCY\n`;
      reportText += `---------------------------------\n`;
      
      const sortedFuelAsc = [...fuelExpenses].sort((a, b) => a.odometer - b.odometer);
      const fuelConsMap: { [id: string]: string } = {};
      for (let i = 1; i < sortedFuelAsc.length; i++) {
        const cur = sortedFuelAsc[i];
        const prev = sortedFuelAsc[i - 1];
        const dist = cur.odometer - prev.odometer;
        if (dist > 0 && cur.liters && cur.liters > 0) {
          fuelConsMap[cur.id] = `(${((cur.liters / dist) * 100).toFixed(1)} L/100km)`;
        }
      }
      
      [...fuelExpenses].sort((a, b) => b.date.localeCompare(a.date)).forEach(e => {
        const consStr = fuelConsMap[e.id] ? ` | ${fuelConsMap[e.id]}` : '';
        const literStr = e.liters ? ` | ${e.liters} Lt` : '';
        reportText += `• ${e.date} | ${e.odometer.toLocaleString()} KM${literStr} | ${currency}${e.amount.toLocaleString()}${consStr}${e.notes ? `\n  ${language === 'tr' ? 'Not' : 'Note'}: ${e.notes}` : ''}\n`;
      });
      reportText += `\n`;
    }
    
    // 3. Other Expenses
    const otherExpenses = vehicleExpenses.filter(e => e.category !== 'maintenance' && e.category !== 'fuel');
    if (otherExpenses.length > 0) {
      reportText += language === 'tr' ? `📊 DİĞER GİDERLER\n` : `📊 OTHER EXPENSES\n`;
      reportText += `---------------------------------\n`;
      [...otherExpenses].sort((a, b) => b.date.localeCompare(a.date)).forEach(e => {
        let catLabel: string = e.category;
        if (language === 'tr') {
          catLabel = e.category === 'tax' ? 'Vergi' : e.category === 'insurance' ? 'Sigorta' : e.category === 'wash' ? 'Yıkama' : e.category === 'fine' ? 'Ceza' : e.category === 'parking' ? 'Otopark' : 'Diğer';
        } else {
          catLabel = e.category.charAt(0).toUpperCase() + e.category.slice(1);
        }
        reportText += `• ${e.date} | ${catLabel} | ${e.odometer.toLocaleString()} KM | ${currency}${e.amount.toLocaleString()} ${e.notes ? `\n  ${language === 'tr' ? 'Not' : 'Note'}: ${e.notes}` : ''}\n`;
      });
      reportText += `\n`;
    }
    
    // 4. Active Reminders
    const activeRems = vehicleReminders.filter(r => !r.isCompleted);
    if (activeRems.length > 0) {
      reportText += language === 'tr' ? `🔔 YAKLAŞAN HATIRLATICILAR\n` : `🔔 UPCOMING REMINDERS\n`;
      reportText += `---------------------------------\n`;
      activeRems.forEach(r => {
        const targetStr = r.type === 'date' ? r.targetDate : `${r.targetOdometer?.toLocaleString()} KM`;
        reportText += `• ${r.title} (Hedef: ${targetStr})\n`;
      });
      reportText += `\n`;
    }
    
    reportText += language === 'tr' 
      ? `Negauge Araç Yöneticisi ile oluşturulmuştur.`
      : `Generated with Negauge Vehicle Tracker.`;
    
    try {
      await Share.share({
        message: reportText,
        title: `${vehicle.name} Raporu`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = t('v_error_name');
    if (!odometer.trim() || isNaN(Number(odometer)) || Number(odometer) < 0) {
      newErrors.odometer = t('exp_error_odometer');
    }
    if (year.trim() && (isNaN(Number(year)) || Number(year) < 1900 || Number(year) > 2030)) {
      newErrors.year = t('v_error_year');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveVehicle = async () => {
    if (!validate()) return;
    
    if (vehicleToEdit) {
      await updateVehicle({
        ...vehicleToEdit,
        name: name.trim(),
        plate: plate.trim() || undefined,
        color: selectedColor,
        icon: selectedIcon,
        year: year ? Number(year) : undefined,
        initialOdometer: Number(odometer),
        currentOdometer: Math.max(vehicleToEdit.currentOdometer, Number(odometer)),
        imageUri: imageUri || undefined,
      });
    } else {
      await addVehicle(
        name.trim(),
        plate.trim(),
        selectedColor,
        selectedIcon,
        year ? Number(year) : 0,
        Number(odometer),
        imageUri || undefined
      );
    }

    // Reset Form
    setName('');
    setPlate('');
    setYear('');
    setOdometer('');
    setSelectedColor(currentColors.vehicleColors[0]);
    setSelectedIcon('car');
    setImageUri(null);
    setVehicleToEdit(null);
    setShowAddForm(false);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleDelete = (id: string, vehicleName: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(
      t('v_delete_confirm_title'),
      t('v_delete_confirm_desc'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
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
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('v_title')}</Text>
          {!showAddForm && vehicles.length > 0 && (
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

        {showAddForm || vehicles.length === 0 ? (
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {vehicleToEdit ? (language === 'tr' ? 'Aracı Düzenle' : 'Edit Vehicle') : (vehicles.length === 0 ? t('v_add_first') : t('v_add_new'))}
              </Text>
              {vehicles.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setShowAddForm(false);
                    setVehicleToEdit(null);
                    // Reset Form
                    setName('');
                    setPlate('');
                    setYear('');
                    setOdometer('');
                    setSelectedColor(currentColors.vehicleColors[0]);
                    setSelectedIcon('car');
                    setImageUri(null);
                  }}
                >
                  <Ionicons name="close" size={24} color={currentColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Catalog Select Trigger */}
            <TouchableOpacity
              style={styles.catalogSelectBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowCatalogModal(true);
              }}
            >
              <Ionicons name="search-outline" size={16} color={currentColors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.catalogSelectBtnText}>
                {language === 'tr' ? 'Marka & Model Kataloğundan Seç' : 'Select Brand & Model from Catalog'}
              </Text>
            </TouchableOpacity>

            <Input
              label={`${t('v_name')} *`}
              placeholder={t('v_name_example')}
              value={name}
              onChangeText={setName}
              error={errors.name}
            />

            <View style={styles.row}>
              <Input
                label={t('v_plate_optional')}
                placeholder={t('v_plate_example')}
                value={plate}
                onChangeText={setPlate}
                style={{ flex: 1, marginRight: 12 }}
              />
              <Input
                label={t('v_year_optional')}
                placeholder="YYYY"
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
                maxLength={4}
                error={errors.year}
                style={{ width: 120 }}
              />
            </View>

            <Input
              label={`${t('v_initial_odometer')} (KM) *`}
              placeholder="0"
              value={odometer}
              onChangeText={setOdometer}
              keyboardType="numeric"
              error={errors.odometer}
            />

            {/* Icon Selection */}
            <Text style={styles.sectionLabel}>{t('v_type')}</Text>
            <View style={styles.iconContainer}>
              {iconOptions.map(option => (
                <TouchableOpacity
                  key={option.name}
                  style={[
                    styles.iconButton,
                    selectedIcon === option.name && { borderColor: selectedColor, backgroundColor: theme === 'dark' ? '#0F172A' : '#F1F5F9', borderWidth: 2 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSelectedIcon(option.name);
                  }}
                >
                  <MaterialCommunityIcons
                    name={getMaterialIconName(option.name) as any}
                    size={24}
                    color={selectedIcon === option.name ? selectedColor : currentColors.textMuted}
                  />
                  <Text
                    style={[
                      styles.iconText,
                      selectedIcon === option.name ? { color: currentColors.textPrimary, fontWeight: '700' } : { color: currentColors.textMuted },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color Selection */}
            <Text style={styles.sectionLabel}>{t('v_color_theme')}</Text>
            <View style={styles.colorContainer}>
              {currentColors.vehicleColors.map(color => (
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

            {/* Photo Picker */}
            {imageUri ? (
              <View style={styles.photoPreviewSection}>
                <Text style={styles.sectionLabel}>
                  {language === 'tr' ? 'Araç Fotoğrafı' : 'Vehicle Photo'}
                </Text>
                <View style={[styles.photoPreviewWrapper, { borderColor: selectedColor + '60' }]}>
                  <Image source={{ uri: imageUri }} style={styles.photoPreviewImage} />
                  <TouchableOpacity
                    style={styles.removePhotoBadge}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                      setImageUri(null);
                    }}
                  >
                    <Ionicons name="trash" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.changePhotoBadge}
                    onPress={handleImagePickOptions}
                  >
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                    <Text style={styles.changePhotoText}>
                      {language === 'tr' ? 'Değiştir' : 'Change'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.photoPickerContainer, { borderColor: selectedColor + '40' }]}
                onPress={handleImagePickOptions}
              >
                <Ionicons name="camera-outline" size={28} color={selectedColor} />
                <Text style={styles.photoPickerText}>
                  {language === 'tr' ? 'Araç Fotoğrafı Ekle (İsteğe Bağlı)' : 'Add Vehicle Photo (Optional)'}
                </Text>
                <Text style={styles.photoPickerSubtext}>
                  {language === 'tr' ? 'SVG çizimi yerine bu fotoğraf gösterilir.' : 'This photo will be displayed instead of the SVG drawing.'}
                </Text>
              </TouchableOpacity>
            )}

            <Button
              title={vehicleToEdit ? (language === 'tr' ? 'Güncelle' : 'Update') : t('v_save')}
              onPress={handleSaveVehicle}
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
                    <View style={{ marginRight: 12, width: 70, height: 35, justifyContent: 'center', alignItems: 'center' }}>
                      <VehicleVisual type={vehicle.icon} color={vehicle.color} width={70} height={35} imageUri={vehicle.imageUri} />
                    </View>
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleName}>{vehicle.name}</Text>
                      {vehicle.plate && <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>}
                      <Text style={styles.vehicleOdo}>
                        {t('exp_odometer')}: {vehicle.currentOdometer.toLocaleString()} KM
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    {isSelected ? (
                      <View style={styles.rightActionRow}>
                        <View style={[styles.statusBadge, { backgroundColor: vehicle.color + '30', marginRight: 8 }]}>
                          <Text style={[styles.statusText, { color: vehicle.color }]}>{t('v_status_active')}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleShareReport(vehicle)}
                          style={[styles.editBtn, { marginRight: 8 }]}
                        >
                          <Ionicons name="share-social-outline" size={20} color={vehicle.color} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleEditClick(vehicle)}
                          style={styles.editBtn}
                        >
                          <Ionicons name="create-outline" size={20} color={vehicle.color} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.rightActionRow}>
                        <TouchableOpacity
                          onPress={() => handleShareReport(vehicle)}
                          style={[styles.editBtn, { marginRight: 8 }]}
                        >
                          <Ionicons name="share-social-outline" size={20} color={currentColors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleEditClick(vehicle)}
                          style={[styles.editBtn, { marginRight: 8 }]}
                        >
                          <Ionicons name="create-outline" size={20} color={currentColors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(vehicle.id, vehicle.name)}
                          style={styles.deleteBtn}
                        >
                          <Ionicons name="trash-outline" size={20} color={currentColors.danger} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Catalog Modal */}
      <Modal visible={showCatalogModal} animationType="slide" transparent={false}>
        <View style={[styles.modalContainer, { backgroundColor: currentColors.background }]}>
          <View style={styles.modalHeader}>
            {selectedCatalogBrand ? (
              <TouchableOpacity
                onPress={() => setSelectedCatalogBrand(null)}
                style={styles.modalBackBtn}
              >
                <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
              </TouchableOpacity>
            ) : <View style={{ width: 24 }} />}
            <Text style={styles.modalTitle}>
              {selectedCatalogBrand 
                ? (language === 'tr' ? `${selectedCatalogBrand.name} Modelleri` : `${selectedCatalogBrand.name} Models`) 
                : (language === 'tr' ? 'Marka Seçin' : 'Select Brand')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowCatalogModal(false);
                setSelectedCatalogBrand(null);
                setCatalogSearch('');
              }}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={currentColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.modalSearchContainer}>
            <Ionicons name="search" size={20} color={currentColors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.modalSearchInput, { color: currentColors.textPrimary }]}
              placeholder={language === 'tr' ? 'Ara...' : 'Search...'}
              placeholderTextColor={currentColors.textMuted}
              value={catalogSearch}
              onChangeText={setCatalogSearch}
            />
          </View>

          {/* Catalog Lists */}
          {isSearchingOnline ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <ActivityIndicator color={currentColors.primary} size="large" />
              <Text style={{ marginTop: 16, fontSize: 14, fontWeight: '700', color: currentColors.textSecondary, textAlign: 'center' }}>
                {language === 'tr' ? 'Modeller yükleniyor...' : 'Loading models...'}
              </Text>
            </View>
          ) : !selectedCatalogBrand ? (
            <FlatList
              data={VEHICLE_CATALOG.filter(b => b.name.toLowerCase().includes(catalogSearch.toLowerCase()))}
              keyExtractor={item => item.name}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItemRow}
                  onPress={() => {
                    if (isSearchingOnline) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    fetchModelsForBrand(item.name, item.type);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons 
                      name={item.type === 'motorcycle' ? 'bicycle-outline' : 'car-outline'} 
                      size={20} 
                      color={currentColors.primary} 
                      style={{ marginRight: 12 }} 
                    />
                    <Text style={styles.modalItemText}>{item.name}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={currentColors.textMuted} />
                </TouchableOpacity>
              )}
              ListFooterComponent={() => {
                if (!catalogSearch.trim()) return null;
                return (
                  <View style={styles.onlineSearchFooter}>
                    <TouchableOpacity
                      style={styles.onlineSearchBtn}
                      onPress={() => handleSearchOnline(catalogSearch.trim())}
                    >
                      <Ionicons name="earth" size={18} color={currentColors.primary} style={{ marginRight: 8 }} />
                      <Text style={styles.onlineSearchBtnText}>
                        {language === 'tr' ? `İnternette "${catalogSearch}" ara...` : `Search "${catalogSearch}" online...`}
                      </Text>
                    </TouchableOpacity>
                    {onlineSearchError ? (
                      <Text style={styles.onlineSearchErrorText}>{onlineSearchError}</Text>
                    ) : null}
                  </View>
                );
              }}
            />
          ) : (
            <FlatList
              data={selectedCatalogBrand.models.filter(m => m.toLowerCase().includes(catalogSearch.toLowerCase()))}
              keyExtractor={item => item}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItemRow}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    setName(`${selectedCatalogBrand.name} ${item}`);
                    if (selectedCatalogBrand.type === 'motorcycle') {
                      setSelectedIcon('bicycle');
                    } else {
                      setSelectedIcon('car');
                    }
                    setShowCatalogModal(false);
                    setSelectedCatalogBrand(null);
                    setCatalogSearch('');
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  <Ionicons name="checkmark-circle-outline" size={20} color={currentColors.success} />
                </TouchableOpacity>
              )}
            />
          )}
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
    row: {
      flexDirection: 'row',
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 10,
      marginBottom: 12,
    },
    iconContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
      marginBottom: 20,
    },
    iconButton: {
      width: '46%',
      flexGrow: 1,
      height: 50,
      backgroundColor: theme === 'dark' ? '#0F172A40' : '#F1F5F940',
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      margin: 4,
    },
    iconText: {
      fontSize: 12,
      marginLeft: 8,
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
      color: colors.textPrimary,
      marginBottom: 2,
    },
    vehiclePlate: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 4,
    },
    vehicleOdo: {
      fontSize: 12,
      color: colors.textMuted,
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
    rightActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    editBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#FFFFFF10' : '#00000005',
      borderRadius: 10,
    },
    catalogSelectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 16,
      justifyContent: 'center',
    },
    catalogSelectBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    modalContainer: {
      flex: 1,
      paddingTop: 50,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    modalBackBtn: {
      padding: 4,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalSearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
      borderRadius: 10,
      margin: 16,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    modalSearchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      paddingVertical: 8,
    },
    modalListContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    modalItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    modalItemText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    onlineSearchFooter: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    onlineSearchStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    onlineSearchText: {
      fontSize: 14,
      fontWeight: '600',
    },
    onlineSearchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 20,
      width: '100%',
    },
    onlineSearchBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    onlineSearchErrorText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.danger,
      marginTop: 10,
      textAlign: 'center',
    },
    photoPickerContainer: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme === 'dark' ? '#0F172A40' : '#F1F5F940',
      marginBottom: 16,
    },
    photoPickerText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 8,
      textAlign: 'center',
    },
    photoPickerSubtext: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },
    photoPreviewSection: {
      marginBottom: 16,
    },
    photoPreviewWrapper: {
      height: 140,
      borderRadius: 12,
      borderWidth: 1.5,
      overflow: 'hidden',
      position: 'relative',
    },
    photoPreviewImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    removePhotoBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: '#EF4444DF',
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    changePhotoBadge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: '#0F172ADF',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    changePhotoText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
      marginLeft: 4,
    },
  });
  return memoizedStyles;
};

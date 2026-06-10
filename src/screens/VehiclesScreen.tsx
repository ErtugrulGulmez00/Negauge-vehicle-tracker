import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Modal, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { DARK_COLORS, LIGHT_COLORS } from '../theme/colors';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import * as Haptics from 'expo-haptics';
import { t } from '../localization/i18n';
import { Vehicle } from '../types';
import { VEHICLE_CATALOG, CatalogBrand } from '../data/vehicleCatalog';

export const VehiclesScreen: React.FC = () => {
  const { vehicles, selectedVehicleId, selectVehicle, addVehicle, updateVehicle, deleteVehicle, language, theme } = useVehicles();
  const [showAddForm, setShowAddForm] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  
  // Form States
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState('');
  const [odometer, setOdometer] = useState('');
  const [selectedColor, setSelectedColor] = useState(theme === 'dark' ? DARK_COLORS.vehicleColors[0] : LIGHT_COLORS.vehicleColors[0]);
  const [selectedIcon, setSelectedIcon] = useState('car');
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

  const handleEditClick = (vehicle: Vehicle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setVehicleToEdit(vehicle);
    setName(vehicle.name);
    setPlate(vehicle.plate || '');
    setYear(vehicle.year ? String(vehicle.year) : '');
    setOdometer(String(vehicle.initialOdometer));
    setSelectedColor(vehicle.color);
    setSelectedIcon(vehicle.icon);
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
    { name: 'bus', label: t('v_type_bus') },
    { name: 'boat', label: t('v_type_boat') },
  ];

  const handleSelectVehicle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    selectVehicle(id);
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
      });
    } else {
      await addVehicle(
        name.trim(),
        plate.trim(),
        selectedColor,
        selectedIcon,
        year ? Number(year) : 0,
        Number(odometer)
      );
    }

    // Reset Form
    setName('');
    setPlate('');
    setYear('');
    setOdometer('');
    setSelectedColor(currentColors.vehicleColors[0]);
    setSelectedIcon('car');
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
                    selectedIcon === option.name && { borderColor: selectedColor, backgroundColor: theme === 'dark' ? '#0F172A' : '#F1F5F9' },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSelectedIcon(option.name);
                  }}
                >
                  <Ionicons
                    name={option.name as any}
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
                    <View style={[styles.avatar, { backgroundColor: vehicle.color + '20' }]}>
                      <Ionicons name={vehicle.icon as any} size={28} color={vehicle.color} />
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
                          onPress={() => handleEditClick(vehicle)}
                          style={styles.editBtn}
                        >
                          <Ionicons name="create-outline" size={20} color={vehicle.color} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.rightActionRow}>
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
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    iconButton: {
      flex: 1,
      height: 70,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
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
  });
  return memoizedStyles;
};

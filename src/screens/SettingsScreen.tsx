import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Clipboard, Alert, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { COLORS, DARK_COLORS, LIGHT_COLORS } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import * as Haptics from 'expo-haptics';
import { t } from '../localization/i18n';

export const SettingsScreen: React.FC = () => {
  const { 
    exportData, 
    importData, 
    clearAllData, 
    language, 
    theme, 
    setLanguage, 
    setTheme 
  } = useVehicles();

  const [backupString, setBackupString] = useState('');
  const [importString, setImportString] = useState('');
  const [showExport, setShowExport] = useState(false);

  // Animation Refs
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

  const handleExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const json = await exportData();
    setBackupString(json);
    setShowExport(true);
  };

  const handleCopyToClipboard = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Clipboard.setString(backupString);
    Alert.alert(t('success'), t('bu_copy_success'));
  };

  const handleImport = async () => {
    if (!importString.trim()) {
      Alert.alert(t('error'), t('bu_import_error_empty'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(
      t('bu_import_confirm_title'),
      t('bu_import_confirm_desc'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('bu_import_overwrite'),
          style: 'destructive',
          onPress: async () => {
            const success = await importData(importString.trim());
            if (success) {
              setImportString('');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              Alert.alert(t('success'), t('bu_import_success'));
            } else {
              Alert.alert(t('error'), t('bu_import_fail'));
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(
      t('bu_reset_confirm_title'),
      t('bu_reset_confirm_desc'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            Alert.alert(t('success'), t('bu_reset_success'));
          },
        },
      ]
    );
  };

  const handleLanguageChange = (lang: 'tr' | 'en') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLanguage(lang);
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setTheme(newTheme);
  };

  const styles = getStyles(theme);
  const currentColors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  return (
    <Animated.View style={[styles.flexContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('sett_title')}</Text>
        </View>

        {/* Application Customization Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="options-outline" size={24} color={currentColors.primary} />
            <Text style={styles.sectionTitle}>{t('sett_app_settings')}</Text>
          </View>

          {/* Theme Selector */}
          <Text style={styles.optionLabel}>{t('sett_theme')}</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.toggleButton,
                theme === 'dark' && styles.toggleButtonActive
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <Ionicons name="moon" size={16} color={theme === 'dark' ? '#0F172A' : currentColors.textSecondary} />
              <Text style={[
                styles.toggleText,
                theme === 'dark' && styles.toggleTextActive
              ]}>
                {t('sett_theme_dark')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.toggleButton,
                theme === 'light' && styles.toggleButtonActive
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <Ionicons name="sunny" size={16} color={theme === 'light' ? '#0F172A' : currentColors.textSecondary} />
              <Text style={[
                styles.toggleText,
                theme === 'light' && styles.toggleTextActive
              ]}>
                {t('sett_theme_light')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Language Selector */}
          <Text style={styles.optionLabel}>{t('sett_lang')}</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.toggleButton,
                language === 'tr' && styles.toggleButtonActive
              ]}
              onPress={() => handleLanguageChange('tr')}
            >
              <Text style={[
                styles.toggleText,
                language === 'tr' && styles.toggleTextActive,
                { marginLeft: 0 }
              ]}>
                Türkçe
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.toggleButton,
                language === 'en' && styles.toggleButtonActive
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={[
                styles.toggleText,
                language === 'en' && styles.toggleTextActive,
                { marginLeft: 0 }
              ]}>
                English
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Export Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-upload-outline" size={24} color={currentColors.primary} />
            <Text style={styles.sectionTitle}>{t('bu_export_title')}</Text>
          </View>
          <Text style={styles.desc}>{t('bu_export_desc')}</Text>
          
          {showExport ? (
            <View style={styles.exportArea}>
              <TextInput
                multiline
                editable={false}
                value={backupString}
                style={styles.textInputArea}
              />
              <Button
                title={t('bu_copy_btn')}
                onPress={handleCopyToClipboard}
                style={styles.actionBtn}
              />
              <Button
                title={t('bu_hide')}
                variant="secondary"
                onPress={() => setShowExport(false)}
                style={styles.hideBtn}
              />
            </View>
          ) : (
            <Button
              title={t('bu_generate_code')}
              onPress={handleExport}
              style={styles.actionBtn}
            />
          )}
        </Card>

        {/* Import Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-download-outline" size={24} color={currentColors.success} />
            <Text style={styles.sectionTitle}>{t('bu_import_title')}</Text>
          </View>
          <Text style={styles.desc}>{t('bu_import_desc')}</Text>
          <TextInput
            multiline
            placeholder={t('bu_import_placeholder')}
            placeholderTextColor={currentColors.textMuted}
            value={importString}
            onChangeText={setImportString}
            style={[styles.textInputArea, { height: 100 }]}
          />
          <Button
            title={t('bu_import_btn')}
            variant="danger"
            onPress={handleImport}
            style={styles.actionBtn}
          />
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.card, { borderColor: currentColors.danger + '40', borderWidth: 1 }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trash-outline" size={24} color={currentColors.danger} />
            <Text style={[styles.sectionTitle, { color: currentColors.danger }]}>{t('bu_danger_zone')}</Text>
          </View>
          <Text style={styles.desc}>{t('bu_danger_desc')}</Text>
          <Button
            title={t('bu_reset_btn')}
            variant="danger"
            onPress={handleClearData}
            style={styles.actionBtn}
          />
        </Card>
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
    flexContainer: {
      flex: 1,
    },
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
    card: {
      marginBottom: 20,
      padding: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginLeft: 10,
    },
    desc: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    optionLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 8,
      marginBottom: 8,
    },
    toggleRow: {
      flexDirection: 'row',
      backgroundColor: theme === 'dark' ? '#0F172A' : '#F1F5F9',
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
    },
    toggleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
    },
    toggleButtonActive: {
      backgroundColor: colors.primary,
    },
    toggleText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      marginLeft: 6,
    },
    toggleTextActive: {
      color: '#0F172A',
    },
    exportArea: {
      marginTop: 8,
    },
    textInputArea: {
      backgroundColor: theme === 'dark' ? '#0F172A' : '#F1F5F9',
      borderColor: colors.cardBorder,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      color: colors.textPrimary,
      fontFamily: 'monospace',
      fontSize: 11,
      height: 120,
      textAlignVertical: 'top',
      marginBottom: 16,
    },
    actionBtn: {
      marginTop: 4,
    },
    hideBtn: {
      marginTop: 10,
    },
  });
  return memoizedStyles;
};

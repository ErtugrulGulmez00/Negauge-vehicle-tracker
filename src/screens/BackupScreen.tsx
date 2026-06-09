import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Clipboard, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { COLORS } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import * as Haptics from 'expo-haptics';
import { t } from '../localization/i18n';

export const BackupScreen: React.FC = () => {
  const { exportData, importData, clearAllData } = useVehicles();
  const [backupString, setBackupString] = useState('');
  const [importString, setImportString] = useState('');
  const [showExport, setShowExport] = useState(false);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('bu_title')}</Text>
        <Text style={styles.subtitle}>{t('bu_subtitle')}</Text>
      </View>

      {/* Export Section */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
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
          <Ionicons name="cloud-download-outline" size={24} color={COLORS.success} />
          <Text style={styles.sectionTitle}>{t('bu_import_title')}</Text>
        </View>
        <Text style={styles.desc}>{t('bu_import_desc')}</Text>
        <TextInput
          multiline
          placeholder={t('bu_import_placeholder')}
          placeholderTextColor={COLORS.textMuted}
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
      <Card style={[styles.card, { borderColor: COLORS.danger + '40', borderWidth: 1 }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
          <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>{t('bu_danger_zone')}</Text>
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    marginBottom: 20,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginLeft: 10,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  exportArea: {
    marginTop: 8,
  },
  textInputArea: {
    backgroundColor: '#0F172A',
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: COLORS.textPrimary,
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

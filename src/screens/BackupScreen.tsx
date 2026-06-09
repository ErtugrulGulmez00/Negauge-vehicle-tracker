import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Clipboard, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../context/VehicleContext';
import { COLORS } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import * as Haptics from 'expo-haptics';

export const BackupScreen: React.FC = () => {
  const { exportData, importData } = useVehicles();
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
    Alert.alert('Başarılı', 'Yedek verisi panoya kopyalandı! Bu metni güvenli bir yere kaydedebilirsiniz.');
  };

  const handleImport = async () => {
    if (!importString.trim()) {
      Alert.alert('Hata', 'Lütfen içe aktarmak için geçerli bir yedek metni yapıştırın.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(
      'Yedeği Geri Yükle',
      'Bu işlem mevcut tüm araç ve masraf verilerinizi silecektir. Devam etmek istiyor musunuz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İçe Aktar (Üzerine Yaz)',
          style: 'destructive',
          onPress: async () => {
            const success = await importData(importString.trim());
            if (success) {
              setImportString('');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              Alert.alert('Başarılı', 'Verileriniz yedekten başarıyla geri yüklendi!');
            } else {
              Alert.alert('Hata', 'Yedek verisi çözümlenemedi. Lütfen metnin tam ve doğru olduğunu kontrol edin.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Yedekle & Yükle</Text>
        <Text style={styles.subtitle}>Verilerinizi güvenceye alın veya başka bir telefona aktarın</Text>
      </View>

      {/* Export Section */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Verileri Dışa Aktar</Text>
        </View>
        <Text style={styles.desc}>
          Tüm verilerinizi (araçlar, masraflar ve hatırlatıcılar) şifreli bir metin formatında dışa aktarın.
        </Text>
        
        {showExport ? (
          <View style={styles.exportArea}>
            <TextInput
              multiline
              editable={false}
              value={backupString}
              style={styles.textInputArea}
            />
            <Button
              title="Kodu Panoya Kopyala"
              onPress={handleCopyToClipboard}
              style={styles.actionBtn}
            />
            <Button
              title="Gizle"
              variant="secondary"
              onPress={() => setShowExport(false)}
              style={styles.hideBtn}
            />
          </View>
        ) : (
          <Button
            title="Yedek Kodunu Oluştur"
            onPress={handleExport}
            style={styles.actionBtn}
          />
        )}
      </Card>

      {/* Import Section */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cloud-download-outline" size={24} color={COLORS.success} />
          <Text style={styles.sectionTitle}>Yedeği İçe Aktar</Text>
        </View>
        <Text style={styles.desc}>
          Daha önce kopyaladığınız yedek kodunu aşağıdaki alana yapıştırarak tüm verilerinizi geri yükleyebilirsiniz.
        </Text>
        <TextInput
          multiline
          placeholder="Yedek kodunu buraya yapıştırın..."
          placeholderTextColor={COLORS.textMuted}
          value={importString}
          onChangeText={setImportString}
          style={[styles.textInputArea, { height: 100 }]}
        />
        <Button
          title="Yedekten Geri Yükle"
          variant="danger"
          onPress={handleImport}
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

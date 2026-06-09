import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Platform, StatusBar as RNStatusBar, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { VehicleProvider, useVehicles } from './src/context/VehicleContext';
import { COLORS } from './src/theme/colors';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { VehiclesScreen } from './src/screens/VehiclesScreen';
import { AddExpenseScreen } from './src/screens/AddExpenseScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { RemindersScreen } from './src/screens/RemindersScreen';
import { BackupScreen } from './src/screens/BackupScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { Reminder } from './src/types';
import * as Haptics from 'expo-haptics';

type Tab = 'dashboard' | 'vehicles' | 'analytics' | 'reminders' | 'backup';

function MainAppContent() {
  const { selectedVehicle, reminders, isLoading, hasCompletedOnboarding } = useVehicles();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showAddExpense, setShowAddExpense] = useState(false);

  const handleTabChange = (tab: Tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActiveTab(tab);
    setShowAddExpense(false);
  };

  // Check if there are active due reminders
  const dueRemindersCount = React.useMemo(() => {
    if (!selectedVehicle) return 0;
    const activeReminders = reminders.filter(r => r.vehicleId === selectedVehicle.id && !r.isCompleted);
    
    const today = new Date().toISOString().substring(0, 10);
    return activeReminders.filter(r => {
      if (r.type === 'date' && r.targetDate) {
        return today >= r.targetDate;
      }
      if (r.type === 'odometer' && r.targetOdometer) {
        return selectedVehicle.currentOdometer >= r.targetOdometer;
      }
      return false;
    }).length;
  }, [reminders, selectedVehicle]);

  const renderScreen = () => {
    if (showAddExpense) {
      return <AddExpenseScreen onSuccess={() => setShowAddExpense(false)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <View style={styles.flexOne}>
            {dueRemindersCount > 0 && (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.alertBanner}
                onPress={() => handleTabChange('reminders')}
              >
                <Ionicons name="warning-outline" size={20} color="#000" />
                <Text style={styles.alertBannerText}>
                  Dikkat: Vakti gelen {dueRemindersCount} adet hatırlatıcınız var!
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#000" />
              </TouchableOpacity>
            )}
            <DashboardScreen
              onAddExpensePress={() => setShowAddExpense(true)}
              onNavigateToVehicles={() => handleTabChange('vehicles')}
            />
          </View>
        );
      case 'vehicles':
        return <VehiclesScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'reminders':
        return <RemindersScreen />;
      case 'backup':
        return <BackupScreen />;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  // Force onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  // Force vehicle setup if no vehicle exists
  const isSetupRequired = !selectedVehicle;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      
      <View style={styles.container}>
        {/* Active Screen */}
        <View style={styles.screenContainer}>
          {isSetupRequired ? <VehiclesScreen /> : renderScreen()}
        </View>

        {/* Bottom Tab Bar (Hidden during Onboarding) */}
        {!isSetupRequired && !showAddExpense && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => handleTabChange('dashboard')}
            >
              <Ionicons
                name={activeTab === 'dashboard' ? 'home' : 'home-outline'}
                size={22}
                color={activeTab === 'dashboard' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>
                Panel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => handleTabChange('vehicles')}
            >
              <Ionicons
                name={activeTab === 'vehicles' ? 'car' : 'car-outline'}
                size={22}
                color={activeTab === 'vehicles' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabLabel, activeTab === 'vehicles' && styles.tabLabelActive]}>
                Araçlar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => handleTabChange('analytics')}
            >
              <Ionicons
                name={activeTab === 'analytics' ? 'analytics' : 'analytics-outline'}
                size={22}
                color={activeTab === 'analytics' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabLabel, activeTab === 'analytics' && styles.tabLabelActive]}>
                Analiz
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => handleTabChange('reminders')}
            >
              <View>
                <Ionicons
                  name={activeTab === 'reminders' ? 'notifications' : 'notifications-outline'}
                  size={22}
                  color={activeTab === 'reminders' ? COLORS.primary : COLORS.textSecondary}
                />
                {dueRemindersCount > 0 && <View style={styles.tabBadge} />}
              </View>
              <Text style={[styles.tabLabel, activeTab === 'reminders' && styles.tabLabelActive]}>
                Hatırlatıcı
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => handleTabChange('backup')}
            >
              <Ionicons
                name={activeTab === 'backup' ? 'cloud-done' : 'cloud-done-outline'}
                size={22}
                color={activeTab === 'backup' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabLabel, activeTab === 'backup' && styles.tabLabelActive]}>
                Yedek
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <VehicleProvider>
      <MainAppContent />
    </VehicleProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  tabBar: {
    height: 70,
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warning,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  alertBanner: {
    backgroundColor: COLORS.warning,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 10,
    justifyContent: 'space-between',
  },
  alertBannerText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
});

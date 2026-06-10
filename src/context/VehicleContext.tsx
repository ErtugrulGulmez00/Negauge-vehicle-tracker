import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle, Expense, Reminder, ExpenseCategory } from '../types';
import { setAppLanguage, appLanguage } from '../localization/i18n';
import { encodeBase64, decodeBase64 } from '../utils/backup';

interface VehicleContextType {
  vehicles: Vehicle[];
  expenses: Expense[];
  reminders: Reminder[];
  selectedVehicleId: string | null;
  selectedVehicle: Vehicle | null;
  isLoading: boolean;
  
  // Theme & Language
  language: 'tr' | 'en';
  theme: 'dark' | 'light';
  setLanguage: (lang: 'tr' | 'en') => Promise<void>;
  setTheme: (theme: 'dark' | 'light') => Promise<void>;
  
  // Vehicle Actions
  addVehicle: (name: string, plate: string, color: string, icon: string, year: number, initialOdometer: number, imageUri?: string) => Promise<void>;
  updateVehicle: (updatedVehicle: Vehicle) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  selectVehicle: (id: string) => Promise<void>;
  
  // Expense Actions
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (updatedExpense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Reminder Actions
  addReminder: (reminder: Omit<Reminder, 'id' | 'isCompleted'>) => Promise<void>;
  updateReminder: (updatedReminder: Reminder) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  
  // Backup & Restore
  exportData: () => Promise<string>;
  importData: (jsonString: string) => Promise<boolean>;
  
  // Onboarding
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  
  // Developer Tools
  clearAllData: () => Promise<void>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

// Helper for offline unique ID generation
const generateId = () => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
};

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Theme & Language States
  const [language, setLanguageState] = useState<'tr' | 'en'>(appLanguage.startsWith('tr') ? 'tr' : 'en');
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');

  // Load initial data from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedVehicles = await AsyncStorage.getItem('@vehicles');
        const storedExpenses = await AsyncStorage.getItem('@expenses');
        const storedReminders = await AsyncStorage.getItem('@reminders');
        const storedSelectedId = await AsyncStorage.getItem('@selected_vehicle_id');
        const storedOnboarding = await AsyncStorage.getItem('@onboarding_completed');
        const storedLanguage = await AsyncStorage.getItem('@app_language');
        const storedTheme = await AsyncStorage.getItem('@app_theme');

        if (storedLanguage) {
          const lang = storedLanguage as 'tr' | 'en';
          setLanguageState(lang);
          setAppLanguage(lang);
        } else {
          const lang = appLanguage.startsWith('tr') ? 'tr' : 'en';
          setLanguageState(lang);
          setAppLanguage(lang);
        }

        if (storedTheme) {
          const th = storedTheme as 'dark' | 'light';
          setThemeState(th);
        } else {
          setThemeState('dark');
        }

        if (storedOnboarding === 'true') {
          setHasCompletedOnboarding(true);
        }
        if (storedVehicles) {
          const parsedVehicles = JSON.parse(storedVehicles);
          setVehicles(parsedVehicles);
        }
        if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
        if (storedReminders) setReminders(JSON.parse(storedReminders));
        
        if (storedSelectedId) {
          setSelectedVehicleId(storedSelectedId);
        } else if (storedVehicles) {
          const parsed = JSON.parse(storedVehicles);
          if (parsed.length > 0) {
            setSelectedVehicleId(parsed[0].id);
            await AsyncStorage.setItem('@selected_vehicle_id', parsed[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load data from AsyncStorage', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Selected Vehicle Helper
  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  // Save helper functions
  const saveVehicles = async (newVehicles: Vehicle[]) => {
    setVehicles(newVehicles);
    await AsyncStorage.setItem('@vehicles', JSON.stringify(newVehicles));
  };

  const saveExpenses = async (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    await AsyncStorage.setItem('@expenses', JSON.stringify(newExpenses));
  };

  const saveReminders = async (newReminders: Reminder[]) => {
    setReminders(newReminders);
    await AsyncStorage.setItem('@reminders', JSON.stringify(newReminders));
  };

  // --- Vehicle Actions ---
  const addVehicle = async (
    name: string,
    plate: string,
    color: string,
    icon: string,
    year: number,
    initialOdometer: number,
    imageUri?: string
  ) => {
    const newVehicle: Vehicle = {
      id: generateId(),
      name,
      plate: plate.trim() || undefined,
      color,
      icon,
      year: year || undefined,
      initialOdometer,
      currentOdometer: initialOdometer,
      imageUri,
    };
    const updated = [...vehicles, newVehicle];
    await saveVehicles(updated);
    
    // Select automatically if it's the first vehicle
    if (!selectedVehicleId) {
      setSelectedVehicleId(newVehicle.id);
      await AsyncStorage.setItem('@selected_vehicle_id', newVehicle.id);
    }
  };

  const updateVehicle = async (updatedVehicle: Vehicle) => {
    const updated = vehicles.map(v => (v.id === updatedVehicle.id ? updatedVehicle : v));
    await saveVehicles(updated);
  };

  const deleteVehicle = async (id: string) => {
    const updatedVehicles = vehicles.filter(v => v.id !== id);
    await saveVehicles(updatedVehicles);

    // Clean up related expenses and reminders
    const updatedExpenses = expenses.filter(e => e.vehicleId !== id);
    await saveExpenses(updatedExpenses);

    const updatedReminders = reminders.filter(r => r.vehicleId !== id);
    await saveReminders(updatedReminders);

    // Re-evaluate selected vehicle
    if (selectedVehicleId === id) {
      const nextId = updatedVehicles.length > 0 ? updatedVehicles[0].id : null;
      setSelectedVehicleId(nextId);
      if (nextId) {
        await AsyncStorage.setItem('@selected_vehicle_id', nextId);
      } else {
        await AsyncStorage.removeItem('@selected_vehicle_id');
      }
    }
  };

  const selectVehicle = async (id: string) => {
    setSelectedVehicleId(id);
    await AsyncStorage.setItem('@selected_vehicle_id', id);
  };

  // --- Expense Actions ---
  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: generateId(),
    };
    const updated = [newExpense, ...expenses]; // Keep newest at the top
    await saveExpenses(updated);

    // Update vehicle odometer if this expense has a higher odometer reading
    if (selectedVehicle && newExpense.odometer > selectedVehicle.currentOdometer) {
      const updatedVehicle = {
        ...selectedVehicle,
        currentOdometer: newExpense.odometer,
      };
      await updateVehicle(updatedVehicle);
    }
  };

  const updateExpense = async (updatedExpense: Expense) => {
    const updated = expenses.map(e => (e.id === updatedExpense.id ? updatedExpense : e));
    await saveExpenses(updated);

    // Re-calculate odometer if changed
    if (selectedVehicle && updatedExpense.vehicleId === selectedVehicle.id) {
      // Find the maximum odometer among all expenses of this vehicle
      const vehicleExpenses = updated.filter(e => e.vehicleId === selectedVehicle.id);
      const maxOdometer = Math.max(
        selectedVehicle.initialOdometer,
        ...vehicleExpenses.map(e => e.odometer)
      );
      if (maxOdometer !== selectedVehicle.currentOdometer) {
        await updateVehicle({ ...selectedVehicle, currentOdometer: maxOdometer });
      }
    }
  };

  const deleteExpense = async (id: string) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    const updated = expenses.filter(e => e.id !== id);
    await saveExpenses(updated);

    // Re-calculate odometer for safety
    if (selectedVehicle && expenseToDelete && expenseToDelete.vehicleId === selectedVehicle.id) {
      const vehicleExpenses = updated.filter(e => e.vehicleId === selectedVehicle.id);
      const maxOdometer = Math.max(
        selectedVehicle.initialOdometer,
        ...vehicleExpenses.map(e => e.odometer)
      );
      await updateVehicle({ ...selectedVehicle, currentOdometer: maxOdometer });
    }
  };

  // --- Reminder Actions ---
  const addReminder = async (reminderData: Omit<Reminder, 'id' | 'isCompleted'>) => {
    const newReminder: Reminder = {
      ...reminderData,
      id: generateId(),
      isCompleted: false,
    };
    const updated = [...reminders, newReminder];
    await saveReminders(updated);
  };

  const updateReminder = async (updatedReminder: Reminder) => {
    const updated = reminders.map(r => (r.id === updatedReminder.id ? updatedReminder : r));
    await saveReminders(updated);
  };

  const toggleReminder = async (id: string) => {
    const updated = reminders.map(r => (r.id === id ? { ...r, isCompleted: !r.isCompleted } : r));
    await saveReminders(updated);
  };

  const deleteReminder = async (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    await saveReminders(updated);
  };

  // --- Backup & Restore ---
  const exportData = async () => {
    const data = {
      vehicles,
      expenses,
      reminders,
      selectedVehicleId,
      version: 1,
      exportDate: new Date().toISOString(),
    };
    const json = JSON.stringify(data);
    return 'HMM_SECURE_BACKUP_' + encodeBase64(json);
  };

  const importData = async (backupString: string): Promise<boolean> => {
    try {
      let cleanStr = backupString.trim();
      if (cleanStr.startsWith('HMM_SECURE_BACKUP_')) {
        cleanStr = cleanStr.substring('HMM_SECURE_BACKUP_'.length);
      }
      const jsonString = decodeBase64(cleanStr);
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.vehicles) && Array.isArray(parsed.expenses) && Array.isArray(parsed.reminders)) {
        await saveVehicles(parsed.vehicles);
        await saveExpenses(parsed.expenses);
        await saveReminders(parsed.reminders);
        
        if (parsed.selectedVehicleId) {
          setSelectedVehicleId(parsed.selectedVehicleId);
          await AsyncStorage.setItem('@selected_vehicle_id', parsed.selectedVehicleId);
        } else if (parsed.vehicles.length > 0) {
          setSelectedVehicleId(parsed.vehicles[0].id);
          await AsyncStorage.setItem('@selected_vehicle_id', parsed.vehicles[0].id);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import backup data', error);
      return false;
    }
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem('@onboarding_completed', 'true');
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.clear();
      setVehicles([]);
      setExpenses([]);
      setReminders([]);
      setSelectedVehicleId(null);
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error('Failed to clear app data', error);
    }
  };

  const setLanguage = async (lang: 'tr' | 'en') => {
    setLanguageState(lang);
    setAppLanguage(lang);
    await AsyncStorage.setItem('@app_language', lang);
  };

  const setTheme = async (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('@app_theme', newTheme);
  };

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        expenses,
        reminders,
        selectedVehicleId,
        selectedVehicle,
        isLoading,
        language,
        theme,
        setLanguage,
        setTheme,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        selectVehicle,
        addExpense,
        updateExpense,
        deleteExpense,
        addReminder,
        updateReminder,
        toggleReminder,
        deleteReminder,
        exportData,
        importData,
        hasCompletedOnboarding,
        completeOnboarding,
        clearAllData,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicles = () => {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return context;
};

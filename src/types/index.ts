export interface Vehicle {
  id: string;
  name: string;
  plate?: string;
  color: string; // Hex code for accent coloring
  icon: string;  // Icon name from @expo/vector-icons (Ionicons)
  initialOdometer: number;
  currentOdometer: number;
  year?: number;
  imageUri?: string;
}

export type ExpenseCategory = 'fuel' | 'maintenance' | 'tax' | 'insurance' | 'wash' | 'fine' | 'parking' | 'other';

export interface Expense {
  id: string;
  vehicleId: string;
  amount: number;
  date: string; // ISO string format YYYY-MM-DD
  odometer: number; // KM reading at the time of expense
  category: ExpenseCategory;
  notes?: string;
  liters?: number;
}

export interface Reminder {
  id: string;
  vehicleId: string;
  title: string;
  type: 'date' | 'odometer';
  targetDate?: string; // ISO string format YYYY-MM-DD
  targetOdometer?: number; // KM limit
  isCompleted: boolean;
}

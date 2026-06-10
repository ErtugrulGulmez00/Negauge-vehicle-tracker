import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Expense, Vehicle } from '../types';
import { t } from '../localization/i18n';

/**
 * Exports vehicle expenses to a CSV file and prompts the user to save/share it.
 */
export const exportExpensesToCSV = async (expenses: Expense[], vehicle: Vehicle): Promise<boolean> => {
  try {
    // CSV Header row
    const headers = [
      t('exp_category_label'),
      t('exp_amount', { currency: '' }).replace(/[()]/g, '').trim(),
      t('exp_date'),
      t('exp_odometer'),
      t('notes')
    ];
    
    // Category mapping function for localized names
    const getLocalizedCategory = (cat: string) => {
      switch (cat) {
        case 'fuel': return t('cat_fuel');
        case 'maintenance': return t('cat_maintenance');
        case 'insurance': return t('cat_insurance');
        case 'tax': return t('cat_tax');
        case 'wash': return t('cat_wash');
        case 'fine': return t('cat_fine');
        case 'parking': return t('cat_parking');
        default: return t('cat_other');
      }
    };

    const rows = expenses.map(e => [
      getLocalizedCategory(e.category),
      e.amount,
      e.date,
      e.odometer,
      e.notes || ''
    ]);

    // Combine headers and rows with UTF-8 BOM prefix for Excel compatibility
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          // Escape quotes and wrap in double quotes
          const strVal = String(val).replace(/"/g, '""');
          return `"${strVal}"`;
        }).join(',')
      )
    ].join('\n');

    // Create file path
    const sanitizedVehicleName = vehicle.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${sanitizedVehicleName}_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // Write file to device local storage
    await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

    // Open share menu
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `${vehicle.name} - Expenses`,
        UTI: 'public.comma-separated-values-text'
      });
      return true;
    } else {
      console.warn('Sharing is not available on this platform');
      return false;
    }
  } catch (error) {
    console.error('Failed to export CSV file', error);
    return false;
  }
};

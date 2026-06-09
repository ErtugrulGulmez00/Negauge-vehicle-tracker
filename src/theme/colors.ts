export const DARK_COLORS = {
  background: '#0F172A',      // Deep dark slate
  cardBackground: '#1E293B',  // Elevated slate for cards
  cardBorder: '#334155',      // Subtle border for cards
  
  // Accents
  primary: '#F59E0B',         // Amber (dashboard orange)
  primaryLight: '#FEF3C7',    // Very light amber for highlights
  success: '#10B981',         // Green (fuel efficiency, additions)
  danger: '#EF4444',          // Red (deletions, alerts)
  info: '#3B82F6',            // Blue (wash, general info)
  warning: '#F59E0B',         // Warning orange
  
  // Text
  textPrimary: '#F8FAFC',     // Bright slate white
  textSecondary: '#94A3B8',   // Cool grey
  textMuted: '#64748B',       // Slate grey
  
  // Underlay/Active states
  activeUnderlay: '#2D3748',
  
  // Default vehicle color choices
  vehicleColors: [
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Green
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#64748B', // Grey
    '#E2E8F0', // White
  ]
};

export const LIGHT_COLORS = {
  background: '#F8FAFC',      // Light slate grey
  cardBackground: '#FFFFFF',  // White for cards
  cardBorder: '#E2E8F0',      // Light grey border
  
  // Accents
  primary: '#D97706',         // Darker amber for contrast
  primaryLight: '#FEF3C7',    // Amber light background
  success: '#059669',         // Emerald green
  danger: '#DC2626',          // Darker red for contrast
  info: '#2563EB',            // Stronger blue
  warning: '#D97706',         // Warning orange
  
  // Text
  textPrimary: '#0F172A',     // Deep slate black
  textSecondary: '#475569',   // Darker cool grey
  textMuted: '#94A3B8',       // Light slate grey
  
  // Underlay/Active states
  activeUnderlay: '#F1F5F9',
  
  // Default vehicle color choices
  vehicleColors: [
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Green
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#64748B', // Grey
    '#0F172A', // Dark Slate
  ]
};

export let COLORS = { ...DARK_COLORS };

export const setThemeColors = (theme: 'dark' | 'light') => {
  const source = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  Object.assign(COLORS, source);
};

export const FONTS = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  extrabold: 'Outfit_800ExtraBold',
};

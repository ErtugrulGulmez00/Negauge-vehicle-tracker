import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useVehicles } from '../context/VehicleContext';
import { DARK_COLORS, LIGHT_COLORS } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  hapticFeedback?: boolean;
}

function getContrastColor(hexColor: string) {
  if (!hexColor) return '#0F172A';
  const hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    const g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    const b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 180 ? '#0F172A' : '#FFFFFF';
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 180 ? '#0F172A' : '#FFFFFF';
  }
  return '#FFFFFF';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  hapticFeedback = true,
}) => {
  const { theme, selectedVehicle } = useVehicles();
  const currentColors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const buttonBgColor = selectedVehicle?.color || currentColors.primary;
  const buttonTextColor = getContrastColor(buttonBgColor);

  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const dynamicStyles = {
    primary: {
      backgroundColor: buttonBgColor,
    },
    secondary: {
      backgroundColor: currentColors.cardBackground,
      borderColor: currentColors.cardBorder,
    },
    danger: {
      backgroundColor: currentColors.danger,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: buttonBgColor,
    },
    disabled: {
      backgroundColor: theme === 'dark' ? '#1E293B' : '#E2E8F0',
      borderColor: theme === 'dark' ? '#334155' : '#CBD5E1',
      opacity: 0.5,
    },
    textPrimary: {
      color: buttonTextColor,
    },
    textSecondary: {
      color: currentColors.textPrimary,
    },
    textDanger: {
      color: '#FFFFFF',
    },
    textOutline: {
      color: buttonBgColor,
    },
    textDisabled: {
      color: currentColors.textMuted,
    },
  };

  const getButtonStyle = () => {
    const base: ViewStyle = styles.btn;
    if (disabled) return [base, dynamicStyles.disabled, style];
    
    switch (variant) {
      case 'primary':
        return [base, dynamicStyles.primary, style];
      case 'secondary':
        return [base, dynamicStyles.secondary, style];
      case 'danger':
        return [base, dynamicStyles.danger, style];
      case 'outline':
        return [base, dynamicStyles.outline, style];
      default:
        return [base, dynamicStyles.primary, style];
    }
  };

  const getTextStyle = () => {
    const base: TextStyle = styles.text;
    if (disabled) return [base, dynamicStyles.textDisabled, textStyle];
    
    switch (variant) {
      case 'primary':
        return [base, dynamicStyles.textPrimary, textStyle];
      case 'secondary':
        return [base, dynamicStyles.textSecondary, textStyle];
      case 'danger':
        return [base, dynamicStyles.textDanger, textStyle];
      case 'outline':
        return [base, dynamicStyles.textOutline, textStyle];
      default:
        return [base, dynamicStyles.textPrimary, textStyle];
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={disabled || loading}
      style={getButtonStyle()}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? buttonBgColor : buttonTextColor} size="small" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  text: {
    fontSize: 16,
    letterSpacing: 0.3,
    fontWeight: '700',
  },
});
